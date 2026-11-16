import assert from "node:assert/strict";
import test from "node:test";
import { knowledgeBase } from "../data/knowledge-base.js";
import { searchKnowledgeBase } from "../lib/search.js";
import { cleanHistory, contextQuery, mergeContext, needsContext, MAX_TURNS } from "../lib/followup.js";

/** Sama dengan retrieve() di Worker: tiga entri teratas beserta status dan skornya. */
function retrieve(query) {
  const result = searchKnowledgeBase(query, knowledgeBase);
  if (result.status === "empty" || result.status === "none") return { entries: [], status: "none", score: null };
  const seen = new Set();
  const entries = [result.best, ...result.alternatives]
    .filter(Boolean)
    .filter(({ entry }) => (seen.has(entry.id) ? false : seen.add(entry.id)))
    .slice(0, 3)
    .map(({ entry }) => entry);
  return { entries, status: result.status, score: result.best?.score ?? null };
}

/** Yang dilakukan Worker untuk satu pertanyaan, mengembalikan id entri konteks. */
function contextFor(question, turns) {
  const history = cleanHistory(turns);
  const own = retrieve(question);
  if (!needsContext(question, own, history)) return own.entries.map((entry) => entry.id);
  const lastId = [...history].reverse().find((turn) => turn.entryId)?.entryId;
  const last = knowledgeBase.find((entry) => entry.id === lastId) ?? null;
  return mergeContext(own, retrieve(contextQuery(question, history)), last).map((entry) => entry.id);
}

const asked = (q, entryId = null) => [{ q, a: "", entryId }];

const cases = [
  // pertanyaan tanpa topik sendiri: harus nyambung ke yang sebelumnya
  ["pengajuan cuti sem ganjil sampai kapan untuk tahun ini", "berarti gua ikutin yang mana nii", "cuti-akademik-batas"],
  ["pengajuan cuti sem ganjil sampai kapan untuk tahun ini", "di kalender akademik kok berbeda", "kalender-cuti-akademik"],
  ["kapan batas pembayaran ukt", "kalau telat bayar gimana", "ukt-pembayaran-ganjil"],
  ["kapan batas pembayaran ukt", "kalau cuti sampai kapan", "cuti-akademik-batas"],
  ["kapan jadwal irs dan perwalian", "kalau angkatan 2023 kapan", "irs-perwalian-jadwal"],
  ["kapan uts", "kalau uas kapan", "kalender-perkuliahan-ujian"],
  ["kapan uts", "terus nilainya kapan keluar", "kalender-perkuliahan-ujian"],
  ["apa itu msib", "laporan akhirnya kapan dikumpulkan", "msib-laporan-akhir"],
];

for (const [before, now, expected] of cases) {
  test(`"${now}" continues "${before}"`, () => {
    const ids = contextFor(now, asked(before));
    assert.ok(ids.includes(expected), `${expected} missing from ${ids.join(", ")}`);
  });
}

test("a question with its own clear topic is not dragged back to the previous one", () => {
  assert.match(contextFor("apa saja syarat ttg", asked("kapan uts"))[0], /^ttg-/);
  assert.equal(contextFor("bagaimana format penulisan skripsi", asked("kapan uts"))[0], "format-penulisan");
});

test("without any history nothing changes", () => {
  assert.equal(needsContext("berarti yang mana", retrieve("berarti yang mana"), []), false);
});

test("the last answered topic anchors a question that has no topic of its own", () => {
  const ids = contextFor("berarti gua ikutin yang mana nii", asked("apa saja", "cuti-akademik-batas"));
  assert.ok(ids.includes("cuti-akademik-batas"));
});

test("history from the browser is trimmed and cannot carry anything but text", () => {
  const dirty = [{ q: "a".repeat(900), a: "b".repeat(900) }, { q: 5 }, null, { q: "ok", a: 7, entryId: "x".repeat(200) }, { q: "c" }, { q: "d" }];
  const clean = cleanHistory(dirty);
  assert.equal(clean.length, MAX_TURNS);
  assert.ok(clean.every((turn) => turn.q.length <= 300 && turn.a.length <= 500 && (turn.entryId ?? "").length <= 80));
  assert.equal(clean.at(-1).q, "d");
  assert.equal(cleanHistory(undefined, "pertanyaan lama")[0].q, "pertanyaan lama", "the older single-question field still works");
});

test("a follow-up with its own topic still gets the last answered topic as a second context entry", async () => {
  const { withAnchor } = await import("../lib/followup.js");
  const last = knowledgeBase.find((entry) => entry.id === "cuti-akademik-batas");
  const own = retrieve("di kalender akademik kok berbeda").entries;
  const withLast = withAnchor(own, [last]);
  assert.equal(withLast[0].id, own[0].id, "the topic of the new question stays first");
  assert.equal(withLast[1].id, "cuti-akademik-batas");
  assert.equal(withLast.length, 3);
  assert.deepEqual(withAnchor(own, null), own);
});

test("anchors come from the last two different topics, newest first", async () => {
  const { lastEntries, withAnchor } = await import("../lib/followup.js");
  const turns = cleanHistory([
    { q: "a", entryId: "cuti-akademik-batas" },
    { q: "b", entryId: "kalender-cuti-akademik" },
    { q: "c", entryId: "kalender-cuti-akademik" },
  ]);
  const anchors = lastEntries(turns, knowledgeBase);
  assert.deepEqual(anchors.map((entry) => entry.id), ["kalender-cuti-akademik", "cuti-akademik-batas"]);
  const own = retrieve("di kalender akademik kok berbeda").entries;
  assert.ok(withAnchor(own, anchors).some((entry) => entry.id === "cuti-akademik-batas"));
});
