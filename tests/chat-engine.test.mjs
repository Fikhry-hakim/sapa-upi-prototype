import test from "node:test";
import assert from "node:assert/strict";

import { knowledgeBase } from "../data/knowledge-base.js";
import { createChatResponse } from "../lib/chat-engine.js";
import { clarifyQuestion } from "../lib/clarify.js";

test("known question returns a sourced answer response", () => {
  const response = createChatResponse("Apa saja persyaratan pendaftaran sidang?", knowledgeBase);

  assert.equal(response.type, "answer");
  assert.equal(response.entry.id, "sidang-syarat-skripsi");
  assert.equal(response.message, response.entry.answer);
  assert.equal(response.verificationLabel, "Berdasarkan pedoman akademik");
  assert.equal(response.confidenceLabel, "Kecocokan tinggi");
  assert.equal(response.followUpQuestions.length, 4);
  for (const field of [
    "sourceTitle",
    "sourceOwner",
    "validPeriod",
    "updatedAt",
    "sourceRef",
  ]) {
    assert.ok(response.entry[field]);
  }
});

test("broad question returns topic suggestions", () => {
  // One bare word several topics answer: pendaftaran, pelaksanaan, hasil.
  const response = createChatResponse("sidang", knowledgeBase);

  assert.equal(response.type, "suggestions");
  assert.ok(response.suggestions.length >= 2);
  assert.ok(
    response.suggestions.every(
      (suggestion) => suggestion.id && suggestion.title && suggestion.category,
    ),
  );
});

test("unrelated question returns fallback with official escalation options", () => {
  const response = createChatResponse("Di mana beli tiket konser?", knowledgeBase);

  assert.equal(response.type, "fallback");
  assert.match(response.message, /belum menemukan/i);
  assert.equal(response.reason, "Informasi ini belum ada di dokumen yang tersedia.");
  assert.deepEqual(response.escalationOptions, [
    "Tenaga Administrasi Program Studi",
    "Situs atau pengumuman resmi UPI",
  ]);
});

test("empty input returns an empty response without generated content", () => {
  const response = createChatResponse("  ", knowledgeBase);

  assert.deepEqual(response, {
    type: "empty",
    message: "Tuliskan pertanyaan terlebih dahulu.",
  });
});

test("the offline answer to a clicked sentence stays on the topic that sentence came from", () => {
  const question = clarifyQuestion(7, "Transkrip dengan jumlah SKS 144 sampai 152 dan tidak ada mata kuliah bernilai E");

  // Tanpa petunjuk: dicari lewat isi entrinya.
  assert.equal(createChatResponse(question, knowledgeBase).entry.id, "sidang-syarat-skripsi");
  // Dengan petunjuk topik jawaban yang dibaca, topik itu didahulukan walau kalimatnya ada di dua entri.
  assert.equal(createChatResponse(question, knowledgeBase, { topic: "artikel-syarat-sidang" }).entry.id, "artikel-syarat-sidang");
  // Kalimat generik yang tidak bisa dilacak: topik jawabannya dipakai, bukan "belum menemukan".
  const generic = createChatResponse(clarifyQuestion(2, "Persyaratannya:"), knowledgeBase, { topic: "sidang-syarat-skripsi" });
  assert.equal(generic.type, "answer");
  assert.equal(generic.entry.id, "sidang-syarat-skripsi");
});


import { isNotFoundAnswer } from "../lib/chat-engine.js";

test("answers that admit nothing was found are recognised, answers that give facts are not", () => {
  assert.equal(isNotFoundAnswer("Maaf, saya belum menemukan informasi tentang kriteria magang di dokumen yang tersedia."), true);
  assert.equal(isNotFoundAnswer("Saya tidak menemukan aturannya di dokumen."), true);
  assert.equal(isNotFoundAnswer("Masa studi maksimal 14 semester menurut Peraturan Rektor 38/2026."), false);
  assert.equal(isNotFoundAnswer("Persyaratan sidang meliputi draf, bukti publikasi, dan transkrip."), false);
});

test("the can't-answer options never point to a lecturer", () => {
  const response = createChatResponse("Di mana beli tiket konser?", knowledgeBase);
  assert.ok(response.escalationOptions.every((option) => !/dosen|kemahasiswaan|pembimbing/i.test(option)));
});
