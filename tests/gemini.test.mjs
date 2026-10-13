import test from "node:test";
import assert from "node:assert/strict";

import { knowledgeBase } from "../data/knowledge-base.js";
import {
  SYSTEM_INSTRUCTION,
  buildContextBlock,
  buildInput,
  extractText,
  askGemini,
  isRetryable,
  MAX_ATTEMPTS,
  TOTAL_BUDGET_MS,
} from "../worker/src/gemini.js";

const sidang = knowledgeBase.find((entry) => entry.id === "sidang-pendaftaran");

test("system instruction forbids answering outside the supplied context", () => {
  assert.match(SYSTEM_INSTRUCTION, /HANYA berdasarkan "KONTEKS PEDOMAN"/);
  assert.match(SYSTEM_INSTRUCTION, /Jangan mengarang/i);
  assert.match(SYSTEM_INSTRUCTION, /Jangan pernah mengarang angka/i);
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
