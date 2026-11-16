/**
 * Mendaftarkan dokumen bawaan (folder dokumen/) ke tabel documents.
 *
 *   node worker/seed-documents.mjs > worker/seed-documents.sql
 *
 * Aman dijalankan ulang: dokumen bawaan ditimpa, dokumen unggahan tidak disentuh,
 * dan status RAG yang sudah diatur pengelola dipertahankan.
 */

import { statSync, readdirSync } from "node:fs";
import { documents } from "../data/sources.js";

const quote = (v) => (v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const categories = {
  "buku-panduan": "Pedoman Akademik & Tugas Akhir",
  "pedoman-karya-ilmiah": "Pedoman Akademik & Tugas Akhir",
  "pengumuman-t207": "Pengumuman",
  "kalender-akademik-2026": "Kalender Akademik",
  "edaran-48-2026": "Surat Edaran",
  "pengumuman-t150": "Pengumuman",
  "edaran-68-2026": "Surat Edaran",
  "pengumuman-t45": "Pengumuman",
  "edaran-092-2025": "Surat Edaran",
  "peraturan-rektor-70-2026": "Pedoman Akademik & Tugas Akhir",
  "ppt-syarat-kelulusan-2025": "Pedoman Akademik & Tugas Akhir",
  "pedoman-ta-2024": "Pedoman Akademik & Tugas Akhir",
  "panduan-mandala": "Pedoman Akademik & Tugas Akhir",
};
// Hanya dokumen yang dirujuk entri knowledge base yang dipakai menjawab.
const usedForAnswers = (id) => !["ppt-syarat-kelulusan-2025", "pedoman-ta-2024", "panduan-mandala"].includes(id);
const sizeBytes = { "buku-panduan": 3756418, "pedoman-karya-ilmiah": 8775470, "pengumuman-t207": 312662,
  "kalender-akademik-2026": 800546,
  "edaran-48-2026": 1008547,
  "pengumuman-t150": 306230,
  "edaran-68-2026": 974039,
  "pengumuman-t45": 293651,
  "edaran-092-2025": 328634,
};

const root = new URL("../", import.meta.url);
const bytesOf = (file) => statSync(new URL(file.replace(/^\.\//, ""), root)).size;

const lines = [];
for (const [id, doc] of Object.entries(documents)) {
  lines.push(
    `INSERT INTO documents (id, title, owner, reference, period, kind, pages, size_bytes, file, bundled, status, rag_active, category)`,
    `VALUES (${[id, doc.title, doc.owner, doc.reference, doc.period, doc.kind].map(quote).join(", ")}, ${doc.pages}, ${sizeBytes[id] ?? bytesOf(doc.file)}, ${quote(doc.file)}, 1, 'ready', ${usedForAnswers(id) ? 1 : 0}, ${quote(categories[id] ?? null)})`,
    `ON CONFLICT(id) DO UPDATE SET title = excluded.title, owner = excluded.owner, reference = excluded.reference,`,
    `  period = excluded.period, pages = excluded.pages, size_bytes = excluded.size_bytes, file = excluded.file, bundled = 1, category = COALESCE(documents.category, excluded.category);`,
  );
}

// Template administrasi (docx/pdf) di dokumen/template: tersedia untuk diunduh, bukan sumber jawaban.
const templateDir = new URL("dokumen/template/", root);
const readable = (name) =>
  name
    .replace(/\.[a-z]+$/i, "")
    .replace(/-/g, " ")
    .replace(/\bsem (\d+)\b/i, "SEM $1 –")
    .replace(/^./, (c) => c.toUpperCase());
for (const name of readdirSync(templateDir).sort()) {
  const id = `template-${name.replace(/\.[a-z]+$/i, "").toLowerCase()}`;
  const file = `./dokumen/template/${name}`;
  const kind = name.endsWith(".pdf") ? "PDF" : "DOCX";
  lines.push(
    `INSERT INTO documents (id, title, owner, reference, period, kind, pages, size_bytes, file, bundled, status, rag_active, category)`,
    `VALUES (${[id, `Template: ${readable(name)}`, "Program Studi Bisnis Digital, UPI Kampus Daerah Tasikmalaya", "Template kelengkapan dokumen pendaftaran seminar dan sidang", "Tahun Akademik 2026/2027", kind].map(quote).join(", ")}, 1, ${bytesOf(file)}, ${quote(file)}, 1, 'ready', 0, 'Template Dokumen')`,
    `ON CONFLICT(id) DO UPDATE SET title = excluded.title, size_bytes = excluded.size_bytes, file = excluded.file, bundled = 1, category = COALESCE(documents.category, excluded.category);`,
  );
}
console.log(lines.join("\n"));
