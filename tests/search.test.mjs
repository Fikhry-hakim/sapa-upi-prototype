import test from "node:test";
import assert from "node:assert/strict";

import { knowledgeBase } from "../data/knowledge-base.js";
import { normalizeText, searchKnowledgeBase, stem } from "../lib/search.js";

test("normalizeText removes punctuation, casing, and repeated whitespace", () => {
  assert.equal(
    normalizeText("  Bagaimana Cara Daftar SIDANG?!  "),
    "bagaimana cara daftar sidang",
  );
});

test("exact academic question returns the matching knowledge entry", () => {
  const result = searchKnowledgeBase(
    "Apa saja persyaratan pendaftaran sidang?",
    knowledgeBase,
  );

  assert.equal(result.status, "match");
  assert.equal(result.best.entry.id, "sidang-syarat-skripsi");
});

test("informal TA wording resolves to a Tugas Akhir topic", () => {
  const result = searchKnowledgeBase("Gimana mulai TA?", knowledgeBase);

  assert.equal(result.status, "match");
  assert.equal(result.best.entry.category, "Tugas Akhir");
});

test("empty input returns empty without a best result", () => {
  const result = searchKnowledgeBase("   ", knowledgeBase);

  assert.deepEqual(result, {
    status: "empty",
    best: null,
    alternatives: [],
  });
});

test("unrelated input returns none", () => {
  const result = searchKnowledgeBase("Di mana beli tiket konser?", knowledgeBase);

  assert.equal(result.status, "none");
  assert.equal(result.best, null);
  assert.deepEqual(result.alternatives, []);
});

test("a bare sidang query returns close topic suggestions", () => {
  // Several entries answer "sidang": the requirements, how it is run, the
  // result categories. One word does not choose between them.
  const result = searchKnowledgeBase("sidang", knowledgeBase);
  const suggestedIds = result.alternatives.map(({ entry }) => entry.id);

  assert.equal(result.status, "ambiguous");
  assert.ok(suggestedIds.length >= 2, "expected more than one close topic");
  assert.ok(
    suggestedIds.every((id) => knowledgeBase.some((entry) => entry.id === id)),
    "suggestions must be real entries",
  );
});

test("a question naming the sidang wins over the thesis topic it mentions", () => {
  // "skripsi" expands to "tugas akhir", which used to outweigh "sidang" purely
  // by producing more tokens and by repeating across the entry's sample
  // questions and synonym list.
  for (const query of [
    "Apa saja syarat mendaftar sidang skripsi?",
    "syarat sidang skripsi apa aja",
    "mau daftar sidang skripsi gimana",
  ]) {
    const result = searchKnowledgeBase(query, knowledgeBase);
    assert.equal(result.best.entry.id, "sidang-syarat-skripsi", `wrong topic for: ${query}`);
  }
});

test("asking about starting the thesis lands on the Tugas Akhir topic", () => {
  for (const query of ["mau mulai skripsi mulai dari mana", "Apa syarat mengambil skripsi?"]) {
    const result = searchKnowledgeBase(query, knowledgeBase);
    assert.equal(
      result.best.entry.id,
      "skripsi-syarat-mengambil",
      `wrong topic for: ${query}`,
    );
  }
});

test("a question these documents do not cover is refused, not force-matched", () => {
  // The four source documents say nothing about attendance, tuition or leave.
  // A weak coincidental overlap must not be served as an answer.
  for (const query of [
    "Berapa minimal kehadiran kuliah?",
    "cara bayar ukt",
    "cuti kuliah gimana",
    "beasiswa apa saja",
  ]) {
    const result = searchKnowledgeBase(query, knowledgeBase);
    assert.equal(result.status, "none", `should not have matched: ${query}`);
  }
});

