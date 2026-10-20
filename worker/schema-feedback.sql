-- Umpan balik singkat setelah jawaban (Buruk / Cukup / Baik).
--
-- Sama seperti tabel events: tidak ada teks pertanyaan dan tidak ada identitas
-- pengguna. Yang tersimpan hanya penilaiannya, jenis jawaban yang dinilai, dan
-- topik rujukannya, supaya Dashboard bisa menunjukkan topik mana yang sering
-- dinilai kurang tanpa mengarsipkan apa yang ditanyakan mahasiswa.
--
-- Jalankan sekali pada basis data yang sudah ada. Pada instalasi baru, tabel ini
-- sudah ada di schema-owner.sql.
CREATE TABLE IF NOT EXISTS feedback (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  at        TEXT NOT NULL DEFAULT (datetime('now')),
  rating    TEXT NOT NULL CHECK (rating IN ('buruk', 'cukup', 'baik')),
  kind      TEXT NOT NULL CHECK (kind IN ('ai', 'offline', 'fallback')),
  entry_id  TEXT
);

CREATE INDEX IF NOT EXISTS feedback_at ON feedback(at);
