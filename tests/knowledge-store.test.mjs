import test from "node:test";
import assert from "node:assert/strict";

import { knowledgeBase } from "../data/knowledge-base.js";
import {
  assembleEntries,
  loadKnowledgeBase,
  clearCache,
  CACHE_TTL_MS,
} from "../worker/src/knowledge-store.js";

const entryRow = {
  id: "sidang-pendaftaran",
  category: "Sidang",
  title: "Persyaratan pendaftaran sidang",
  answer: "Mahasiswa menyiapkan berkas.",
  lead: "Berikut rinciannya:",
  closing: "Ada lagi yang mau ditanyakan?",
  source_title: "Contoh Pedoman Akademik UPI",
  source_owner: "Pengelola Tugas Akhir",
  valid_period: "Semester Ganjil 2026/2027",
  updated_at: "12 September 2026",
  source_url: "https://example.com/sidang",
  escalation: "Hubungi pengelola tugas akhir.",
  table_json: null,
};

/** Minimal stand-in for the D1 binding: two canned result sets. */
function fakeD1({ entries = [], lists = [], fail = false } = {}) {
  let calls = 0;
  return {
    get calls() {
      return calls;
    },
    prepare(sql) {
      calls += 1;
      return {
        all: async () => {
          if (fail) throw new Error("D1_ERROR: no such table");
          return { results: sql.includes("entry_lists") ? lists : entries };
        },
      };
    },
  };
}

test("assembleEntries rebuilds the shape the retrieval code expects", () => {
  const [entry] = assembleEntries(
    [entryRow],
    [
      { entry_id: "sidang-pendaftaran", kind: "question", value: "Apa saja persyaratannya?" },
      { entry_id: "sidang-pendaftaran", kind: "keyword", value: "sidang" },
      { entry_id: "sidang-pendaftaran", kind: "point", value: "Siapkan berkas." },
      { entry_id: "sidang-pendaftaran", kind: "follow_up", value: "Berapa lama prosesnya?" },
    ],
  );

  assert.equal(entry.sourceTitle, "Contoh Pedoman Akademik UPI");
  assert.equal(entry.validPeriod, "Semester Ganjil 2026/2027");
  assert.deepEqual(entry.questions, ["Apa saja persyaratannya?"]);
  assert.deepEqual(entry.keywords, ["sidang"]);
  assert.deepEqual(entry.points, ["Siapkan berkas."]);
  assert.deepEqual(entry.followUps, ["Berapa lama prosesnya?"]);
  assert.ok(!("table" in entry), "no table_json means no table key");
});

test("list order follows the position the author wrote, as the query returns it", () => {
  const [entry] = assembleEntries(
    [entryRow],
    [
      { entry_id: "sidang-pendaftaran", kind: "point", value: "pertama" },
      { entry_id: "sidang-pendaftaran", kind: "point", value: "kedua" },
      { entry_id: "sidang-pendaftaran", kind: "point", value: "ketiga" },
    ],
  );

  assert.deepEqual(entry.points, ["pertama", "kedua", "ketiga"]);
});

test("a rendered table survives the round trip through JSON", () => {
  const table = { title: "Syarat", columns: ["A", "B"], rows: [["1", "2"]] };
  const [entry] = assembleEntries([{ ...entryRow, table_json: JSON.stringify(table) }], []);

  assert.deepEqual(entry.table, table);
});

test("a malformed table drops the table but keeps the answer", () => {
  const [entry] = assembleEntries([{ ...entryRow, table_json: "{ bukan json" }], []);

  assert.ok(!("table" in entry));
  assert.equal(entry.answer, "Mahasiswa menyiapkan berkas.");
});

test("list rows for an unknown entry or kind are ignored, not thrown on", () => {
  const [entry] = assembleEntries(
    [entryRow],
    [
      { entry_id: "entri-yang-tidak-ada", kind: "question", value: "diabaikan" },
      { entry_id: "sidang-pendaftaran", kind: "jenis-asing", value: "diabaikan" },
      { entry_id: "sidang-pendaftaran", kind: "question", value: "dipakai" },
    ],
  );

  assert.deepEqual(entry.questions, ["dipakai"]);
});

test("D1 is the source of truth when it has active entries", async () => {
  clearCache();
  const db = fakeD1({
    entries: [entryRow],
    lists: [{ entry_id: "sidang-pendaftaran", kind: "keyword", value: "sidang" }],
  });

  const loaded = await loadKnowledgeBase(db, knowledgeBase);

  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].id, "sidang-pendaftaran");
});

test("a failing D1 falls back to the bundled copy instead of answering nothing", async () => {
  clearCache();
  const loaded = await loadKnowledgeBase(fakeD1({ fail: true }), knowledgeBase);

  assert.equal(loaded, knowledgeBase);
});

test("an empty D1 falls back too, so a half-run migration cannot blank the assistant", async () => {
  clearCache();
  const loaded = await loadKnowledgeBase(fakeD1({ entries: [], lists: [] }), knowledgeBase);

  assert.equal(loaded, knowledgeBase);
});

test("no binding at all still answers from the bundled copy", async () => {
  clearCache();
  const loaded = await loadKnowledgeBase(undefined, knowledgeBase);

  assert.equal(loaded, knowledgeBase);
});

test("the knowledge base is cached, then re-read once the TTL passes", async () => {
  clearCache();
  const db = fakeD1({ entries: [entryRow], lists: [] });
  let now = 1_000_000;

  await loadKnowledgeBase(db, knowledgeBase, () => now);
  await loadKnowledgeBase(db, knowledgeBase, () => now);
  const callsWhileFresh = db.calls;

  now += CACHE_TTL_MS + 1;
  await loadKnowledgeBase(db, knowledgeBase, () => now);

  assert.equal(callsWhileFresh, 2, "two prepared statements for one load");
  assert.equal(db.calls, 4, "an expired cache reads D1 again");
});

test("entries seeded from the bundled file keep every field the UI renders", () => {
  // Guards the seed script: a field dropped on the way into D1 would show up
  // as a missing source line or an empty answer, not as an error.
  const [rebuilt] = assembleEntries([entryRow], []);
  const sample = knowledgeBase[0];

  for (const field of Object.keys(sample)) {
    if (["questions", "keywords", "points", "followUps", "table"].includes(field)) continue;
    assert.ok(field in rebuilt, `assembled entry is missing ${field}`);
  }
});
