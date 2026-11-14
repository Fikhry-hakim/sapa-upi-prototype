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

import { knowledgeBase } from "../data/knowledge-base.js";
import { searchKnowledgeBase } from "../lib/search.js";
import { toIndonesianQuery } from "../lib/en-terms.js";

test("English questions find the same topics as their Indonesian versions", () => {
  const cases = [
    ["When is the deadline for academic leave this semester?", "cuti-akademik-batas"],
    ["When are the midterm and final exams?", "kalender-perkuliahan-ujian"],
    ["How do I access Scopus?", "scopus-akses"],
    ["What is the dress code for the results seminar?", "semhas-pakaian"],
    ["What is the similarity limit in Turnitin?", "uji-similaritas"],
    ["When is the short semester?", "kalender-semester-antara"],
    ["When does the semester start?", "kalender-perkuliahan-ujian"],
    ["What courses does class of 2025 take?", "mata-kuliah-ganjil-2026"],
  ];
  for (const [question, id] of cases) {
    const result = searchKnowledgeBase(toIndonesianQuery(question), knowledgeBase);
    assert.notEqual(result.status, "none", question);
    assert.equal(result.best.entry.id, id, question);
  }
});

test("a question with no known English terms is left alone, and an unrelated one is still refused", () => {
  assert.equal(toIndonesianQuery("Apa syarat sidang?"), "Apa syarat sidang?");
  assert.equal(searchKnowledgeBase(toIndonesianQuery("What is the weather in Bandung?"), knowledgeBase).status, "none");
});

test("dashboard text is translated, but document categories and titles are left as written", () => {
  assert.equal(translate("Tingkat Kegagalan Teknis"), "Technical Failure Rate");
  assert.equal(translate("Versi 2 dari 3"), "Version 2 of 3");
  assert.equal(translate("Menampilkan 10 dari 1.234 interaksi"), "Showing 10 of 1.234 interactions");
  for (const untouched of ["Pengumuman", "Surat Edaran", "Kalender Akademik", "Pedoman Akademik & Tugas Akhir", "Surat Edaran Nomor 48 Tahun 2026"]) {
    assert.equal(translate(untouched), untouched);
  }
});

test("dashboard charts: titles, week and date labels, and decimal separators", () => {
  assert.equal(translate("Tren Waktu Respons"), "Response Time Trend");
  assert.equal(translate("Minggu 2"), "Week 2");
  assert.equal(translate("14 Mei"), "14 May");
  assert.equal(translate("Puncak: Minggu 4 (101 interaksi)"), "Peak: Week 4 (101 interactions)");
  assert.equal(translate("9,1 dtk"), "9.1 s");
  assert.equal(translate("Median 5,4 detik"), "Median 5.4 seconds");
  assert.equal(translate("Rata-rata: 12,3 interaksi/minggu"), "Average: 12.3 interactions/week");
  assert.match(translate("11 penilaian, 90,9% di antaranya Baik. Penilaian bersifat sukarela dan tidak memuat pertanyaan maupun identitas."), /^11 ratings, 90\.9% of them Good/);
});
