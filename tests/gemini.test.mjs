import test from "node:test";
import assert from "node:assert/strict";

import { knowledgeBase } from "../data/knowledge-base.js";
import {
  SYSTEM_INSTRUCTION,
  buildContextBlock,
  buildInput,
  extractText,
  askGemini,
  askWithFallback,
  askWorkersAI,
  generationConfigFor,
  isRetryable,
  MAX_ATTEMPTS,
  TOTAL_BUDGET_MS,
} from "../worker/src/gemini.js";

const sidang = knowledgeBase.find((entry) => entry.id === "sidang-syarat-skripsi");

test("system instruction forbids answering outside the supplied context", () => {
  assert.match(SYSTEM_INSTRUCTION, /HANYA berdasarkan "KONTEKS PEDOMAN"/);
  assert.match(SYSTEM_INSTRUCTION, /Jangan mengarang/i);
  assert.match(SYSTEM_INSTRUCTION, /Jangan pernah mengarang angka/i);
});

test("the model is told not to call real documents sample data", () => {
  // The knowledge base used to be invented, and the instruction said so. It is
  // now four real documents, so that disclaimer would be a false one.
  assert.match(SYSTEM_INSTRUCTION, /Jangan menyebut jawabanmu sebagai "data contoh"/);
  assert.match(SYSTEM_INSTRUCTION, /dua ketentuan yang berbeda/);
});

test("context block carries the answer and its provenance", () => {
  const block = buildContextBlock([sidang]);

  assert.match(block, /KONTEKS PEDOMAN/);
  assert.ok(block.includes(sidang.title));
  assert.ok(block.includes(sidang.answer));
  assert.ok(block.includes(sidang.sourceTitle));
  assert.ok(block.includes(sidang.escalation));
});

test("context block states plainly when nothing was retrieved", () => {
  assert.match(buildContextBlock([]), /tidak ada rujukan yang cocok/);
});

test("input pairs the context with the student's question", () => {
  const input = buildInput("Apa syarat sidang?", [sidang]);

  assert.ok(input.indexOf("KONTEKS PEDOMAN") < input.indexOf("PERTANYAAN MAHASISWA"));
  assert.match(input, /PERTANYAAN MAHASISWA: Apa syarat sidang\?$/);
});

test("extractText reads the last model_output step, skipping thought steps", () => {
  const text = extractText({
    steps: [
      { type: "user_input", content: [{ type: "text", text: "diabaikan" }] },
      { type: "thought", content: [{ type: "text", text: "berpikir..." }] },
      {
        type: "model_output",
        content: [
          { type: "text", text: "Syarat sidang " },
          { type: "text", text: "sudah terpenuhi." },
        ],
      },
    ],
  });

  assert.equal(text, "Syarat sidang sudah terpenuhi.");
});

test("extractText returns empty string for malformed payloads", () => {
  assert.equal(extractText({}), "");
  assert.equal(extractText({ steps: [] }), "");
  assert.equal(extractText({ steps: [{ type: "model_output", content: [] }] }), "");
});

test("askGemini posts to the Interactions API with the key in the header", async () => {
  let captured;
  const fetchImpl = async (url, init) => {
    captured = { url, init };
    return {
      ok: true,
      json: async () => ({
        steps: [{ type: "model_output", content: [{ type: "text", text: "Jawaban." }] }],
      }),
    };
  };

  const answer = await askGemini({
    question: "Apa syarat sidang?",
    entries: [sidang],
    apiKey: "kunci-uji",
    model: "gemini-3.5-flash-lite",
    fetchImpl,
  });

  assert.equal(answer, "Jawaban.");
  assert.equal(captured.url, "https://generativelanguage.googleapis.com/v1beta/interactions");
  assert.equal(captured.init.headers["x-goog-api-key"], "kunci-uji");

  const body = JSON.parse(captured.init.body);
  assert.equal(body.model, "gemini-3.5-flash-lite");
  assert.equal(body.system_instruction, SYSTEM_INSTRUCTION);
  assert.ok(body.input.includes(sidang.answer), "grounding context must be sent");
});

test("askGemini surfaces API errors instead of returning a silent empty answer", async () => {
  const failing = async () => ({ ok: false, status: 429, text: async () => "quota habis" });

  await assert.rejects(
    () => askGemini({ question: "x", entries: [], apiKey: "k", model: "m", fetchImpl: failing }),
    /Gemini 429/,
  );
});

test("askGemini rejects when the model returns no usable text", async () => {
  const empty = async () => ({ ok: true, json: async () => ({ steps: [] }) });

  await assert.rejects(
    () => askGemini({ question: "x", entries: [], apiKey: "k", model: "m", fetchImpl: empty }),
    /no text/,
  );
});

const noSleep = async () => {};

test("a region Gemini does not serve is retried, a bad request is not", () => {
  // Workers have no fixed egress, so this 400 is luck of the draw, not a bug
  // in the request — unlike a malformed body or an exhausted quota.
  assert.ok(isRetryable(400, '{"error":{"message":"User location is not supported for the API use."}}'));
  assert.ok(isRetryable(503, "upstream unavailable"));
  assert.ok(!isRetryable(400, '{"error":{"message":"Invalid JSON payload"}}'));
  assert.ok(!isRetryable(429, "quota habis"));
});

