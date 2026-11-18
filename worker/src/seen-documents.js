/**
 * Berkas yang pernah dicari pengguna.
 *
 * Halaman Berkas mahasiswa dan dosen hanya menampilkan berkas yang sudah mereka cari
 * (muncul sebagai sumber jawaban, diminta lewat chat, atau dibuka). Untuk akun yang masuk,
 * daftar itu disimpan di sini supaya ikut berpindah perangkat. Yang disimpan hanya id
 * dokumen, tidak ada isi pertanyaan.
 */

export const MAX_SEEN_PER_USER = 200;
const MAX_PER_REQUEST = 50;

export const isDocumentId = (value) => /^[a-z0-9][a-z0-9-]{0,79}$/.test(String(value ?? ""));

/** Id dokumen yang sah dari isi permintaan, tanpa duplikat dan dibatasi jumlahnya. */
export function cleanIds(input) {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.filter((id) => typeof id === "string" && isDocumentId(id)))].slice(0, MAX_PER_REQUEST);
}

export async function listSeen(db, user) {
  if (!db || !user) return [];
  const { results } = await db
    .prepare("SELECT document_id FROM seen_documents WHERE user_id = ? ORDER BY seen_at DESC LIMIT ?")
    .bind(user.id, MAX_SEEN_PER_USER)
    .all();
  return (results ?? []).map((row) => row.document_id);
}

/** Catat berkas yang sudah dicari. Mengembalikan jumlah id yang diproses. */
export async function addSeen(db, user, ids) {
  const clean = cleanIds(ids);
  if (!db || !user || !clean.length) return 0;
  await db.batch(
    clean.map((id) =>
      db
        .prepare("INSERT INTO seen_documents (user_id, document_id) VALUES (?, ?) ON CONFLICT(user_id, document_id) DO UPDATE SET seen_at = datetime('now')")
        .bind(user.id, id),
    ),
  );
  // Batas per akun: yang paling lama dibuang.
  await db
    .prepare("DELETE FROM seen_documents WHERE user_id = ? AND document_id NOT IN (SELECT document_id FROM seen_documents WHERE user_id = ? ORDER BY seen_at DESC LIMIT ?)")
    .bind(user.id, user.id, MAX_SEEN_PER_USER)
    .run();
  return clean.length;
}
