import test from "node:test";
import assert from "node:assert/strict";

import { knowledgeBase } from "../data/knowledge-base.js";
import { searchKnowledgeBase } from "../lib/search.js";
import { pickSuggestion } from "../lib/suggest.js";

const entry = (id) => knowledgeBase.find((e) => e.id === id);

test("the suggestion follows what was just asked, not just the topic", () => {
  const ujian = entry("kalender-perkuliahan-ujian");
  assert.match(pickSuggestion(ujian, "kapan si UTS dilaksanakan"), /UTS/);
  assert.match(pickSuggestion(ujian, "kapan UAS dilaksanakan"), /UAS/);
  assert.match(pickSuggestion(ujian, "kapan ujian ulang dan remedial"), /remedial|ujian ulang/i);
  assert.match(pickSuggestion(ujian, "kapan awal kuliah semester ganjil"), /perkuliahan/i);

  const sidang = entry("sidang-syarat-skripsi");
  assert.match(pickSuggestion(sidang, "berapa skor tesol untuk sidang"), /Turnitin|SKS|mendaftar/);
  assert.match(pickSuggestion(sidang, "batas turnitin sidang"), /TESOL|SKS|mendaftar/);
});

test("a question that was just asked is not suggested back, and contact requests never are", () => {
  const ujian = entry("kalender-perkuliahan-ujian");
  assert.notEqual(pickSuggestion(ujian, "Kapan UTS semester genap?"), "Kapan UTS semester genap?");
  for (const e of knowledgeBase) {
    for (const asked of ["", "apa saja", e.questions[0]]) {
      const suggestion = pickSuggestion(e, asked);
      assert.ok(suggestion, `${e.id} has a suggestion for "${asked}"`);
      assert.ok(!/hubungi/i.test(suggestion), `${e.id} suggests asking for contacts`);
    }
  }
});

test("English questions pick a suggestion through their Indonesian keywords", () => {
  const ujian = entry("kalender-perkuliahan-ujian");
  assert.match(pickSuggestion(ujian, "When is the midterm exam?", { lang: "en" }), /UTS/);
  assert.match(pickSuggestion(ujian, "When are the final exams?", { lang: "en" }), /UAS/);
});

test("every hint is a real question the knowledge base can answer", () => {
  for (const e of knowledgeBase) {
    assert.ok(Array.isArray(e.hints) && e.hints.length >= 2, `${e.id} needs hints`);
    for (const hint of e.hints) {
      assert.equal(typeof hint, "string");
      const result = searchKnowledgeBase(hint, knowledgeBase);
      assert.notEqual(result.status, "none", `unanswerable hint in ${e.id}: ${hint}`);
    }
  }
});
