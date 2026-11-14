import test from "node:test";
import assert from "node:assert/strict";

import { translate } from "../lib/i18n.js";
import { buildInput, ENGLISH_NOTE, normalizeLang } from "../worker/src/gemini.js";

test("fixed interface strings are translated, keeping surrounding whitespace", () => {
  assert.equal(translate("Masuk dengan akun UPI"), "Sign in with UPI account");
  assert.equal(translate(" Halaman "), " Page ");
  assert.equal(translate("Jelaskan lebih lanjut poin 3"), "Explain point 3 further");
});

test("file cards switch to English units and dates, but answers keep their month names", () => {
  assert.equal(translate("PDF • 3,6 MB • 72 halaman • 5 Okt 2026"), "PDF • 3.6 MB • 72 pages • 5 Oct 2026");
  assert.equal(translate("PDF • 951 KB • 1 halaman • 26 Agu 2026"), "PDF • 951 KB • 1 page • 26 Aug 2026");
  const answer = "UAS berlangsung 10–24 Desember 2026.";
  assert.equal(translate(answer), answer, "official document content stays as written");
});

test("unknown text is returned untouched", () => {
  assert.equal(translate("Kalender Akademik Universitas Pendidikan Indonesia 2026/2027"), "Kalender Akademik Universitas Pendidikan Indonesia 2026/2027");
  assert.equal(translate(""), "");
});

test("the worker only switches to English when asked, and leaves the safety rules alone", () => {
  assert.equal(normalizeLang("en"), "en");
  for (const other of ["id", "fr", undefined, null, "EN "]) assert.equal(normalizeLang(other), "id");
  const entries = [];
  const indonesian = buildInput("Apa syarat sidang?", entries);
  assert.ok(!indonesian.includes(ENGLISH_NOTE));
  assert.equal(buildInput("Apa syarat sidang?", entries, "id"), indonesian);
  const english = buildInput("Apa syarat sidang?", entries, "en");
  assert.ok(english.startsWith(indonesian));
  assert.ok(english.includes("bahasa Inggris") && english.includes("Semua aturan lain tetap berlaku"));
});