test("askGemini retries past an unsupported-location response and answers", async () => {
  let attempts = 0;
  const fetchImpl = async () => {
    attempts += 1;
    if (attempts === 1) {
      return {
        ok: false,
        status: 400,
        text: async () => '{"error":{"message":"User location is not supported for the API use."}}',
      };
    }
    return {
      ok: true,
      json: async () => ({
        steps: [{ type: "model_output", content: [{ type: "text", text: "Jawaban." }] }],
      }),
    };
  };

  const answer = await askGemini({
    question: "x",
    entries: [],
    apiKey: "k",
    model: "m",
    fetchImpl,
    sleep: noSleep,
  });

  assert.equal(answer, "Jawaban.");
  assert.equal(attempts, 2);
});

test("askGemini gives up after a bounded number of attempts", async () => {
  let attempts = 0;
  const alwaysBlocked = async () => {
    attempts += 1;
    return { ok: false, status: 503, text: async () => "upstream unavailable" };
  };

  await assert.rejects(
    () => askGemini({ question: "x", entries: [], apiKey: "k", model: "m", fetchImpl: alwaysBlocked, sleep: noSleep }),
    /Gemini 503/,
  );
  assert.equal(attempts, MAX_ATTEMPTS, "must not retry forever");
});

test("a quota error is surfaced immediately rather than spending more of it", async () => {
  let attempts = 0;
  const overQuota = async () => {
    attempts += 1;
    return { ok: false, status: 429, text: async () => "quota habis" };
  };

  await assert.rejects(
    () => askGemini({ question: "x", entries: [], apiKey: "k", model: "m", fetchImpl: overQuota, sleep: noSleep }),
    /Gemini 429/,
  );
  assert.equal(attempts, 1);
});

test("retrying stops once the time budget is spent, rather than stalling the answer", async () => {
  // A throttled model answered in 101s once, long enough that the question
  // looked like it had hung. Retries must never add up to that again.
  let attempts = 0;
  let clock = 0;
  const slowAndBlocked = async () => {
    attempts += 1;
    clock += TOTAL_BUDGET_MS; // one attempt eats the whole budget
    return {
      ok: false,
      status: 400,
      text: async () => '{"error":{"message":"User location is not supported for the API use."}}',
    };
  };

  await assert.rejects(
    () =>
      askGemini({
        question: "x",
        entries: [],
        apiKey: "k",
        model: "m",
        fetchImpl: slowAndBlocked,
        sleep: noSleep,
        now: () => clock,
      }),
    /location is not supported/,
  );
  assert.equal(attempts, 1, "no second attempt once the budget is gone");
});

test("an attempt that times out is retried rather than failing the question", async () => {
  let attempts = 0;
  const fetchImpl = async () => {
    attempts += 1;
    if (attempts === 1) throw new Error("The operation was aborted due to timeout");
    return {
      ok: true,
      json: async () => ({
        steps: [{ type: "model_output", content: [{ type: "text", text: "Jawaban." }] }],
      }),
    };
  };

  const answer = await askGemini({
    question: "x",
    entries: [],
    apiKey: "k",
    model: "m",
    fetchImpl,
    sleep: noSleep,
    now: () => 0,
  });

  assert.equal(answer, "Jawaban.");
  assert.equal(attempts, 2);
});

test("timed-out attempts can never add up to more than the total budget", async () => {
  let clock = 0;
  let calls = 0;
  const timeouts = [];
  const fetchImpl = async (_url, options) => {
    calls += 1;
    timeouts.push(options.signal);
    clock += 12_000; // every attempt burns the whole per-attempt allowance
    throw new Error("The operation was aborted due to timeout");
  };

  await assert.rejects(
    askGemini({ question: "x", entries: [], apiKey: "k", model: "m", fetchImpl, sleep: async () => {}, now: () => clock }),
    /timeout/,
  );

  assert.equal(calls, 2, "a third attempt must not start once the budget is gone");
  assert.ok(clock <= TOTAL_BUDGET_MS + 12_000, "at most one attempt past the budget line, never two");
});

/** fetch palsu yang menjawab per model, sambil memajukan jam. */
function modelRouter(behaviours, clock) {
  const seen = [];
  return {
    seen,
    fetchImpl: async (_url, options) => {
      const { model, generation_config: config } = JSON.parse(options.body);
      seen.push({ model, config });
      const act = behaviours[model];
      clock.t += act.cost ?? 0;
      if (act.throws) throw new Error(act.throws);
      if (act.status) return new Response(act.body ?? "", { status: act.status });
      return new Response(JSON.stringify({ steps: [{ type: "model_output", content: [{ type: "text", text: act.text }] }] }), { status: 200 });
    },
  };
}

const ask = (extra) => ({ question: "x", entries: [], apiKey: "k", sleep: async () => {}, ...extra });

