import test from "node:test";
import assert from "node:assert/strict";
import { MAX_QUESTION_CHARS, SIDE, OUTCOMES, recordEvent, sanitizeQuestion, topQuestions } from "../worker/src/events.js";

test("a question is tidied, anonymised, and cut before it is stored", () => {
  assert.equal(sanitizeQuestion("  Apa syarat   sidang skripsi?? "), "Apa syarat sidang skripsi");
  assert.equal(sanitizeQuestion("kirim ke budi@upi.edu ya"), "kirim ke [email] ya");
  assert.equal(sanitizeQuestion("NIM saya 2208123456 bisa sidang?"), "NIM saya [angka] bisa sidang");
  assert.equal(sanitizeQuestion("telepon 0811-2096-229 itu siapa"), "telepon [angka] itu siapa");
  // Angka pendek (semester, SKS, nomor edaran) tetap terbaca.
  assert.equal(sanitizeQuestion("batas cuti semester 7 dan 144 SKS"), "batas cuti semester 7 dan 144 SKS");
  assert.equal(sanitizeQuestion("x".repeat(500)).length, MAX_QUESTION_CHARS);
  assert.equal(sanitizeQuestion("ya"), null);
  assert.equal(sanitizeQuestion(undefined), null);
});

test("every outcome belongs to exactly one side", () => {
  for (const outcome of OUTCOMES) assert.ok(["terjawab", "pengguna", "ai_data"].includes(SIDE[outcome]), outcome);
  assert.equal(SIDE.di_luar_cakupan, "pengguna");
  assert.equal(SIDE.klarifikasi, "pengguna");
  assert.equal(SIDE.bukti_terbatas, "ai_data");
  assert.equal(SIDE.gangguan_teknis, "ai_data");
});

function dbWith(rows) {
  return {
    prepare: () => ({
      bind: () => ({ all: async () => ({ results: rows }) }),
    }),
  };
}
const window = { start: Date.parse("2026-11-01T00:00:00Z"), end: Date.parse("2026-12-01T00:00:00Z") };

test("the same question in different letter case is one question with its outcomes added up", async () => {
  const result = await topQuestions(
    dbWith([
      { key: "apa syarat sidang", question: "Apa syarat sidang", outcome: "berbasis_sumber", n: 5 },
      { key: "apa syarat sidang", question: "apa syarat sidang", outcome: "klarifikasi", n: 1 },
      { key: "kapan wisuda", question: "Kapan wisuda", outcome: "gangguan_teknis", n: 3 },
    ]),
    window,
  );
  assert.equal(result.unique, 2);
  assert.equal(result.recorded, 9);
  assert.equal(result.questions[0].total, 6);
  assert.equal(result.questions[0].counts.berbasis_sumber, 5);
  assert.equal(result.questions[0].side, "terjawab");
});

test("a question is blamed on the side where it failed more, and on nobody when it mostly succeeded", async () => {
  const result = await topQuestions(
    dbWith([
      { key: "a", question: "A", outcome: "di_luar_cakupan", n: 4 },
      { key: "b", question: "B", outcome: "gangguan_teknis", n: 3 },
      { key: "b", question: "B", outcome: "bukti_terbatas", n: 2 },
      { key: "c", question: "C", outcome: "berbasis_sumber", n: 9 },
      { key: "c", question: "C", outcome: "klarifikasi", n: 1 },
    ]),
    window,
  );
  const side = (q) => result.questions.find((item) => item.question === q).side;
  assert.equal(side("A"), "pengguna");
  assert.equal(side("B"), "ai_data");
  assert.equal(side("C"), "terjawab");
  assert.deepEqual(result.sides, { terjawab: 9, pengguna: 5, ai_data: 5 });
});

test("only the most asked questions are returned", async () => {
  const rows = Array.from({ length: 30 }, (_, i) => ({ key: `q${i}`, question: `Q${i}`, outcome: "berbasis_sumber", n: i + 1 }));
  const result = await topQuestions(dbWith(rows), window, { limit: 10 });
  assert.equal(result.questions.length, 10);
  assert.equal(result.questions[0].question, "Q29");
  assert.equal(result.unique, 30);
});

test("an event is still recorded, without its text, before the question column exists", async () => {
  const statements = [];
  const db = {
    prepare(sql) {
      statements.push(sql);
      return {
        bind: () => ({
          run: async () => {
            if (/question/.test(sql)) throw new Error("table events has no column named question");
          },
        }),
      };
    },
  };
  await recordEvent(db, { outcome: "berbasis_sumber", question: "Apa syarat sidang?" });
  assert.equal(statements.length, 2);
  assert.ok(!/question/.test(statements[1]));
  // Kesalahan lain tidak ditelan.
  const broken = { prepare: () => ({ bind: () => ({ run: async () => { throw new Error("disk penuh"); } }) }) };
  await assert.rejects(recordEvent(broken, { outcome: "berbasis_sumber" }), /disk penuh/);
});
