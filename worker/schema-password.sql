-- Migrasi untuk basis data yang sudah punya tabel sessions tanpa kolom method.
-- Jalankan sekali, setelah schema-auth.sql. Pada instalasi baru, kolom ini
-- sudah ada di schema-auth.sql dan berkas ini tidak perlu dijalankan.
ALTER TABLE sessions ADD COLUMN method TEXT NOT NULL DEFAULT 'google';