test("stem lets official wording and student shorthand meet", () => {
  // Documents say "persyaratan pendaftaran"; students type "syarat daftar".
  assert.equal(stem("persyaratan"), stem("syarat"));
  assert.equal(stem("pendaftaran"), stem("daftar"));
  assert.equal(stem("mendaftar"), stem("daftar"));
  assert.equal(stem("kehadiran"), stem("hadir"));
  assert.equal(stem("perkuliahan"), stem("kuliah"));
  assert.equal(stem("kelulusan"), stem("lulus"));

  // and does not chew short words down to nothing
  assert.equal(stem("sidang"), "sidang");
  assert.equal(stem("berkas"), "berkas");
  assert.equal(stem("tugas"), "tugas");
});

test("colloquial phrasing reaches the same entry as the formal question", () => {
  const pairs = [
    ["Bagaimana cara mengganti dosen pembimbing skripsi?", "gimana ganti pembimbing"],
    ["Bagaimana aturan penggunaan AI dalam skripsi?", "boleh pakai ai ga buat skripsi"],
    ["Apa ketentuan berpakaian saat seminar hasil?", "pakaian semhas gimana"],
  ];

  for (const [formal, casual] of pairs) {
    assert.equal(
      searchKnowledgeBase(casual, knowledgeBase).best.entry.id,
      searchKnowledgeBase(formal, knowledgeBase).best.entry.id,
      `casual phrasing diverged: ${casual}`,
    );
  }
});

test("ambiguity is judged on the gap in proportion, not a fixed number of points", () => {
  // Scores scale with how rare the matched words are, so a fixed gap would read
  // as ambiguous for a weak match and decisive for a strong one.
  const broad = searchKnowledgeBase("sidang", knowledgeBase);
  assert.equal(broad.status, "ambiguous");

  const specific = searchKnowledgeBase("Apa saja persyaratan pendaftaran sidang?", knowledgeBase);
  assert.equal(specific.status, "match");
  assert.ok(
    specific.best.score > broad.best.score,
    "a precisely worded question should outscore a bare keyword",
  );
});

test("an entry cannot win by listing one concept several ways", () => {
  // "ta", "skripsi" and "tugas akhir" normalize to the same phrase, so an
  // entry listing several of them must not collect the bonus several times.
  const viaSynonym = searchKnowledgeBase("sidang skripsi", knowledgeBase);
  const viaFullWord = searchKnowledgeBase("sidang tugas akhir", knowledgeBase);

  assert.equal(viaSynonym.best.entry.id, viaFullWord.best.entry.id);
  assert.equal(viaSynonym.best.entry.id, "sidang-syarat-skripsi");
});

test("the glossary lets student slang and spelled-out abbreviations reach the entries their short forms already matched", () => {
  for (const [query, expectedId] of [
    ["dospem saya siapa", "pembimbing-penggantian"],
    ["surat keputusan pembimbing", "pembimbing-skripsi"],
    ["indeks prestasi kumulatif minimal berapa", "skripsi-syarat-mengambil"],
    ["satuan kredit semester minimal", "skripsi-syarat-mengambil"],
  ]) {
    const result = searchKnowledgeBase(query, knowledgeBase);
    assert.notEqual(result.status, "none", query);
    assert.equal(result.best.entry.id, expectedId, query);
  }
});

test("TTG is found whether asked by its short or long form, on its own or inside a longer question", () => {
  for (const query of ["apa itu TTG", "gmn jalur akhir TTG", "ketentuan Teknologi Tepat Guna"]) {
    const result = searchKnowledgeBase(query, knowledgeBase);
    assert.notEqual(result.status, "none", query);
    assert.match(result.best.entry.id, /^ttg-/, query);
  }
});

test("a known limitation: a fully spelled-out English phrase (\"letter of acceptance\") still loses to its own filler words", () => {
  // "LoA" alone already matches fine — the glossary appends it here too — but
  // the existing relevance formula discounts a match by how much of the query
  // it covers, and "letter", "of" and "acceptance" are English words this
  // Indonesian-tuned scorer does not otherwise recognise. Covered here so a
  // future fix to that formula has a test to turn green, not silently fixed.
  assert.equal(searchKnowledgeBase("loa", knowledgeBase).status, "ambiguous");
  assert.equal(searchKnowledgeBase("letter of acceptance", knowledgeBase).status, "none");
});
