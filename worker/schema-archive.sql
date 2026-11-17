-- Arsip percakapan: percakapan yang diarsipkan hilang dari daftar riwayat tetapi tidak dihapus.
-- Aman dijalankan sekali; kolom baru boleh kosong (NULL = tidak diarsipkan).
ALTER TABLE conversations ADD COLUMN archived_at TEXT;
CREATE INDEX IF NOT EXISTS conversations_archived ON conversations(user_id, archived_at);
