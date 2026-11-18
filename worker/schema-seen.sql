-- Berkas yang pernah dicari pengguna (halaman Berkas mahasiswa dan dosen), tersimpan per akun.
CREATE TABLE IF NOT EXISTS seen_documents (
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id  TEXT NOT NULL,
  seen_at      TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, document_id)
);
