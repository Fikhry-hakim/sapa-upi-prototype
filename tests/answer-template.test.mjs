import test from "node:test";
import assert from "node:assert/strict";

import { SYSTEM_INSTRUCTION } from "../worker/src/gemini.js";
import { isBullet, splitSentences, stripBullet } from "../lib/clarify.js";

test("the prompt carries the answer template and its question-type variants", () => {
  assert.match(SYSTEM_INSTRUCTION, /KERANGKA JAWABAN/);
  for (const kind of ["Syarat atau daftar", "Cara atau prosedur", "Pertanyaan \"apakah\"", "Angka, tanggal, atau batas", "Arti istilah", "Informasinya tidak ada"]) {
    assert.ok(SYSTEM_INSTRUCTION.includes(kind), `jenis pertanyaan hilang dari kerangka: ${kind}`);
  }
  assert.match(SYSTEM_INSTRUCTION, /maksimal 6 butir/);
});

test("the plain vocabulary rule keeps internal jargon out of answers", () => {
  assert.match(SYSTEM_INSTRUCTION, /Jangan memakai kata "rujukan", "konteks", "terindeks"/);
});

// Bentuk yang diminta kerangka harus persis yang dipahami layar: baris biasa satu kalimat
// (jadi paragraf), butir daftar (jadi <li> yang bisa diklik).
test("a template-shaped answer is read by the screen as opener, list items, then closer", () => {
  const answer = [
    "Untuk mendaftar sidang skripsi, ada beberapa syarat yang harus dipenuhi.",
    "",
    "- Draf skripsi 3 eksemplar yang disahkan pembimbing dan ketua prodi.",
    "- Skor TESOL minimal 400.",
    "- Uji Turnitin maksimal 35%.",
    "",
    "Pastikan kelengkapannya ke tenaga administrasi program studi sebelum mendaftar.",
  ].join("\n");

  const blocks = answer.split(/\n{2,}/);
  assert.equal(blocks.length, 3);

  const [opener, list, closer] = blocks.map((block) => block.split("\n").map((line) => line.trim()).filter(Boolean));
  assert.equal(opener.length, 1);
  assert.ok(!isBullet(opener[0]) && splitSentences(opener[0]).length === 1, "pembuka harus satu kalimat, bukan daftar");

  assert.equal(list.length, 3);
  assert.ok(list.every(isBullet), "setiap butir harus dikenali sebagai butir daftar");
  assert.equal(stripBullet(list[1]), "Skor TESOL minimal 400.");

  assert.ok(!isBullet(closer[0]) && splitSentences(closer[0]).length === 1, "penutup harus satu kalimat, bukan daftar");
});

test("numbered steps are recognised as list items too", () => {
  assert.ok(["1. Buka SIAS.", "2) Unggah berkas."].every(isBullet));
});
