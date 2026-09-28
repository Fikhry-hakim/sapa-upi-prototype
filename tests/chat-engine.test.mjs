import test from "node:test";
import assert from "node:assert/strict";

import { knowledgeBase } from "../data/knowledge-base.js";
import { createChatResponse } from "../lib/chat-engine.js";

test("known question returns a sourced answer response", () => {
  const response = createChatResponse(
    "Bagaimana cara mengajukan surat keterangan mahasiswa aktif?",
    knowledgeBase,
  );

  assert.equal(response.type, "answer");
  assert.equal(response.entry.id, "administrasi-surat-aktif");
  assert.equal(response.message, response.entry.answer);
  assert.equal(response.verificationLabel, "Berdasarkan sumber informasi contoh");
  assert.equal(response.confidenceLabel, "Kecocokan tinggi");
  for (const field of [
    "sourceTitle",
    "sourceOwner",
    "validPeriod",
    "updatedAt",
    "sourceUrl",
  ]) {
    assert.ok(response.entry[field]);
  }
});

test("broad question returns topic suggestions", () => {
  const response = createChatResponse("informasi berkas sidang", knowledgeBase);

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
  assert.equal(response.reason, "Informasi tidak tersedia pada knowledge base contoh.");
  assert.deepEqual(response.escalationOptions, [
    "Tenaga Administrasi Program Studi",
    "Dosen atau pihak yang berwenang",
    "Sumber informasi resmi terkait",
  ]);
});

test("empty input returns an empty response without generated content", () => {
  const response = createChatResponse("  ", knowledgeBase);

  assert.deepEqual(response, {
    type: "empty",
    message: "Tuliskan pertanyaan terlebih dahulu.",
  });
});
