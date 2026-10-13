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
  assert.equal(result.best.entry.id, "sidang-pendaftaran");
});

test("informal TA wording resolves to the Tugas Akhir topic", () => {
  const result = searchKnowledgeBase("Gimana mulai TA?", knowledgeBase);

  assert.equal(result.status, "match");
  assert.equal(result.best.entry.id, "tugas-akhir-pengajuan");
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

test("a broad sidang and berkas query returns close topic suggestions", () => {
  const result = searchKnowledgeBase("informasi berkas sidang", knowledgeBase);
  const suggestedIds = result.alternatives.map(({ entry }) => entry.id);

  assert.equal(result.status, "ambiguous");
  assert.ok(suggestedIds.includes("sidang-pendaftaran"));
  assert.ok(suggestedIds.includes("sidang-batas-berkas"));
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
    assert.equal(result.best.entry.id, "sidang-pendaftaran", `wrong topic for: ${query}`);
  }
});

test("asking about the thesis itself still lands on the Tugas Akhir topic", () => {
  for (const query of ["cara ajuin judul skripsi", "mau mulai skripsi mulai dari mana"]) {
    const result = searchKnowledgeBase(query, knowledgeBase);
    assert.equal(result.best.entry.id, "tugas-akhir-pengajuan", `wrong topic for: ${query}`);
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
    ["Berapa minimal kehadiran kuliah?", "absen kurang gimana"],
    ["Kapan batas pengumpulan berkas sidang?", "deadline berkas skripsi kapan"],
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
  // tugas-akhir-pengajuan lists "ta", "skripsi" and "tugas akhir" as separate
  // keywords; they normalize to the same phrase and must be counted once.
  const viaSynonym = searchKnowledgeBase("sidang skripsi", knowledgeBase);
  const viaFullWord = searchKnowledgeBase("sidang tugas akhir", knowledgeBase);

  assert.equal(viaSynonym.best.entry.id, viaFullWord.best.entry.id);
  assert.equal(viaSynonym.best.entry.id, "sidang-pendaftaran");
});
