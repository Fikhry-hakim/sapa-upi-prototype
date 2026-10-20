import assert from "node:assert/strict";
import test from "node:test";

import { checkFeedback, feedbackSummary, recordFeedback } from "../worker/src/feedback.js";
import { windowFor } from "../worker/src/events.js";
import { readFile } from "node:fs/promises";

test("only a known rating and answer kind are accepted, and the topic id is trimmed", () => {
  assert.deepEqual(checkFeedback({ rating: "baik", kind: "ai", entryId: "ta-tiga-jalur" }), {
    rating: "baik",
    kind: "ai",
    entryId: "ta-tiga-jalur",
  });
  assert.equal(checkFeedback({ rating: "baik", kind: "ai" }).entryId, null);
  assert.equal(checkFeedback({ rating: "baik", kind: "ai", entryId: "x".repeat(500) }).entryId.length, 80);

  for (const bad of [null, {}, { rating: "mantap", kind: "ai" }, { rating: "baik", kind: "manusia" }, { rating: 5, kind: "ai" }]) {
    assert.equal(checkFeedback(bad), null, JSON.stringify(bad));
  }
});

test("a stored rating carries no question text and no identity", async () => {
  const calls = [];
  const db = {
    prepare: (sql) => ({
      bind: (...args) => ({
        run: async () => {
          calls.push({ sql, args });
        },
      }),
    }),
  };
  await recordFeedback(db, { rating: "cukup", kind: "offline", entryId: "topik" });
  assert.deepEqual(calls[0].args, ["cukup", "offline", "topik"]);
  assert.match(calls[0].sql, /INSERT INTO feedback \(rating, kind, entry_id\)/);
  assert.ok(!/question|user|email|pertanyaan/i.test(calls[0].sql), "no column for text or identity");
});

test("the summary counts each rating and the share of good ones", async () => {
  const db = {
    prepare: () => ({
      bind: () => ({
        all: async () => ({
          results: [
            { rating: "baik", n: 3 },
            { rating: "cukup", n: 1 },
          ],
        }),
      }),
    }),
  };
  const s = await feedbackSummary(db, windowFor("mingguan", Date.now()));
  assert.deepEqual(s.counts, { buruk: 0, cukup: 1, baik: 3 });
  assert.equal(s.total, 4);
  assert.equal(s.goodShare, 75);

  const empty = await feedbackSummary({ prepare: () => ({ bind: () => ({ all: async () => ({ results: [] }) }) }) }, windowFor("mingguan", Date.now()));
  assert.equal(empty.total, 0);
  assert.equal(empty.goodShare, null, "no ratings is not a 0% score");
});

test("every answer card offers the rating row, and it never sends the question", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  assert.match(app, /fillCard\(card, response, \{ feedback: true \}\)/);
  const sender = app.slice(app.indexOf("function feedbackRow"), app.indexOf("function fillCard"));
  assert.ok(sender.includes("/feedback"));
  assert.ok(!/question/.test(sender.replace("entryId", "")), "the rating row has no access to the question text");
});
