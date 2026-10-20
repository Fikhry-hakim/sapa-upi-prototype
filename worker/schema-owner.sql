-- Halaman owner: peristiwa interaksi, katalog dokumen, dan log audit.

-- Satu baris per pertanyaan yang dijawab. Isi pertanyaan TIDAK disimpan di sini
-- dan tidak ada identitas pengguna — hanya hasilnya. Dengan begitu dashboard
-- bisa menunjukkan seberapa sering sistem menjawab, menolak, atau gagal tanpa
-- mengubah dirinya menjadi arsip apa yang ditanyakan mahasiswa.
CREATE TABLE IF NOT EXISTS events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  at           TEXT NOT NULL DEFAULT (datetime('now')),
  outcome      TEXT NOT NULL CHECK (outcome IN
                 ('berbasis_sumber', 'klarifikasi', 'bukti_terbatas', 'di_luar_cakupan', 'gangguan_teknis')),
  entry_id     TEXT,            -- topik yang menjadi rujukan
  category     TEXT,            -- judul topik, supaya log mudah dibaca
  document_id  TEXT,
  page         INTEGER,
  duration_ms  INTEGER,
  source       TEXT,            -- 'llm' atau 'gagal'
  signed_in    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS events_at ON events(at);

-- Dokumen yang menjadi sumber jawaban. Dokumen bawaan (di folder dokumen/) dan
-- dokumen yang diunggah pengelola tercatat di tabel yang sama.
CREATE TABLE IF NOT EXISTS documents (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  owner        TEXT NOT NULL,
  reference    TEXT NOT NULL,
  period       TEXT NOT NULL,
  kind         TEXT NOT NULL DEFAULT 'PDF',
  pages        INTEGER NOT NULL DEFAULT 0,
  size_bytes   INTEGER NOT NULL DEFAULT 0,
  file         TEXT,            -- './dokumen/x.pdf' (bawaan) atau '/files/<id>' (unggahan)
  bundled      INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL CHECK (status IN ('ready', 'validating', 'parse_failed', 'inactive', 'expired')),
  rag_active   INTEGER NOT NULL DEFAULT 1,
  uploaded_by  TEXT,
  validated_by TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Teks tiap halaman dokumen unggahan, untuk pencarian. Bobot peringkat dihitung
-- oleh FTS5 (bm25); halaman dokumen yang belum divalidasi tidak pernah dipakai.
CREATE VIRTUAL TABLE IF NOT EXISTS passages USING fts5(
  body,
  document_id UNINDEXED,
  page UNINDEXED,
  tokenize = 'unicode61 remove_diacritics 2'
);

CREATE TABLE IF NOT EXISTS audit_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  at           TEXT NOT NULL DEFAULT (datetime('now')),
  actor        TEXT NOT NULL,
  action       TEXT NOT NULL,
  document_id  TEXT,
  detail       TEXT
);

CREATE INDEX IF NOT EXISTS audit_at ON audit_log(at DESC);
