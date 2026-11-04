-- Menggabungkan kategori "Pedoman Akademik" dan "Tugas Akhir & Skripsi" menjadi
-- satu kategori "Pedoman Akademik & Tugas Akhir", dan menyesuaikan dokumen yang
-- sudah terlanjur memakai salah satu nama lama. Jalankan sekali.
UPDATE documents
   SET category = 'Pedoman Akademik & Tugas Akhir'
 WHERE category IN ('Pedoman Akademik', 'Tugas Akhir & Skripsi');
