import test from "node:test";
import assert from "node:assert/strict";
import { findRequestedDocuments, isFileRequest } from "../lib/doc-request.js";

// Cara orang sungguhan meminta tiap berkas; yang pertama harus selalu dokumen yang dimaksud.
const ASKS = {
  "buku-panduan": ["ada file buku panduan tugas akhir ga", "minta buku panduan penyelesaian tugas akhir"],
  "pedoman-karya-ilmiah": ["ada pedoman penulisan karya ilmiah", "minta file pedoman penulisan skripsi UPI"],
  "pengumuman-t207": ["ada pengumuman seminar hasil jalur artikel", "file pengumuman T-207"],
  "kalender-akademik-2026": ["ada file kalender akademik ga", "minta kalender akademik 2026/2027"],
  "edaran-48-2026": ["ada surat edaran ukt dan perwalian", "file surat edaran nomor 48 tahun 2026"],
  "pengumuman-t150": ["ada pengumuman jadwal irs dan perwalian", "file pengumuman T-150"],
  "edaran-68-2026": ["ada surat edaran cuti akademik", "file surat edaran nomor 68 tahun 2026"],
  "pengumuman-t45": ["ada pengumuman tugas akhir artikel angkatan 2023", "file pengumuman T-45"],
  "edaran-092-2025": ["ada surat edaran laporan msib", "file surat edaran 092 tahun 2025"],
  "peraturan-rektor-70-2026": ["ada file peraturan rektor 70 tahun 2026", "minta peraturan rektor tugas akhir sidang dan kelulusan"],
  "peraturan-rektor-38-2026": ["ada file peraturan rektor 38 tahun 2026", "minta peraturan rektor penyelenggaraan pendidikan"],
  "ppt-syarat-kelulusan-2025": ["ada ppt sosialisasi syarat kelulusan", "minta file sosialisasi syarat kelulusan mahasiswa"],
  "pedoman-ta-2024": ["ada file pedoman penyusunan tugas akhir mahasiswa 2024", "minta pedoman tugas akhir UPI edisi 2024"],
  "panduan-mandala": ["ada panduan aplikasi mandala", "minta file panduan mandala"],
  "panduan-simkatmawa-2026": ["ada file panduan simkatmawa", "minta panduan pengakuan pengalaman belajar kampus berdampak"],
  "panduan-unggah-mandiri": ["ada panduan unggah mandiri sias", "minta file panduan unggah mandiri"],
  "panduan-bebas-pustaka": ["ada panduan bebas pustaka", "minta file panduan pengajuan bebas pustaka"],
  "buku-magang": ["ada file buku magang", "minta buku petunjuk magang bisnis digital"],
  "template-sem-9-laporan-hasil-penelitian-seminar-hasil": ["ada file template laporan hasil penelitian", "minta file SEM 9 laporan hasil penelitian"],
};

test("every document can be asked for by the way students actually ask", () => {
  for (const [id, questions] of Object.entries(ASKS)) {
    for (const question of questions) {
      const found = findRequestedDocuments(question);
      assert.equal(found[0]?.id, id, `"${question}" should give ${id}, got ${found.map((item) => item.id).join(", ") || "nothing"}`);
    }
  }
});

test("ordinary questions are not mistaken for file requests", () => {
  for (const question of [
    "berapa lama masa studi maksimal S1?",
    "syarat sidang skripsi apa aja",
    "kapan batas akhir pengajuan cuti akademik?",
    "apa itu TPTA?",
  ]) {
    assert.deepEqual(findRequestedDocuments(question), [], question);
  }
});

test("a vague request names no document instead of guessing one", () => {
  assert.deepEqual(findRequestedDocuments("ada file apa aja?"), []);
  assert.equal(isFileRequest("ada file apa aja?"), true);
});

import { catalogDocuments, catalogMessage, isCatalogQuestion } from "../lib/doc-request.js";

test("questions about what the collection holds are catalog questions", () => {
  for (const q of [
    "dokumen apa aja yang udah ada di knowledge base",
    "apa saja dokumen yang tersedia di SAPA",
    "daftar dokumen",
    "list file yang ada",
    "SAPA punya dokumen apa saja?",
  ]) assert.equal(isCatalogQuestion(q), true, q);
});

test("questions about a topic inside documents are not catalog questions", () => {
  for (const q of [
    "dokumen apa saja yang diperlukan untuk sidang",
    "ada file kalender akademik ga",
    "apa syarat sidang skripsi",
    "berapa masa studi maksimal",
  ]) assert.equal(isCatalogQuestion(q), false, q);
});

test("the catalog lists official documents and counts templates apart", () => {
  const { official, templates } = catalogDocuments();
  assert.ok(official.length >= 15);
  assert.ok(official.every(({ id }) => !id.startsWith("template-")));
  assert.ok(templates >= 15);
  assert.match(catalogMessage(official.length, templates), /template formulir/);
});
