/**
 * Dokumen sumber yang ikut disajikan bersama situs, dan di halaman mana tiap
 * topik knowledge base berasal. Dipakai pembaca dokumen untuk membuka berkas
 * langsung di halaman rujukan dan menyorot kalimat yang dikutip.
 *
 * Nomor halaman adalah halaman PDF (dihitung dari 1), bukan nomor cetak.
 * Kalimat sorotan dicocokkan terhadap teks halaman, jadi cukup potongan
 * awal kalimatnya; kalau tidak ketemu, halaman tetap terbuka tanpa sorotan.
 */

export const documents = {
  "buku-panduan": {
    file: "./dokumen/buku-panduan-tugas-akhir-bisnis-digital.pdf",
    title: "Buku Panduan Penyelesaian Tugas Akhir Mahasiswa",
    owner: "Program Studi Bisnis Digital, UPI Kampus Daerah Tasikmalaya",
    reference: "Edisi April 2023",
    period: "Tahun Akademik 2022/2023",
    kind: "PDF",
    pages: 72,
    sizeLabel: "3,6 MB",
    dateLabel: "Apr 2023",
  },
  "pedoman-karya-ilmiah": {
    file: "./dokumen/pedoman-penulisan-karya-ilmiah-upi-2024.pdf",
    title: "Pedoman Penulisan Karya Ilmiah UPI Menuju WCU",
    owner: "Universitas Pendidikan Indonesia",
    reference: "Edisi 2024",
    period: "Tahun 2024",
    kind: "PDF",
    pages: 64,
    sizeLabel: "8,4 MB",
    dateLabel: "2024",
  },
  "pengumuman-t207": {
    file: "./dokumen/T-207-pengumuman-seminar-hasil-artikel.pdf",
    title: "Pengumuman Ketentuan Pelaksanaan Seminar Hasil Jalur Artikel",
    owner: "Ketua Program Studi Bisnis Digital",
    reference: "Nomor T-207/UN40.C3.4.4/PK.03.03/2026",
    period: "Pendaftaran 5–23 Oktober 2026",
    kind: "PDF",
    pages: 2,
    sizeLabel: "305 KB",
    dateLabel: "5 Okt 2026",
  },
  "kalender-akademik-2026": {
    file: "./dokumen/kalender-akademik-upi-2026-2027.pdf",
    title: "Kalender Akademik Universitas Pendidikan Indonesia 2026/2027",
    owner: "Rektor Universitas Pendidikan Indonesia",
    reference: "Keputusan Rektor Nomor 11/UN40/PK.01/2026",
    period: "Tahun Akademik 2026/2027",
    kind: "PDF",
    pages: 5,
    sizeLabel: "782 KB",
    dateLabel: "7 Jan 2026",
  },
  "edaran-48-2026": {
    file: "./dokumen/surat-edaran-48-2026-ukt-irs-perwalian.pdf",
    title: "Surat Edaran Pembayaran UKT/BPP, Pengisian IRS, dan Perwalian Daring Semester Ganjil 2026/2027",
    owner: "Wakil Rektor Bidang Pendidikan dan Penjaminan Mutu, UPI",
    reference: "Surat Edaran Nomor 48 Tahun 2026",
    period: "Semester Ganjil 2026/2027",
    kind: "PDF",
    pages: 2,
    sizeLabel: "985 KB",
    dateLabel: "21 Mei 2026",
  },
  "pengumuman-t150": {
    file: "./dokumen/T-150-pengumuman-irs-perwalian-2026.pdf",
    title: "Pengumuman Pengisian IRS dan Perwalian Daring Semester Ganjil 2026/2027",
    owner: "Ketua Program Studi Bisnis Digital",
    reference: "Nomor T-150/UN40.C3.4.4/TM.02.00/2026",
    period: "20 Juli–10 Agustus 2026",
    kind: "PDF",
    pages: 3,
    sizeLabel: "299 KB",
    dateLabel: "14 Jul 2026",
  },
  "edaran-68-2026": {
    file: "./dokumen/surat-edaran-68-2026-cuti-akademik.pdf",
    title: "Surat Edaran Batas Akhir Pengajuan Cuti Akademik Semester Ganjil 2026/2027",
    owner: "Wakil Rektor Bidang Pendidikan dan Penjaminan Mutu, UPI",
    reference: "Surat Edaran Nomor 68 Tahun 2026",
    period: "Semester Ganjil 2026/2027",
    kind: "PDF",
    pages: 1,
    sizeLabel: "951 KB",
    dateLabel: "26 Agu 2026",
  },
  "pengumuman-t45": {
    file: "./dokumen/T-45-pengumuman-ta-artikel-ttg-angkatan-2023.pdf",
    title: "Pengumuman Ketentuan Tugas Akhir Jalur Artikel Ilmiah dan TTG Angkatan 2023",
    owner: "Ketua Program Studi Bisnis Digital",
    reference: "Nomor T-45/UN40.C3.4.4/PK.03.03/2026",
    period: "Pengajuan Maret dan Juli 2026",
    kind: "PDF",
    pages: 2,
    sizeLabel: "287 KB",
    dateLabel: "23 Feb 2026",
  },
  "edaran-092-2025": {
    file: "./dokumen/surat-edaran-092-2025-laporan-msib.pdf",
    title: "Surat Edaran Laporan MSIB Mandiri Program Studi Bisnis Digital",
    owner: "Ketua Program Studi Bisnis Digital",
    reference: "Surat Edaran Nomor 092 Tahun 2025",
    period: "Angkatan 2022",
    kind: "PDF",
    pages: 2,
    sizeLabel: "321 KB",
    dateLabel: "12 Mar 2025",
  },
};

