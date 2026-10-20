-- Isian tambahan modal Upload Dokumen dan metode penyimpanan (baru / gabungkan / perbarui versi).
-- Jalankan sekali pada basis data yang sudah punya tabel documents. Pada instalasi baru,
-- kolom ini sudah ada di schema-owner.sql.
ALTER TABLE documents ADD COLUMN category TEXT;
ALTER TABLE documents ADD COLUMN effective_date TEXT;
ALTER TABLE documents ADD COLUMN description TEXT;
ALTER TABLE documents ADD COLUMN related_to TEXT;   -- dokumen yang dihubungkan (Gabungkan Terkait)
ALTER TABLE documents ADD COLUMN supersedes TEXT;   -- dokumen yang digantikan saat divalidasi (Perbarui Versi)
