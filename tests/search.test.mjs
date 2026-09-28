import test from "node:test";
import assert from "node:assert/strict";

import { knowledgeBase } from "../data/knowledge-base.js";
import { normalizeText, searchKnowledgeBase } from "../lib/search.js";

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