const BY_FILE = Object.fromEntries(
  Object.entries(documents).map(([id, doc]) => [doc.file, id]),
);

/** Id dokumen dari path berkasnya, atau null. */
export function documentIdForFile(file) {
  return BY_FILE[file] ?? null;
}

/** Halaman dan kalimat yang dikutip untuk sebuah topik. */
export const citations = {
  "ta-tiga-jalur": { page: 2, highlight: "tiga skema atau jalur penyelesaian tugas akhir, yang terdiri dari Jalur Skripsi, Jalur Artikel, dan Jalur Karya Teknologi Tepat Guna" },
  "skripsi-syarat-mengambil": { page: 13, highlight: "Mahasiswa yang akan mengambil mata kuliah skripsi diharuskan telah" },
  "seminar-proposal-pendaftaran": { page: 13, highlight: "Mahasiswa mengunduh template proposal skripsi" },
  "seminar-proposal-pelaksanaan": { page: 14, highlight: "c) Perempuan mengenakan jas almamater, celana/rok bahan panjang berwarna hitam, kemeja putih, dan menggunakan sepatu." },
  "pembimbing-skripsi": { page: 15, highlight: "Perpanjangan SK pembimbing skripsi diperbaharui secara otomatis oleh prodi pada semester berikutnya selama masa studi yang ditetapkan." },
  "pembimbing-penggantian": { page: 15, highlight: "TPS menginformasikan keputusan penggantian pembimbing skripsi kepada mahasiswa melalui surat keputusan pergantian yang ditandatangani oleh TPS dan ketua Program Studi." },
  "skripsi-publikasi-artikel": { page: 16, highlight: "Referensi yang berasal dari artikel jurnal minimal 25% dari total referensi yang digunakan dan wajib mengutip penelitian dosen prodi Bisnis Digital 9." },
  "sidang-syarat-skripsi": { page: 16, highlight: "Persyaratan ujian sidang diantaranya" },
  "sidang-pelaksanaan": { page: 17, highlight: "Prodi tidak mewajibkan mahasiswa membawa konsumsi atau segala bentuk gratifikasi selama proses pembimbingan sampai sidang akhir;" },
  "sidang-hasil-kelulusan": { page: 17, highlight: "Mahasiswa diberi waktu paling lama 30 hari untuk melakukan perbaikan terhitung sejak tanggal ujian." },
  "skripsi-percetakan": { page: 18, highlight: "Jika sudah sesuai, maka Staf Prodi akan memberikan form persetujuan percetakan skripsi kepada mahasiswa (Lampiran 15)." },
  "wisuda-pemberkasan": { page: 18, highlight: "Mahasiswa melakukan update/data wisudawan melalui laman https://siak.upi.edu/sias." },
  "artikel-ketentuan-umum": { page: 21, highlight: "Artikel ilmiah ditulis oleh mahasiswa sebagai penulis pertama dan dua dosen pembimbing sebagai penulis anggota;" },
  "artikel-jenis": { page: 22, highlight: "Artikel hasil penelitian empirik (original research) Sebagai bahan penyusunan artikel, mahasiswa dapat melaksanakan penelitian empirik ( original research ) dengan berbagai metode seperti metode -metode penelitian kuantitatif ( qu" },
  "artikel-syarat-sidang": { page: 23, highlight: "3) Sertifikasi kompetensi nasional atau internasional yang diakui, dari lembaga sertifikasi profesi (LSP) dan sejenis 4) Tidak ada Mata Ku liah yang mendapatkan nilai E dalam transkrip nilai (bukti transkrip nilai terakhir);" },
  "semhas-artikel": { page: 1, highlight: "Pendaftaran Semhas Tugas Akhir Jalur Artikel dilakukan melalui tautan berikut" },
  "semhas-pakaian": { page: 2, highlight: "Ketentuan Berpakaian" },
  "ttg-ketentuan": { page: 26, highlight: "1) Karya yang telah diikutsertakan pada lomba tingkat nasional dan memperoleh gelar juara 1 (satu) sampai dengan juara harapan 2 (dua) baik sebagai ketua maupun anggota atau lebih dinyatakan lolos didanai dalam Program Kreativitas" },
  "ttg-pengajuan": { page: 29, highlight: "Proses pembimbingan terdiri dari penyusunan laporan, kelengkapan dokumen, validasi mitra, kebermanfaatan kepada masyarakat, dan publikasi jurnal pengabdian." },
  "ttg-syarat-sidang": { page: 30, highlight: "4) Sertifikasi kompetensi nasional atau internasional yang diakui, dari lembaga sertifikasi profesi (LSP) dan sejenis 5) Bukti bimbingan 10 kali (buku bimbingan yang ditandatangani pembimbing) 6) Tidak ada Mata Kuliah yang mendapa" },
  "ttg-penilaian": { page: 31, highlight: "Hak atas Kekayaan Intelektual, karya teknologi tepat guna telah memperoleh sertifikat HKI dan atau sedang proses pengajuan HKI." },
  "format-penulisan": { page: 33, highlight: "Jenis Font: Times New Roman" },
  "uji-similaritas": { page: 51, highlight: "Tingkat Kemiripan di Bawah 25% yang menunjukkan bahwa mayoritas konten merupakan hasil karya asli penulis" },
  "penggunaan-ai": { page: 49, highlight: "Karya tulis ilmiah di lingkungan UPI dapat berbantuan AI" },
  "kalender-registrasi": { page: 4, highlight: "Mahasiswa on-going (D4, S1, S2 dan S3) 9 Juni - 17 Juli 2026" },
  "kalender-perkuliahan-ujian": { page: 4, highlight: "Ujian Tengah Semester (UTS) 12 - 16 Oktober 2026" },
  "kalender-semester-antara": { page: 5, highlight: "Pendaftaran di Program Studi 2 - 13 Mei 2026" },
  "kalender-wisuda-dies": { page: 5, highlight: "Wisuda Gelombang I 10-11 Februari 2026" },
  "kalender-penerimaan-s1": { page: 3, highlight: "Pengisian PDSS 5 Januari- 2 Februari 2026" },
  "ukt-pembayaran-ganjil": { page: 1, highlight: "Pembayaran UKT/BPP bagi mahasiswa lama mulai tanggal 9 Juni – 17 Juli 2026." },
  "irs-perwalian-jadwal": { page: 1, highlight: "Pengisian IRS dan perwalian daring mulai tanggal 20 Juli – 10 Agustus 2026." },
  "irs-prosedur-prodi": { page: 1, highlight: "Dosen Pembimbing Akademik memeriksa kembali kesesuaian mata kuliah yang dikontrak" },
  "mata-kuliah-ganjil-2026": { page: 1, highlight: "Daftar mata kuliah yang dapat dikontrak." },
  "cuti-akademik-batas": { page: 1, highlight: "paling lambat tanggal 16 November 2026" },
  "ta-artikel-ttg-angkatan-2023": { page: 1, highlight: "Pengajuan dilaksanakan dalam dua periode" },
  "msib-laporan-akhir": { page: 1, highlight: "Mahasiswa melaksanakan kegiatan MSIB di tempat yang sudah ditentukan" },
  "sanksi-plagiat": { page: 51, highlight: "Pelanggaran plagiarisme dalam karya ilmiah, pihak UPI akan melakukan tindakan tegas" },
};

/** Rujukan lengkap untuk sebuah topik, atau null kalau tidak punya berkas. */
export function citationFor(entry) {
  const id = documentIdForFile(entry?.sourceUrl);
  if (!id) return null;
  const hit = citations[entry.id] ?? { page: 1, highlight: "" };
  return { documentId: id, document: documents[id], ...hit };
}
