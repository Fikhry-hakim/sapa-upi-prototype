import test from "node:test";
import assert from "node:assert/strict";
import { answerCacheKey, readCachedAnswer, writeCachedAnswer, MAX_CACHED_ANSWER } from "../worker/src/answer-cache.js";

const entry = (answer = "Jawabannya 14 semester.") => ({ id: "e1", title: "Masa studi", category: "Administrasi", answer, points: ["a"], sourceTitle: "S", sourceOwner: "O", validPeriod: "2026", updatedAt: "2026", escalation: "x" });

function fakeDb() {
  const rows = new Map();
  return {
    rows,
    prepare: (sql) => ({
      args: [],
      bind(...args) {
        this.args = args;
        return this;
      },
      async first() {
        return rows.has(this.args[0]) ? { answer: rows.get(this.args[0]) } : null;
      },
      async run() {
        if (/INSERT/.test(sql)) rows.set(this.args[0], this.args[1]);
        return { meta: { changes: 1 } };
      },
    }),
  };
}

test("the same question and context give the same key; any change gives another", async () => {
  const base = { question: "Berapa masa studi?", entries: [entry()], lang: "id" };
  const key = await answerCacheKey(base);
  assert.match(key, /^[0-9a-f]{64}$/);
  assert.equal(await answerCacheKey({ ...base, question: "  berapa   MASA studi? " }), key, "case and spacing do not matter");
  assert.notEqual(await answerCacheKey({ ...base, question: "Berapa masa cuti?" }), key);
  assert.notEqual(await answerCacheKey({ ...base, lang: "en" }), key, "another language is another answer");
  assert.notEqual(await answerCacheKey({ ...base, entries: [entry("Sekarang 16 semester.")] }), key, "a changed knowledge base never serves the old answer");
});

test("a stored answer is read back, and a missing one is null", async () => {
  const db = fakeDb();
  assert.equal(await readCachedAnswer(db, "abc"), null);
  await writeCachedAnswer(db, "abc", "Jawaban.");
  assert.equal(await readCachedAnswer(db, "abc"), "Jawaban.");
});

test("the question text is never stored, only the hash key and the answer", async () => {
  const db = fakeDb();
  const key = await answerCacheKey({ question: "Pertanyaan rahasia saya", entries: [entry()], lang: "id" });
  await writeCachedAnswer(db, key, "Jawaban.");
  assert.equal(JSON.stringify([...db.rows]).includes("rahasia"), false);
});

test("oversized or empty answers are not cached", async () => {
  const db = fakeDb();
  await writeCachedAnswer(db, "k1", "x".repeat(MAX_CACHED_ANSWER + 1));
  await writeCachedAnswer(db, "k2", "");
  assert.equal(db.rows.size, 0);
});

test("a database error never breaks answering", async () => {
  const broken = { prepare: () => { throw new Error("no such table: answer_cache"); } };
  assert.equal(await readCachedAnswer(broken, "k"), null);
  await assert.doesNotReject(() => writeCachedAnswer(broken, "k", "Jawaban."));
});