test("when the main model times out, the backup answers and the swap is reported", async () => {
  const clock = { t: 0 };
  const { fetchImpl, seen } = modelRouter(
    {
      utama: { throws: "The operation was aborted due to timeout", cost: 9_000 },
      cadangan: { text: "Jawaban dari cadangan." },
    },
    clock,
  );
  const result = await askWithFallback(ask({ models: ["utama", "cadangan"], fetchImpl, now: () => clock.t }));

  assert.equal(result.text, "Jawaban dari cadangan.");
  assert.equal(result.model, "cadangan");
  assert.equal(result.fellBack, true);
  assert.equal(seen.at(-1).model, "cadangan");
});

test("the main model answering means the backup is never called", async () => {
  const clock = { t: 0 };
  const { fetchImpl, seen } = modelRouter({ utama: { text: "Utama." }, cadangan: { text: "Cadangan." } }, clock);
  const result = await askWithFallback(ask({ models: ["utama", "cadangan"], fetchImpl, now: () => clock.t }));
  assert.equal(result.fellBack, false);
  assert.deepEqual(seen.map((s) => s.model), ["utama"]);
});

test("a quota error moves to the backup, but a malformed request does not", async () => {
  const clock = { t: 0 };
  const quota = modelRouter({ utama: { status: 429, body: "quota" }, cadangan: { text: "Ok." } }, clock);
  assert.equal((await askWithFallback(ask({ models: ["utama", "cadangan"], fetchImpl: quota.fetchImpl, now: () => clock.t }))).model, "cadangan");

  const bad = modelRouter({ utama: { status: 400, body: "invalid argument" }, cadangan: { text: "Ok." } }, { t: 0 });
  await assert.rejects(askWithFallback(ask({ models: ["utama", "cadangan"], fetchImpl: bad.fetchImpl, now: () => 0 })), /Gemini 400/);
  assert.deepEqual(bad.seen.map((s) => s.model), ["utama"], "our own bad request is not blamed on the model");
});

test("both models failing surfaces the last error, within the total budget", async () => {
  const clock = { t: 0 };
  const { fetchImpl } = modelRouter(
    { utama: { throws: "timeout utama", cost: 9_000 }, cadangan: { throws: "timeout cadangan", cost: 6_000 } },
    clock,
  );
  await assert.rejects(askWithFallback(ask({ models: ["utama", "cadangan"], fetchImpl, now: () => clock.t })), /cadangan/);
  assert.ok(clock.t <= TOTAL_BUDGET_MS + 3_000, `spent ${clock.t}ms`);
});

test("the backup is skipped when the main model already used up the whole budget", async () => {
  const clock = { t: 0 };
  const { fetchImpl, seen } = modelRouter({ utama: { throws: "timeout", cost: 14_500 }, cadangan: { text: "x" } }, clock);
  await assert.rejects(askWithFallback(ask({ models: ["utama", "cadangan"], fetchImpl, now: () => clock.t })));
  assert.deepEqual(seen.map((s) => s.model), ["utama"]);
});

test("the same model listed twice, or no backup at all, still works", async () => {
  const clock = { t: 0 };
  const { fetchImpl, seen } = modelRouter({ utama: { text: "Ok." } }, clock);
  await askWithFallback(ask({ models: ["utama", "utama", undefined], fetchImpl, now: () => clock.t }));
  assert.equal(seen.length, 1);
});

test("only Gemini 3 models are sent the thinking level", () => {
  assert.equal(generationConfigFor("gemini-3.5-flash-lite").thinking_level, "low");
  assert.equal("thinking_level" in generationConfigFor("gemini-2.5-flash-lite"), false);
  assert.equal(generationConfigFor("gemini-2.5-flash-lite").seed, generationConfigFor("gemini-3.5-flash-lite").seed, "the seed stays fixed for everyone");
});

test("the Workers AI backup gets the same rules and context as Gemini, and returns plain text", async () => {
  let received;
  const ai = {
    run: async (model, input) => {
      received = { model, input };
      return { response: "  Jawaban dari cadangan.  " };
    },
  };
  const text = await askWorkersAI({ question: "syarat sidang", entries: [sidang], ai });

  assert.equal(text, "Jawaban dari cadangan.");
  assert.equal(received.input.messages[0].role, "system");
  assert.equal(received.input.messages[0].content, SYSTEM_INSTRUCTION, "same system rules as Gemini");
  assert.match(received.input.messages[1].content, /KONTEKS PEDOMAN/);
  assert.match(received.input.messages[1].content, /syarat sidang/);
  assert.equal(received.input.temperature, 0, "deterministic, so two readers get the same answer");
});

test("the Workers AI backup refuses to invent an answer when it returns nothing, or hangs", async () => {
  await assert.rejects(askWorkersAI({ question: "x", entries: [], ai: { run: async () => ({ response: "   " }) } }), /tidak mengembalikan teks/);
  await assert.rejects(askWorkersAI({ question: "x", entries: [], ai: null }), /tidak tersedia/);
  await assert.rejects(
    askWorkersAI({ question: "x", entries: [], ai: { run: () => new Promise(() => {}) }, timeoutMs: 30 }),
    /timeout/,
  );
});
