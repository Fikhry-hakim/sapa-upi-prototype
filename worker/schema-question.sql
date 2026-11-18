-- Teks pertanyaan pada log interaksi, untuk "Pertanyaan Teratas" di Dashboard.
-- Hanya diisi bila pengguna mengaktifkan "Improve SAPA UPI"; dipotong, tanpa identitas, email dan angka panjang disamarkan.
ALTER TABLE events ADD COLUMN question TEXT;
