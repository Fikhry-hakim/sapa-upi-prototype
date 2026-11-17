-- Cache jawaban model: pertanyaan yang sama dengan sumber yang sama dilayani tanpa memanggil Gemini lagi.
-- Kuncinya adalah hash (bukan teks pertanyaan) dan isinya hanya jawaban; tidak ada data pengguna.
CREATE TABLE IF NOT EXISTS answer_cache (
  key         TEXT PRIMARY KEY,
  answer      TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS answer_cache_age ON answer_cache(created_at);
