import assert from "node:assert/strict";
import test from "node:test";

import { clarifyQuestion, isBullet, isClarifiable, MAX_QUESTION_LENGTH, splitSentences, stripBullet } from "../lib/clarify.js";

test("an answer is split into the sentences a reader would number", () => {
  const answer =
    "Berdasarkan Pedoman Penulisan Karya Ilmiah UPI (Edisi 2024), margin adalah 4 cm untuk batas kiri, 3 cm untuk batas kanan, 4 cm untuk batas atas, dan 3 cm untuk batas bawah. Ukuran kertas yang digunakan adalah A4 dengan dimensi 21 cm x 29,7 cm. Hubungi staf Program Studi Bisnis Digital saat pengecekan format.";
  const sentences = splitSentences(answer);
  assert.equal(sentences.length, 3);
  assert.ok(sentences[1].endsWith("29,7 cm."), "a decimal comma does not end the sentence");
  assert.ok(sentences[0].startsWith("Berdasarkan"));
});

test("decimals, abbreviations, page references and addresses do not split a sentence", () => {
  assert.equal(splitSentences("Skor TOEFL minimal 2.5 poin pada skala ini.").length, 1);
  assert.equal(splitSentences("Lihat Buku Panduan hal. 33 untuk rincian lengkapnya.").length, 1);
  assert.equal(splitSentences("Syarat meliputi KRS, transkrip, dll. Semuanya diunggah ke sistem.").length, 2);
  assert.equal(splitSentences("Kirim ke bisnisdigital@upi.edu atau kunjungi kd-tasikmalaya.upi.edu hari kerja.").length, 1);
  assert.equal(splitSentences("Sesuai SK No. 207 tahun 2026 tentang seminar hasil.").length, 1);
});

test("question and exclamation marks end a sentence, and empty input gives nothing", () => {
  assert.deepEqual(splitSentences("Apakah sudah siap? Ya, sudah! Lanjutkan ke tahap berikutnya."), [
    "Apakah sudah siap?",
    "Ya, sudah!",
    "Lanjutkan ke tahap berikutnya.",
  ]);
  assert.deepEqual(splitSentences("   "), []);
  assert.deepEqual(splitSentences(null), []);
});

test("a lower-case continuation after a period stays in the same sentence", () => {
  assert.equal(splitSentences("Gunakan ukuran A4 dst. sesuai ketentuan yang berlaku.").length, 1);
});

test("only sentences long enough to be explained get a number", () => {
  assert.equal(isClarifiable("Ya."), false);
  assert.equal(isClarifiable("Baik."), false);
  assert.equal(isClarifiable("Margin kiri adalah 4 cm."), true);
});

test("bullets are recognised and stripped", () => {
  assert.equal(stripBullet("- Draf skripsi"), "Draf skripsi");
  assert.equal(stripBullet("* Draf skripsi"), "Draf skripsi");
  assert.equal(stripBullet("• Draf skripsi"), "Draf skripsi");
  assert.equal(stripBullet("1. Draf skripsi"), "Draf skripsi");
  assert.equal(stripBullet("2) Draf skripsi"), "Draf skripsi");
  for (const line of ["- a b", "* a b", "• a b", "1. a b", "2) a b"]) assert.equal(isBullet(line), true, line);
  assert.equal(isBullet("Draf skripsi"), false);
  assert.equal(isBullet("2026 adalah tahun ajaran baru"), false, "a year is not a list marker");
});

test("the clarification question carries the point itself, so retrieval finds the same topic", () => {
  const q = clarifyQuestion(2, "Ukuran kertas yang digunakan adalah A4.");
  assert.equal(q, 'Jelaskan lebih detail poin 2: "Ukuran kertas yang digunakan adalah A4."');
});

test("a very long sentence is trimmed so the question never exceeds what the Worker accepts", () => {
  const q = clarifyQuestion(11, "Kalimat panjang sekali. ".repeat(60));
  assert.ok(q.length <= MAX_QUESTION_LENGTH, `${q.length} characters`);
  assert.ok(q.includes("…"));
  assert.ok(q.endsWith('"'));
});
