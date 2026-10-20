/**
 * Mendaftarkan dokumen bawaan (folder dokumen/) ke tabel documents.
 *
 *   node worker/seed-documents.mjs > worker/seed-documents.sql
 *
 * Aman dijalankan ulang: dokumen bawaan ditimpa, dokumen unggahan tidak disentuh,
 * dan status RAG yang sudah diatur pengelola dipertahankan.
 */

import { documents } from "../data/sources.js";

const quote = (v) => (v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const categories = {
  "buku-panduan": "Tugas Akhir & Skripsi",
  "pedoman-karya-ilmiah": "Pedoman Akademik",
  "pengumuman-t207": "Pengumuman",
};
const sizeBytes = { "buku-panduan": 3756418, "pedoman-karya-ilmiah": 8775470, "pengumuman-t207": 312662 };

const lines = [];
for (const [id, doc] of Object.entries(documents)) {
  lines.push(
    `INSERT INTO documents (id, title, owner, reference, period, kind, pages, size_bytes, file, bundled, status, rag_active, category)`,
    `VALUES (${[id, doc.title, doc.owner, doc.reference, doc.period, doc.kind].map(quote).join(", ")}, ${doc.pages}, ${sizeBytes[id] ?? 0}, ${quote(doc.file)}, 1, 'ready', 1, ${quote(categories[id] ?? null)})`,
    `ON CONFLICT(id) DO UPDATE SET title = excluded.title, owner = excluded.owner, reference = excluded.reference,`,
    `  period = excluded.period, pages = excluded.pages, size_bytes = excluded.size_bytes, file = excluded.file, bundled = 1, category = COALESCE(documents.category, excluded.category);`,
  );
}
console.log(lines.join("\n"));
