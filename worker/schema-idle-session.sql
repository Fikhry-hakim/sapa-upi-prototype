-- Batas tidak aktif untuk sesi pengelola (lihat STAFF_IDLE_TIMEOUT_MS di worker/src/auth.js).
-- Jalankan sekali pada basis data yang sudah ada, sebelum deploy Worker yang memakainya.
-- Pada instalasi baru, kolom ini sudah ada di schema-auth.sql.
ALTER TABLE sessions ADD COLUMN last_used_at TEXT;
UPDATE sessions SET last_used_at = created_at WHERE last_used_at IS NULL;
