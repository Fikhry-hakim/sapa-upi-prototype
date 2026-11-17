/**
 * Knowledge base SAPA UPI.
 *
 * Isinya diambil dari empat dokumen resmi Program Studi Bisnis Digital dan UPI:
 *
 *   S1  Buku Panduan Penyelesaian Tugas Akhir Mahasiswa
 *       Tim Prodi Bisnis Digital, UPI Kampus Daerah Tasikmalaya, April 2023
 *   S2  Pedoman Penulisan Karya Ilmiah UPI Menuju World Class University, Edisi 2024
 *   S3  Pengumuman Nomor T-207/UN40.C3.4.4/PK.03.03/2026 tentang Ketentuan
 *       Pelaksanaan Seminar Hasil Tugas Akhir Jalur Artikel Ilmiah, 5 Oktober 2026
 *   S4  Surat Nomor B-5577/UN40.C3.1/TA.07.02/2025 tentang Imbauan Pelatihan
 *       Kewirausahaan, Kampus UPI Tasikmalaya, 10 September 2025
 *
 * Angka, tanggal, dan nomor dokumen di bawah ini disalin dari sumbernya, bukan
 * disusun ulang. Kalau sebuah ketentuan tidak tertulis di keempat dokumen itu,
 * ia tidak ada di sini — dan asisten akan menolak menjawabnya.
 *
 * File ini berperan ganda: benih untuk D1 (lihat worker/seed.mjs) dan salinan
 * cadangan yang dipakai browser saat Worker tidak terjangkau.
 *
 * sourceUrl menunjuk ke berkas di folder dokumen/ supaya siapa pun bisa membaca
 * sendiri dasar jawabannya. Dokumen S4 belum dipublikasikan karena berkas
 * aslinya satu bundel dengan Perjanjian Kinerja Direktur dan Rektor, lengkap
 * dengan tanda tangan dan NIP — itu bukan dokumen yang ditujukan ke mahasiswa.
 */

const PEDOMAN_TA = {
  sourceTitle: "Buku Panduan Penyelesaian Tugas Akhir Mahasiswa",
  sourceOwner: "Tim Prodi Bisnis Digital, UPI Kampus Daerah Tasikmalaya",
  validPeriod: "Berlaku sejak April 2023",
  updatedAt: "April 2023",
  sourceRef: "Buku Panduan Penyelesaian Tugas Akhir, Prodi Bisnis Digital",
  sourceUrl: "./dokumen/buku-panduan-tugas-akhir-bisnis-digital.pdf",
};

const PERREK_38 = {
  sourceTitle: "Peraturan Rektor UPI tentang Penyelenggaraan Pendidikan",
  sourceOwner: "Rektor Universitas Pendidikan Indonesia",
  validPeriod: "Berlaku sejak 20 Mei 2026",
  updatedAt: "20 Mei 2026",
  sourceRef: "Peraturan Rektor Nomor 38 Tahun 2026",
  sourceUrl: "./dokumen/peraturan-rektor-38-2026-penyelenggaraan-pendidikan.pdf",
};

const PUSTAKA_UNGGAH = {
  sourceTitle: "Panduan Unggah Mandiri Tugas Akhir melalui SIAS",
  sourceOwner: "Perpustakaan UPI (UPI Central Library)",
  validPeriod: "Berlaku untuk pengajuan sidang",
  updatedAt: "Januari 2026",
  sourceRef: "Panduan Unggah Mandiri melalui SIAS, Perpustakaan UPI",
  sourceUrl: "./dokumen/panduan-unggah-mandiri-sias.pdf",
};

const PUSTAKA_BEBAS = {
  sourceTitle: "Panduan Pengajuan Bebas Pustaka di SIAS",
  sourceOwner: "Perpustakaan UPI (UPI Central Library)",
  validPeriod: "Berlaku untuk pengajuan sidang",
  updatedAt: "Januari 2026",
  sourceRef: "Panduan Pengajuan Bebas Pustaka, Perpustakaan UPI",
  sourceUrl: "./dokumen/panduan-bebas-pustaka-sias.pdf",
};

const BUKU_MAGANG = {
  sourceTitle: "Buku Petunjuk Program Magang Profesional Bisnis Digital",
  sourceOwner: "Tim Prodi Bisnis Digital, UPI Kampus Daerah Tasikmalaya",
  validPeriod: "Berlaku sejak 2023",
  updatedAt: "2023",
  sourceRef: "Buku Petunjuk Program Magang Profesional Bisnis Digital",
  sourceUrl: "./dokumen/buku-magang.pdf",
};

const SIMKATMAWA = {
  sourceTitle: "Panduan Pengakuan Pengalaman Belajar dan Prestasi Mahasiswa dalam Implementasi Kampus Berdampak (SIMKATMAWA)",
  sourceOwner: "Universitas Pendidikan Indonesia",
  validPeriod: "Edisi IV, Januari 2026",
  updatedAt: "Januari 2026",
  sourceRef: "Panduan SIMKATMAWA Edisi IV, 2026",
  sourceUrl: "./dokumen/panduan-simkatmawa-2026.pdf",
};

const PERREK_70 = {
  sourceTitle: "Peraturan Rektor UPI tentang Tugas Akhir, Ujian Sidang, dan Penetapan Kelulusan",
  sourceOwner: "Rektor Universitas Pendidikan Indonesia",
  validPeriod: "Berlaku sejak 6 November 2026",
  updatedAt: "6 November 2026",
  sourceRef: "Peraturan Rektor Nomor 70 Tahun 2026",
  sourceUrl: "./dokumen/peraturan-rektor-70-2026-tugas-akhir-sidang-kelulusan.pdf",
};

const PPT_EDARAN = {
  sourceTitle: "Sosialisasi Syarat Kelulusan Mahasiswa (memuat Edaran Direktur Nomor 5572 Tahun 2025)",
  sourceOwner: "Wakil Direktur Bidang Pendidikan, Kemahasiswaan dan Penjaminan Mutu, UPI Kampus Tasikmalaya",
  validPeriod: "Berlaku sejak 8 September 2025",
  updatedAt: "8 September 2025",
  sourceRef: "Edaran Direktur Kampus UPI Tasikmalaya Nomor 5572 Tahun 2025",
  sourceUrl: "./dokumen/ppt-sosialisasi-syarat-kelulusan-2025.pdf",
};

const PEDOMAN_2024 = {
  sourceTitle: "Pedoman Penyusunan Tugas Akhir Mahasiswa UPI (Edisi 2024)",
  sourceOwner: "Universitas Pendidikan Indonesia",
  validPeriod: "Edisi November 2024",
  updatedAt: "November 2024",
  sourceRef: "Pedoman Penyusunan Tugas Akhir Mahasiswa UPI Edisi 2024",
  sourceUrl: "./dokumen/pedoman-tugas-akhir-mahasiswa-2024.pdf",
};

const MANDALA = {
  sourceTitle: "Panduan Penggunaan Aplikasi Mandala untuk Mahasiswa (S2 dan S3)",
  sourceOwner: "DSTIPD, Universitas Pendidikan Indonesia",
  validPeriod: "Mahasiswa magister dan doktor, 2026",
  updatedAt: "2026",
  sourceRef: "Panduan Penggunaan Aplikasi Mandala",
  sourceUrl: "./dokumen/panduan-aplikasi-mandala-s2-s3.pdf",
};

const PERREK_70_GLOS = { ...PERREK_70, sourceRef: "Peraturan Rektor Nomor 70 Tahun 2026, Pasal 1 (definisi)" };
const PEDOMAN_2024_GLOS = { ...PEDOMAN_2024, sourceRef: "Pedoman Penyusunan Tugas Akhir UPI 2024, Daftar Istilah" };
const GLOS_UMUM = {
  sourceTitle: "Glosarium SAPA UPI (dihimpun dari Panduan Perpustakaan, SIMKATMAWA, Buku Magang, dan Peraturan Rektor)",
  sourceOwner: "SAPA UPI, Program Studi Bisnis Digital",
  validPeriod: "Mengikuti dokumen sumber",
  updatedAt: "2026",
  sourceRef: "Dihimpun dari dokumen resmi UPI di folder dokumen",
  sourceUrl: null,
};


const PEDOMAN_KTI = {
  sourceTitle: "Pedoman Penulisan Karya Ilmiah UPI (Edisi 2024)",
  sourceOwner: "Universitas Pendidikan Indonesia",
  validPeriod: "Edisi 2024",
  updatedAt: "2024",
  sourceRef: "Pedoman Penulisan Karya Ilmiah UPI Menuju WCU, Edisi 2024",
  sourceUrl: "./dokumen/pedoman-penulisan-karya-ilmiah-upi-2024.pdf",
};

const PENGUMUMAN_SEMHAS = {
  sourceTitle: "Pengumuman Ketentuan Pelaksanaan Semhas Jalur Artikel",
  sourceOwner: "Ketua Program Studi Bisnis Digital, Adam Hermawan",
  validPeriod: "Pendaftaran 5–23 Oktober 2026",
  updatedAt: "5 Oktober 2026",
  sourceRef: "Nomor T-207/UN40.C3.4.4/PK.03.03/2026",
  sourceUrl: "./dokumen/T-207-pengumuman-seminar-hasil-artikel.pdf",
};

const SURAT_KEWIRAUSAHAAN = {
  sourceTitle: "Imbauan Pelatihan Kewirausahaan sebagai Syarat Ujian Sidang",
  sourceOwner: "Wakil Direktur Bidang Pendidikan, Kampus UPI Tasikmalaya",
  validPeriod: "Berlaku sejak 10 September 2025",
  updatedAt: "10 September 2025",
  sourceRef: "Nomor B-5577/UN40.C3.1/TA.07.02/2025, merujuk Edaran Direktur Nomor 5572 Tahun 2025",
  // Surat ini ada di halaman 5 bahan sosialisasi syarat kelulusan (pindaian).
  sourceUrl: "./dokumen/ppt-sosialisasi-syarat-kelulusan-2025.pdf",
};

const KALENDER_UPI = {
  sourceTitle: "Kalender Akademik UPI Tahun Akademik 2026/2027",
  sourceOwner: "Rektor Universitas Pendidikan Indonesia",
  validPeriod: "Tahun Akademik 2026/2027",
  updatedAt: "7 Januari 2026",
  sourceRef: "Keputusan Rektor Nomor 11/UN40/PK.01/2026",
  sourceUrl: "./dokumen/kalender-akademik-upi-2026-2027.pdf",
};

const EDARAN_48 = {
  sourceTitle: "Surat Edaran Pembayaran UKT/BPP, Pengisian IRS, dan Perwalian Daring Semester Ganjil 2026/2027",
  sourceOwner: "Wakil Rektor Bidang Pendidikan dan Penjaminan Mutu UPI",
  validPeriod: "Semester Ganjil 2026/2027",
  updatedAt: "21 Mei 2026",
  sourceRef: "Surat Edaran Nomor 48 Tahun 2026",
  sourceUrl: "./dokumen/surat-edaran-48-2026-ukt-irs-perwalian.pdf",
};

const PENGUMUMAN_T150 = {
  sourceTitle: "Pengumuman Pengisian IRS dan Perwalian Daring Semester Ganjil 2026/2027",
  sourceOwner: "Ketua Program Studi Bisnis Digital, Adam Hermawan",
  validPeriod: "20 Juli–10 Agustus 2026",
  updatedAt: "14 Juli 2026",
  sourceRef: "Nomor T-150/UN40.C3.4.4/TM.02.00/2026",
  sourceUrl: "./dokumen/T-150-pengumuman-irs-perwalian-2026.pdf",
};

const EDARAN_68 = {
  sourceTitle: "Surat Edaran Batas Akhir Pengajuan Cuti Akademik Semester Ganjil 2026/2027",
  sourceOwner: "Wakil Rektor Bidang Pendidikan dan Penjaminan Mutu UPI",
  validPeriod: "Semester Ganjil 2026/2027",
  updatedAt: "26 Agustus 2026",
  sourceRef: "Surat Edaran Nomor 68 Tahun 2026",
  sourceUrl: "./dokumen/surat-edaran-68-2026-cuti-akademik.pdf",
};

const PENGUMUMAN_T45 = {
  sourceTitle: "Pengumuman Ketentuan Tugas Akhir Jalur Artikel Ilmiah dan TTG Angkatan 2023",
  sourceOwner: "Ketua Program Studi Bisnis Digital, Adam Hermawan",
  validPeriod: "Pengajuan Maret dan Juli 2026",
  updatedAt: "23 Februari 2026",
  sourceRef: "Nomor T-45/UN40.C3.4.4/PK.03.03/2026",
  sourceUrl: "./dokumen/T-45-pengumuman-ta-artikel-ttg-angkatan-2023.pdf",
};

const EDARAN_MSIB = {
  sourceTitle: "Surat Edaran Laporan MSIB Mandiri Program Studi Bisnis Digital",
  sourceOwner: "Ketua Program Studi Bisnis Digital, Dr. Syti Sarah Maesaroh, S.P., M.M.",
  validPeriod: "Mahasiswa Angkatan 2022",
  updatedAt: "12 Maret 2025",
  sourceRef: "Surat Edaran Nomor 092 Tahun 2025",
  sourceUrl: "./dokumen/surat-edaran-092-2025-laporan-msib.pdf",
};

const INFO_SCOPUS = {
  sourceTitle: "Pengumuman Akses Scopus dan Scopus AI untuk Sivitas Akademika UPI",
  sourceOwner: "Universitas Pendidikan Indonesia",
  validPeriod: "Berlaku sampai ada pemberitahuan baru",
  updatedAt: "Tanggal terbit tidak tercantum pada pengumuman",
  sourceRef: "Pengumuman layanan Scopus dan Scopus AI untuk sivitas akademika UPI",
  // Berupa pesan pengumuman (teks dan poster), bukan berkas PDF.
  sourceUrl: null,
};

export const knowledgeBase = [
  {
    id: "ta-tiga-jalur",
    category: "Tugas Akhir",
    title: "Tiga jalur penyelesaian tugas akhir",
    questions: [
      "Apa saja jalur penyelesaian tugas akhir?",
      "Apakah harus skripsi untuk lulus?",
    ],
    followUps: [
      "Apa syarat mengambil skripsi?",
      "Apa ketentuan jalur artikel ilmiah?",
      "Apa itu jalur Teknologi Tepat Guna?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Apa saja syarat sidang jalur skripsi?",
      "Apa ketentuan jalur artikel ilmiah?",
      "Bagaimana cara mengajukan tugas akhir jalur TTG?",
    ],
    keywords: ["jalur", "tugas akhir", "skripsi", "artikel", "ttg", "teknologi tepat guna", "pilihan"],
    lead: "Prodi Bisnis Digital menyediakan tiga jalur penyelesaian tugas akhir:",
    points: [
      "Jalur Skripsi — penelitian yang dilaporkan dalam bentuk skripsi.",
      "Jalur Artikel Ilmiah — artikel yang terbit di jurnal, diakui setara skripsi.",
      "Jalur Karya Teknologi Tepat Guna (TTG) — karya teknologi untuk masyarakat, diakui setara skripsi.",
      "Ketiganya sama-sama diakhiri ujian sidang dan punya persyaratan yang berbeda.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan persyaratan masing-masing jalur.",
    answer:
      "Prodi Bisnis Digital menyediakan tiga jalur penyelesaian tugas akhir: Jalur Skripsi, Jalur Artikel Ilmiah, dan Jalur Karya Teknologi Tepat Guna (TTG). Artikel ilmiah dan karya TTG dapat diakui setara dengan skripsi apabila memenuhi persyaratan yang ditetapkan. Ketiganya tetap diakhiri dengan ujian sidang.",
    escalation:
      "Hubungi dosen Pembimbing Akademik atau Tim Pertimbangan Skripsi (TPS) untuk menentukan jalur yang paling sesuai.",
    ...PEDOMAN_TA,
  },

  {
    id: "skripsi-syarat-mengambil",
    category: "Tugas Akhir",
    title: "Syarat mengambil mata kuliah skripsi",
    questions: [
      "Apa syarat mengambil skripsi?",
      "Berapa SKS minimal untuk mulai skripsi?",
    ],
    followUps: [
      "Bagaimana cara mengajukan topik skripsi?",
      "Bagaimana mendaftar seminar proposal?",
      "Berapa IPK minimal yang diperlukan?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Berapa SKS minimal untuk mengambil skripsi?",
      "Bagaimana cara mengajukan topik skripsi?",
      "Berapa jumlah dosen pembimbing skripsi?",
    ],
    keywords: ["mengambil skripsi", "kontrak skripsi", "mulai skripsi", "sks", "ipk", "indeks prestasi kumulatif", "syarat ipk skripsi", "metode penelitian", "110 sks"],
    lead: "Ketentuan umum untuk dapat mengikuti penyelesaian skripsi:",
    points: [
      "Telah menyelesaikan minimal 110 SKS dengan IPK minimal 2,50.",
      "Sudah lulus mata kuliah Metode Penelitian.",
      "Mengontrak mata kuliah skripsi dan disetujui oleh dosen Pembimbing Akademik (PA).",
      "Catatan: Peraturan Rektor Nomor 70 Tahun 2026 (6 November 2026) menetapkan batas minimum UPI paling sedikit 60% beban studi dan proposal paling cepat diajukan semester 6; syarat 110 SKS dan IPK 2,50 di Buku Panduan adalah ketentuan prodi yang lebih ketat dan belum diperbarui dalam dokumen yang tersedia.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan langkah pengajuan topik setelah syarat ini terpenuhi.",
    answer:
      "Mahasiswa yang akan mengambil mata kuliah skripsi harus telah menyelesaikan minimal 110 SKS dengan IPK minimal 2,50, sudah lulus mata kuliah Metode Penelitian, serta mengontrak mata kuliah skripsi dengan persetujuan dosen Pembimbing Akademik. Catatan: Peraturan Rektor Nomor 70 Tahun 2026 (6 November 2026) menetapkan batas minimum UPI paling sedikit 60% beban studi dan proposal paling cepat diajukan semester 6; syarat 110 SKS dan IPK 2,50 di Buku Panduan adalah ketentuan prodi yang lebih ketat dan belum diperbarui dalam dokumen yang tersedia.",
    escalation:
      "Hubungi dosen Pembimbing Akademik untuk memeriksa pemenuhan SKS dan IPK pada transkrip terakhir.",
    ...PEDOMAN_TA,
  },

  {
    id: "seminar-proposal-pendaftaran",
    category: "Tugas Akhir",
    title: "Pendaftaran seminar proposal skripsi",
    questions: [
      "Bagaimana cara mendaftar seminar proposal?",
      "Dokumen apa saja untuk seminar proposal?",
    ],
    followUps: [
      "Berapa kali harus jadi partisipan seminar?",
      "Berapa lama jadwal seminar ditetapkan?",
      "Apa ketentuan berpakaian saat seminar proposal?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Dokumen apa saja untuk seminar proposal?",
      "Berapa lama jadwal seminar ditetapkan?",
      "Apa ketentuan berpakaian saat seminar proposal?",
    ],
    keywords: ["seminar proposal", "sempro", "daftar", "pendaftaran", "proposal", "berkas", "map kuning"],
    lead: "Persiapan dan pendaftaran seminar proposal skripsi:",
    points: [
      "Unduh template proposal di https://bisnisdigital.upi.edu/tugas-akhir-mahasiswa/.",
      "Konsultasi dengan dosen Pembimbing Akademik dan dapatkan pengesahan proposal.",
      "Isi dan ajukan form calon pembimbing skripsi kepada Tim Pertimbangan Skripsi (TPS).",
      "Lampirkan bukti keikutsertaan sebagai partisipan minimal 10 kali seminar proposal.",
      "Seluruh dokumen di-bundle dalam satu map plastik berwarna kuning.",
      "Staf prodi memverifikasi kelengkapan, lalu mendistribusikan berkas ke TPS.",
      "Prodi menetapkan jadwal seminar proposal dalam 7 hari kerja.",
      "Mahasiswa membuat ringkasan seminar untuk dibagikan kepada partisipan saat pelaksanaan.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan ketentuan pelaksanaan dan berpakaian saat seminarnya.",
    answer:
      "Mahasiswa mengunduh template proposal di laman prodi, berkonsultasi dan mendapat pengesahan dari dosen Pembimbing Akademik, mengajukan form calon pembimbing kepada Tim Pertimbangan Skripsi, serta melampirkan bukti keikutsertaan minimal 10 kali sebagai partisipan seminar proposal. Seluruh dokumen dibundel dalam satu map plastik berwarna kuning. Setelah staf prodi memverifikasi kelengkapan, prodi menetapkan jadwal seminar proposal dalam 7 hari kerja.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital untuk memverifikasi kelengkapan berkas seminar proposal.",
    ...PEDOMAN_TA,
  },

  {
    id: "sempro-semhas-gform",
    category: "Tugas Akhir",
    title: "Formulir online pendaftaran seminar proposal / seminar hasil",
    questions: [
      "Di mana formulir pendaftaran seminar proposal?",
      "Apa saja yang diisi di gform pendaftaran sempro?",
    ],
    followUps: [
      "Template dokumen pendaftaran ada di mana?",
      "Dokumen apa saja untuk seminar proposal?",
    ],
    hints: [
      "Link gform pendaftaran sempro",
      "Isian formulir pendaftaran sempro apa saja?",
    ],
    keywords: ["gform sempro", "formulir sempro", "link sempro", "daftar sempro online", "form seminar proposal", "form seminar hasil", "template sempro", "format sem"],
    lead: "Pendaftaran seminar proposal dan seminar hasil tugas akhir dilakukan lewat Google Form (login dengan akun UPI):",
    points: [
      "Formulir: https://docs.google.com/forms/d/e/1FAIpQLSeOJ3Epo_ng3rQrbe23z0RPH0bhvrxYmkr8Bs13VRZlsMUTsg/viewform",
      "Template kelengkapan dokumennya ada di https://bit.ly/Format-Template_admPenyelesaianStudi.",
      "Data yang diisi: NIM, nama, program studi, tahun masuk, jalur masuk, nomor WA, NIK dan NKK, tempat dan tanggal lahir, alamat KTP, dan dosen pembimbing akademik.",
      "Data tugas akhir: judul (huruf kapital di tiap kata, kecuali kata sambung), bidang keilmuan, calon dosen pembimbing 1 dan 2 (isi tanda minus kalau pembimbing tunggal), serta jalur atau bentuk tugas akhir.",
      "Nomor WA, NIK, dan NKK diawali tanda petik satu (') supaya angka nolnya tidak hilang.",
      "Formulir meminta unggah berkas, jadi siapkan dokumennya dalam format yang sesuai template sebelum mengisi.",
    ],
    closing: "Mau saya jelaskan dokumen apa saja yang perlu disiapkan untuk seminar proposal?",
    answer:
      "Pendaftaran seminar proposal dan seminar hasil tugas akhir lewat Google Form dengan akun UPI. Template kelengkapan dokumen tersedia di bit.ly/Format-Template_admPenyelesaianStudi. Formulir meminta data diri, data dosen pembimbing akademik, judul, bidang keilmuan, calon pembimbing 1 dan 2, serta jalur tugas akhir, dan juga meminta unggah berkas.",
    escalation:
      "Kalau formulir tidak bisa dibuka atau ada isian yang tidak jelas, hubungi staf Program Studi Bisnis Digital.",
    sourceTitle: "Formulir Pendaftaran Seminar Proposal / Seminar Hasil Tugas Akhir",
    sourceOwner: "Program Studi, Universitas Pendidikan Indonesia Kampus Daerah Tasikmalaya",
    validPeriod: "Tahun Akademik 2026/2027",
    updatedAt: "Tanggal terbit tidak tercantum pada formulir",
    sourceRef: "Google Form Pendaftaran Seminar Proposal / Seminar Hasil Tugas Akhir",
    // Berupa formulir daring (login akun UPI), bukan berkas PDF.
    sourceUrl: null,
  },

  {
    id: "seminar-proposal-pelaksanaan",
    category: "Tugas Akhir",
    title: "Pelaksanaan dan ketentuan berpakaian seminar proposal",
    questions: [
      "Apa ketentuan berpakaian saat seminar proposal?",
      "Bagaimana pelaksanaan seminar proposal?",
    ],
    followUps: [
      "Bagaimana cara mendaftar seminar proposal?",
      "Siapa yang menguji seminar proposal?",
      "Berapa lama jadwal seminar ditetapkan?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Apa ketentuan berpakaian saat seminar proposal?",
      "Siapa yang menguji seminar proposal?",
      "Bagaimana cara mendaftar seminar proposal?",
    ],
    keywords: ["pakaian", "berpakaian", "jas almamater", "seminar proposal", "pelaksanaan", "presentasi"],
    lead: "Ketentuan pelaksanaan seminar proposal skripsi:",
    points: [
      "Mahasiswa mendapat jadwal dan penugasan dosen penguji dari prodi, daring maupun luring.",
      "Mahasiswa mempresentasikan topik penelitiannya di hadapan pembimbing dan dosen partisipan.",
      "Laki-laki: rambut rapi, jas almamater, celana bahan panjang hitam, kemeja putih, berdasi, bersepatu.",
      "Perempuan: rambut rapi atau jilbab diikat, jas almamater, celana/rok bahan panjang hitam, kemeja putih.",
      "Seminar dilaksanakan sesuai usulan mahasiswa dan kesediaan pembimbing serta partisipan.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan dokumen pendaftarannya lebih dulu.",
    answer:
      "Seminar proposal dilaksanakan setelah mahasiswa menerima jadwal dan penugasan dosen penguji dari prodi. Mahasiswa mempresentasikan topik penelitian di hadapan dosen pembimbing dan partisipan. Mahasiswa laki-laki mengenakan jas almamater, celana bahan panjang hitam, kemeja putih, dasi, dan sepatu; mahasiswa perempuan mengenakan jas almamater, celana atau rok bahan panjang hitam, dan kemeja putih, dengan rambut rapi atau jilbab diikat.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital jika jadwal atau penugasan penguji belum diterima.",
    ...PEDOMAN_TA,
  },

  {
    id: "pembimbing-skripsi",
    category: "Tugas Akhir",
    title: "Ketentuan pembimbingan skripsi",
    questions: [
      "Berapa jumlah dosen pembimbing skripsi?",
      "Berapa lama masa pembimbingan skripsi?",
    ],
    followUps: [
      "Bagaimana cara mengganti dosen pembimbing?",
      "Berapa kali minimal bimbingan?",
      "Apa syarat dosen pembimbing?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Berapa jumlah dosen pembimbing skripsi?",
      "Berapa lama masa pembimbingan skripsi?",
      "Bagaimana cara mengganti dosen pembimbing?",
    ],
    keywords: ["pembimbing", "dosen pembimbing", "bimbingan", "sk pembimbing", "masa bimbingan"],
    lead: "Ketentuan pembimbingan skripsi di Prodi Bisnis Digital:",
    points: [
      "Jumlah dosen pembimbing sebanyak-banyaknya 2 orang, ditetapkan melalui SK Pembimbing.",
      "Masa pembimbingan 1 semester, dapat diperpanjang selama tidak melebihi masa studi.",
      "Perpanjangan SK pembimbing diperbarui otomatis oleh prodi pada semester berikutnya.",
      "Dosen pembimbing minimal memiliki jabatan akademik asisten ahli.",
      "Catatan: Peraturan Rektor Nomor 70 Tahun 2026 (lebih baru) menyebut pembimbing sarjana minimal berkualifikasi magister atau berjabatan Lektor Kepala, jumlahnya 1 sampai 2 orang, dengan bimbingan paling sedikit 8 kali per semester; kalau berbeda dengan Buku Panduan, ikuti peraturan yang lebih baru.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan mekanisme penggantian pembimbing.",
    answer:
      "Jumlah dosen pembimbing skripsi sebanyak-banyaknya 2 orang dan ditetapkan melalui SK Pembimbing. Masa pembimbingan berlangsung 1 semester dan dapat diperpanjang selama tidak melebihi masa studi yang ditetapkan; perpanjangan SK diperbarui otomatis oleh prodi pada semester berikutnya. Dosen pembimbing minimal berjabatan akademik asisten ahli. Catatan: Peraturan Rektor Nomor 70 Tahun 2026 (lebih baru) menyebut pembimbing sarjana minimal berkualifikasi magister atau berjabatan Lektor Kepala, jumlahnya 1 sampai 2 orang, dengan bimbingan paling sedikit 8 kali per semester; kalau berbeda dengan Buku Panduan, ikuti peraturan yang lebih baru.",
    escalation:
      "Hubungi Tim Pertimbangan Skripsi (TPS) atau staf prodi terkait penetapan dan perpanjangan SK pembimbing.",
    ...PEDOMAN_TA,
  },

  {
    id: "pembimbing-penggantian",
    category: "Tugas Akhir",
    title: "Mekanisme penggantian dosen pembimbing",
    questions: [
      "Bagaimana cara mengganti dosen pembimbing skripsi?",
      "Apakah dosen pembimbing bisa diganti?",
    ],
    followUps: [
      "Berapa lama keputusan penggantian pembimbing?",
      "Siapa yang memutuskan penggantian pembimbing?",
      "Berapa jumlah dosen pembimbing skripsi?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Siapa yang memutuskan penggantian pembimbing?",
      "Berapa lama keputusan penggantian pembimbing?",
      "Berapa jumlah dosen pembimbing skripsi?",
    ],
    keywords: ["ganti pembimbing", "penggantian", "pindah pembimbing", "pembimbing", "tps"],
    lead: "Pembimbing dapat diganti berdasarkan Surat Keputusan, dengan mekanisme berikut:",
    points: [
      "Mahasiswa mengajukan penggantian kepada Ketua Prodi disertai alasan penggantian.",
      "Staf prodi menyerahkan form penggantian kepada Tim Pertimbangan Skripsi (TPS).",
      "TPS memverifikasi pengajuan tersebut.",
      "Keputusan ditentukan TPS paling lambat 7 hari kerja.",
      "TPS menginformasikan keputusan melalui surat yang ditandatangani TPS dan Ketua Prodi.",
      "Bila disetujui, prodi mengajukan SK pembimbing skripsi terbaru.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan ketentuan pembimbingan secara umum.",
    answer:
      "Mahasiswa mengajukan penggantian pembimbing kepada Ketua Prodi dengan menyertakan alasannya. Staf prodi meneruskan form tersebut ke Tim Pertimbangan Skripsi, yang memverifikasi pengajuan dan memutuskan paling lambat 7 hari kerja. Keputusan disampaikan melalui surat yang ditandatangani TPS dan Ketua Program Studi, dan bila disetujui prodi mengajukan SK pembimbing terbaru.",
    escalation:
      "Hubungi Ketua Program Studi atau Tim Pertimbangan Skripsi untuk mengajukan penggantian pembimbing.",
    ...PEDOMAN_TA,
  },

  {
    id: "skripsi-publikasi-artikel",
    category: "Tugas Akhir",
    title: "Publikasi artikel sebagai syarat sidang skripsi",
    questions: [
      "Apakah skripsi wajib publikasi artikel?",
      "Di mana artikel skripsi harus dipublikasikan?",
    ],
    followUps: [
      "Apa saja syarat sidang jalur skripsi?",
      "Siapa penulis pertama artikel?",
      "Berapa minimal referensi dari jurnal?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Di mana artikel skripsi harus dipublikasikan?",
      "Berapa minimal referensi dari jurnal?",
      "Apa saja syarat sidang jalur skripsi?",
    ],
    keywords: ["publikasi", "artikel", "jurnal", "prosiding", "loa", "accepted", "referensi"],
    lead: "Ketentuan publikasi artikel bagi mahasiswa jalur skripsi:",
    points: [
      "Artikel dipublikasikan minimal di jurnal nasional dengan status Accepted, atau minimal di seminar nasional (prosiding) dengan status Accepted.",
      "Topik artikel harus berhubungan dengan topik skripsi.",
      "Mahasiswa menjadi penulis pertama, dosen pembimbing sebagai penulis berikutnya.",
      "Referensi dari artikel jurnal minimal 25% dari total referensi.",
      "Wajib mengutip penelitian dosen Prodi Bisnis Digital.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan seluruh syarat pendaftaran ujian sidang.",
    answer:
      "Mahasiswa jalur skripsi wajib mempublikasikan artikel ilmiah minimal pada jurnal nasional berstatus Accepted atau pada seminar nasional (prosiding) berstatus Accepted, dengan topik yang berhubungan dengan skripsinya. Mahasiswa menjadi penulis pertama dan dosen pembimbing sebagai penulis berikutnya. Referensi yang berasal dari artikel jurnal minimal 25% dari total referensi, dan wajib mengutip penelitian dosen Prodi Bisnis Digital.",
    escalation:
      "Hubungi dosen pembimbing atau Tim Pertimbangan Skripsi untuk validasi LoA publikasi artikel.",
    ...PEDOMAN_TA,
  },

  {
    id: "sidang-syarat-skripsi",
    category: "Sidang",
    title: "Persyaratan pendaftaran ujian sidang jalur skripsi",
    questions: [
      "Apa saja persyaratan pendaftaran sidang?",
      "Bagaimana cara mendaftar ujian sidang skripsi?",
    ],
    followUps: [
      "Berapa skor TESOL minimal?",
      "Berapa batas maksimal similarity Turnitin?",
      "Bagaimana pelaksanaan ujian sidang?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Berapa skor TESOL minimal?",
      "Berapa batas maksimal similarity Turnitin?",
      "Berapa SKS pada transkrip untuk sidang?",
      "Bagaimana cara mendaftar ujian sidang skripsi?",
    ],
    keywords: ["sidang", "daftar sidang", "persyaratan sidang", "ujian sidang", "berkas", "sias", "tesol", "turnitin"],
    lead: "Pendaftaran ujian sidang dilakukan melalui staf Prodi Bisnis Digital, lalu diteruskan ke bagian akademik. Pengajuan administrasi diakses melalui https://siak.upi.edu/sias. Persyaratannya:",
    points: [
      "3 eksemplar draf skripsi yang telah disahkan pembimbing dan ketua prodi.",
      "LoA publikasi artikel ilmiah yang telah divalidasi Tim Pertimbangan Skripsi.",
      "Kemampuan bahasa Inggris (TESOL dari UPI) dengan skor minimal 400.",
      "Sertifikasi kompetensi nasional atau internasional dari Lembaga Sertifikasi Profesi (LSP) atau sejenis.",
      "Uji kemiripan maksimal 25% (Peraturan Rektor 70/2026); batas 35% Turnitin di Buku Panduan April 2023 sudah tidak berlaku.",
      "Transkrip nilai lengkap terakhir dengan jumlah SKS 144 sampai 152.",
      "Tidak ada mata kuliah yang mendapat nilai E.",
      "Peraturan Rektor 70/2026 (lebih baru) juga mewajibkan pernyataan penggunaan Generative AI; ketentuan lain yang bertentangan dengan Buku Panduan mengikuti peraturan yang lebih baru.",
    ],
    table: {
      title: "Ringkasan Persyaratan Ujian Sidang Jalur Skripsi",
      columns: ["PERSYARATAN", "KETENTUAN"],
      rows: [
        ["Draf skripsi", "3 eksemplar, disahkan pembimbing dan ketua prodi"],
        ["Publikasi artikel", "LoA divalidasi Tim Pertimbangan Skripsi"],
        ["Bahasa Inggris", "TESOL UPI, skor minimal 400"],
        ["Sertifikasi kompetensi", "Nasional/internasional dari LSP atau sejenis"],
        ["Uji similaritas", "Maksimal 25% (Peraturan Rektor 70/2026)"],
        ["Jumlah SKS", "144 sampai 152 pada transkrip terakhir"],
        ["Nilai", "Tidak ada mata kuliah bernilai E"],
      ],
    },
    closing: "Kalau kamu mau, saya bisa jelaskan pelaksanaan ujian sidangnya.",
    answer:
      "Pendaftaran ujian sidang dilakukan melalui staf Prodi Bisnis Digital dan diteruskan ke bagian akademik, dengan pengajuan administrasi melalui laman https://siak.upi.edu/sias. Persyaratannya meliputi 3 eksemplar draf skripsi yang telah disahkan pembimbing dan ketua prodi, LoA publikasi artikel yang divalidasi Tim Pertimbangan Skripsi, TESOL UPI dengan skor minimal 400, sertifikasi kompetensi dari LSP atau sejenis, uji kemiripan maksimal 25% (Peraturan Rektor 70/2026; batas 35% Turnitin di Buku Panduan sudah tidak berlaku), transkrip dengan jumlah SKS 144 sampai 152, dan tidak ada mata kuliah bernilai E. Petugas akademik memverifikasi persyaratan, lalu TPS dan petugas akademik menyusun jadwal ujian sidang. Peraturan Rektor Nomor 70 Tahun 2026 (lebih baru) juga mewajibkan pernyataan penggunaan Generative AI; ketentuan lain yang bertentangan dengan Buku Panduan mengikuti peraturan yang lebih baru.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital atau petugas akademik untuk memverifikasi kelengkapan berkas sidang.",
    ...PEDOMAN_TA,
  },

  {
    id: "sidang-pelaksanaan",
    category: "Sidang",
    title: "Pelaksanaan ujian sidang",
    questions: [
      "Bagaimana pelaksanaan ujian sidang?",
      "Berapa jumlah dosen penguji sidang?",
    ],
    followUps: [
      "Apa saja persyaratan pendaftaran sidang?",
      "Apa saja kategori hasil ujian sidang?",
      "Apakah perlu membawa konsumsi saat sidang?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Berapa jumlah dosen penguji sidang?",
      "Apakah perlu membawa konsumsi saat sidang?",
      "Apa saja kategori hasil ujian sidang?",
    ],
    keywords: ["pelaksanaan sidang", "penguji", "majelis", "gratifikasi", "konsumsi", "sidang"],
    lead: "Ketentuan pelaksanaan ujian sidang:",
    points: [
      "Satu peserta ujian sidang diuji oleh 3 dosen penguji.",
      "Dosen penguji minimal memiliki jabatan akademik asisten ahli.",
      "Dosen penguji bukan merupakan pembimbing mahasiswa yang bersangkutan.",
      "Majelis sidang terdiri dari tim penguji dan tim pembimbing, dan membuat rekomendasi kelulusan.",
      "TPS berkoordinasi dengan ketua prodi untuk menentukan kelulusan.",
      "Prodi tidak mewajibkan mahasiswa membawa konsumsi atau segala bentuk gratifikasi selama proses pembimbingan sampai sidang akhir.",
      "Catatan: Peraturan Rektor Nomor 70 Tahun 2026 (lebih baru) menetapkan tim penguji paling sedikit 3 orang, pembimbing boleh menjadi anggota tim penguji sesuai ketentuan prodi, pimpinan sidang bukan dari pembimbing, dan sidang program sarjana dilaksanakan tertutup.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan kategori hasil ujian sidangnya.",
    answer:
      "Ujian sidang dilaksanakan dengan komposisi satu peserta yang diuji oleh 3 dosen penguji berjabatan akademik minimal asisten ahli, dan penguji bukan merupakan pembimbing mahasiswa tersebut. Majelis sidang yang terdiri dari tim penguji dan tim pembimbing membuat rekomendasi kelulusan, lalu TPS berkoordinasi dengan ketua prodi untuk menentukannya. Prodi tidak mewajibkan mahasiswa membawa konsumsi atau bentuk gratifikasi apa pun selama proses pembimbingan sampai sidang akhir. Catatan: Peraturan Rektor Nomor 70 Tahun 2026 (lebih baru) menetapkan tim penguji paling sedikit 3 orang, pembimbing boleh menjadi anggota tim penguji sesuai ketentuan prodi, pimpinan sidang bukan dari pembimbing, dan sidang program sarjana dilaksanakan tertutup.",
    escalation:
      "Hubungi Tim Pertimbangan Skripsi atau Ketua Program Studi untuk pertanyaan seputar pelaksanaan sidang.",
    ...PEDOMAN_TA,
  },

  {
    id: "sidang-hasil-kelulusan",
    category: "Kelulusan",
    title: "Kategori hasil ujian sidang dan waktu revisi",
    questions: [
      "Apa saja kategori hasil ujian sidang?",
      "Berapa lama waktu revisi setelah sidang?",
    ],
    followUps: [
      "Apa itu yudisium?",
      "Bagaimana proses revisi skripsi?",
      "Bagaimana pelaksanaan ujian sidang?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Berapa lama waktu revisi setelah sidang?",
      "Apa saja kategori hasil ujian sidang?",
      "Bagaimana proses revisi skripsi?",
    ],
    keywords: ["hasil sidang", "kelulusan", "yudisium", "revisi", "perbaikan", "lulus", "gagal"],
    lead: "Yudisium adalah prosesi peresmian kelulusan mahasiswa dalam menempuh sidang. Hasil ujian dikategorikan menjadi:",
    points: [
      "Lulus tanpa perbaikan.",
      "Lulus dengan perbaikan kecil/minor — waktu perbaikan paling lama 2 minggu sejak tanggal ujian, meliputi judul, abstrak, daftar pustaka, dan kebahasaan.",
      "Lulus dengan perbaikan besar/substansial — waktu perbaikan paling lama 30 hari sejak tanggal ujian, meliputi perubahan orientasi penelitian, analisis data, dan kerangka analisis.",
      "Gagal.",
      "Mahasiswa yang lulus dengan perbaikan melakukan revisi sesuai saran penguji bersama dosen pembimbing.",
      "Catatan: Peraturan Rektor Nomor 70 Tahun 2026 (lebih baru) membagi hasil sidang menjadi lulus tanpa perbaikan, lulus dengan perbaikan minor, perbaikan mayor dan ujian ulang, atau tidak lulus; ujian ulang paling banyak 1 kali, paling cepat 14 hari dan paling lambat 30 hari kalender setelah sidang sebelumnya.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan proses setelah revisi sampai pemberkasan wisuda.",
    answer:
      "Hasil ujian sidang dikategorikan menjadi empat: lulus tanpa perbaikan; lulus dengan perbaikan kecil atau minor dengan waktu perbaikan paling lama 2 minggu sejak tanggal ujian yang meliputi judul, abstrak, daftar pustaka, dan kebahasaan; lulus dengan perbaikan besar atau substansial dengan waktu paling lama 30 hari yang meliputi perubahan orientasi penelitian, analisis data, dan kerangka analisis; serta gagal. Yudisium merupakan prosesi peresmian kelulusan mahasiswa. Catatan: Peraturan Rektor Nomor 70 Tahun 2026 (lebih baru) membagi hasil sidang menjadi lulus tanpa perbaikan, lulus dengan perbaikan minor, perbaikan mayor dan ujian ulang, atau tidak lulus; ujian ulang paling banyak 1 kali, paling cepat 14 hari dan paling lambat 30 hari kalender setelah sidang sebelumnya.",
    escalation:
      "Hubungi dosen pembimbing untuk proses revisi, atau staf prodi untuk status yudisium.",
    ...PEDOMAN_TA,
  },

  {
    id: "skripsi-percetakan",
    category: "Kelulusan",
    title: "Pengecekan format, percetakan, dan penjilidan skripsi",
    questions: [
      "Bagaimana ketentuan penjilidan skripsi?",
      "Apa warna hardcover skripsi?",
    ],
    followUps: [
      "Berapa rangkap skripsi yang harus diserahkan?",
      "Apa saja persyaratan wisuda?",
      "Bagaimana proses pengecekan format?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Apa warna hardcover skripsi?",
      "Berapa rangkap skripsi yang harus diserahkan?",
      "Bagaimana proses pengecekan format?",
    ],
    keywords: ["cetak", "percetakan", "jilid", "hardcover", "format", "penggandaan", "skripsi"],
    lead: "Setelah revisi disahkan, skripsi melalui pengecekan format dan percetakan:",
    points: [
      "Mahasiswa menyerahkan draf yang disetujui pembimbing kepada staf prodi untuk pengecekan format.",
      "Jika ada koreksi, draf dikembalikan untuk diperbaiki dan dicetak ulang.",
      "Bila sudah sesuai, staf prodi memberikan form persetujuan percetakan skripsi.",
      "Skripsi dicetak dan dijilid sebanyak dua rangkap, untuk Perpustakaan dan Prodi.",
      "Skripsi dijilid dengan hardcover berwarna cokelat tua.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan pemberkasan wisudanya.",
    answer:
      "Mahasiswa menyerahkan draf skripsi yang telah disetujui pembimbing kepada staf prodi untuk pengecekan format. Bila ada koreksi, draf dikembalikan untuk diperbaiki dan dicetak ulang. Setelah sesuai, staf prodi memberikan form persetujuan percetakan. Skripsi kemudian dicetak dan dijilid sebanyak dua rangkap untuk Perpustakaan dan Prodi, dengan hardcover berwarna cokelat tua.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital untuk pengecekan format dan form persetujuan percetakan.",
    ...PEDOMAN_TA,
  },

  {
    id: "wisuda-pemberkasan",
    category: "Kelulusan",
    title: "Pemberkasan wisuda",
    questions: [
      "Apa saja persyaratan wisuda?",
      "Bagaimana cara mendaftar wisuda?",
    ],
    followUps: [
      "Bagaimana ketentuan penjilidan skripsi?",
      "Ke mana skripsi dan CD diserahkan?",
      "Apa itu yudisium?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Ke mana skripsi dan CD diserahkan?",
      "Bagaimana cara mendaftar wisuda?",
      "Kapan jadwal wisuda UPI tahun 2026?",
    ],
    keywords: ["wisuda", "pemberkasan", "wisudawan", "cd", "perpustakaan", "sias"],
    lead: "Pemberkasan wisuda dilakukan setelah skripsi disahkan:",
    points: [
      "Mahasiswa memperbarui data wisudawan melalui https://siak.upi.edu/sias.",
      "Menyerahkan skripsi yang telah disahkan pembimbing dan ketua prodi.",
      "Menyerahkan skripsi dan CD ke Perpustakaan serta dosen pembimbing.",
      "Menyerahkan CD ke Program Studi.",
      "Catatan: Peraturan Rektor Nomor 70 Tahun 2026 (lebih baru) mengatur wisuda setelah yudisium, dengan surat keterangan bebas pustaka di SIAS, dan tugas akhir yang lulus diunggah ke Repositori UPI.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan ketentuan penjilidan sebelum pemberkasan.",
    answer:
      "Mahasiswa melakukan pembaruan data wisudawan melalui laman https://siak.upi.edu/sias. Persyaratan wisuda meliputi skripsi yang telah disahkan oleh pembimbing dan ketua prodi, penyerahan skripsi dan CD ke Perpustakaan dan dosen pembimbing, serta penyerahan CD ke Program Studi, di samping persyaratan lainnya. Catatan: Peraturan Rektor Nomor 70 Tahun 2026 (lebih baru) mengatur wisuda setelah yudisium, dengan surat keterangan bebas pustaka di SIAS, dan tugas akhir yang lulus diunggah ke Repositori UPI.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital untuk memastikan kelengkapan berkas wisuda.",
    ...PEDOMAN_TA,
  },

  {
    id: "artikel-ketentuan-umum",
    category: "Tugas Akhir",
    title: "Ketentuan artikel ilmiah yang diakui setara skripsi",
    questions: [
      "Apa ketentuan jalur artikel ilmiah?",
      "Jurnal apa yang diakui untuk jalur artikel?",
    ],
    followUps: [
      "Apa saja syarat sidang jalur artikel?",
      "Apa jenis artikel yang diakui?",
      "Bagaimana cara memeriksa akreditasi jurnal?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Jurnal apa yang diakui untuk jalur artikel?",
      "Apa jenis artikel yang diakui?",
      "Apa saja syarat sidang jalur artikel?",
    ],
    keywords: ["artikel", "jalur artikel", "jurnal", "sinta", "scopus", "internasional bereputasi", "setara skripsi"],
    lead: "Artikel ilmiah dapat diakui setara skripsi apabila memenuhi ketentuan berikut:",
    points: [
      "Terbit pada jurnal terakreditasi nasional SINTA 1 sampai 3, atau jurnal internasional bereputasi dari berbagai indexing.",
      "Jurnal memiliki ruang lingkup kajian sebidang atau relevan dengan body of knowledge program studi.",
      "Mahasiswa sebagai penulis pertama dan dua dosen pembimbing sebagai penulis anggota.",
      "Wajib mensitasi karya ilmiah dosen yang relevan.",
      "Artikel menggunakan afiliasi dan email upi.edu.",
      "Sebelum submit, mahasiswa harus mendapat rekomendasi/verifikasi dari dosen pembimbing.",
      "Mahasiswa menyerahkan artikel yang sudah terbit, atau LoA yang dilengkapi bukti bayar, kepada Tim Penyelesaian Studi.",
      "Dekan atau Direktur Kampus Daerah menerbitkan Surat Keterangan tentang kedudukan artikel setara skripsi.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan persyaratan ujian sidang jalur artikel.",
    answer:
      "Artikel ilmiah diakui setara skripsi apabila diterbitkan pada jurnal terakreditasi nasional SINTA 1 sampai 3 atau jurnal internasional bereputasi, dengan ruang lingkup yang sebidang atau relevan dengan body of knowledge program studi. Mahasiswa menjadi penulis pertama dan dua dosen pembimbing sebagai penulis anggota, wajib mensitasi karya dosen yang relevan, serta menggunakan afiliasi dan email upi.edu. Sebelum submit, mahasiswa harus mendapat rekomendasi dari dosen pembimbing. Artikel yang telah terbit atau LoA beserta bukti bayar diserahkan kepada Tim Penyelesaian Studi, dan Dekan atau Direktur Kampus Daerah menerbitkan Surat Keterangan tentang kedudukan artikel setara skripsi. Akreditasi jurnal dapat diperiksa melalui SINTA, DOAJ, Scopus, ISI Web of Science, dan pengindeks lain yang tercantum dalam pedoman.",
    escalation:
      "Hubungi dosen pembimbing atau Tim Penyelesaian Studi untuk verifikasi kelayakan jurnal dan artikel.",
    ...PEDOMAN_TA,
  },

  {
    id: "artikel-jenis",
    category: "Tugas Akhir",
    title: "Jenis artikel ilmiah yang diakui",
    questions: [
      "Apa jenis artikel yang diakui untuk tugas akhir?",
      "Apakah literature review bisa dijadikan tugas akhir?",
    ],
    followUps: [
      "Apa ketentuan jalur artikel ilmiah?",
      "Apa saja syarat sidang jalur artikel?",
      "Jurnal apa yang diakui?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Apakah literature review bisa dijadikan tugas akhir?",
      "Apa jenis artikel yang diakui?",
      "Jurnal apa yang diakui untuk jalur artikel?",
    ],
    keywords: ["jenis artikel", "original research", "literature review", "kajian literatur", "penelitian empirik"],
    lead: "Mahasiswa dapat memilih salah satu dari dua jenis artikel ilmiah:",
    points: [
      "Artikel hasil penelitian empirik (original research), dengan metode kuantitatif, kualitatif, kombinasi (mixed methods), atau penelitian dan pengembangan (research and development).",
      "Artikel hasil kajian literatur (literature review).",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan ketentuan jurnal tempat artikel diterbitkan.",
    answer:
      "Dalam jalur artikel ilmiah, mahasiswa dapat memilih salah satu dari dua jenis artikel: artikel hasil penelitian empirik (original research) dengan metode kuantitatif, kualitatif, kombinasi, atau penelitian dan pengembangan; atau artikel hasil kajian literatur (literature review).",
    escalation:
      "Hubungi dosen pembimbing untuk menentukan jenis artikel yang sesuai dengan rencana penelitianmu.",
    ...PEDOMAN_TA,
  },

  {
    id: "artikel-syarat-sidang",
    category: "Sidang",
    title: "Persyaratan ujian sidang jalur artikel ilmiah",
    questions: [
      "Apa saja syarat sidang jalur artikel?",
      "Berapa kali bimbingan minimal untuk sidang jalur artikel?",
    ],
    followUps: [
      "Apa ketentuan jalur artikel ilmiah?",
      "Berapa skor TESOL minimal?",
      "Bagaimana pelaksanaan ujian sidang?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Berapa kali bimbingan minimal untuk sidang jalur artikel?",
      "Berapa skor TESOL minimal?",
      "Apa saja syarat sidang jalur artikel?",
    ],
    keywords: ["sidang artikel", "syarat sidang", "jalur artikel", "loa", "bimbingan", "tesol"],
    lead: "Persyaratan ujian sidang bagi mahasiswa jalur artikel ilmiah:",
    points: [
      "3 eksemplar artikel yang telah diterbitkan, atau yang telah mendapat LoA beserta bukti bayar, dengan LoA divalidasi Tim Pertimbangan Skripsi.",
      "Kemampuan bahasa Inggris (TESOL) dengan skor minimal 400.",
      "Sertifikasi kompetensi nasional atau internasional dari Lembaga Sertifikasi Profesi (LSP) atau sejenis.",
      "Tidak ada mata kuliah bernilai E pada transkrip nilai terakhir.",
      "Bukti bimbingan minimal 10 kali, berupa buku bimbingan yang ditandatangani pembimbing.",
      "Dosen pembimbing dan ketua prodi memvalidasi pengajuan melalui https://siak.upi.edu/sias.",
      "Catatan: Peraturan Rektor Nomor 70 Tahun 2026 (lebih baru) mensyaratkan sertifikat bahasa Inggris atau bahasa asing dengan skor minimal sesuai Keputusan Rektor dan paling sedikit 1 sertifikat kompetensi, serta LoA bagi tugas akhir bentuk artikel ilmiah.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan pelaksanaan ujian sidangnya.",
    answer:
      "Persyaratan ujian sidang jalur artikel meliputi 3 eksemplar artikel yang telah diterbitkan atau yang telah mendapatkan LoA beserta bukti bayar dengan LoA divalidasi Tim Pertimbangan Skripsi, TESOL dengan skor minimal 400, sertifikasi kompetensi dari LSP atau sejenis, tidak ada mata kuliah bernilai E pada transkrip terakhir, serta bukti bimbingan minimal 10 kali berupa buku bimbingan yang ditandatangani pembimbing. Dosen pembimbing dan ketua prodi memvalidasi pengajuan melalui laman https://siak.upi.edu/sias. Catatan: Peraturan Rektor Nomor 70 Tahun 2026 (lebih baru) mensyaratkan sertifikat bahasa Inggris atau bahasa asing dengan skor minimal sesuai Keputusan Rektor dan paling sedikit 1 sertifikat kompetensi, serta LoA bagi tugas akhir bentuk artikel ilmiah.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital atau petugas akademik untuk verifikasi persyaratan sidang.",
    ...PEDOMAN_TA,
  },

  {
    id: "semhas-artikel",
    category: "Sidang",
    title: "Seminar hasil tugas akhir jalur artikel ilmiah",
    questions: [
      "Kapan pendaftaran seminar hasil jalur artikel?",
      "Dokumen apa saja untuk seminar hasil?",
    ],
    followUps: [
      "Apa ketentuan berpakaian saat seminar hasil?",
      "Berapa lama durasi presentasi seminar hasil?",
      "Di mana mendaftar seminar hasil?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Kapan pendaftaran seminar hasil jalur artikel?",
      "Berapa lama durasi presentasi seminar hasil?",
      "Di mana mendaftar seminar hasil?",
      "Apa saja berkas untuk seminar hasil?",
    ],
    keywords: ["seminar hasil", "semhas", "artikel", "pendaftaran", "jadwal", "sias", "dokumen"],
    lead: "Ketentuan pelaksanaan Seminar Hasil (Semhas) Tugas Akhir Jalur Artikel Ilmiah:",
    points: [
      "Pendaftaran: 5–23 Oktober 2026.",
      "Penyerahan dokumen persyaratan: 7–16 Oktober 2026.",
      "Pelaksanaan sesuai jadwal yang diumumkan program studi.",
      "Pendaftaran melalui SIAS (https://siak.upi.edu/sias/) dan Gform (https://bit.ly/PendaftaranSemhasTA).",
      "Dokumen: 3 naskah artikel ilmiah (full paper) disertai bukti persetujuan Dosen Pembimbing.",
      "Dokumen: 3 laporan hasil penelitian sesuai sistematika yang ditetapkan.",
      "Dokumen pendukung yang digunakan dalam proses submission artikel, diunggah melalui Gform.",
      "Mahasiswa wajib hadir paling lambat 15 menit sebelum jadwal seminar dimulai.",
      "Bahan tayang dipaparkan dalam durasi 10–15 menit.",
      "Setelah jadwal ditetapkan, mahasiswa menghubungi dosen penguji untuk mengonfirmasi kehadiran.",
      "Seminar dilaksanakan terbuka, sehingga mahasiswa lain dapat hadir sebagai audiens.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan ketentuan berpakaian saat seminar hasil.",
    answer:
      "Pendaftaran Seminar Hasil Tugas Akhir Jalur Artikel berlangsung 5–23 Oktober 2026, dengan penyerahan dokumen persyaratan 7–16 Oktober 2026, dan pelaksanaan sesuai jadwal yang diumumkan program studi. Pendaftaran dilakukan melalui SIAS dan Gform. Dokumen persyaratan meliputi 3 naskah artikel ilmiah full paper disertai bukti persetujuan dosen pembimbing, 3 laporan hasil penelitian sesuai sistematika yang ditetapkan, serta dokumen pendukung proses submission artikel. Mahasiswa wajib hadir paling lambat 15 menit sebelum jadwal dimulai dan memaparkan bahan tayang selama 10–15 menit. Seminar dilaksanakan terbuka sehingga mahasiswa lain dapat hadir sebagai audiens.",
    escalation:
      "Hubungi Program Studi Bisnis Digital di bisnisdigital@upi.edu atau (0265) 331860 untuk kepastian jadwal seminar.",
    ...PENGUMUMAN_SEMHAS,
  },

  {
    id: "semhas-pakaian",
    category: "Sidang",
    title: "Ketentuan berpakaian seminar hasil",
    questions: [
      "Apa ketentuan berpakaian saat seminar hasil?",
      "Pakaian apa yang dikenakan saat semhas?",
    ],
    followUps: [
      "Kapan pendaftaran seminar hasil?",
      "Berapa lama durasi presentasi seminar hasil?",
      "Dokumen apa saja untuk seminar hasil?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Pakaian apa yang dikenakan saat semhas?",
      "Kapan pendaftaran seminar hasil?",
      "Berapa lama durasi presentasi seminar hasil?",
    ],
    keywords: ["pakaian", "berpakaian", "seminar hasil", "semhas", "jas almamater", "dasi", "jilbab"],
    lead: "Ketentuan berpakaian pada Seminar Hasil Tugas Akhir Jalur Artikel:",
    points: [
      "Mahasiswa pria: kemeja putih polos lengan panjang, celana bahan hitam, dasi hitam, jas almamater, dan sepatu formal hitam.",
      "Mahasiswa wanita: kemeja putih polos, rok atau celana bahan hitam, jilbab hitam bagi yang berhijab, jas almamater, dan sepatu formal hitam.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan jadwal dan dokumen pendaftarannya.",
    answer:
      "Pada Seminar Hasil Tugas Akhir Jalur Artikel, mahasiswa pria mengenakan kemeja putih polos lengan panjang, celana bahan hitam, dasi hitam, jas almamater, dan sepatu formal hitam. Mahasiswa wanita mengenakan kemeja putih polos, rok atau celana bahan hitam, jilbab hitam bagi yang berhijab, jas almamater, dan sepatu formal hitam.",
    escalation:
      "Hubungi Program Studi Bisnis Digital di bisnisdigital@upi.edu jika ada ketentuan tambahan yang diumumkan kemudian.",
    ...PENGUMUMAN_SEMHAS,
  },

  {
    id: "ttg-ketentuan",
    category: "Tugas Akhir",
    title: "Karya Teknologi Tepat Guna yang diakui setara skripsi",
    questions: [
      "Apa itu jalur Teknologi Tepat Guna?",
      "Karya seperti apa yang diakui sebagai TTG?",
    ],
    followUps: [
      "Apa saja syarat sidang jalur TTG?",
      "Bagaimana cara mengajukan tugas akhir jalur TTG?",
      "Bagaimana penilaian karya TTG?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Karya seperti apa yang diakui sebagai TTG?",
      "Bagaimana penilaian karya TTG?",
      "Apa saja syarat sidang jalur TTG?",
    ],
    keywords: ["ttg", "teknologi tepat guna", "pkm", "lomba", "juara", "inovasi"],
    lead: "Karya Teknologi Tepat Guna adalah teknologi yang dirancang untuk masyarakat tertentu dengan memperhatikan aspek lingkungan, etika, budaya, sosial, politik, dan ekonomi. Karya yang diakui setara skripsi yaitu:",
    points: [
      "Karya yang diikutsertakan pada lomba tingkat nasional dan memperoleh juara 1 sampai juara harapan 2, baik sebagai ketua maupun anggota; atau dinyatakan lolos didanai dalam Program Kreativitas Mahasiswa (PKM).",
      "Produk teknologi yang sudah dapat didiseminasikan atau dimanfaatkan pihak lain sesuai kebutuhan masyarakat, dibuktikan dengan dokumentasi desain, proses pembuatan, dan penerapannya.",
      "Tema karya memiliki relevansi dengan bidang keilmuan program studi.",
      "Disertai publikasi pada jurnal pengabdian kepada masyarakat.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan mekanisme pengajuan dan pembimbingannya.",
    answer:
      "Karya Teknologi Tepat Guna adalah teknologi yang dirancang khusus untuk masyarakat tertentu dengan memperhatikan aspek lingkungan, etika, budaya, sosial, politik, dan ekonomi. Karya yang diakui setara skripsi adalah karya yang diikutsertakan pada lomba tingkat nasional dan memperoleh juara 1 sampai juara harapan 2, atau dinyatakan lolos didanai dalam Program Kreativitas Mahasiswa; serta produk teknologi yang sudah dapat didiseminasikan atau dimanfaatkan pihak lain sesuai kebutuhan masyarakat, dibuktikan dengan dokumentasi desain, proses pembuatan, dan penerapannya. Temanya harus relevan dengan bidang keilmuan program studi dan disertai publikasi pada jurnal pengabdian kepada masyarakat.",
    escalation:
      "Hubungi Ketua Program Studi untuk persetujuan tema besar tugas akhir jalur Teknologi Tepat Guna.",
    ...PEDOMAN_TA,
  },

  {
    id: "ttg-pengajuan",
    category: "Tugas Akhir",
    title: "Pengajuan dan pembimbingan tugas akhir jalur TTG",
    questions: [
      "Bagaimana cara mengajukan tugas akhir jalur TTG?",
      "Berapa kali bimbingan jalur Teknologi Tepat Guna?",
    ],
    followUps: [
      "Apa itu jalur Teknologi Tepat Guna?",
      "Apa saja syarat sidang jalur TTG?",
      "Bagaimana penilaian karya TTG?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Berapa kali bimbingan jalur Teknologi Tepat Guna?",
      "Bagaimana cara mengajukan tugas akhir jalur TTG?",
      "Bagaimana penilaian karya TTG?",
    ],
    keywords: ["ttg", "pengajuan", "teknologi tepat guna", "bimbingan", "logbook", "verifikasi tema"],
    lead: "Mekanisme pengajuan dan pembimbingan tugas akhir jalur Teknologi Tepat Guna:",
    points: [
      "Mahasiswa mengajukan diri kepada dosen PA dengan memberikan deskripsi singkat invensi atau ide.",
      "Mengisi Form Lembar Verifikasi Tema/Topik/Judul Jalur Teknologi Tepat Guna.",
      "Dokumen pengajuan diunggah melalui Gform, lalu diverifikasi staf prodi.",
      "Ketua Program Studi menyetujui dan menetapkan tema besar, serta menunjuk pembimbing.",
      "Prodi mengajukan SK Pembimbing Tugas Akhir.",
      "Pembimbingan dilakukan minimal 10 kali dengan membawa logbook bimbingan.",
      "Pembimbingan mencakup penyusunan laporan, kelengkapan dokumen, validasi mitra, kebermanfaatan kepada masyarakat, dan publikasi jurnal pengabdian.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan persyaratan sidangnya.",
    answer:
      "Mahasiswa mengajukan diri kepada dosen Pembimbing Akademik dengan deskripsi singkat invensi atau ide, mengisi Form Lembar Verifikasi Tema/Topik/Judul Jalur Teknologi Tepat Guna, lalu mengunggah dokumen pengajuan melalui Gform untuk diverifikasi staf prodi. Ketua Program Studi menyetujui dan menetapkan tema besar serta menunjuk pembimbing, kemudian prodi mengajukan SK Pembimbing. Proses bimbingan dilakukan minimal 10 kali dengan membawa logbook, mencakup penyusunan laporan, kelengkapan dokumen, validasi mitra, kebermanfaatan kepada masyarakat, dan publikasi jurnal pengabdian.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital untuk verifikasi dokumen pengajuan jalur TTG.",
    ...PEDOMAN_TA,
  },

  {
    id: "ttg-syarat-sidang",
    category: "Sidang",
    title: "Persyaratan ujian sidang jalur Teknologi Tepat Guna",
    questions: [
      "Apa saja syarat sidang jalur TTG?",
      "Dokumen apa untuk sidang Teknologi Tepat Guna?",
    ],
    followUps: [
      "Bagaimana cara mengajukan tugas akhir jalur TTG?",
      "Bagaimana penilaian karya TTG?",
      "Berapa skor TESOL minimal?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Apa saja berkas untuk sidang Teknologi Tepat Guna?",
      "Berapa skor TESOL minimal?",
      "Apa saja syarat sidang jalur TTG?",
    ],
    keywords: ["sidang ttg", "teknologi tepat guna", "syarat sidang", "laporan", "jurnal pengabdian"],
    lead: "Persyaratan ujian sidang jalur Teknologi Tepat Guna:",
    points: [
      "3 eksemplar Laporan Tugas Akhir TTG yang telah disahkan pembimbing dan ketua prodi.",
      "LoA publikasi artikel pada jurnal pengabdian masyarakat yang telah divalidasi Tim Pertimbangan Skripsi.",
      "Kemampuan bahasa Inggris (TESOL) dengan skor minimal 400.",
      "Sertifikasi kompetensi nasional atau internasional dari Lembaga Sertifikasi Profesi (LSP) atau sejenis.",
      "Bukti bimbingan 10 kali berupa buku bimbingan yang ditandatangani pembimbing.",
      "Tidak ada mata kuliah bernilai E pada transkrip nilai terakhir.",
      "Bukti penerapan teknologi tepat guna.",
      "Pengajuan administrasi melalui https://siak.upi.edu/sias, divalidasi pembimbing dan ketua prodi.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan kriteria penilaian karyanya.",
    answer:
      "Persyaratan ujian sidang jalur Teknologi Tepat Guna meliputi 3 eksemplar Laporan Tugas Akhir TTG yang disahkan pembimbing dan ketua prodi, LoA publikasi pada jurnal pengabdian masyarakat yang divalidasi Tim Pertimbangan Skripsi, TESOL dengan skor minimal 400, sertifikasi kompetensi dari LSP atau sejenis, bukti bimbingan 10 kali, tidak ada mata kuliah bernilai E, serta bukti penerapan teknologi tepat guna. Pengajuan administrasi dilakukan melalui laman https://siak.upi.edu/sias dan divalidasi oleh dosen pembimbing serta ketua prodi.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital untuk verifikasi persyaratan sidang jalur TTG.",
    ...PEDOMAN_TA,
  },

  {
    id: "ttg-penilaian",
    category: "Sidang",
    title: "Penilaian karya Teknologi Tepat Guna",
    questions: [
      "Bagaimana penilaian karya TTG?",
      "Apa kriteria penilaian Teknologi Tepat Guna?",
    ],
    followUps: [
      "Apa saja syarat sidang jalur TTG?",
      "Apa itu jalur Teknologi Tepat Guna?",
      "Apakah karya TTG perlu HKI?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Apa kriteria penilaian Teknologi Tepat Guna?",
      "Apakah karya TTG perlu HKI?",
      "Apa saja syarat sidang jalur TTG?",
    ],
    keywords: ["penilaian ttg", "kriteria", "hki", "invensi", "inovasi", "teknologi tepat guna"],
    lead: "Kriteria penilaian karya Teknologi Tepat Guna yang diakui setara skripsi:",
    points: [
      "Kredibilitas karya: tema relevan dengan keilmuan prodi, bernilai invensi dan inovasi, tidak merusak lingkungan, mudah dimanfaatkan dan dipelihara masyarakat, menghasilkan nilai tambah ekonomi dan lingkungan, serta aplikatif.",
      "Penguasaan mahasiswa: penyajian atau presentasi, dan penguasaan materi substantif.",
      "Publikasi pada jurnal pengabdian.",
      "Hak atas Kekayaan Intelektual: karya telah memperoleh sertifikat HKI atau sedang dalam proses pengajuan HKI.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan persyaratan pendaftaran sidangnya.",
    answer:
      "Penilaian karya Teknologi Tepat Guna mencakup kredibilitas karya, yaitu relevansi tema dengan keilmuan prodi, nilai invensi dan inovasi, tidak merusak lingkungan, mudah dimanfaatkan dan dipelihara masyarakat, memberi nilai tambah ekonomi dan lingkungan, serta aplikatif; penguasaan mahasiswa berupa penyajian dan penguasaan materi substantif; publikasi pada jurnal pengabdian; serta Hak atas Kekayaan Intelektual, yakni karya telah memperoleh sertifikat HKI atau sedang dalam proses pengajuan.",
    escalation:
      "Hubungi Ketua Program Studi atau dosen pembimbing untuk penjelasan bobot penilaian.",
    ...PEDOMAN_TA,
  },

  {
    id: "format-penulisan",
    category: "Penulisan Ilmiah",
    title: "Font, spasi, margin, dan ukuran kertas karya tulis ilmiah",
    questions: [
      "Bagaimana format penulisan skripsi?",
      "Berapa ukuran margin dan font skripsi?",
      "Apakah pedoman karya ilmiah UPI sudah ada?",
      "Apakah pedoman penulisan karya ilmiah UPI tersedia?",
    ],
    followUps: [
      "Berapa batas maksimal similarity?",
      "Bagaimana aturan penggunaan AI?",
      "Bagaimana ketentuan penjilidan skripsi?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Berapa ukuran margin dan font skripsi?",
      "Berapa ukuran kertas skripsi?",
      "Bagaimana aturan penggunaan AI?",
    ],
    keywords: ["format", "font", "margin", "spasi", "kertas", "times new roman", "a4", "penulisan"],
    lead: "Aturan teknis penulisan skripsi, tesis, dan disertasi di lingkungan UPI:",
    points: [
      "Font: Times New Roman, ukuran 12 pt untuk isi utama; judul bab dan subbab lebih besar, misalnya 14 pt atau dicetak tebal.",
      "Spasi isi utama: 1,5 spasi.",
      "Spasi abstrak, kutipan panjang, dan daftar pustaka: 1 spasi.",
      "Margin kiri 4 cm, kanan 3 cm, atas 4 cm, bawah 3 cm.",
      "Ukuran kertas A4 (21 cm x 29,7 cm).",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan ketentuan uji similaritas.",
    answer:
      "Karya tulis ilmiah di UPI ditulis dengan font Times New Roman ukuran 12 pt untuk isi utama, sedangkan judul bab dan subbab lebih besar misalnya 14 pt atau dicetak tebal. Isi utama menggunakan 1,5 spasi, sementara abstrak, kutipan panjang, dan daftar pustaka menggunakan 1 spasi. Margin kiri 4 cm, kanan 3 cm, atas 4 cm, dan bawah 3 cm, pada kertas A4 berukuran 21 cm x 29,7 cm.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital saat pengecekan format sebelum percetakan skripsi.",
    ...PEDOMAN_KTI,
  },

  {
    id: "uji-similaritas",
    category: "Penulisan Ilmiah",
    title: "Uji similaritas dan batas kemiripan",
    questions: [
      "Berapa batas maksimal similarity untuk sidang?",
      "Berapa persen kemiripan Turnitin yang diperbolehkan?",
    ],
    followUps: [
      "Apa sanksi tindakan plagiat?",
      "Bagaimana aturan penggunaan AI?",
      "Apa saja persyaratan pendaftaran sidang?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Berapa persen kemiripan Turnitin yang diperbolehkan?",
      "Apa sanksi tindakan plagiat?",
      "Apa itu uji similaritas?",
    ],
    keywords: ["similaritas", "kemiripan", "turnitin", "plagiat", "plagiarisme", "persen", "ithenticate"],
    lead: "Batas yang berlaku adalah dari Peraturan Rektor Nomor 70 Tahun 2026 (6 November 2026), yang paling baru:",
    points: [
      "Peraturan Rektor 70/2026: kemiripan paling tinggi 25% agar boleh diajukan ke ujian sidang.",
      "Kemiripan di atas 25% sampai 40%: wajib memperbaiki bagian yang mirip sebelum diajukan.",
      "Kemiripan di atas 40%: wajib diperbaiki menyeluruh dan tidak bisa diajukan ke ujian sidang.",
      "Pedoman Penulisan Karya Ilmiah UPI Edisi 2024 menyebut angka yang sama; batas Turnitin 35% di Buku Panduan April 2023 sudah tidak berlaku.",
      "Alat uji yang disebutkan antara lain Turnitin, iThenticate, Grammarly, dan Quetext.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan sanksi atas tindakan plagiat.",
    answer:
      "Batas similaritas untuk ujian sidang mengikuti Peraturan Rektor Nomor 70 Tahun 2026 (6 November 2026): kemiripan paling tinggi 25% boleh diajukan, di atas 25% sampai 40% wajib memperbaiki bagian yang mirip, dan di atas 40% wajib diperbaiki menyeluruh serta tidak bisa diajukan. Pedoman Penulisan Karya Ilmiah UPI Edisi 2024 menyebut angka yang sama. Batas Turnitin 35% di Buku Panduan Penyelesaian Tugas Akhir (April 2023) sudah tidak berlaku karena bertentangan dengan peraturan yang lebih baru.",
    escalation:
      "Konfirmasikan ke staf prodi kalau perlu bukti hasil uji similaritas untuk pendaftaran sidang.",
    ...PEDOMAN_KTI,
  },

  {
    id: "penggunaan-ai",
    category: "Penulisan Ilmiah",
    title: "Ketentuan penggunaan AI dalam karya tulis ilmiah",
    questions: [
      "Bagaimana aturan penggunaan AI dalam skripsi?",
      "Apakah boleh pakai ChatGPT untuk tugas akhir?",
    ],
    followUps: [
      "Berapa batas maksimal similarity?",
      "Apa sanksi tindakan plagiat?",
      "Bagaimana cara menyatakan penggunaan AI?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Apakah boleh pakai ChatGPT untuk tugas akhir?",
      "Bagaimana cara menyatakan penggunaan AI?",
      "Apa sanksi tindakan plagiat?",
    ],
    keywords: ["ai", "chatgpt", "kecerdasan buatan", "parafrase", "quillbot", "logbook", "orisinalitas"],
    lead: "Karya tulis ilmiah di UPI boleh berbantuan AI dengan ketentuan berikut:",
    points: [
      "AI hanya sebagai alat bantu riset untuk masukan konsep; akurasinya tetap harus dari sumber dan referensi yang relevan.",
      "Penulis wajib menuliskan gagasannya dengan kalimat dan paragraf sendiri, dan dilarang menyalin langsung hasil AI.",
      "AI boleh dipakai untuk merancang kerangka atau outline, memperbaiki parafrase, serta membantu tata bahasa dan struktur kalimat.",
      "Jika AI memberikan referensi, penulis wajib memverifikasinya dan tidak mengutip langsung dari jawaban AI.",
      "Ide inti, argumen, analisis, dan kesimpulan harus hasil pemikiran penulis.",
      "Penulis wajib menyatakan penggunaan AI, dibuktikan dengan logbook berupa tangkapan layar pada semua bagian proses berbantuan AI, yang disertakan dalam lampiran.",
      "Karya tulis yang berbantuan AI maksimal 20%.",
      "Catatan: Peraturan Rektor Nomor 70 Tahun 2026 (lebih baru) mewajibkan pernyataan penggunaan Generative AI yang transparan (platform, tujuan, dan bagian yang memakainya) dan verifikasi hasil AI oleh mahasiswa; peraturan itu tidak menyebut angka persentase batas penggunaan AI.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan ketentuan uji similaritas yang berkaitan.",
    answer:
      "Karya tulis ilmiah di UPI dapat dibantu AI dengan ketentuan bahwa AI hanya menjadi alat bantu riset untuk masukan konsep, sementara akurasinya tetap harus berasal dari sumber dan referensi yang relevan. Penulis wajib menuliskan gagasannya dengan kalimat sendiri dan dilarang menyalin langsung hasil AI. AI boleh dipakai untuk merancang kerangka, memperbaiki parafrase, serta membantu tata bahasa dan struktur. Referensi yang diberikan AI wajib diverifikasi. Ide inti, argumen, analisis, dan kesimpulan harus merupakan hasil pemikiran penulis. Penulis wajib menyatakan penggunaan AI dengan melampirkan logbook berupa tangkapan layar pada semua bagian proses berbantuan AI, dan karya tulis yang berbantuan AI maksimal 20%. Catatan: Peraturan Rektor Nomor 70 Tahun 2026 (lebih baru) mewajibkan pernyataan penggunaan Generative AI yang transparan (platform, tujuan, dan bagian yang memakainya) dan verifikasi hasil AI oleh mahasiswa; peraturan itu tidak menyebut angka persentase batas penggunaan AI.",
    escalation:
      "Hubungi dosen pembimbing untuk memastikan bentuk pelaporan logbook penggunaan AI yang diterima.",
    ...PEDOMAN_KTI,
  },

  {
    id: "sanksi-plagiat",
    category: "Penulisan Ilmiah",
    title: "Sanksi tindakan plagiat",
    questions: [
      "Apa sanksi tindakan plagiat?",
      "Apa hukuman jika terbukti plagiarisme?",
    ],
    followUps: [
      "Berapa batas maksimal similarity?",
      "Bagaimana aturan penggunaan AI?",
      "Apa itu uji similaritas?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Apa hukuman jika terbukti plagiarisme?",
      "Berapa batas maksimal similarity?",
      "Bagaimana aturan penggunaan AI?",
    ],
    keywords: ["sanksi", "plagiat", "plagiarisme", "hukuman", "permendiknas", "teguran"],
    lead: "UPI merujuk pada Permendiknas Nomor 17 Tahun 2010 tentang Pencegahan dan Penanggulangan Plagiat di Perguruan Tinggi.",
    points: [
      "Sanksi bagi mahasiswa yang terbukti melakukan plagiat diatur dalam Pasal 12 Ayat 1 dan 2 peraturan tersebut.",
      "Bentuk sanksi antara lain dimulai dari teguran.",
      "Uji similaritas dilakukan untuk menghindari plagiarisme, meningkatkan orisinalitas, dan menjaga integritas akademik.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan batas kemiripan yang diizinkan.",
    answer:
      "UPI menindak pelanggaran plagiarisme dengan merujuk pada Permendiknas Nomor 17 Tahun 2010 tentang Pencegahan dan Penanggulangan Plagiat di Perguruan Tinggi, yang pada Pasal 12 Ayat 1 dan 2 mengatur sanksi bagi mahasiswa, dosen, peneliti, maupun tenaga kependidikan. Salah satu bentuk sanksi bagi mahasiswa adalah teguran. Uji similaritas dilakukan untuk menghindari plagiarisme, meningkatkan orisinalitas, dan menjaga integritas akademik.",
    escalation:
      "Hubungi Ketua Program Studi untuk rincian lengkap bentuk sanksi yang diatur dalam Permendiknas Nomor 17 Tahun 2010.",
    ...PEDOMAN_KTI,
  },

  {
    id: "pelatihan-kewirausahaan",
    category: "Administrasi",
    title: "Pelatihan kewirausahaan sebagai syarat ujian sidang",
    questions: [
      "Apakah pelatihan kewirausahaan wajib?",
      "Siapa yang harus mengikuti pelatihan kewirausahaan?",
    ],
    followUps: [
      "Apa saja persyaratan pendaftaran sidang?",
      "Semester berapa wajib mengikuti pelatihan?",
      "Siapa yang mengeluarkan ketentuan ini?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Siapa yang harus mengikuti pelatihan kewirausahaan?",
      "Semester berapa wajib mengikuti pelatihan?",
      "Apa saja persyaratan pendaftaran sidang?",
    ],
    keywords: ["kewirausahaan", "pelatihan", "wajib", "syarat sidang", "penyelesaian studi", "imbauan"],
    lead: "Berdasarkan Edaran Direktur Nomor 5572 Tahun 2025 tentang Pengaturan Pelaksanaan Program Wajib Mahasiswa Sarjana sebagai Syarat Ujian Sidang dan Penyelesaian Studi:",
    points: [
      "Seluruh mahasiswa program sarjana (S1) semester 3 dan 4 (Tingkat II) di lingkungan Kampus UPI Tasikmalaya diwajibkan mengikuti Program Pelatihan Intensif Kewirausahaan.",
      "Kewajiban ini juga berlaku bagi mahasiswa semester 5, 6, dan 7 (Tingkat III dan IV).",
      "Program ini merupakan syarat ujian sidang dan penyelesaian studi.",
      "Catatan: Peraturan Rektor Nomor 70 Tahun 2026 mensyaratkan lulusan sarjana memiliki paling sedikit 1 sertifikat kewirausahaan atau MOOC/Micro Credential dan 100 poin kegiatan ekstrakurikuler.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan persyaratan pendaftaran sidang lainnya.",
    answer:
      "Berdasarkan Edaran Direktur Nomor 5572 Tahun 2025 tentang Pengaturan Pelaksanaan Program Wajib Mahasiswa Sarjana sebagai Syarat Ujian Sidang dan Penyelesaian Studi, seluruh mahasiswa program sarjana semester 3 dan 4 (Tingkat II), serta mahasiswa semester 5, 6, dan 7 (Tingkat III dan IV) di lingkungan Kampus UPI Tasikmalaya diwajibkan mengikuti Program Pelatihan Intensif Kewirausahaan. Program ini menjadi syarat ujian sidang dan penyelesaian studi. Catatan: Peraturan Rektor Nomor 70 Tahun 2026 mensyaratkan lulusan sarjana memiliki paling sedikit 1 sertifikat kewirausahaan atau MOOC/Micro Credential dan 100 poin kegiatan ekstrakurikuler.",
    escalation:
      "Hubungi Wakil Direktur Bidang Pendidikan, Kemahasiswaan dan Penjaminan Mutu Kampus UPI Tasikmalaya untuk jadwal dan bukti keikutsertaan pelatihan.",
    ...SURAT_KEWIRAUSAHAAN,
  },
  {
    id: "kalender-registrasi",
    category: "Kalender Akademik",
    title: "Jadwal registrasi, verifikasi data, dan perubahan rencana studi 2026/2027",
    questions: [
      "Kapan jadwal registrasi semester ganjil 2026/2027?",
      "Kapan kuliah umum dan pra perkuliahan?",
      "Kapan masa perubahan rencana studi (PRS)?",
    ],
    followUps: [
      "Kapan batas pembayaran UKT mahasiswa lama?",
      "Kapan pengisian IRS dan perwalian?",
      "Kapan awal perkuliahan?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Kapan batas pembayaran UKT mahasiswa lama?",
      "Kapan kuliah umum dan pra perkuliahan?",
      "Kapan masa perubahan rencana studi?",
      "Kapan verifikasi data mahasiswa baru?",
      "Kapan pengisian IRS dan perwalian?",
    ],
    keywords: ["kalender akademik", "registrasi", "ukt", "pembayaran", "verifikasi data", "mahasiswa baru", "prs", "perubahan rencana studi", "kuliah umum", "pra perkuliahan"],
    lead: "Jadwal registrasi menurut Kalender Akademik UPI 2026/2027 (semester ganjil / genap):",
    points: [
      "Pembayaran UKT mahasiswa lama (D4, S1, S2, S3): 9 Juni–17 Juli 2026 / 25 Desember 2026–15 Januari 2027.",
      "Pembayaran UKT mahasiswa baru jalur SNBP: 20–30 April 2026; jalur SNBT: 22 Juni–10 Juli 2026; jalur Seleksi Mandiri (SM dan PI): 1–10 Juli 2026.",
      "Pembayaran mahasiswa baru S2 dan S3: 22–26 Juni 2026 / 11–16 Januari 2027.",
      "Verifikasi data mahasiswa baru: SNBP 30 Mei–3 Juni 2026; SNBT dan Pascasarjana 27–31 Juli 2026 / 18–22 Januari 2027; SM dan PI 20–24 Juli 2026.",
      "Pengisian IRS dan perwalian: 20 Juli–10 Agustus 2026 / 4–23 Januari 2027.",
      "Kuliah umum dan pra perkuliahan: 19–21 Agustus 2026 / 25–27 Januari 2027.",
      "Perubahan Rencana Studi (PRS): 31 Agustus–7 September 2026 / 8–13 Februari 2027.",
    ],
    table: {
      title: "Jadwal Registrasi Mahasiswa Lama",
      columns: ["KEGIATAN", "GANJIL 2026", "GENAP 2027"],
      rows: [
        ["Pembayaran UKT/biaya pendidikan", "9 Juni–17 Juli 2026", "25 Desember 2026–15 Januari 2027"],
        ["Pengisian IRS dan perwalian", "20 Juli–10 Agustus 2026", "4–23 Januari 2027"],
        ["Kuliah umum dan pra perkuliahan", "19–21 Agustus 2026", "25–27 Januari 2027"],
        ["Perubahan Rencana Studi (PRS)", "31 Agustus–7 September 2026", "8–13 Februari 2027"],
      ],
    },
    closing: "Kalau kamu mau, saya bisa jelaskan jadwal awal perkuliahan dan ujian.",
    answer:
      "Menurut Kalender Akademik UPI 2026/2027, pembayaran UKT mahasiswa lama berlangsung 9 Juni sampai 17 Juli 2026 untuk semester ganjil dan 25 Desember 2026 sampai 15 Januari 2027 untuk semester genap. Pengisian IRS dan perwalian berlangsung 20 Juli sampai 10 Agustus 2026 (ganjil) dan 4 sampai 23 Januari 2027 (genap). Kuliah umum dan pra perkuliahan berlangsung 19 sampai 21 Agustus 2026 (ganjil) dan 25 sampai 27 Januari 2027 (genap). Perubahan Rencana Studi berlangsung 31 Agustus sampai 7 September 2026 (ganjil) dan 8 sampai 13 Februari 2027 (genap). Kalender yang sama juga memuat jadwal pembayaran dan verifikasi data mahasiswa baru.",
    escalation:
      "Pastikan jadwal terbaru ke staf Program Studi Bisnis Digital atau petugas akademik.",
    ...KALENDER_UPI,
  },

  {
    id: "kalender-perkuliahan-ujian",
    category: "Kalender Akademik",
    title: "Jadwal awal dan akhir perkuliahan, UTS, UAS, dan pemasukan nilai 2026/2027",
    questions: [
      "Kapan awal perkuliahan semester ganjil 2026/2027?",
      "Kapan jadwal UTS dan UAS?",
      "Kapan ujian ulang dan remedial?",
      "Kapan akhir perkuliahan semester ini?",
    ],
    followUps: [
      "Kapan nilai UAS dimasukkan?",
      "Kapan jadwal registrasi?",
      "Kapan semester antara?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Kapan UTS semester genap?",
      "Kapan nilai UAS dimasukkan ke sistem?",
      "Kapan perkuliahan semester genap dimulai?",
      "Kapan nilai ujian ulang dimasukkan?",
      "Kapan akhir perkuliahan semester ganjil?",
    ],
    keywords: ["kalender akademik", "awal perkuliahan", "akhir perkuliahan", "uts", "uas", "ujian tengah semester", "ujian akhir semester", "ujian ulang", "remedial", "pemasukan nilai", "jadwal ujian"],
    lead: "Jadwal perkuliahan dan ujian menurut Kalender Akademik UPI 2026/2027 (semester ganjil / genap):",
    points: [
      "Awal perkuliahan: 24 Agustus 2026 / 25 Januari 2027.",
      "Akhir perkuliahan: 7 Desember 2026 / 10 Mei 2027.",
      "Ujian Tengah Semester (UTS): 12–16 Oktober 2026 / 15–19 Maret 2027.",
      "Ujian Akhir Semester (UAS): 10–24 Desember 2026 / 10–21 Mei 2027.",
      "Pemeriksaan dan pemasukan nilai UAS: 15–26 Desember 2026 / 13–25 Mei 2027.",
      "Remedial dan ujian ulang: 17–26 Desember 2026 / 15–25 Mei 2027.",
      "Pemasukan nilai hasil ujian ulang: 17–31 Desember 2026 / 15–28 Mei 2027.",
    ],
    table: {
      title: "Jadwal Perkuliahan dan Ujian",
      columns: ["KEGIATAN", "GANJIL 2026", "GENAP 2027"],
      rows: [
        ["Awal perkuliahan", "24 Agustus 2026", "25 Januari 2027"],
        ["UTS", "12–16 Oktober 2026", "15–19 Maret 2027"],
        ["Akhir perkuliahan", "7 Desember 2026", "10 Mei 2027"],
        ["UAS", "10–24 Desember 2026", "10–21 Mei 2027"],
        ["Pemasukan nilai UAS", "15–26 Desember 2026", "13–25 Mei 2027"],
        ["Remedial dan ujian ulang", "17–26 Desember 2026", "15–25 Mei 2027"],
        ["Pemasukan nilai ujian ulang", "17–31 Desember 2026", "15–28 Mei 2027"],
      ],
    },
    closing: "Kalau kamu mau, saya bisa jelaskan jadwal semester antara atau wisuda.",
    answer:
      "Menurut Kalender Akademik UPI 2026/2027, perkuliahan semester ganjil dimulai 24 Agustus 2026 dan berakhir 7 Desember 2026, sedangkan semester genap dimulai 25 Januari 2027 dan berakhir 10 Mei 2027. UTS berlangsung 12 sampai 16 Oktober 2026 (ganjil) dan 15 sampai 19 Maret 2027 (genap). UAS berlangsung 10 sampai 24 Desember 2026 (ganjil) dan 10 sampai 21 Mei 2027 (genap). Pemeriksaan dan pemasukan nilai UAS berlangsung 15 sampai 26 Desember 2026 dan 13 sampai 25 Mei 2027. Remedial dan ujian ulang berlangsung 17 sampai 26 Desember 2026 dan 15 sampai 25 Mei 2027, dengan pemasukan nilainya 17 sampai 31 Desember 2026 dan 15 sampai 28 Mei 2027.",
    escalation:
      "Pastikan jadwal ujian terbaru ke staf Program Studi Bisnis Digital atau petugas akademik.",
    ...KALENDER_UPI,
  },

  {
    id: "kalender-cuti-akademik",
    category: "Kalender Akademik",
    title: "Jadwal pengajuan cuti akademik menurut Kalender Akademik 2026/2027",
    questions: [
      "Kapan jadwal pengajuan cuti akademik di kalender akademik?",
      "Kenapa jadwal cuti di kalender akademik berbeda dengan surat edaran?",
      "Kapan pengajuan cuti akademik semester genap 2027?",
    ],
    followUps: [
      "Kapan batas akhir pengajuan cuti akademik semester ganjil 2026/2027?",
      "Kapan batas pembayaran UKT?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Kapan pengajuan cuti akademik semester genap?",
      "Kapan batas akhir pengajuan cuti akademik semester ganjil 2026/2027?",
      "Kapan batas pembayaran UKT?",
    ],
    keywords: ["kalender akademik", "cuti akademik", "cuti", "pengajuan cuti", "berbeda", "semester genap", "semester ganjil"],
    lead: "Menurut Kalender Akademik UPI 2026/2027, jadwal pengajuan cuti akademik adalah:",
    points: [
      "Semester ganjil: pengajuan 27 Juli–21 Agustus 2026.",
      "Semester genap: pengajuan 26 Juli–16 Agustus 2027.",
      "Kalender ini ditetapkan 7 Januari 2026. Untuk mahasiswa yang belum membayar UKT semester ganjil 2026/2027, Surat Edaran Nomor 68 Tahun 2026 (26 Agustus 2026) menetapkan batas akhir pengajuan cuti 16 November 2026. Karena lebih baru, surat edaran itu yang diikuti.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan batas akhir cuti menurut surat edaran terbaru.",
    answer:
      "Menurut Kalender Akademik UPI 2026/2027, pengajuan cuti akademik semester ganjil berlangsung 27 Juli sampai 21 Agustus 2026, dan semester genap 26 Juli sampai 16 Agustus 2027. Kalender ini ditetapkan 7 Januari 2026. Untuk mahasiswa yang belum membayar UKT semester ganjil 2026/2027, Surat Edaran Nomor 68 Tahun 2026 (26 Agustus 2026) menetapkan batas akhir pengajuan cuti 16 November 2026. Karena surat edaran itu lebih baru, itulah yang diikuti kalau ada perbedaan dengan kalender.",
    escalation:
      "Segera hubungi staf Program Studi Bisnis Digital atau petugas akademik untuk proses pengajuan cuti.",
    ...KALENDER_UPI,
  },

  {
    id: "kalender-semester-antara",
    category: "Kalender Akademik",
    title: "Jadwal semester antara (semester padat) 2026 dan 2027",
    questions: [
      "Kapan jadwal semester antara?",
      "Kapan pendaftaran semester padat?",
      "Kapan pembayaran uang kuliah semester antara?",
    ],
    followUps: [
      "Kapan awal dan akhir perkuliahan semester antara?",
      "Kapan ujian akhir semester antara?",
      "Kapan jadwal UAS semester ganjil?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Kapan pendaftaran semester antara?",
      "Kapan pembayaran uang kuliah semester antara?",
      "Kapan ujian akhir semester antara?",
      "Kapan awal perkuliahan semester antara?",
    ],
    keywords: ["semester antara", "semester padat", "pendaftaran", "uang kuliah", "kalender akademik", "isian rencana studi"],
    lead: "Jadwal Semester Antara/Padat menurut Kalender Akademik UPI 2026/2027 (tahun 2026 / tahun 2027):",
    points: [
      "Pendaftaran di Program Studi: 2–13 Mei 2026 / 23–30 April 2027.",
      "Penyerahan daftar peserta dari prodi ke Direktorat Keuangan: 15–22 Mei 2026 / 3–14 Mei 2027.",
      "Pembayaran uang kuliah: 1–15 Juni 2026 / 19–26 Mei 2027.",
      "Isian Rencana Studi (IRS): 18–25 Juni 2026 / 31 Mei–4 Juni 2027.",
      "Awal perkuliahan: 22 Juni 2026 / 7 Juni 2027.",
      "Akhir perkuliahan: 14 Agustus 2026 / 23 Juli 2027.",
      "Ujian akhir: 17–21 Agustus 2026 / 26–30 Juli 2027.",
      "Pemasukan nilai: 18–23 Agustus 2026 / 2–6 Agustus 2027.",
    ],
    table: {
      title: "Jadwal Semester Antara/Padat",
      columns: ["KEGIATAN", "TAHUN 2026", "TAHUN 2027"],
      rows: [
        ["Pendaftaran di Program Studi", "2–13 Mei 2026", "23–30 April 2027"],
        ["Pembayaran uang kuliah", "1–15 Juni 2026", "19–26 Mei 2027"],
        ["Isian Rencana Studi (IRS)", "18–25 Juni 2026", "31 Mei–4 Juni 2027"],
        ["Awal perkuliahan", "22 Juni 2026", "7 Juni 2027"],
        ["Akhir perkuliahan", "14 Agustus 2026", "23 Juli 2027"],
        ["Ujian akhir", "17–21 Agustus 2026", "26–30 Juli 2027"],
        ["Pemasukan nilai", "18–23 Agustus 2026", "2–6 Agustus 2027"],
      ],
    },
    closing: "Kalau kamu mau, saya bisa jelaskan jadwal perkuliahan dan ujian semester reguler.",
    answer:
      "Menurut Kalender Akademik UPI 2026/2027, pendaftaran Semester Antara/Padat di program studi berlangsung 2 sampai 13 Mei 2026 dan 23 sampai 30 April 2027. Prodi menyerahkan daftar peserta ke Direktorat Keuangan pada 15 sampai 22 Mei 2026 dan 3 sampai 14 Mei 2027. Pembayaran uang kuliah berlangsung 1 sampai 15 Juni 2026 dan 19 sampai 26 Mei 2027, lalu pengisian IRS pada 18 sampai 25 Juni 2026 dan 31 Mei sampai 4 Juni 2027. Perkuliahan berlangsung 22 Juni sampai 14 Agustus 2026 dan 7 Juni sampai 23 Juli 2027, dengan ujian akhir pada 17 sampai 21 Agustus 2026 dan 26 sampai 30 Juli 2027, serta pemasukan nilai pada 18 sampai 23 Agustus 2026 dan 2 sampai 6 Agustus 2027.",
    escalation:
      "Pastikan syarat dan jadwal terbaru ke staf Program Studi Bisnis Digital atau petugas akademik.",
    ...KALENDER_UPI,
  },

  {
    id: "kalender-wisuda-dies",
    category: "Kalender Akademik",
    title: "Jadwal wisuda lima gelombang dan Dies Natalis UPI 2026",
    questions: [
      "Kapan jadwal wisuda UPI tahun 2026?",
      "Kapan wisuda gelombang berikutnya?",
      "Kapan Dies Natalis UPI?",
    ],
    followUps: [
      "Berkas apa saja untuk pemberkasan wisuda?",
      "Kapan pengukuhan guru besar?",
      "Kapan jadwal sidang?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Kapan wisuda gelombang berikutnya?",
      "Kapan Dies Natalis UPI?",
      "Kapan pengukuhan guru besar?",
      "Berkas apa saja untuk pemberkasan wisuda?",
    ],
    keywords: ["jadwal wisuda", "gelombang", "wisuda", "dies natalis", "pengukuhan guru besar", "kalender akademik"],
    lead: "Jadwal wisuda, pengukuhan guru besar, dan Dies Natalis menurut Kalender Akademik UPI 2026/2027:",
    points: [
      "Wisuda Gelombang I: 10–11 Februari 2026.",
      "Wisuda Gelombang II: 12–13 Mei 2026.",
      "Wisuda Gelombang III: 14–15 Juli 2026.",
      "Wisuda Gelombang IV: 13–14 Oktober 2026.",
      "Wisuda Gelombang V: 8–9 Desember 2026.",
      "Pengukuhan Guru Besar: April, Juli, dan November 2026.",
      "Dies Natalis: 20 Oktober 2026.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan pemberkasan wisuda.",
    answer:
      "Menurut Kalender Akademik UPI 2026/2027, wisuda berlangsung dalam lima gelombang: Gelombang I pada 10 sampai 11 Februari 2026, Gelombang II pada 12 sampai 13 Mei 2026, Gelombang III pada 14 sampai 15 Juli 2026, Gelombang IV pada 13 sampai 14 Oktober 2026, dan Gelombang V pada 8 sampai 9 Desember 2026. Pengukuhan Guru Besar dilaksanakan pada April, Juli, dan November 2026, sedangkan Dies Natalis jatuh pada 20 Oktober 2026.",
    escalation:
      "Pastikan jadwal wisuda terbaru ke staf Program Studi Bisnis Digital atau petugas akademik.",
    ...KALENDER_UPI,
  },

  {
    id: "kalender-penerimaan-s1",
    category: "Kalender Akademik",
    title: "Jadwal penerimaan mahasiswa baru S1 (SNBP, SNBT, dan seleksi mandiri) 2026",
    questions: [
      "Kapan jadwal SNBP, SNBT, dan seleksi mandiri UPI 2026?",
      "Kapan pendaftaran SNBT UPI?",
      "Kapan pengumuman seleksi mandiri?",
    ],
    followUps: [
      "Kapan pembayaran UKT mahasiswa baru?",
      "Kapan jadwal registrasi?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Kapan pendaftaran SNBT UPI?",
      "Kapan pengumuman seleksi mandiri?",
      "Kapan pengumuman SNBP?",
      "Kapan UTBK dilaksanakan?",
    ],
    keywords: ["penerimaan mahasiswa baru", "snbp", "snbt", "utbk", "seleksi mandiri", "pdss", "pengumuman kelulusan", "kalender akademik"],
    lead: "Jadwal penerimaan mahasiswa baru jenjang S1 menurut Kalender Akademik UPI 2026/2027:",
    points: [
      "SNBP: pengisian PDSS 5 Januari–2 Februari 2026, pendaftaran 3–18 Februari 2026, pengumuman 31 Maret 2026.",
      "SNBT: pendaftaran 25 Maret–7 April 2026, UTBK 21–30 April 2026, pengumuman 25 Mei 2026.",
      "Seleksi Mandiri berdasarkan nilai UTBK SNBT: pendaftaran 26 Mei–19 Juni 2026, pengumuman 23 Juni 2026.",
      "Seleksi Mandiri Jalur Reguler (SM) dan Prestasi Istimewa (PI): pendaftaran 26 Mei–26 Juni 2026, UTBK 6–8 Juli 2026, ujian keterampilan dan/atau wawancara 9–12 Juli 2026, pengumuman 17 Juli 2026.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan jadwal pembayaran UKT mahasiswa baru.",
    answer:
      "Menurut Kalender Akademik UPI 2026/2027, SNBP memiliki pengisian PDSS 5 Januari sampai 2 Februari 2026, pendaftaran 3 sampai 18 Februari 2026, dan pengumuman 31 Maret 2026. SNBT memiliki pendaftaran 25 Maret sampai 7 April 2026, UTBK 21 sampai 30 April 2026, dan pengumuman 25 Mei 2026. Seleksi Mandiri berdasarkan nilai UTBK SNBT membuka pendaftaran 26 Mei sampai 19 Juni 2026 dengan pengumuman 23 Juni 2026. Seleksi Mandiri Jalur Reguler dan Prestasi Istimewa membuka pendaftaran 26 Mei sampai 26 Juni 2026, UTBK 6 sampai 8 Juli 2026, ujian keterampilan dan/atau wawancara 9 sampai 12 Juli 2026, dan pengumuman 17 Juli 2026.",
    escalation:
      "Pastikan jadwal penerimaan terbaru ke panitia penerimaan mahasiswa baru UPI.",
    ...KALENDER_UPI,
  },

  {
    id: "ukt-pembayaran-ganjil",
    category: "Administrasi",
    title: "Pembayaran UKT/BPP semester ganjil 2026/2027 bagi mahasiswa lama",
    questions: [
      "Kapan batas pembayaran UKT semester ganjil 2026/2027?",
      "Kapan pembayaran BPP mahasiswa lama?",
    ],
    followUps: [
      "Kapan pengisian IRS dan perwalian?",
      "Bagaimana kalau saya tidak membayar UKT?",
      "Kapan pengajuan cuti akademik?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Kapan pembayaran BPP mahasiswa lama?",
      "Kapan pengajuan cuti akademik?",
      "Kapan pengisian IRS dan perwalian?",
    ],
    keywords: ["ukt", "bpp", "pembayaran", "mahasiswa lama", "semester ganjil", "biaya pendidikan", "cuti akademik", "surat edaran 48"],
    lead: "Berdasarkan Surat Edaran Nomor 48 Tahun 2026 untuk semester ganjil tahun akademik 2026/2027:",
    points: [
      "Pembayaran UKT/BPP bagi mahasiswa lama berlangsung 9 Juni–17 Juli 2026.",
      "Pembayaran biaya dan pengajuan cuti akademik berlangsung 27 Juli–21 Agustus 2026.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan jadwal pengisian IRS dan perwalian.",
    answer:
      "Berdasarkan Surat Edaran Nomor 48 Tahun 2026, pembayaran UKT/BPP semester ganjil 2026/2027 bagi mahasiswa lama berlangsung 9 Juni sampai 17 Juli 2026. Pembayaran biaya dan pengajuan cuti akademik semester ganjil berlangsung 27 Juli sampai 21 Agustus 2026.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital atau petugas akademik untuk memastikan status pembayaran UKT.",
    ...EDARAN_48,
  },

  {
    id: "irs-perwalian-jadwal",
    category: "Administrasi",
    title: "Jadwal pengisian IRS dan perwalian daring per angkatan semester ganjil 2026/2027",
    questions: [
      "Kapan jadwal pengisian IRS dan perwalian untuk angkatan saya?",
      "Di mana mengisi IRS dan perwalian daring?",
      "Bagaimana kalau saya terlambat mengisi IRS?",
    ],
    followUps: [
      "Mata kuliah apa yang bisa dikontrak?",
      "Kapan masa Perubahan Rencana Studi?",
      "Kapan pembayaran UKT?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Di mana mengisi IRS dan perwalian daring?",
      "Bagaimana kalau saya terlambat mengisi IRS?",
      "Kapan masa Perubahan Rencana Studi?",
      "Mata kuliah apa yang bisa dikontrak?",
    ],
    keywords: ["irs", "isian rencana studi", "perwalian", "daring", "siakku", "dosen pa", "pembimbing akademik", "prs", "angkatan", "kontrak kuliah"],
    lead: "Berdasarkan Surat Edaran Nomor 48 Tahun 2026, pengisian IRS dan perwalian daring semester ganjil 2026/2027 berlangsung 20 Juli–10 Agustus 2026:",
    points: [
      "Mahasiswa mengisi IRS melalui portal SIAKKu di https://student.upi.edu/.",
      "Dosen Pembimbing Akademik (PA) melakukan perwalian melalui https://siak.upi.edu/perwalian/.",
      "Akun yang dipakai sama dengan akun SIAKKu untuk mahasiswa dan SInNDo untuk dosen PA.",
      "Yang belum punya akun internet mendaftar ke Direktorat Sistem Teknologi Informasi dan Pusat Data.",
      "Angkatan 2020/2021 dan 2021/2022: 20–26 Juli 2026.",
      "Angkatan 2022/2023 dan 2023/2024: 27 Juli–2 Agustus 2026.",
      "Angkatan 2024/2025, 2025/2026, dan 2026/2027: 3–10 Agustus 2026.",
      "Yang belum mengisi IRS sampai batas waktu wajib memperbaiki kontrak kuliah pada masa PRS, 31 Agustus–7 September 2026.",
      "Dosen PA yang belum menyetujui IRS dalam batas waktu wajib menyetujuinya pada masa PRS.",
    ],
    table: {
      title: "Masa IRS dan Perwalian per Angkatan",
      columns: ["ANGKATAN", "MASA IRS DAN PERWALIAN"],
      rows: [
        ["2020/2021 dan 2021/2022", "20–26 Juli 2026"],
        ["2022/2023 dan 2023/2024", "27 Juli–2 Agustus 2026"],
        ["2024/2025, 2025/2026, dan 2026/2027", "3–10 Agustus 2026"],
      ],
    },
    closing: "Kalau kamu mau, saya bisa jelaskan daftar mata kuliah yang bisa dikontrak.",
    answer:
      "Berdasarkan Surat Edaran Nomor 48 Tahun 2026, pengisian IRS dan perwalian daring semester ganjil 2026/2027 berlangsung 20 Juli sampai 10 Agustus 2026 dan dibagi per angkatan: angkatan 2020/2021 dan 2021/2022 pada 20 sampai 26 Juli 2026, angkatan 2022/2023 dan 2023/2024 pada 27 Juli sampai 2 Agustus 2026, serta angkatan 2024/2025, 2025/2026, dan 2026/2027 pada 3 sampai 10 Agustus 2026. Mahasiswa mengisi IRS melalui SIAKKu di https://student.upi.edu/, sedangkan dosen Pembimbing Akademik menyetujuinya melalui https://siak.upi.edu/perwalian/ dengan akun yang sama. Mahasiswa yang tidak mengisi IRS sampai batas waktu wajib memperbaiki kontrak kuliah pada masa Perubahan Rencana Studi, 31 Agustus sampai 7 September 2026.",
    escalation:
      "Hubungi dosen Pembimbing Akademik atau staf Program Studi Bisnis Digital kalau IRS belum disetujui.",
    ...EDARAN_48,
  },

  {
    id: "irs-prosedur-prodi",
    category: "Administrasi",
    title: "Ketentuan kontrak mata kuliah dan kelas gabungan pada IRS Prodi Bisnis Digital",
    questions: [
      "Bagaimana ketentuan kontrak mata kuliah di IRS Prodi Bisnis Digital?",
      "Bagaimana kontrak mata kuliah pendidikan agama non-Islam?",
      "Apa itu menu kelas gabungan?",
    ],
    followUps: [
      "Mata kuliah apa yang bisa dikontrak angkatan saya?",
      "Kapan jadwal IRS dan perwalian?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Apa itu menu kelas gabungan?",
      "Bagaimana kontrak mata kuliah pendidikan agama non-Islam?",
      "Kapan jadwal IRS dan perwalian?",
    ],
    keywords: ["irs", "kontrak mata kuliah", "mk", "kelas gabungan", "pendidikan agama", "dosen pa", "perwalian", "t-150"],
    lead: "Berdasarkan Pengumuman T-150 Program Studi Bisnis Digital tentang IRS dan perwalian daring:",
    points: [
      "Pengisian IRS dan perwalian daring dilaksanakan 20 Juli–10 Agustus 2026 melalui https://student.upi.edu/.",
      "Kontrak mata kuliah mengikuti daftar mata kuliah, tahun angkatan, dan kelas yang sudah ditetapkan.",
      "Pendidikan Agama Kristen, Katolik, Hindu, Buddha, dan Khonghucu dikontrak melalui menu \"Kelas Gabungan\".",
      "Dosen Pembimbing Akademik memeriksa kesesuaian mata kuliah yang dikontrak sebelum memberi persetujuan di https://siak.upi.edu/perwalian/.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan daftar mata kuliah per angkatan.",
    answer:
      "Berdasarkan Pengumuman T-150 Program Studi Bisnis Digital, IRS dan perwalian daring dilaksanakan 20 Juli sampai 10 Agustus 2026 melalui https://student.upi.edu/. Kontrak mata kuliah dilakukan sesuai daftar mata kuliah, tahun angkatan, dan kelas yang telah ditetapkan. Mata kuliah Pendidikan Agama Kristen, Katolik, Hindu, Buddha, dan Khonghucu dikontrak melalui menu Kelas Gabungan. Dosen Pembimbing Akademik memeriksa kembali kesesuaian mata kuliah yang dikontrak sebelum memberi persetujuan melalui https://siak.upi.edu/perwalian/.",
    escalation:
      "Hubungi Program Studi Bisnis Digital di bisnisdigital@upi.edu atau (0265) 331860 kalau mata kuliah tidak muncul di IRS.",
    ...PENGUMUMAN_T150,
  },

  {
    id: "mata-kuliah-ganjil-2026",
    category: "Administrasi",
    title: "Daftar mata kuliah semester ganjil 2026/2027 per angkatan Prodi Bisnis Digital",
    questions: [
      "Mata kuliah apa saja yang dikontrak semester ganjil 2026/2027?",
      "Berapa total SKS yang dikontrak angkatan saya?",
      "Mata kuliah apa untuk angkatan 2023?",
    ],
    followUps: [
      "Bagaimana cara mengontrak mata kuliah agama?",
      "Kapan jadwal IRS angkatan saya?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Mata kuliah apa untuk angkatan 2023?",
      "Berapa total SKS yang dikontrak angkatan saya?",
      "Bagaimana cara mengontrak mata kuliah agama?",
    ],
    keywords: ["mata kuliah", "mk", "sks", "angkatan", "semester ganjil", "daftar mata kuliah", "kontrak", "kurikulum", "irs", "skripsi"],
    lead: "Daftar mata kuliah yang dapat dikontrak pada IRS semester ganjil 2026/2027 (Pengumuman T-150, tertanggal 14 Juli 2026):",
    points: [
      "Angkatan 2026 (20 SKS): Manajemen Keuangan (BD112, 4), Kewirausahaan Digital (BD113, 4), Landasan Pendidikan (DK300, 2), Sistem Informasi Bisnis Digital (BD229, 4), Pendidikan Pancasila (KU110, 2), Olahraga dan Kebugaran (KU108, 2), serta satu mata kuliah Pendidikan Agama (2).",
      "Angkatan 2025 (23 SKS): Bahasa Inggris Bisnis (BD210, 4), Proyek Kreatif (TS403, 3), Merek Visual (BD220, 4), Sistem Basis Data (BD321, 4), Algoritma & Pemrograman (BD223, 4), Pemasaran Digital (BD231, 4).",
      "Angkatan 2024 (23 SKS): Penambangan Data (BD421, 4), Bahasa Inggris Bisnis (BD210, 3), Praktek Penulisan Naskah Periklanan (BD425, 4), Kecerdasan Buatan (BD422, 4), Metodologi Penelitian (BD432, 4), Riset Pasar dan Analisis Data (BD431, 4).",
      "Angkatan 2023 jalur skripsi (16 SKS): Strategi Bisnis (BD403, 3), Market Research (BD431, 3), Seminar Inisiasi Bisnis Digital (BD455, 4), Analisis dan Desain Sistem Informasi (BD411, 3), Visualisasi Data (BD444, 3).",
      "Angkatan 2023 jalur artikel dan TTG (22 SKS): kelima mata kuliah di atas ditambah Skripsi (BD598, 6) dan Ujian Sidang (BD599, 0).",
      "Angkatan 2020–2023 (6 SKS): Skripsi (BD598, 6) dan Ujian Sidang (BD599, 0).",
    ],
    table: {
      title: "Total SKS per Angkatan",
      columns: ["ANGKATAN", "TOTAL SKS"],
      rows: [
        ["2026", "20"],
        ["2025", "23"],
        ["2024", "23"],
        ["2023 jalur skripsi", "16"],
        ["2023 jalur artikel dan TTG", "22"],
        ["2020–2023", "6"],
      ],
    },
    closing: "Kalau kamu mau, saya bisa jelaskan cara kontrak mata kuliah agama di IRS.",
    answer:
      "Menurut Pengumuman T-150 tanggal 14 Juli 2026, mata kuliah yang dikontrak pada semester ganjil 2026/2027 berbeda tiap angkatan. Angkatan 2026 mengontrak 20 SKS: Manajemen Keuangan, Kewirausahaan Digital, Landasan Pendidikan, Sistem Informasi Bisnis Digital, Pendidikan Pancasila, Olahraga dan Kebugaran, dan satu mata kuliah Pendidikan Agama. Angkatan 2025 mengontrak 23 SKS: Bahasa Inggris Bisnis, Proyek Kreatif, Merek Visual, Sistem Basis Data, Algoritma & Pemrograman, dan Pemasaran Digital. Angkatan 2024 mengontrak 23 SKS: Penambangan Data, Bahasa Inggris Bisnis, Praktek Penulisan Naskah Periklanan, Kecerdasan Buatan, Metodologi Penelitian, dan Riset Pasar dan Analisis Data. Angkatan 2023 jalur skripsi mengontrak 16 SKS (Strategi Bisnis, Market Research, Seminar Inisiasi Bisnis Digital, Analisis dan Desain Sistem Informasi, Visualisasi Data), sedangkan jalur artikel dan TTG mengontrak 22 SKS karena ditambah Skripsi 6 SKS dan Ujian Sidang. Angkatan 2020 sampai 2023 mengontrak Skripsi dan Ujian Sidang, total 6 SKS.",
    escalation:
      "Hubungi dosen Pembimbing Akademik atau Program Studi Bisnis Digital di bisnisdigital@upi.edu untuk memastikan daftar mata kuliah angkatan kamu.",
    ...PENGUMUMAN_T150,
  },

  {
    id: "cuti-akademik-batas",
    category: "Administrasi",
    title: "Batas akhir pengajuan cuti akademik semester ganjil 2026/2027",
    questions: [
      "Kapan batas akhir pengajuan cuti akademik semester ganjil 2026/2027?",
      "Bagaimana kalau saya belum bayar UKT dan tidak mengajukan cuti?",
      "Apa yang terjadi kalau tidak mengajukan cuti akademik?",
    ],
    followUps: [
      "Kapan batas pembayaran UKT?",
      "Siapa yang boleh mengajukan cuti?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Bagaimana kalau saya belum bayar UKT dan tidak mengajukan cuti?",
      "Apa yang terjadi kalau tidak mengajukan cuti akademik?",
      "Kapan batas pembayaran UKT?",
    ],
    keywords: ["cuti akademik", "cuti", "batas akhir", "ukt", "mengundurkan diri", "status kemahasiswaan", "surat edaran 68", "masa studi"],
    lead: "Berdasarkan Surat Edaran Nomor 68 Tahun 2026 (ditetapkan 26 Agustus 2026):",
    points: [
      "Mahasiswa yang belum membayar UKT semester ganjil 2026/2027 dan masih memiliki hak cuti serta masa studi diimbau mengajukan cuti akademik paling lambat 16 November 2026.",
      "Kalau sampai tanggal itu tidak mengajukan cuti, statusnya dianggap mengundurkan diri.",
      "Dasarnya Peraturan Rektor Nomor 38 Tahun 2026 pasal 68 ayat (1): tidak melakukan registrasi administrasi dan akademik serta tidak mengajukan cuti sesuai ketentuan dapat menyebabkan pembatalan status kemahasiswaan.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan jadwal pembayaran UKT.",
    answer:
      "Berdasarkan Surat Edaran Nomor 68 Tahun 2026, mahasiswa yang belum membayar UKT semester ganjil 2026/2027 dan masih memiliki hak cuti serta masa studi diimbau mengajukan cuti akademik paling lambat 16 November 2026. Kalau sampai tanggal itu tidak mengajukan cuti, statusnya dianggap mengundurkan diri. Ketentuan ini merujuk Peraturan Rektor Nomor 38 Tahun 2026 pasal 68 ayat (1), yang menyebut bahwa tidak melakukan registrasi administrasi dan akademik serta tidak mengajukan cuti akademik sesuai ketentuan dapat menyebabkan pembatalan status kemahasiswaan.",
    escalation:
      "Segera hubungi staf Program Studi Bisnis Digital atau petugas akademik untuk proses pengajuan cuti.",
    ...EDARAN_68,
  },

  {
    id: "ta-artikel-ttg-angkatan-2023",
    category: "Tugas Akhir",
    title: "Pengajuan dosen pembimbing tugas akhir jalur artikel ilmiah dan TTG angkatan 2023",
    questions: [
      "Bagaimana mengajukan dosen pembimbing tugas akhir angkatan 2023?",
      "Kapan periode pengajuan dosen pembimbing angkatan 2023?",
      "Berapa lama surat keterangan calon dosen pembimbing berlaku?",
    ],
    followUps: [
      "Apa isi draf yang harus disiapkan?",
      "Bagaimana kalau tidak ada kesepakatan dengan calon pembimbing?",
      "Bagaimana mendapatkan buku bimbingan?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Kapan periode pengajuan dosen pembimbing angkatan 2023?",
      "Berapa lama surat keterangan calon dosen pembimbing berlaku?",
      "Bagaimana mendapatkan buku bimbingan?",
      "Draf apa yang harus disiapkan untuk jalur artikel?",
    ],
    keywords: ["pengajuan pembimbing", "angkatan 2023", "surat keterangan", "buku bimbingan", "periode pengajuan", "dosen pa"],
    lead: "Berdasarkan Pengumuman T-45 (23 Februari 2026) untuk mahasiswa Prodi Bisnis Digital angkatan 2023:",
    points: [
      "Periode pengajuan: Periode I 2–31 Maret 2026 dan Periode II 1–31 Juli 2026.",
      "Mahasiswa wajib berkonsultasi dengan Dosen PA dan menyiapkan draf sesuai jalur.",
      "Draf jalur artikel memuat tema, latar belakang, rumusan masalah, tujuan dan manfaat, metodologi, nama jurnal yang dituju, dan daftar referensi.",
      "Draf jalur TTG memuat tema, analisis situasi, manfaat produk, unsur kebaruan, langkah pengembangan, sasaran pengguna, dan daftar referensi.",
      "Draf yang disetujui Dosen PA diajukan untuk Surat Keterangan Calon Dosen Pembimbing dari Ketua Prodi melalui https://forms.gle/c6KWapSm2uJDCEnb9.",
      "Surat Keterangan berlaku 14 hari kerja; dalam waktu itu mahasiswa dan calon pembimbing menyepakati kelanjutan rencana penulisan.",
      "Kalau sepakat, ajukan SK Direktur tentang Dosen Pembimbing melalui https://forms.gle/Ky1YPstjhBuE22xr6; kalau tidak sepakat, ajukan ulang calon pembimbing.",
      "Selama bimbingan mahasiswa wajib membawa Buku Bimbingan, yang diperoleh dengan menyerahkan salinan SK Direktur ke Bagian Pendidikan dan Kemahasiswaan.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan ketentuan umum artikel ilmiah.",
    answer:
      "Berdasarkan Pengumuman T-45 tanggal 23 Februari 2026, mahasiswa angkatan 2023 mengajukan dosen pembimbing jalur Artikel Ilmiah atau TTG pada dua periode, yaitu 2 sampai 31 Maret 2026 dan 1 sampai 31 Juli 2026. Sebelum mengajukan, mahasiswa berkonsultasi dengan Dosen PA dan menyiapkan draf sesuai jalur. Draf yang disetujui diajukan untuk Surat Keterangan Calon Dosen Pembimbing dari Ketua Program Studi melalui formulir yang disediakan. Surat itu berlaku 14 hari kerja, dan dalam waktu tersebut mahasiswa serta calon pembimbing menyepakati kelanjutan rencana penulisan. Kalau sepakat, mahasiswa mengajukan SK Direktur tentang Dosen Pembimbing; kalau tidak, mahasiswa dapat mengajukan calon pembimbing lagi. Selama bimbingan, mahasiswa wajib membawa Buku Bimbingan yang diperoleh dengan menyerahkan salinan SK Direktur ke Bagian Pendidikan dan Kemahasiswaan.",
    escalation:
      "Hubungi Program Studi Bisnis Digital di bisnisdigital@upi.edu atau (0265) 331860 untuk kepastian periode dan tautan pengajuan.",
    ...PENGUMUMAN_T45,
  },

  {
    id: "msib-laporan-akhir",
    category: "Administrasi",
    title: "Laporan akhir MSIB Mandiri Prodi Bisnis Digital angkatan 2022",
    questions: [
      "Apa saja yang harus dikumpulkan setelah selesai MSIB?",
      "Bagaimana ketentuan laporan MSIB Mandiri?",
      "Apa kewajiban mahasiswa yang ikut magang MSIB?",
    ],
    followUps: [
      "Bagaimana ketentuan dokumen PKS dan IA?",
      "Apa kewajiban peserta magang setelah MSIB?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Bagaimana ketentuan dokumen PKS dan IA?",
      "Apa kewajiban peserta magang setelah MSIB?",
      "Bagaimana penilaian mentor MSIB?",
    ],
    keywords: ["msib", "magang", "studi independen", "laporan msib", "logbook", "pks", "ia", "implementation of agreement", "penilaian mentor", "angkatan 2022"],
    lead: "Berdasarkan Surat Edaran Nomor 092 Tahun 2025 untuk mahasiswa Prodi Bisnis Digital angkatan 2022 (berlaku untuk MSIB Batch 8):",
    points: [
      "Mahasiswa melaksanakan MSIB di tempat yang sudah ditentukan dan melaporkan progres secara berkala kepada Dosen Pembimbing.",
      "Dokumen akhir diunggah ke folder Dosen Pembimbing masing-masing dengan format Nama_NIM.",
      "Dokumen yang diunggah: Laporan MSIB, Logbook, penilaian mentor (magang atau studi independen), serta dokumen PKS dan IA.",
      "PKS dan IA dibuat rapi sesuai format; satu perusahaan dengan beberapa mahasiswa cukup satu PKS dan satu IA.",
      "PKS dan IA dibuat dua rangkap, ditandatangani, dicap, dan dibubuhi materai; bagian yang disesuaikan ditandai highlight kuning.",
      "Dokumen laporan PKS dan IA dibuat dua rangkap, ditandatangani, dan dicap.",
      "Mahasiswa magang wajib menyiapkan PPT untuk presentasi ujian magang dan membuat collaboration content dengan Instagram @digitalbusiness.upi tentang aktivitas magang.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan ketentuan dokumen PKS dan IA.",
    answer:
      "Berdasarkan Surat Edaran Nomor 092 Tahun 2025 untuk mahasiswa angkatan 2022, mahasiswa melaksanakan MSIB di tempat yang sudah ditentukan dan melaporkan progres secara berkala kepada Dosen Pembimbing. Dokumen akhir diunggah ke folder Dosen Pembimbing masing-masing dengan format Nama_NIM, terdiri dari Laporan MSIB, Logbook, penilaian mentor, serta dokumen Perjanjian Kerjasama (PKS) dan Implementation of Agreement (IA). PKS dan IA dibuat rapi sesuai format, cukup satu set per perusahaan kalau ada beberapa mahasiswa, dibuat dua rangkap, ditandatangani, dicap, dan dibubuhi materai. Dokumen laporan PKS dan IA juga dibuat dua rangkap, ditandatangani, dan dicap. Mahasiswa yang mengikuti magang wajib menyiapkan PPT presentasi ujian magang dan membuat collaboration content dengan Instagram @digitalbusiness.upi.",
    escalation:
      "Hubungi Dosen Pembimbing MSIB atau Program Studi Bisnis Digital di bisnisdigital@upi.edu untuk tautan format dan jadwal terbaru.",
    ...EDARAN_MSIB,
  },

  {
    id: "scopus-akses",
    category: "Penulisan Ilmiah",
    title: "Akses Scopus dan Scopus AI untuk sivitas akademika UPI",
    questions: [
      "Apakah mahasiswa UPI bisa mengakses Scopus?",
      "Bagaimana cara mengakses Scopus dan Scopus AI?",
    ],
    followUps: [
      "Bagaimana cara mencari jurnal untuk artikel tugas akhir?",
      "Berapa minimal referensi dari artikel jurnal?",
      "Siapa yang harus saya hubungi?",
    ],
    hints: [
      "Bagaimana cara mencari jurnal untuk artikel tugas akhir?",
      "Berapa minimal referensi dari artikel jurnal?",
      "Apakah mahasiswa UPI bisa mengakses Scopus AI?",
    ],
    keywords: ["scopus", "scopus ai", "database jurnal", "sitasi", "riset", "publikasi", "akses", "poster", "qr code"],
    lead: "Berdasarkan pengumuman untuk sivitas akademika UPI:",
    points: [
      "Scopus dan Scopus AI sudah dapat diakses oleh seluruh sivitas akademika UPI.",
      "Layanan ini membantu dosen, mahasiswa, dan peneliti mengakses database abstrak dan sitasi global secara lebih komprehensif.",
      "Panduan tata cara akses ada di tautan https://view.highspot.com/viewer/46dc272ae0513703d8da5907a160e3db atau lewat QR Code pada poster pengumuman.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan ketentuan referensi artikel jurnal pada tugas akhir.",
    answer:
      "Berdasarkan pengumuman untuk sivitas akademika UPI, Scopus dan Scopus AI sudah dapat diakses oleh seluruh sivitas akademika UPI, termasuk dosen, mahasiswa, dan peneliti. Layanan ini memberi akses ke database abstrak dan sitasi global secara lebih komprehensif. Panduan lengkap tata cara akses tersedia di https://view.highspot.com/viewer/46dc272ae0513703d8da5907a160e3db atau melalui QR Code pada poster pengumuman.",
    escalation:
      "Hubungi perpustakaan atau unit layanan informasi UPI kalau akses Scopus bermasalah.",
    ...INFO_SCOPUS,
  },

  {
    id: "perrek-syarat-ambil-ta",
    category: "Tugas Akhir",
    title: "Syarat mengambil tugas akhir dan mengajukan proposal (Peraturan Rektor 70/2026)",
    questions: ["Apa syarat mengambil tugas akhir menurut Peraturan Rektor?", "Kapan paling cepat mengajukan proposal tugas akhir?"],
    followUps: ["Apa saja isi proposal tugas akhir?", "Bagaimana proposal dinilai?"],
    hints: ["Kapan paling cepat mengajukan proposal tugas akhir?", "Berapa persen SKS untuk mengambil tugas akhir?"],
    keywords: ["peraturan rektor", "60% beban studi", "proposal paling cepat semester 6", "aturan rektor tugas akhir"],
    lead: "Menurut Peraturan Rektor Nomor 70 Tahun 2026, syarat mengambil tugas akhir untuk program sarjana:",
    points: [
      "Sudah menempuh paling sedikit 60% dari total beban studi kurikulum.",
      "Sudah lulus mata kuliah prasyarat yang relevan, baik metodologi penelitian maupun bidang atau tema tugas akhir.",
      "Terdaftar sebagai mahasiswa aktif, tidak sedang cuti, sudah registrasi semester berjalan, dan mengontrak mata kuliah tugas akhir.",
      "Proposal tugas akhir paling cepat diajukan pada semester 6.",
      "Program studi boleh menetapkan ketentuan yang lebih spesifik, selama tidak menurunkan standar minimum UPI.",
    ],
    closing: "Kalau mau, saya jelaskan isi proposal dan cara penilaiannya.",
    answer:
      "Menurut Peraturan Rektor Nomor 70 Tahun 2026, mahasiswa program sarjana dapat mengambil tugas akhir setelah menempuh paling sedikit 60% dari total beban studi kurikulum, lulus mata kuliah prasyarat yang relevan (metodologi penelitian dan bidang atau tema tugas akhir), terdaftar aktif dan tidak cuti, sudah registrasi, serta mengontrak mata kuliah tugas akhir. Proposal paling cepat diajukan pada semester 6. Program studi boleh menetapkan syarat yang lebih spesifik selama tidak menurunkan standar minimum UPI.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital kalau ada ketentuan teknis yang belum jelas.",
    ...PERREK_70,
  },

  {
    id: "perrek-proposal",
    category: "Tugas Akhir",
    title: "Isi dan penilaian proposal tugas akhir (Peraturan Rektor 70/2026)",
    questions: ["Apa saja isi proposal tugas akhir menurut Peraturan Rektor?", "Bagaimana hasil penilaian proposal tugas akhir?"],
    followUps: ["Berapa lama perbaikan proposal?", "Apakah perbaikan proposal harus seminar ulang?"],
    hints: ["Berapa lama perbaikan proposal setelah seminar?", "Berapa penelaah di seminar proposal?"],
    keywords: ["peraturan rektor", "penelaah proposal", "hasil penilaian proposal", "perbaikan proposal"],
    lead: "Isi dan penilaian proposal tugas akhir menurut Peraturan Rektor Nomor 70 Tahun 2026:",
    points: [
      "Proposal paling sedikit memuat judul atau tema, latar belakang dan rumusan masalah, tujuan dan manfaat, kajian pustaka, metode, serta rencana jadwal kegiatan.",
      "Proposal dinilai lewat seminar dan/atau penelaahan oleh 2 sampai 4 penelaah untuk program sarjana, yang ditetapkan program studi.",
      "Hasilnya salah satu dari: diterima tanpa perbaikan, diterima dengan perbaikan minor, diterima dengan perbaikan mayor, atau ditolak.",
      "Perbaikan minor atau mayor wajib selesai paling lambat 10 hari kalender sejak hasil ditetapkan, diverifikasi prodi tanpa seminar proposal ulang.",
      "Proposal yang ditolak diperbaiki sesuai rekomendasi penelaah dan diajukan lagi untuk seminar atau penelaahan ulang.",
    ],
    closing: "Mau saya jelaskan juga soal pembimbing tugas akhir?",
    answer:
      "Menurut Peraturan Rektor Nomor 70 Tahun 2026, proposal tugas akhir memuat judul atau tema, latar belakang dan rumusan masalah, tujuan dan manfaat, kajian pustaka, metode, dan jadwal kegiatan. Proposal dinilai oleh 2 sampai 4 penelaah untuk program sarjana. Hasilnya diterima tanpa perbaikan, diterima dengan perbaikan minor atau mayor, atau ditolak. Perbaikan minor atau mayor harus selesai paling lambat 10 hari kalender tanpa seminar ulang, sedangkan proposal yang ditolak diajukan ulang.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital kalau ada ketentuan teknis yang belum jelas.",
    ...PERREK_70,
  },

  {
    id: "perrek-pembimbing",
    category: "Tugas Akhir",
    title: "Pembimbing tugas akhir dan bimbingan (Peraturan Rektor 70/2026)",
    questions: ["Berapa pembimbing tugas akhir menurut Peraturan Rektor?", "Berapa kali minimal bimbingan tugas akhir dalam satu semester?"],
    followUps: ["Kapan pembimbing bisa diganti?", "Siapa yang menetapkan pembimbing?"],
    hints: ["Berapa kali minimal bimbingan dalam satu semester?", "Kapan pembimbing bisa diganti?"],
    keywords: ["peraturan rektor", "bimbingan minimal 8 kali", "kualifikasi pembimbing", "penggantian pembimbing"],
    lead: "Ketentuan pembimbing tugas akhir program sarjana menurut Peraturan Rektor Nomor 70 Tahun 2026:",
    points: [
      "Jumlah pembimbing paling sedikit 1 orang dan paling banyak 2 orang.",
      "Pembimbing minimal berkualifikasi magister atau berjabatan akademik Lektor Kepala.",
      "Pembimbing ditetapkan lewat Keputusan Dekan atau Direktur Kampus UPI di Daerah; prodi boleh mempertimbangkan usulan mahasiswa dan kesediaan dosen.",
      "Bimbingan paling sedikit 8 kali dalam setiap semester, terdokumentasi, dan kemajuan dilaporkan lewat sistem informasi UPI.",
      "Pembimbing dapat diganti, misalnya karena berhalangan tetap, bidang tugas akhir berubah, atau ada konflik kepentingan; usulan disampaikan ke prodi disertai alasan.",
      "Hasil bimbingan sebelumnya tidak hilang ketika pembimbing diganti.",
    ],
    closing: "Kalau mau, saya jelaskan syarat mengikuti ujian sidang.",
    answer:
      "Menurut Peraturan Rektor Nomor 70 Tahun 2026, tugas akhir program sarjana dibimbing 1 sampai 2 dosen yang minimal bergelar magister atau berjabatan Lektor Kepala, ditetapkan lewat Keputusan Dekan atau Direktur Kampus UPI di Daerah. Bimbingan dilakukan paling sedikit 8 kali setiap semester dan didokumentasikan. Pembimbing dapat diganti atas alasan yang sah, seperti berhalangan tetap, perubahan bidang tugas akhir, atau konflik kepentingan.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital kalau ada ketentuan teknis yang belum jelas.",
    ...PERREK_70,
  },

  {
    id: "perrek-syarat-sidang",
    category: "Tugas Akhir",
    title: "Syarat mengikuti ujian sidang tugas akhir (Peraturan Rektor 70/2026)",
    questions: ["Apa syarat mengikuti ujian sidang menurut Peraturan Rektor?", "Bagaimana mengajukan ujian sidang tugas akhir?"],
    followUps: ["Berapa batas similaritas untuk sidang?", "Berapa penguji ujian sidang?"],
    hints: ["Apa saja syarat sidang menurut Peraturan Rektor 70/2026?", "Siapa yang menetapkan jadwal ujian sidang?"],
    keywords: ["peraturan rektor", "aturan rektor sidang", "sidang menurut peraturan rektor"],
    lead: "Syarat dan pengajuan ujian sidang tugas akhir menurut Peraturan Rektor Nomor 70 Tahun 2026:",
    points: [
      "Akademik: tugas akhir dinyatakan layak oleh pembimbing, bimbingan sudah terpenuhi, kelengkapan produk terpenuhi, integritas akademik terpenuhi, dan publikasi ilmiah terpenuhi bila dipersyaratkan.",
      "Administratif: mahasiswa aktif dan tidak cuti, sudah registrasi, serta mengontrak mata kuliah tugas akhir pada semester berjalan.",
      "Pengajuan lewat SIAS atau sistem informasi yang ditetapkan UPI, dengan persetujuan pembimbing, bukti bimbingan, bukti integritas akademik, bukti publikasi, dan dokumen administratif.",
      "Prodi memverifikasi kelengkapan; mahasiswa yang belum memenuhi syarat belum bisa ditetapkan mengikuti sidang.",
      "Pelaksanaan sidang ditetapkan oleh Direktur Kampus UPI di Daerah, memuat waktu, tempat atau moda, tim penguji, dan pimpinan sidang.",
    ],
    closing: "Mau saya jelaskan batas similaritas dan aturan penggunaan AI sebelum sidang?",
    answer:
      "Menurut Peraturan Rektor Nomor 70 Tahun 2026, mahasiswa bisa mengikuti ujian sidang setelah tugas akhirnya dinyatakan layak oleh pembimbing, bimbingan terpenuhi, kelengkapan produk dan integritas akademik terpenuhi, serta publikasi ilmiah terpenuhi bila dipersyaratkan. Mahasiswa juga harus aktif, tidak cuti, sudah registrasi, dan mengontrak mata kuliah tugas akhir. Pengajuan lewat SIAS dan diverifikasi prodi, lalu pelaksanaan sidang ditetapkan Direktur Kampus UPI di Daerah.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital kalau ada ketentuan teknis yang belum jelas.",
    ...PERREK_70,
  },

  {
    id: "perrek-similaritas-ai",
    category: "Tugas Akhir",
    title: "Batas similaritas dan penggunaan Generative AI sebelum sidang (Peraturan Rektor 70/2026)",
    questions: ["Berapa batas similaritas untuk ujian sidang menurut Peraturan Rektor?", "Bagaimana aturan penggunaan AI di tugas akhir menurut Peraturan Rektor?"],
    followUps: ["Apa yang harus dicantumkan kalau pakai AI?", "Apa yang terjadi kalau similaritas di atas 25%?"],
    hints: ["Berapa batas similaritas untuk sidang?", "Apa yang wajib dicantumkan kalau memakai AI?"],
    keywords: ["peraturan rektor", "batas similaritas", "generative ai", "pernyataan penggunaan ai"],
    lead: "Ketentuan similaritas dan Generative AI untuk tugas akhir karya tulis ilmiah menurut Peraturan Rektor Nomor 70 Tahun 2026:",
    points: [
      "Wajib lolos uji similaritas dan pemeriksaan penggunaan Generative AI sebelum diajukan ke ujian sidang.",
      "Kemiripan paling tinggi 25% agar boleh diajukan ke ujian sidang.",
      "Kemiripan di atas 25% sampai 40%: wajib memperbaiki bagian yang mirip sebelum diajukan.",
      "Kemiripan di atas 40%: wajib diperbaiki menyeluruh dan belum bisa diajukan.",
      "Penggunaan Generative AI wajib dinyatakan dan didokumentasikan: nama atau jenis platform, tujuan dan bentuk penggunaan, serta bagian tugas akhir yang memakainya.",
      "Hasil AI wajib diverifikasi mahasiswa, dan AI dilarang dipakai untuk plagiarisme, fabrikasi, falsifikasi, manipulasi data atau sitasi, atau menggantikan kontribusi intelektual mahasiswa.",
      "Hasil deteksi AI hanya bukti pendukung, bukan satu-satunya dasar menyatakan pelanggaran.",
    ],
    closing: "Mau saya jelaskan syarat sidang secara lengkap?",
    answer:
      "Menurut Peraturan Rektor Nomor 70 Tahun 2026, karya tulis ilmiah wajib lolos uji similaritas dan pemeriksaan penggunaan Generative AI sebelum sidang. Kemiripan paling tinggi 25% boleh diajukan; di atas 25% sampai 40% wajib memperbaiki bagian yang mirip; di atas 40% wajib diperbaiki menyeluruh dan tidak bisa diajukan. Penggunaan Generative AI wajib dinyatakan dan didokumentasikan (platform, tujuan, dan bagian yang memakainya), dan hasilnya wajib diverifikasi mahasiswa. Aturan ini lebih baru dari batas Turnitin 35% di Buku Panduan April 2023.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital kalau ada ketentuan teknis yang belum jelas.",
    ...PERREK_70,
  },

  {
    id: "perrek-sidang-hasil",
    category: "Tugas Akhir",
    title: "Pelaksanaan, hasil, dan ujian ulang sidang tugas akhir (Peraturan Rektor 70/2026)",
    questions: ["Berapa penguji ujian sidang menurut Peraturan Rektor?", "Apa saja hasil ujian sidang dan bagaimana ujian ulang?"],
    followUps: ["Berapa kali boleh ujian ulang?", "Bagaimana kalau tidak setuju dengan hasil sidang?"],
    hints: ["Berapa kali boleh ujian sidang ulang?", "Bagaimana mengajukan keberatan atas hasil sidang?"],
    keywords: ["peraturan rektor", "sidang ulang", "jumlah penguji sidang", "keberatan hasil sidang"],
    lead: "Pelaksanaan dan hasil ujian sidang program sarjana menurut Peraturan Rektor Nomor 70 Tahun 2026:",
    points: [
      "Tim penguji paling sedikit 3 orang, boleh ditambah 1 orang untuk tugas akhir berupa produk, prototipe, proyek, atau portofolio.",
      "Ujian sidang program sarjana dilaksanakan secara tertutup; pimpinan sidang tidak berasal dari pembimbing.",
      "Mahasiswa wajib mempresentasikan tugas akhir, lalu menjalani tanya jawab dan pengujian.",
      "Hasilnya: lulus tanpa perbaikan, lulus dengan perbaikan minor, perbaikan mayor dan ujian ulang, atau tidak lulus.",
      "Yang tidak lulus atau perbaikan mayor boleh ujian ulang paling banyak 1 kali, paling cepat 14 hari dan paling lambat 30 hari kalender setelah sidang sebelumnya.",
      "Mahasiswa yang tidak menyelesaikan perbaikan dalam batas waktu tidak dapat pengesahan tugas akhir, mengikuti yudisium, atau ditetapkan lulus.",
      "Keberatan atas proses atau hasil diajukan tertulis ke Ketua Program Studi paling lambat 7 hari kerja sejak hasil diketahui.",
    ],
    closing: "Mau saya jelaskan syarat kelulusan setelah sidang?",
    answer:
      "Menurut Peraturan Rektor Nomor 70 Tahun 2026, ujian sidang program sarjana diuji paling sedikit 3 penguji dan dilaksanakan tertutup. Hasilnya lulus tanpa perbaikan, lulus dengan perbaikan minor, perbaikan mayor dan ujian ulang, atau tidak lulus. Ujian ulang paling banyak 1 kali, paling cepat 14 hari dan paling lambat 30 hari kalender setelah sidang sebelumnya. Mahasiswa yang belum menyelesaikan perbaikan tidak dapat pengesahan, yudisium, atau ditetapkan lulus. Keberatan diajukan tertulis ke Ketua Program Studi paling lambat 7 hari kerja.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital kalau ada ketentuan teknis yang belum jelas.",
    ...PERREK_70,
  },

  {
    id: "perrek-syarat-kelulusan",
    category: "Kelulusan",
    title: "Syarat kelulusan program sarjana dan yudisium (Peraturan Rektor 70/2026)",
    questions: ["Apa syarat kelulusan S1 menurut Peraturan Rektor?", "Apa syarat mengikuti yudisium?"],
    followUps: ["Berapa poin ekstrakurikuler untuk lulus?", "Apa syarat publikasi untuk lulus?"],
    hints: ["Berapa poin ekstrakurikuler untuk lulus?", "Apakah wajib sertifikat kewirausahaan untuk lulus?"],
    keywords: ["peraturan rektor", "poin ekstrakurikuler", "sertifikat kewirausahaan", "yudisium"],
    lead: "Syarat kelulusan program sarjana menurut Peraturan Rektor Nomor 70 Tahun 2026:",
    points: [
      "Akademik: seluruh beban studi selesai, tugas akhir lulus ujian sidang, memenuhi syarat nilai atau IPK kelulusan, dan tidak melebihi masa studi.",
      "Kompetensi: sertifikat kemampuan bahasa Inggris atau bahasa asing lain dengan skor minimal dari Keputusan Rektor, dan paling sedikit 1 sertifikat kompetensi.",
      "Publikasi ilmiah: antologi ilmiah, atau artikel ilmiah yang sudah mendapat LoA bagi yang memilih tugas akhir bentuk artikel ilmiah.",
      "Pengembangan diri: paling sedikit 100 poin kegiatan ekstrakurikuler dan 1 sertifikat kewirausahaan atau MOOC/Micro Credential.",
      "Administratif: surat keterangan bebas pustaka di SIAS dan persyaratan administratif lain.",
      "Yudisium menetapkan kelulusan lewat Keputusan Dekan atau Direktur Kampus UPI di Daerah setelah perbaikan disahkan dan semua syarat terpenuhi.",
      "Tugas akhir yang lulus diunggah ke Repositori UPI, dan lulusan bisa mengikuti wisuda.",
    ],
    closing: "Mau saya jelaskan predikat kelulusan (cum laude)?",
    answer:
      "Menurut Peraturan Rektor Nomor 70 Tahun 2026, syarat kelulusan program sarjana meliputi: menyelesaikan seluruh beban studi dan lulus ujian sidang tugas akhir, tidak melebihi masa studi, sertifikat bahasa Inggris atau bahasa asing dan paling sedikit 1 sertifikat kompetensi, publikasi ilmiah (antologi atau artikel ber-LoA bagi tugas akhir bentuk artikel), paling sedikit 100 poin ekstrakurikuler dan 1 sertifikat kewirausahaan atau MOOC/Micro Credential, serta surat keterangan bebas pustaka di SIAS. Kelulusan ditetapkan lewat yudisium.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital kalau ada ketentuan teknis yang belum jelas.",
    ...PERREK_70,
  },

  {
    id: "perrek-predikat-kelulusan",
    category: "Kelulusan",
    title: "Predikat kelulusan program sarjana (Peraturan Rektor 70/2026)",
    questions: ["Apa syarat predikat cum laude S1 menurut Peraturan Rektor?", "Apa syarat summa cum laude?"],
    followUps: ["Apa syarat publikasi untuk cum laude?", "Bagaimana kalau tidak memenuhi syarat cum laude?"],
    hints: ["Berapa nilai untuk cum laude?", "Apa syarat summa cum laude?"],
    keywords: ["peraturan rektor", "predikat kelulusan", "cum laude", "summa cum laude", "magna cum laude"],
    lead: "Predikat kelulusan program sarjana menurut Peraturan Rektor Nomor 70 Tahun 2026:",
    points: [
      "Dengan pujian (Cum Laude): IPK dan nilai sidang 3,75 atau lebih, studi paling lama 8 semester, tidak mengulang mata kuliah untuk memperbaiki nilai, dan punya artikel terbit di jurnal nasional terakreditasi SINTA 4 atau di atasnya.",
      "Dengan pujian tinggi (Magna Cum Laude): IPK dan nilai sidang 3,85 atau lebih, studi paling lama 7 semester, dan artikel di jurnal SINTA 3 atau di atasnya.",
      "Dengan pujian tertinggi (Summa Cum Laude): IPK dan nilai sidang 3,90 atau lebih, studi paling lama 7 semester, dan artikel di jurnal SINTA 2 atau di atasnya.",
      "Yang tidak memenuhi satu tingkat predikat bisa mendapat predikat di bawahnya selama memenuhi syaratnya.",
      "Predikat yang tersedia: memuaskan, sangat memuaskan, cum laude, magna cum laude, dan summa cum laude.",
    ],
    closing: "Mau saya jelaskan syarat kelulusan lainnya?",
    answer:
      "Menurut Peraturan Rektor Nomor 70 Tahun 2026, program sarjana: Cum Laude butuh IPK dan nilai sidang 3,75 atau lebih, studi paling lama 8 semester, tidak mengulang mata kuliah untuk memperbaiki nilai, dan artikel terbit di jurnal SINTA 4 atau di atasnya. Magna Cum Laude butuh IPK dan nilai sidang 3,85 atau lebih, studi paling lama 7 semester, dan jurnal SINTA 3 atau di atasnya. Summa Cum Laude butuh IPK dan nilai sidang 3,90 atau lebih, studi paling lama 7 semester, dan jurnal SINTA 2 atau di atasnya. Yang tidak memenuhi bisa mendapat predikat di bawahnya.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital kalau ada ketentuan teknis yang belum jelas.",
    ...PERREK_70,
  },

  {
    id: "perrek-berlaku-peralihan",
    category: "Tugas Akhir",
    title: "Mulai berlakunya Peraturan Rektor 70/2026 dan mahasiswa yang sedang menyusun tugas akhir",
    questions: ["Sejak kapan Peraturan Rektor 70 Tahun 2026 berlaku?", "Apakah aturan baru berlaku untuk mahasiswa yang sudah menyusun tugas akhir?"],
    followUps: ["Apakah aturan lama masih berlaku?", "Bagaimana kalau saya sudah sidang sebelum aturan baru?"],
    hints: ["Sejak kapan Peraturan Rektor 70 Tahun 2026 berlaku?", "Apakah aturan lama masih berlaku?"],
    keywords: ["peraturan rektor", "peraturan rektor 70", "aturan baru tugas akhir", "ketentuan peralihan"],
    lead: "Keberlakuan Peraturan Rektor Nomor 70 Tahun 2026:",
    points: [
      "Ditetapkan di Bandung pada 6 November 2026 dan mulai berlaku pada tanggal ditetapkan.",
      "Ketentuan tugas akhir yang bertentangan dengan peraturan ini dinyatakan tidak berlaku; yang tidak bertentangan tetap berlaku.",
      "Mahasiswa yang judul atau topiknya sudah disetujui sebelum peraturan ini berlaku tetap menyelesaikan dengan ketentuan saat persetujuan, tetapi kalau melewati jangka waktunya, mengikuti peraturan ini.",
      "Ketentuan integritas akademik dan pelindungan data langsung berlaku untuk semua.",
      "Mahasiswa yang sudah sidang sebelum peraturan ini berlaku menyelesaikan perbaikan dan syarat kelulusan dengan ketentuan saat sidang.",
      "Prodi boleh menetapkan ketentuan teknis yang lebih spesifik, selama tidak menurunkan standar minimum UPI.",
    ],
    closing: "Kalau mau, saya jelaskan isi aturan barunya, misalnya syarat sidang atau batas similaritas.",
    answer:
      "Peraturan Rektor Nomor 70 Tahun 2026 ditetapkan di Bandung pada 6 November 2026 dan berlaku sejak ditetapkan. Ketentuan tugas akhir yang bertentangan dengannya tidak berlaku lagi. Mahasiswa yang judul atau topiknya sudah disetujui sebelumnya tetap menyelesaikan dengan ketentuan saat persetujuan, kecuali melewati jangka waktu penyelesaian atau menyangkut integritas akademik dan pelindungan data. Mahasiswa yang sudah sidang menyelesaikan perbaikan dengan ketentuan saat sidang.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital kalau ada ketentuan teknis yang belum jelas.",
    ...PERREK_70,
  },

  {
    id: "template-dokumen-administrasi",
    category: "Tugas Akhir",
    title: "Template dokumen seminar proposal, seminar hasil, dan sidang",
    questions: ["Di mana template dokumen seminar proposal?", "Di mana format dokumen pendaftaran seminar hasil dan sidang?"],
    followUps: ["Dokumen apa saja untuk seminar proposal?", "Di mana formulir pendaftaran seminar proposal?"],
    hints: ["Di mana template dokumen sempro?", "Format lembar bimbingan proposal ada di mana?"],
    keywords: ["template sempro", "template dokumen", "format sem", "format dokumen sempro", "unduh template", "lembar bimbingan", "kartu hadir seminar", "bukti keikutsertaan sempro", "daftar kelengkapan sidang", "template seminar hasil"],
    lead: "Template dokumen administrasi tugas akhir yang tersedia (unduh langsung):",
    points: [
      "SEM 1 – Lembar Bimbingan Proposal Tugas Akhir: https://fikhry-hakim.github.io/sapa-upi-prototype/dokumen/template/SEM-1-lembar-bimbingan-proposal-tugas-akhir.docx",
      "SEM 2 – Permohonan Seminar Proposal Tugas Akhir: https://fikhry-hakim.github.io/sapa-upi-prototype/dokumen/template/SEM-2-permohonan-seminar-proposal-tugas-akhir.docx",
      "SEM 3 – Kartu Hadir Partisipan Seminar Proposal: https://fikhry-hakim.github.io/sapa-upi-prototype/dokumen/template/SEM-3-kartu-hadir-partisipan-seminar-proposal.docx",
      "SEM 4 – Daftar Hadir Dosen Penguji dan Mahasiswa Seminar Proposal: https://fikhry-hakim.github.io/sapa-upi-prototype/dokumen/template/SEM-4-daftar-hadir-dosen-penguji-dan-mahasiswa-sempro.docx",
      "SEM 5 – Penilaian Seminar Proposal Tugas Akhir: https://fikhry-hakim.github.io/sapa-upi-prototype/dokumen/template/SEM-5-penilaian-seminar-proposal-tugas-akhir.docx",
      "SEM 6 – Pernyataan Kesediaan Membimbing Tugas Akhir: https://fikhry-hakim.github.io/sapa-upi-prototype/dokumen/template/SEM-6-pernyataan-kesediaan-membimbing-tugas-akhir.docx",
      "SEM 7 – Keterangan Publikasi Karya Ilmiah: https://fikhry-hakim.github.io/sapa-upi-prototype/dokumen/template/SEM-7-keterangan-publikasi-karya-ilmiah.docx",
      "SEM 8 – Berita Acara Uji Kemiripan (Similarity): https://fikhry-hakim.github.io/sapa-upi-prototype/dokumen/template/SEM-8-berita-acara-uji-kemiripan-similarity.docx",
      "SEM 9 – Laporan Hasil Penelitian (Seminar Hasil): https://fikhry-hakim.github.io/sapa-upi-prototype/dokumen/template/SEM-9-laporan-hasil-penelitian-seminar-hasil.docx",
      "SEM 10 – Persetujuan Submit Artikel dari Dosen Pembimbing: https://fikhry-hakim.github.io/sapa-upi-prototype/dokumen/template/SEM-10-persetujuan-submit-artikel-dosen-pembimbing.docx",
      "Format 11 – Lembar Pernyataan Perbaikan Besar/Substansial: https://fikhry-hakim.github.io/sapa-upi-prototype/dokumen/template/format-11-lembar-pernyataan-perbaikan-besar-substansial.docx",
      "Format 12 – Persetujuan Seminar Hasil: https://fikhry-hakim.github.io/sapa-upi-prototype/dokumen/template/format-12-persetujuan-seminar-hasil.docx",
      "Daftar Kelengkapan Persyaratan Ujian Sidang Tugas Akhir S1: https://fikhry-hakim.github.io/sapa-upi-prototype/dokumen/template/daftar-kelengkapan-persyaratan-ujian-sidang-s1.docx",
      "Daftar Kelengkapan Persyaratan Ujian Sidang Tugas Akhir S2: https://fikhry-hakim.github.io/sapa-upi-prototype/dokumen/template/daftar-kelengkapan-persyaratan-ujian-sidang-s2.docx",
      "Bukti Keikutsertaan Seminar Proposal (10 kali partisipan): https://fikhry-hakim.github.io/sapa-upi-prototype/dokumen/template/bukti-keikutsertaan-sempro.pdf",
    ],
    closing: "Template resmi lengkapnya juga ada di https://bit.ly/Format-Template_admPenyelesaianStudi. Mau saya jelaskan dokumen apa saja yang perlu untuk seminar proposal?",
    answer:
      "Template dokumen untuk seminar proposal, seminar hasil, dan sidang tersedia sebagai berkas unduhan: SEM 1 sampai SEM 10 (lembar bimbingan, permohonan seminar proposal, kartu hadir, daftar hadir penguji, penilaian, kesediaan membimbing, keterangan publikasi, berita acara uji kemiripan, laporan hasil penelitian, persetujuan submit artikel), Format 11 dan 12, daftar kelengkapan sidang S1 dan S2, serta bukti keikutsertaan seminar proposal. Semuanya juga ada di https://bit.ly/Format-Template_admPenyelesaianStudi.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital kalau template tidak bisa dibuka atau butuh versi terbaru.",
    sourceTitle: "Template dokumen administrasi penyelesaian studi (Format SEM 1–12 dan daftar kelengkapan sidang)",
    sourceOwner: "Program Studi, Universitas Pendidikan Indonesia Kampus Daerah Tasikmalaya",
    validPeriod: "Tahun Akademik 2026/2027",
    updatedAt: "Tanggal terbit tidak tercantum pada template",
    sourceRef: "Template kelengkapan dokumen pendaftaran seminar proposal, seminar hasil, dan ujian sidang (bit.ly/Format-Template_admPenyelesaianStudi)",
    // Berupa berkas template (docx), bukan PDF yang bisa dibuka di pembaca dokumen.
    sourceUrl: null,
  },

  {
    id: "perrek38-masa-studi",
    category: "Administrasi",
    title: "Masa studi, beban belajar, dan drop out program sarjana (Peraturan Rektor 38/2026)",
    questions: ["Berapa lama masa studi maksimal S1 di UPI?", "Berapa SKS yang harus ditempuh mahasiswa sarjana?"],
    followUps: ["Apa saja yang membuat status mahasiswa dibatalkan?", "Berapa semester cuti akademik yang dihitung dalam masa studi?"],
    hints: ["Berapa batas masa studi S1?", "Kapan mahasiswa kena drop out?"],
    keywords: ["masa studi maksimal", "batas masa studi", "drop out", "beban belajar sarjana", "14 semester"],
    lead: "Ketentuan masa studi dan beban belajar program sarjana menurut Peraturan Rektor Nomor 38 Tahun 2026 tentang Penyelenggaraan Pendidikan:",
    points: [
      "Beban belajar program sarjana paling sedikit 144 SKS dan paling banyak 156 SKS.",
      "Masa tempuh kurikulum dirancang 8 semester, dengan masa studi mahasiswa paling lama 14 semester, termasuk dua semester cuti akademik.",
      "Mahasiswa yang tidak menyelesaikan studi dalam batas masa studi maksimum dinyatakan tidak dapat melanjutkan studi dan dikenai sanksi pemberhentian sebagai mahasiswa (drop out).",
      "Sebagian beban belajar boleh ditempuh di luar program studi: di prodi lain dalam UPI paling lama 1 semester atau setara 20 SKS, dan di perguruan tinggi mitra atau program nasional paling lama 2 semester atau setara 40 SKS.",
    ],
    closing: "Mau saya jelaskan hal-hal yang membuat status kemahasiswaan dibatalkan?",
    answer:
      "Menurut Peraturan Rektor Nomor 38 Tahun 2026, beban belajar program sarjana paling sedikit 144 dan paling banyak 156 SKS. Kurikulum dirancang 8 semester, dan masa studi paling lama 14 semester termasuk dua semester cuti akademik. Mahasiswa yang melewati batas itu dinyatakan tidak dapat melanjutkan studi dan dikenai drop out.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital kalau ingin memastikan sisa masa studi Anda.",
    ...PERREK_38,
  },
  {
    id: "perrek38-status-kemahasiswaan",
    category: "Administrasi",
    title: "Status kemahasiswaan, pengunduran diri, dan pembatalan status (Peraturan Rektor 38/2026)",
    questions: ["Apa yang membuat status mahasiswa dibatalkan di UPI?", "Bagaimana cara mengundurkan diri sebagai mahasiswa UPI?"],
    followUps: ["Berapa IPK minimal di semester 4?", "Berapa lama masa studi maksimal S1?"],
    hints: ["Kapan status mahasiswa dibatalkan?", "Bagaimana prosedur mengundurkan diri?"],
    keywords: ["pembatalan status kemahasiswaan", "status kemahasiswaan", "mengundurkan diri dari upi", "ipk semester empat", "kehilangan status mahasiswa"],
    lead: "Menurut Peraturan Rektor Nomor 38 Tahun 2026, status kemahasiswaan dapat dibatalkan apabila mahasiswa:",
    points: [
      "tidak melakukan registrasi administrasi dan registrasi akademik serta tidak mengajukan cuti akademik sesuai ketentuan;",
      "tidak memenuhi prestasi akademik yang dipersyaratkan, termasuk mahasiswa sarjana yang pada semester keempat memperoleh IPK kurang dari 2,00;",
      "mengundurkan diri atau dinyatakan drop out;",
      "melampaui batas masa studi;",
      "terbukti melakukan pelanggaran akademik seperti plagiarisme atau memakai gelar sebelum dinyatakan lulus, pelanggaran moral dan etika berat (misalnya perundungan atau penyalahgunaan narkoba), atau dijatuhi pidana berkekuatan hukum tetap.",
      "Pembatalan ditetapkan dengan Keputusan Rektor. Mahasiswa yang dibatalkan berhak atas transkrip mata kuliah yang sudah ditempuh, kecuali yang dikenai sanksi terorisme, pelanggaran akademik, pelanggaran moral dan etika, pelanggaran berat tata perilaku, atau melampaui masa studi.",
      "Pengunduran diri atas permohonan sendiri diajukan tertulis kepada pimpinan fakultas atau kampus daerah, diproses UPI, dan ditetapkan dengan keputusan rektor. Yang mengundurkan diri boleh mendaftar kembali lewat jalur penerimaan yang berlaku.",
    ],
    closing: "Mau saya jelaskan batas masa studi sarjana?",
    answer:
      "Menurut Peraturan Rektor Nomor 38 Tahun 2026, status kemahasiswaan dapat dibatalkan, antara lain bila mahasiswa tidak registrasi dan tidak cuti, IPK mahasiswa sarjana kurang dari 2,00 pada semester keempat, mengundurkan diri atau drop out, melampaui batas masa studi, atau melakukan pelanggaran akademik dan etika berat. Pembatalan ditetapkan dengan Keputusan Rektor. Pengunduran diri diajukan tertulis kepada pimpinan fakultas atau kampus daerah.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital untuk kasus yang spesifik.",
    ...PERREK_38,
  },
  {
    id: "perrek38-pindah-prodi",
    category: "Administrasi",
    title: "Syarat pindah program studi di UPI (Peraturan Rektor 38/2026)",
    questions: ["Bagaimana syarat pindah program studi di UPI?", "Kapan mahasiswa boleh pindah prodi?"],
    followUps: ["Apa yang membuat status mahasiswa dibatalkan?", "Berapa lama masa studi maksimal S1?"],
    hints: ["Syarat pindah prodi apa saja?", "Berapa semester minimal sebelum pindah prodi?"],
    keywords: ["pindah program studi", "pindah prodi", "perpindahan program studi", "surat pernyataan penerimaan"],
    lead: "Syarat pindah program studi di lingkungan UPI menurut Peraturan Rektor Nomor 38 Tahun 2026:",
    points: [
      "Sudah menempuh pendidikan paling sedikit 4 semester di program studi asal.",
      "Memenuhi persyaratan akademik yang ditetapkan program studi tujuan.",
      "Mendapat persetujuan program studi tujuan yang dinyatakan lewat surat pernyataan penerimaan.",
      "Program studi tujuan boleh menambah syarat, misalnya tes akademik atau wawancara.",
      "Tata cara pengajuan, seleksi, dan penetapan diatur Direktorat Pendidikan.",
    ],
    closing: "Mau saya jelaskan hal lain tentang status kemahasiswaan?",
    answer:
      "Menurut Peraturan Rektor Nomor 38 Tahun 2026, mahasiswa boleh pindah program studi di UPI bila sudah menempuh paling sedikit 4 semester di prodi asal, memenuhi syarat akademik prodi tujuan, dan mendapat surat pernyataan penerimaan dari prodi tujuan. Prodi tujuan boleh menambah syarat seperti tes atau wawancara.",
    escalation:
      "Hubungi Direktorat Pendidikan atau staf prodi untuk tata cara pengajuannya.",
    ...PERREK_38,
  },
  {
    id: "perrek38-wisuda-ijazah",
    category: "Kelulusan",
    title: "Pendaftaran wisuda dan syarat penyerahan ijazah (Peraturan Rektor 38/2026)",
    questions: ["Kapan batas revisi sebelum daftar wisuda?", "Apa syarat mengambil ijazah?"],
    followUps: ["Apa syarat kelulusan S1 menurut Peraturan Rektor?", "Bagaimana cara unggah mandiri tugas akhir?"],
    hints: ["Syarat daftar wisuda apa saja?", "Apa syarat penyerahan ijazah?"],
    keywords: ["syarat penyerahan ijazah", "pengambilan ijazah", "wisuda in absentia", "revisi sebelum wisuda"],
    lead: "Ketentuan wisuda dan penyerahan ijazah menurut Peraturan Rektor Nomor 38 Tahun 2026:",
    points: [
      "Mahasiswa mendaftar wisuda setelah memenuhi seluruh persyaratan akademik, termasuk menyelesaikan revisi tugas akhir paling lambat 1 bulan sebelum pelaksanaan wisuda.",
      "Wisuda boleh diikuti secara in absentia dengan prosedur yang ditetapkan UPI.",
      "Ijazah dan dokumen akademik diberikan setelah lulusan menyelesaikan perbaikan tugas akhir, tidak punya tunggakan biaya pendidikan, mengunggah tugas akhir lewat unggah mandiri repositori perpustakaan, dan mengembalikan perlengkapan wisuda.",
      "Lulusan sarjana jalur skripsi menunjukkan bukti submit artikel di jurnal nasional atau internasional; jalur artikel menunjukkan bukti artikel accepted atau published di jurnal nasional terakreditasi atau internasional bereputasi.",
      "Alumni boleh meminta terjemahan ijazah, transkrip, dan SKPI ke bahasa Inggris.",
      "Catatan: syarat publikasi untuk kelulusan sarjana diatur lebih baru dan lebih rinci di Peraturan Rektor Nomor 70 Tahun 2026 (berlaku 6 November 2026); kalau berbeda, ikuti yang lebih baru.",
    ],
    closing: "Mau saya jelaskan cara unggah mandiri tugas akhir lewat SIAS?",
    answer:
      "Menurut Peraturan Rektor Nomor 38 Tahun 2026, mahasiswa mendaftar wisuda setelah revisi tugas akhir selesai paling lambat 1 bulan sebelum wisuda. Ijazah diberikan setelah perbaikan tugas akhir selesai, tidak ada tunggakan biaya, tugas akhir diunggah lewat unggah mandiri repositori, perlengkapan wisuda dikembalikan, dan bukti artikel (submit untuk jalur skripsi; accepted atau published untuk jalur artikel) ditunjukkan.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital kalau jadwal wisuda belum jelas.",
    ...PERREK_38,
  },
  {
    id: "unggah-mandiri-sias",
    category: "Kelulusan",
    title: "Cara unggah mandiri tugas akhir lewat SIAS",
    questions: ["Bagaimana cara unggah mandiri tugas akhir di SIAS?", "Di mana mengunggah tugas akhir ke repository UPI?"],
    followUps: ["Bagaimana cara mengajukan bebas pustaka di SIAS?", "Berapa nomor WhatsApp CS unggah mandiri?"],
    hints: ["Langkah unggah mandiri tugas akhir?", "Apa itu rekomendasi publikasi tugas akhir?"],
    keywords: ["unggah mandiri", "unggah tugas akhir", "repository upi", "rekomendasi publikasi", "suma"],
    lead: "Langkah unggah mandiri tugas akhir lewat SIAS (Panduan Perpustakaan UPI):",
    points: [
      "Masuk ke https://sias.upi.edu/ dengan akun SSO.",
      "Pilih menu Pengajuan Sidang: Pengajuan Sidang untuk S1, atau Pengajuan Sidang Tahap 2 untuk S2 dan S3.",
      "Klik Ajukan Rekomendasi Publikasi Tugas Akhir. Pastikan bebas pustaka sudah diajukan lebih dulu.",
      "Tunggu dosen pembimbing 1 menyatakan karya tulis direkomendasikan dipublikasikan atau tidak. Kalau tidak dipublikasikan, karya tulis tetap harus diunggah ke repository.upi.edu tetapi tidak ditampilkan.",
      "Unggah tugas akhir mengikuti panduan SUMa di perpustakaan.upi.edu/suma.",
      "Klik Ajukan Sudah Unggah di SIAS, lalu tunggu verifikasi petugas pada hari dan jam kerja (08.00 sampai 15.00).",
      "Kalau dinyatakan belum sesuai, perbaiki sesuai panduan SUMa. Pertanyaan bisa ke CS Unggah Mandiri lewat WhatsApp 0815-1017-9300.",
    ],
    closing: "Mau saya jelaskan cara mengajukan bebas pustaka?",
    answer:
      "Unggah mandiri dilakukan lewat SIAS (sias.upi.edu, akun SSO): buka Pengajuan Sidang, ajukan rekomendasi publikasi tugas akhir setelah bebas pustaka diajukan, tunggu persetujuan dosen pembimbing 1, unggah tugas akhir sesuai panduan SUMa, klik Ajukan Sudah Unggah, lalu tunggu verifikasi petugas (08.00 sampai 15.00). CS Unggah Mandiri: WhatsApp 0815-1017-9300.",
    escalation:
      "Kalau unggahan ditolak berulang kali, hubungi CS Unggah Mandiri Perpustakaan UPI.",
    ...PUSTAKA_UNGGAH,
  },
  {
    id: "bebas-pustaka-sias",
    category: "Kelulusan",
    title: "Cara mengajukan bebas pustaka di SIAS",
    questions: ["Bagaimana cara mengajukan bebas pustaka di SIAS?", "Kenapa pengajuan bebas pustaka saya ditolak?"],
    followUps: ["Bagaimana cara unggah mandiri tugas akhir di SIAS?", "Bagaimana cek buku yang belum dikembalikan?"],
    hints: ["Langkah ajukan bebas pustaka?", "Bebas pustaka ditolak harus bagaimana?"],
    keywords: ["bebas pustaka", "ajukan bebas pustaka", "pinjaman pustaka", "sanksi indisipliner perpustakaan"],
    lead: "Langkah mengajukan bebas pustaka lewat SIAS (Panduan Perpustakaan UPI):",
    points: [
      "Masuk ke https://sias.upi.edu/ dengan akun SSO (user name dan password internet UPI).",
      "Pilih menu Pengajuan Sidang: Pengajuan Sidang untuk S1, atau Pengajuan Sidang Tahap 1 untuk S2 dan S3.",
      "Klik Ajukan bebas pustaka.",
      "Tunggu petugas memverifikasi pada hari dan jam kerja (08.00 sampai 15.00). Statusnya akan tampil disetujui atau ditolak.",
      "Kalau ditolak, artinya masih ada pinjaman pustaka atau sanksi indisipliner. Cek di digilib.upi.edu/sapa, lalu datang langsung ke Layanan Sirkulasi Perpustakaan UPI.",
    ],
    closing: "Mau saya jelaskan cara unggah mandiri tugas akhir?",
    answer:
      "Bebas pustaka diajukan lewat SIAS (sias.upi.edu, akun SSO): buka menu Pengajuan Sidang, klik Ajukan bebas pustaka, lalu tunggu verifikasi petugas pada 08.00 sampai 15.00. Kalau ditolak, berarti masih ada pinjaman pustaka atau sanksi indisipliner; cek di digilib.upi.edu/sapa dan datang ke Layanan Sirkulasi Perpustakaan UPI.",
    escalation:
      "Hubungi Perpustakaan UPI (cs_perpustakaan@upi.edu) kalau status bebas pustaka bermasalah.",
    ...PUSTAKA_BEBAS,
  },
  {
    id: "magang-bisnis-digital",
    category: "Tugas Akhir",
    title: "Program Magang Profesional Bisnis Digital: bentuk dan persyaratan",
    questions: ["Apa syarat magang di Bisnis Digital?", "Berapa lama magang dan berapa SKS yang dikonversi?"],
    followUps: ["Mata kuliah apa saja yang dikonversi dari magang?", "Siapa saja dosen pembimbing magang bertugas apa?"],
    hints: ["Syarat magang mandiri apa saja?", "Bedanya magang merdeka dan magang mandiri?"],
    keywords: ["buku magang", "magang mandiri", "magang merdeka", "magang profesional", "pkl bisnis digital"],
    lead: "Program Magang Profesional Bisnis Digital menurut Buku Petunjuk Program Studi Bisnis Digital:",
    points: [
      "Magang Merdeka MBKM: 1 semester di semester 7, dikonversi 20 SKS, tempat dipilih lewat pendaftaran di website MBKM. Syarat: sudah menyelesaikan semester 6 dan semua mata kuliah MKKIPS, mengontrak PKL di semester 7 dengan persetujuan dosen PA, punya surat rekomendasi dari kampus daerah, SPTJM, dan transkrip nilai.",
      "Magang Mandiri: 1 semester di semester 7, minimal 5 bulan, dikonversi 20 SKS, tempat dipilih sendiri atau atas rekomendasi prodi. Syarat: sudah menyelesaikan 110 SKS, mengontrak PKL di semester 7 dengan persetujuan dosen PA, surat pengantar dari prodi untuk mitra, dan surat rekomendasi dari kampus daerah setelah diterima.",
      "Langkahnya: bimbingan dengan dosen PA, urus surat pengantar atau SPTJM dan surat rekomendasi, ikuti pembekalan prodi, magang, bimbingan laporan, lalu ujian sidang magang sebelum semester berakhir (sekaligus menyampaikan ide awal tugas akhir).",
      "Mitra: sesuai bidang bisnis digital, bukan perusahaan milik keluarga peserta, berbentuk CV atau PT, atau instansi pemerintah, BUMN/BUMD, startup teknologi, dan sejenisnya.",
      "Mahasiswa hanya magang di tempat yang disetujui Ketua Prodi dan tidak boleh pindah tanpa izin; absen lebih dari tiga hari wajib diberitahukan ke prodi.",
    ],
    closing: "Mau saya jelaskan mata kuliah yang dikonversi dari magang?",
    answer:
      "Magang Profesional Bisnis Digital dilakukan 1 semester di semester 7 dan dikonversi 20 SKS. Magang Merdeka MBKM mensyaratkan semester 6 dan semua MKKIPS selesai, kontrak PKL, surat rekomendasi, SPTJM, dan transkrip. Magang Mandiri minimal 5 bulan dan mensyaratkan 110 SKS, kontrak PKL, surat pengantar prodi, serta surat rekomendasi. Setelah magang ada bimbingan laporan dan ujian sidang magang sebelum semester berakhir.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital untuk surat pengantar dan pendaftaran magang.",
    ...BUKU_MAGANG,
  },
  {
    id: "magang-konversi-penilaian",
    category: "Tugas Akhir",
    title: "Konversi SKS, penilaian, dan monitoring magang Bisnis Digital",
    questions: ["Mata kuliah apa yang dikonversi dari magang?", "Bagaimana penilaian dan monitoring magang?"],
    followUps: ["Apa syarat magang di Bisnis Digital?", "Apa kriteria mitra magang?"],
    hints: ["Konversi SKS magang ke mata kuliah apa?", "Berapa kali dosen memonitor magang?"],
    keywords: ["konversi magang", "mata kuliah konversi magang", "penilaian magang", "logbook magang", "monitoring magang"],
    lead: "Konversi, penilaian, dan monitoring magang menurut Buku Petunjuk Magang Prodi Bisnis Digital:",
    points: [
      "Pengakuan pengalaman magang maksimal 20 SKS, dikonversi ke mata kuliah keahlian pilihan prodi yang sesuai kegiatan magang.",
      "Mata kuliah konversi yang tercantum: Pengembangan Profesional, Seminar Inisiasi Bisnis Digital, Budaya dan Organisasi, Berpikir Konseptual dan Pemecahan Masalah, serta Praktik dan Prinsip Kepemimpinan (masing-masing 4 SKS, semester 7). Mata kuliah generik: Strategi Pengembangan Diri, Total Quality Management, Etika Profesi, Keterampilan Manajerial dan Kewirausahaan, Komunikasi dan Kerjasama Tim, Berpikir Kritis dan Kreatif.",
      "Penilaian bisa terstruktur, terbuka, atau gabungan. Penilaian terbuka memberi bobot pada rumusan masalah (15%), penyelesaian masalah teknis (20%), sintesis desain (15%), komunikasi (10%), kerja sama (10%), kerja keras (10%), kepemimpinan (10%), dan kreativitas (10%).",
      "Kehadiran dibuktikan daftar hadir yang diketahui instruktur magang, dan kegiatan dicatat di logbook yang dilampirkan dalam laporan.",
      "Dosen pembimbing memonitor kegiatan sekurang-kurangnya dua kali selama magang, bertemu dengan mitra, dan menjadi penguji dalam ujian magang.",
    ],
    closing: "Mau saya jelaskan syarat mengikuti magang?",
    answer:
      "Magang diakui maksimal 20 SKS dan dikonversi ke mata kuliah keahlian pilihan seperti Pengembangan Profesional, Seminar Inisiasi Bisnis Digital, Budaya dan Organisasi, Berpikir Konseptual dan Pemecahan Masalah, serta Praktik dan Prinsip Kepemimpinan. Penilaian bisa terstruktur, terbuka, atau gabungan. Kehadiran dibuktikan daftar hadir dan logbook, dan dosen pembimbing memonitor minimal dua kali selama magang.",
    escalation:
      "Hubungi koordinator magang Program Studi Bisnis Digital untuk detail konversi nilai.",
    ...BUKU_MAGANG,
  },
  {
    id: "simkatmawa-poin-kelulusan",
    category: "Kelulusan",
    title: "Pengakuan pengalaman belajar dan poin kelulusan (Panduan SIMKATMAWA 2026)",
    questions: ["Bagaimana cara mengurus 100 poin ekstrakurikuler untuk sidang?", "Apa itu pengakuan pengalaman belajar mahasiswa di UPI?"],
    followUps: ["Apa syarat kelulusan S1 menurut Peraturan Rektor?", "Apakah poin bisa mengurangi beban SKS?"],
    hints: ["Cara klaim poin kegiatan mahasiswa?", "Di mana mengajukan poin untuk syarat sidang?"],
    keywords: ["simkatmawa", "pengakuan pengalaman belajar", "poin kegiatan mahasiswa", "kampus berdampak", "skpi"],
    lead: "Menurut Panduan Pengakuan Pengalaman Belajar dan Prestasi Mahasiswa (Kampus Berdampak) Edisi IV, 2026:",
    points: [
      "Mahasiswa sarjana wajib memperoleh minimal 100 poin dari kegiatan pengalaman belajar dan prestasi, serta memiliki minimal 1 sertifikat kompetensi kerja sesuai SKKNI, sebagai syarat mengajukan ujian sidang.",
      "Pengajuan dilakukan lewat aplikasi https://student.upi.edu/ dengan portofolio dan bukti kegiatan.",
      "Berkas diverifikasi dan dinilai oleh Pembina Kemahasiswaan tingkat program studi dan Direktorat Kemahasiswaan. Setelah poin terpenuhi, mahasiswa mengunduh buktinya.",
      "Lewat SIAS, program studi memastikan mahasiswa layak disetujui mengikuti ujian sidang.",
      "Pengalaman belajar juga bisa dikonversi ke SKS untuk mengurangi beban belajar (tidak berlaku untuk poin), dipakai sebagai tugas mata kuliah, atau dicatat di Surat Keterangan Pendamping Ijazah (SKPI).",
      "Mata kuliah Kewirausahaan mewajibkan minimal satu kegiatan pelatihan, workshop kewirausahaan, atau kredensial mikro.",
    ],
    closing: "Mau saya jelaskan syarat kelulusan lainnya?",
    answer:
      "Menurut Panduan SIMKATMAWA 2026 (Edisi IV), mahasiswa sarjana wajib memiliki minimal 100 poin pengalaman belajar dan prestasi serta 1 sertifikat kompetensi kerja SKKNI untuk mengajukan sidang. Portofolio diajukan lewat student.upi.edu, diverifikasi pembina kemahasiswaan prodi dan Direktorat Kemahasiswaan, lalu bukti pemenuhan poin diunduh. Pengalaman belajar juga bisa dikonversi ke SKS, tugas mata kuliah, atau SKPI.",
    escalation:
      "Hubungi pembina kemahasiswaan Program Studi Bisnis Digital untuk verifikasi poin.",
    ...SIMKATMAWA,
  },

  {
    id: "edaran-5572-program-wajib",
    category: "Administrasi",
    title: "Program wajib mahasiswa sarjana sebagai syarat sidang (Edaran Direktur 5572/2025)",
    questions: ["Program wajib apa saja untuk mahasiswa S1 Kampus Tasikmalaya?", "Kapan tes TOEFL dan pelatihan wajib dilakukan?"],
    followUps: ["Apakah pelatihan kewirausahaan wajib?", "Berapa poin ekstrakurikuler untuk lulus?"],
    hints: ["Program wajib mahasiswa S1 apa saja?", "Kapan tes sertifikasi kompetensi internasional?"],
    keywords: ["program wajib mahasiswa", "edaran direktur 5572", "tes awal toefl", "pelatihan kmd pramuka", "tes sertifikasi kompetensi internasional"],
    lead: "Edaran Direktur Kampus UPI Tasikmalaya Nomor 5572 Tahun 2025 menetapkan program wajib mahasiswa sarjana (S1) sebagai syarat ujian sidang dan penyelesaian studi:",
    points: [
      "Tes Awal TOEFL: Tingkat I (semester 1–2).",
      "Pelatihan Kewirausahaan: Tingkat II (semester 3–4).",
      "Pelatihan Kompetensi Mahir Dasar (KMD) Pramuka: Tingkat II (semester 3–4), khusus S1 PGSD.",
      "Tes Sertifikasi Kompetensi Internasional: Tingkat III/IV (semester 5–7).",
      "Tes TOEFL dan/atau Pelatihan Bahasa Inggris: Tingkat III/IV (semester 5–7).",
      "Teknis pelaksanaan tiap program dikoordinasikan bidang Akademik, Kemahasiswaan dan Penjaminan Mutu Kampus UPI Tasikmalaya.",
      "Catatan: berkas sumbernya berupa gambar (pindaian), jadi pembagian tingkatnya dibaca dari hasil OCR; cocokkan dengan edaran aslinya.",
    ],
    closing: "Mau saya jelaskan pelatihan kewirausahaannya?",
    answer:
      "Edaran Direktur Kampus UPI Tasikmalaya Nomor 5572 Tahun 2025 mewajibkan mahasiswa S1: Tes Awal TOEFL (semester 1–2), Pelatihan Kewirausahaan (semester 3–4), Pelatihan KMD Pramuka (semester 3–4, khusus S1 PGSD), serta Tes Sertifikasi Kompetensi Internasional dan Tes TOEFL dan/atau Pelatihan Bahasa Inggris (semester 5–7). Program ini menjadi syarat ujian sidang dan penyelesaian studi.",
    escalation:
      "Hubungi Wakil Direktur Bidang Pendidikan, Kemahasiswaan dan Penjaminan Mutu Kampus UPI Tasikmalaya untuk jadwal tiap program.",
    ...PPT_EDARAN,
  },
  {
    id: "pedoman-ta-jenis-s1",
    category: "Tugas Akhir",
    title: "Jenis tugas akhir program sarjana menurut Pedoman Penyusunan Tugas Akhir UPI 2024",
    questions: ["Apa saja jenis tugas akhir untuk S1 di UPI?", "Selain skripsi, tugas akhir apa yang boleh diambil mahasiswa sarjana?"],
    followUps: ["Apa itu proyek produk bisnis sebagai tugas akhir?", "Apa itu portofolio pencapaian prestasi?"],
    hints: ["Jenis tugas akhir S1 apa saja?", "Apakah boleh tugas akhir berupa proyek bisnis?"],
    keywords: ["jenis tugas akhir", "ragam tugas akhir", "pedoman penyusunan tugas akhir 2024", "tugas akhir selain skripsi", "proyek produk kreatif"],
    lead: "Menurut Pedoman Penyusunan Tugas Akhir Mahasiswa UPI Edisi 2024, tugas akhir program sarjana atau sarjana terapan dapat berbentuk:",
    points: [
      "Skripsi.",
      "Artikel ilmiah (terbit di jurnal terindeks nasional atau internasional).",
      "Prototype produk industri (tingkat dasar dan menengah).",
      "Proyek seni monumental, proyek seni desain, proyek teknologi tepat guna, dan proyek teknologi kependidikan.",
      "Proyek produk bisnis dan proyek produk kreatif sarjana.",
      "Portofolio pencapaian prestasi.",
      "Mahasiswa sarjana hanya boleh mengambil tugas akhir yang diperuntukkan bagi sarjana; tesis dan disertasi untuk magister dan doktor.",
      "Catatan: bentuk tugas akhir yang tersedia di program studi mengikuti ketetapan prodi, dan aturan terbaru ada di Peraturan Rektor 70/2026.",
    ],
    closing: "Mau saya jelaskan syarat proyek produk bisnis?",
    answer:
      "Pedoman Penyusunan Tugas Akhir UPI 2024 menyebut tugas akhir sarjana dapat berupa skripsi, artikel ilmiah, prototype produk industri, proyek seni (monumental atau desain), proyek teknologi tepat guna, proyek teknologi kependidikan, proyek produk bisnis, proyek produk kreatif sarjana, atau portofolio pencapaian prestasi. Bentuk yang tersedia mengikuti ketetapan program studi.",
    escalation:
      "Hubungi Ketua Program Studi Bisnis Digital untuk bentuk tugas akhir yang dibuka di prodi.",
    ...PEDOMAN_2024,
  },
  {
    id: "pedoman-ta-produk-bisnis",
    category: "Tugas Akhir",
    title: "Syarat proyek produk bisnis sebagai tugas akhir (Pedoman Tugas Akhir 2024)",
    questions: ["Apa syarat proyek produk bisnis sebagai tugas akhir?", "Berapa lama bisnis harus berjalan untuk tugas akhir proyek bisnis?"],
    followUps: ["Apa saja isi proposal proyek produk bisnis?", "Apa jenis tugas akhir S1 lainnya?"],
    hints: ["Proyek bisnis bisa jadi tugas akhir?", "Isi proposal proyek produk bisnis apa saja?"],
    keywords: ["proyek produk bisnis", "tugas akhir proyek bisnis", "business model canvas tugas akhir", "monograf proyek bisnis"],
    lead: "Persyaratan Proyek Produk Bisnis sebagai tugas akhir sarjana menurut Pedoman Penyusunan Tugas Akhir UPI 2024:",
    points: [
      "Proposal singkat berisi profil usaha (visi misi, SWOT), riset pasar, segmentasi dan target pasar, perencanaan usaha (produk, produksi, proyeksi keuangan, HPP, BEP, pemasaran 4P, SDM), Business Model Canvas, rencana dan implementasi 6 bulan, serta evaluasi dan kesimpulan.",
      "Rencana ditandatangani Dosen Pembimbing Akademik dan diajukan ke Ketua Program Studi. SK Ketua Prodi tentang calon pembimbing berlaku 14 hari; dalam 14 hari kerja mahasiswa dan calon pembimbing menyepakati lanjut atau tidak.",
      "Kelayakan produk: lolos kurasi dosen pembimbing atau kurator, orisinal dan bernilai (estetik, teknis, fungsi, sosial, ekonomi), karya individu atau kelompok dengan peran jelas, pernah ikut kompetisi atau pameran, dan sudah menjalankan bisnis minimal 6 bulan dengan indikator kinerja tertentu (punya produk atau jasa, profit, toko online atau offline).",
      "Dilengkapi monograf berafiliasi UPI yang disetujui pembimbing dan Ketua Prodi, layak memperoleh Hak Cipta, dan Buku Bimbingan diparaf pembimbing.",
      "Syarat ujian: ajukan sidang lewat https://siak.upi.edu/sias/, serahkan monograf minimal 3 eksemplar, serta foto dan video proses dan hasil proyek.",
    ],
    closing: "Mau saya jelaskan jenis tugas akhir lainnya?",
    answer:
      "Proyek Produk Bisnis sebagai tugas akhir mensyaratkan proposal rencana usaha (profil usaha, riset pasar, rencana produksi dan keuangan, pemasaran, SDM, Business Model Canvas, rencana 6 bulan), bisnis yang sudah berjalan minimal 6 bulan, monograf berafiliasi UPI yang disetujui pembimbing dan Ketua Prodi (minimal 3 eksemplar), serta foto dan video proses dan hasil. Ujian sidang diajukan lewat SIAS.",
    escalation:
      "Hubungi Ketua Program Studi Bisnis Digital untuk memastikan apakah bentuk ini dibuka di prodi.",
    ...PEDOMAN_2024,
  },
  {
    id: "pedoman-ta-portofolio-prestasi",
    category: "Tugas Akhir",
    title: "Portofolio pencapaian prestasi sebagai tugas akhir (Pedoman Tugas Akhir 2024)",
    questions: ["Apa syarat portofolio pencapaian prestasi sebagai tugas akhir?", "Prestasi apa yang bisa dijadikan tugas akhir?"],
    followUps: ["Apa jenis tugas akhir S1 lainnya?", "Apa syarat proyek produk bisnis sebagai tugas akhir?"],
    hints: ["Prestasi apa yang diakui jadi tugas akhir?", "Isi portofolio prestasi apa saja?"],
    keywords: ["portofolio pencapaian prestasi", "tugas akhir prestasi", "juara nasional tugas akhir", "pomnas tugas akhir"],
    lead: "Persyaratan Portofolio Pencapaian Prestasi sebagai tugas akhir sarjana menurut Pedoman Penyusunan Tugas Akhir UPI 2024:",
    points: [
      "Prestasi yang dilaporkan minimal juara 1, 2, atau 3 tingkat nasional pada cabang olahraga di event nasional seperti PON, Kejurnas, Peparnas, atau Pomnas.",
      "Portofolio disusun sistematis: identitas diri, dokumen prestasi (sertifikat, piagam, surat keterangan resmi), rekaman kegiatan (foto atau video), portofolio karya bila relevan, rekomendasi atau testimoni, dan surat pernyataan keaslian.",
      "Proses pengajuan sama seperti proyek lain: rencana ditandatangani Dosen PA, SK Ketua Prodi calon pembimbing (berlaku 14 hari), lalu SK Dekan atau Direktur Kampus UPI di Daerah.",
      "Syarat ujian: Buku Bimbingan diparaf pembimbing, portofolio yang disetujui seluruh pembimbing dan Ketua Prodi minimal 3 eksemplar, dan pengajuan sidang lewat SIAS.",
    ],
    closing: "Mau saya jelaskan jenis tugas akhir lainnya?",
    answer:
      "Portofolio Pencapaian Prestasi dapat menjadi tugas akhir sarjana bila mahasiswa meraih juara 1, 2, atau 3 tingkat nasional pada event seperti PON, Kejurnas, Peparnas, atau Pomnas. Portofolio memuat identitas diri, dokumen prestasi, rekaman kegiatan, rekomendasi, dan surat pernyataan keaslian, minimal 3 eksemplar, disetujui seluruh pembimbing dan Ketua Prodi.",
    escalation:
      "Hubungi Ketua Program Studi Bisnis Digital untuk memastikan bentuk ini dibuka di prodi.",
    ...PEDOMAN_2024,
  },
  {
    id: "pedoman-ta-ujian-umum",
    category: "Sidang",
    title: "Ketentuan umum ujian tugas akhir menurut Pedoman Tugas Akhir 2024",
    questions: ["Bagaimana ketentuan umum ujian tugas akhir untuk karya fisik?", "Apakah semua jenis tugas akhir harus diuji sidang?"],
    followUps: ["Apa syarat sidang skripsi?", "Apa itu uji deteksi Generative AI pada skripsi?"],
    hints: ["Semua tugas akhir wajib sidang?", "Bagaimana ketentuan umum ujian tugas akhir untuk karya fisik?"],
    keywords: ["ketentuan umum ujian tugas akhir", "karya fisik ujian", "tugas akhir wajib diuji", "foto video tugas akhir"],
    lead: "Ketentuan umum ujian tugas akhir menurut Pedoman Penyusunan Tugas Akhir UPI 2024:",
    points: [
      "Semua jenis tugas akhir (sarjana, magister, doktor) wajib diuji lewat Ujian Sidang Tugas Akhir.",
      "Mekanisme ujian diatur Peraturan Rektor; kalau ada beda penafsiran, yang berlaku adalah Peraturan Rektor.",
      "Produk tulisan, aplikasi, atau benda fisik yang mudah dibawa wajib diperlihatkan kepada seluruh penguji.",
      "Benda fisik yang tidak bisa dibawa tetapi masih terjangkau: tim penguji mengunjungi lokasi pembuatannya.",
      "Benda fisik yang tidak bisa dibawa dan tidak terjangkau: ditunjukkan lewat 2 foto dan 2 video (karya dan mahasiswa bekerja, kunjungan pembimbing, karya berfungsi, dan pembimbing memperhatikan cara kerjanya).",
      "Ujian dilaksanakan sesuai jadwal dalam SK Dekan atau Direktur Kampus UPI di Daerah, yang boleh menambah tata cara ujian di lingkungannya.",
      "Untuk skripsi, pedoman ini mensyaratkan uji similaritas Turnitin maksimal 25% dan uji deteksi teks Generative AI maksimal 15%. Peraturan Rektor 70/2026 (lebih baru) memakai batas similaritas 25% dan mewajibkan pernyataan penggunaan Generative AI.",
    ],
    closing: "Mau saya jelaskan syarat sidang skripsi terbaru?",
    answer:
      "Menurut Pedoman Penyusunan Tugas Akhir UPI 2024, semua tugas akhir wajib diuji sidang dan produknya ditunjukkan kepada seluruh penguji. Karya fisik yang tidak bisa dibawa diuji di lokasi, atau lewat 2 foto dan 2 video bila tidak terjangkau. Aturan terbaru ada di Peraturan Rektor 70/2026.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital untuk jadwal dan tata cara ujian di kampus Tasikmalaya.",
    ...PEDOMAN_2024,
  },
  {
    id: "perrek38-penilaian",
    category: "Administrasi",
    title: "Penilaian hasil belajar mata kuliah (Peraturan Rektor 38/2026)",
    questions: ["Bagaimana penilaian mata kuliah di UPI?", "Komponen apa saja yang membentuk nilai akhir mata kuliah?"],
    followUps: ["Berapa IPK minimal di semester 4?", "Berapa lama masa studi maksimal S1?"],
    hints: ["Nilai akhir dari apa saja?", "Berapa kali ujian per semester?"],
    keywords: ["penilaian hasil belajar", "nilai akhir mata kuliah", "uts dan uas", "penilaian acuan patokan"],
    lead: "Penilaian hasil belajar menurut Peraturan Rektor Nomor 38 Tahun 2026:",
    points: [
      "Evaluasi memakai pendekatan penilaian berbasis kelas, terdiri atas evaluasi formatif (selama proses) dan sumatif (akhir).",
      "Komponen nilai dapat berasal dari partisipasi, tugas, proyek atau produk, kuis, UTS, dan UAS. Nilai akhir adalah akumulasi komponen berdasarkan Penilaian Acuan Patokan (PAP).",
      "Ujian mata kuliah dilaksanakan paling sedikit dua kali per semester: UTS dan UAS.",
      "Hasil dinyatakan dalam nilai huruf, angka, dan derajat mutu; mata kuliah tertentu boleh berupa Lulus atau Tidak Lulus.",
      "Nilai rata-rata tiap semester dan akhir program dihitung dari nilai mata kuliah dan bobot SKS.",
      "Mahasiswa berhak mengetahui hasil penilaian sebagai umpan balik lewat sistem informasi akademik UPI, dan nilai dilaporkan ke PDDikti.",
    ],
    closing: "Mau saya jelaskan masa studi dan batas drop out?",
    answer:
      "Menurut Peraturan Rektor Nomor 38 Tahun 2026, nilai akhir mata kuliah adalah akumulasi partisipasi, tugas, proyek, kuis, UTS, dan UAS berdasarkan Penilaian Acuan Patokan. Ujian minimal dua kali per semester (UTS dan UAS). Hasil dinyatakan dalam nilai huruf, angka, dan derajat mutu.",
    escalation:
      "Hubungi dosen pengampu atau staf prodi kalau ada keberatan terhadap nilai.",
    ...PERREK_38,
  },
  {
    id: "mandala-bebas-publikasi",
    category: "Kelulusan",
    title: "Aplikasi Mandala: surat keterangan bebas publikasi S2 dan S3",
    questions: ["Apa itu aplikasi Mandala UPI?", "Bagaimana cara mendapatkan surat keterangan bebas publikasi di Mandala?"],
    followUps: ["Bagaimana cek similarity di Mandala?", "Bagaimana cara unggah mandiri tugas akhir di SIAS?"],
    hints: ["Mandala itu untuk apa?", "Dokumen apa yang diunggah untuk verifikasi publikasi?"],
    keywords: ["mandala upi", "aplikasi mandala", "surat keterangan bebas publikasi", "verifikasi publikasi s2 s3"],
    lead: "Aplikasi Mandala (Manajemen Disertasi dan Luaran Akademik) khusus mahasiswa magister dan doktor. Alur surat keterangan bebas publikasi:",
    points: [
      "Mandala dipakai mahasiswa magister dan doktor untuk mendapat surat keterangan bebas publikasi, syarat ujian tahap 1 tesis atau disertasi. Akses di https://mandala.upi.edu dengan akun SSO.",
      "Menu: Data Diri, Daftar Pengajuan, Publikasi, SK Publikasi (Claim), Similarity Check, dan Disertasi.",
      "Ajukan verifikasi publikasi: isi judul artikel, nama jurnal, penerbit, jenis dan status publikasi, akreditasi, indexing, serta tautan jurnal dan profil Scimago.",
      "Unggah PDF: full paper (maks 10 MB), bukti review atau screenshot OJS (maks 3 MB), Letter of Acceptance (maks 1 MB), dan bukti pembayaran (opsional, maks 1 MB).",
      "Status: Menunggu Assignment, lalu Perlu Revisi bila ada catatan (perbaiki dan kirim revisi) atau lolos verifikasi.",
      "Setelah lolos, buka Claim SK Publikasi, pilih publikasi, ajukan klaim, lalu unduh surat keterangan bila statusnya Selesai.",
    ],
    closing: "Mau saya jelaskan cara cek similarity di Mandala?",
    answer:
      "Mandala (mandala.upi.edu, akun SSO) dipakai mahasiswa S2 dan S3 untuk mendapat surat keterangan bebas publikasi sebagai syarat ujian tahap 1. Ajukan verifikasi publikasi dengan data dan PDF (full paper, bukti review, LoA), tunggu verifikasi, lalu klaim SK Publikasi dan unduh bila sudah selesai.",
    escalation:
      "Hubungi P3KI Sekolah Pascasarjana UPI untuk kendala di Mandala.",
    ...MANDALA,
  },
  {
    id: "mandala-similarity-check",
    category: "Penulisan Ilmiah",
    title: "Cek similarity (Turnitin) disertasi lewat aplikasi Mandala",
    questions: ["Bagaimana cara cek similarity disertasi di Mandala?", "Apa yang diunggah untuk similarity check di Mandala?"],
    followUps: ["Apa itu aplikasi Mandala UPI?", "Berapa batas similaritas Turnitin?"],
    hints: ["Cara ajukan similarity check di Mandala?", "Bagaimana kalau hasil similarity perlu revisi?"],
    keywords: ["similarity check mandala", "cek plagiasi disertasi", "turnitin mandala", "unggah bab disertasi"],
    lead: "Cek similarity (Turnitin) disertasi lewat Mandala:",
    points: [
      "Buka menu Similarity Check, klik Ajukan Pengecekan, dan isi judul lengkap disertasi.",
      "Unggah dokumen pendukung .doc/.docx maksimal 10 MB per file: cover dan pernyataan, daftar pustaka, dan lampiran.",
      "Unggah setiap bab terpisah: Bab 1 sampai Bab 5 wajib, Bab 6 bila ada.",
      "Pantau kelengkapan di halaman rekap (misalnya 0/9 bagian) dan buka Lihat Detail untuk skor per bab dan laporan.",
      "Bagian berstatus Perlu Revisi diperbaiki: pilih file, klik Upload Revisi, lalu tunggu status Menunggu Review sampai diverifikasi petugas.",
      "Setelah lolos, berkas bisa diajukan ke komisi disertasi pascasarjana untuk cek kelayakan.",
    ],
    closing: "Mau saya jelaskan cara mendapatkan surat keterangan bebas publikasi?",
    answer:
      "Di Mandala, buka Similarity Check, klik Ajukan Pengecekan, isi judul, unggah cover, daftar pustaka, lampiran, dan tiap bab dalam .doc atau .docx (maks 10 MB). Pantau skor per bab, unggah revisi untuk bagian yang perlu perbaikan, dan setelah lolos ajukan ke komisi disertasi pascasarjana.",
    escalation:
      "Hubungi operator Mandala Sekolah Pascasarjana UPI untuk kendala unggahan.",
    ...MANDALA,
  },
  {
    id: "simkatmawa-bentuk-kegiatan",
    category: "Kelulusan",
    title: "Bentuk kegiatan yang diakui dan rambu penilaiannya (Panduan SIMKATMAWA 2026)",
    questions: ["Kegiatan apa saja yang diakui untuk poin pengalaman belajar?", "Bagaimana kompetisi dinilai untuk poin mahasiswa?"],
    followUps: ["Bagaimana cara mengurus 100 poin ekstrakurikuler untuk sidang?", "Apa itu SKPI?"],
    hints: ["Lomba apa saja yang diakui?", "Apakah PKM diakui untuk poin pengalaman belajar?"],
    keywords: ["kegiatan diakui poin", "pkm program kreativitas mahasiswa", "p2mw", "ppk ormawa", "rambu penilaian kompetisi"],
    lead: "Menurut Panduan SIMKATMAWA Edisi IV (2026), pengalaman belajar dan prestasi mahasiswa yang diakui berasal dari:",
    points: [
      "Program pembinaan mahasiswa: PKM, P2MW (wirausaha), PPK Ormawa, dan program lain dari Kemdiktisaintek.",
      "Kompetisi dan festival, misalnya KBMK (bisnis manajemen dan keuangan), LIDM, GEMASTIK, Kontes Robot Indonesia, KDMI, POMNAS, PEKSIMINAS, dan event nasional atau internasional lain yang relevan.",
      "Pelatihan, workshop, atau kegiatan ko-kurikuler.",
      "Kreativitas kecendekiaan: asistensi bersama dosen dan kepeloporan di bidang akademik.",
      "Penguatan kapasitas organisasi kemahasiswaan (BEM, UKM, HMP).",
      "Perolehan sertifikat kompetensi dan hak kekayaan intelektual (HKI).",
      "Kompetisi dinilai dengan rambu: durasi waktu (DW), prestasi atau luaran (PLP), level event (LE: provinsi, nasional, ASEAN, Asia, dunia), kategori event (KE), jumlah peserta (JP), relevansi bidang ilmu (RI), dan kontribusi pada IKU.",
    ],
    closing: "Mau saya jelaskan cara mengajukan poin untuk syarat sidang?",
    answer:
      "Panduan SIMKATMAWA 2026 mengakui pengalaman belajar dari PKM, P2MW, PPK Ormawa, kompetisi dan festival, pelatihan atau workshop, asistensi dosen dan kepeloporan akademik, penguatan organisasi kemahasiswaan, serta sertifikat kompetensi dan HKI. Kompetisi dinilai dari durasi, prestasi, level, kategori, jumlah peserta, relevansi bidang ilmu, dan kontribusi pada IKU.",
    escalation:
      "Hubungi pembina kemahasiswaan Program Studi Bisnis Digital untuk menilai kegiatan tertentu.",
    ...SIMKATMAWA,
  },
  {
    id: "glosarium-tugas-akhir",
    category: "Glosarium",
    title: "Glosarium: istilah tugas akhir dan sidang (TPTA, similaritas, accepted, published)",
    questions: ["Apa itu TPTA?", "Apa bedanya accepted dan published?"],
    followUps: ["Apa itu uji similaritas?", "Apa itu Generative AI dalam tugas akhir?"],
    hints: ["Apa itu ujian ulang?", "Apa itu penguji eksternal?"],
    keywords: ["apa itu tpta", "pengertian tpta", "apa itu accepted", "apa itu published", "apa itu uji similaritas", "glosarium tugas akhir", "apa itu ujian ulang", "penguji eksternal", "konflik kepentingan", "integritas akademik"],
    lead: "Istilah tugas akhir menurut Peraturan Rektor UPI Nomor 70 Tahun 2026:",
    points: [
      "TPTA (Tim Pertimbangan Tugas Akhir): tim di tingkat program studi yang memberi pertimbangan akademik dalam penyelenggaraan tugas akhir.",
      "Proposal tugas akhir: rencana akademik yang diajukan untuk memperoleh persetujuan sebelum tugas akhir dilaksanakan.",
      "Pembimbing: dosen yang membimbing mahasiswa. Promotor: pembimbing program doktor. Tim penguji: dosen, ahli, atau praktisi yang menguji dan menilai tugas akhir. Penguji eksternal: penguji dari luar UPI yang kompeten di bidangnya.",
      "Ujian sidang tugas akhir: asesmen akademik lewat presentasi, pengujian, pembahasan, dan penilaian tugas akhir. Revisi tugas akhir: perbaikan berdasarkan hasil sidang. Ujian ulang: sidang yang diulang bagi yang belum lulus.",
      "Uji similaritas: pemeriksaan kemiripan karya dengan sumber lain memakai perangkat yang ditetapkan UPI. Integritas akademik: kejujuran, objektivitas, orisinalitas, dan etika dalam tugas akhir.",
      "Generative AI: teknologi kecerdasan artifisial yang menghasilkan konten baru (teks, gambar, audio, video, kode).",
      "Accepted: artikel dinyatakan diterima jurnal untuk diterbitkan. Published: artikel sudah resmi terbit dan dapat ditelusuri.",
      "Publikasi ilmiah: penyebaran karya lewat jurnal, prosiding, buku, bab buku, antologi, atau bentuk lain. Konflik kepentingan: kondisi yang dapat memengaruhi objektivitas pembimbingan, penilaian, atau pengujian.",
    ],
    closing: "Mau saya jelaskan istilah sistem dan singkatan yang sering dipakai (SIAS, SSO, SUMa)?",
    answer:
      "TPTA adalah tim di tingkat prodi yang memberi pertimbangan akademik soal tugas akhir. Uji similaritas memeriksa kemiripan karya dengan sumber lain. Accepted berarti artikel sudah dinyatakan diterima jurnal, sedangkan published berarti sudah resmi terbit. Ujian ulang adalah sidang yang diulang bagi yang belum lulus, dan penguji eksternal adalah penguji dari luar UPI yang kompeten di bidangnya.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital kalau ada istilah yang belum ada di sini.",
    ...PERREK_70_GLOS,
  },
  {
    id: "glosarium-sistem-singkatan",
    category: "Glosarium",
    title: "Glosarium: sistem dan singkatan di UPI (SIAS, SSO, SUMa, SKPI, SKKNI, PA)",
    questions: ["Apa itu SIAS?", "Apa kepanjangan SKPI, SKKNI, dan PA?"],
    followUps: ["Bagaimana cara unggah mandiri tugas akhir di SIAS?", "Apa itu SIMKATMAWA?"],
    hints: ["SIAS dipakai untuk apa?", "Apa itu repository UPI dan SUMa?"],
    keywords: ["apa itu sias", "apa itu sso", "apa itu suma", "apa itu skpi", "apa itu skkni", "apa itu pa dosen", "glosarium singkatan", "apa itu repository upi", "apa itu mkkips", "apa itu sptjm"],
    lead: "Sistem dan singkatan yang sering muncul di dokumen UPI dan Prodi Bisnis Digital:",
    points: [
      "SIAS (Sistem Informasi Administrasi): sistem di sias.upi.edu untuk pengajuan sidang, bebas pustaka, rekomendasi publikasi, dan unggah mandiri. SIAK: sistem informasi akademik (siak.upi.edu).",
      "SSO (Single Sign-On): akun tunggal UPI untuk masuk ke SIAS, Mandala, dan aplikasi lain.",
      "SUMa: panduan unggah mandiri tugas akhir ke repository.upi.edu (perpustakaan.upi.edu/suma). Bebas pustaka: surat keterangan dari Perpustakaan UPI bahwa tidak ada pinjaman atau sanksi.",
      "PA (Pembimbing Akademik): dosen yang mendampingi mahasiswa dan menyetujui rencana studi serta kontrak mata kuliah.",
      "SKPI (Surat Keterangan Pendamping Ijazah): mencatat pengalaman belajar dan prestasi mahasiswa. SKKNI: Standar Kompetensi Kerja Nasional Indonesia, acuan sertifikat kompetensi kerja.",
      "SIMKATMAWA: panduan pengakuan pengalaman belajar dan prestasi mahasiswa (aplikasi di student.upi.edu) untuk poin kelulusan, konversi SKS, dan SKPI.",
      "MKKIPS dan MKKPPS: kelompok mata kuliah keahlian (wajib dan pilihan program studi). PKL: praktik kerja lapangan (magang). SPTJM: surat pernyataan tanggung jawab mutlak untuk magang merdeka. MBKM: Merdeka Belajar Kampus Merdeka.",
      "KBK: Kelompok Bidang Keahlian dosen. P3KI: Pusat Pengembangan Publikasi dan Karya Ilmiah. Mandala: aplikasi manajemen disertasi dan luaran akademik untuk S2 dan S3. UKT: Uang Kuliah Tunggal. UTS dan UAS: ujian tengah dan akhir semester.",
    ],
    closing: "Mau saya jelaskan cara unggah mandiri atau bebas pustaka di SIAS?",
    answer:
      "SIAS (sias.upi.edu) adalah sistem untuk pengajuan sidang, bebas pustaka, rekomendasi publikasi, dan unggah mandiri; masuk memakai akun SSO UPI. SUMa adalah panduan unggah tugas akhir ke repository.upi.edu. PA adalah pembimbing akademik, SKPI adalah surat keterangan pendamping ijazah, dan SKKNI adalah standar kompetensi kerja nasional untuk sertifikat kompetensi.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital kalau ada singkatan yang belum ada di sini.",
    ...GLOS_UMUM,
  },
  {
    id: "glosarium-pedoman-ta",
    category: "Glosarium",
    title: "Glosarium: istilah dalam Pedoman Penyusunan Tugas Akhir UPI 2024",
    questions: ["Apa itu monograf?", "Apa itu payung riset dosen?"],
    followUps: ["Apa itu produk bisnis dan produk kreatif?", "Apa itu P3KI dan KBK?"],
    hints: ["Apa itu artikel ilmiah menurut pedoman?", "Apa itu PMDSU?"],
    keywords: ["apa itu monograf", "apa itu payung riset", "apa itu produk kreatif", "apa itu produk bisnis", "apa itu pmdsu", "apa itu p3ki", "apa itu kbk", "apa itu hak cipta", "apa itu hak paten", "daftar istilah pedoman tugas akhir"],
    lead: "Daftar istilah dalam Pedoman Penyusunan Tugas Akhir Mahasiswa UPI Edisi 2024:",
    points: [
      "Artikel ilmiah: karya ilmiah hasil penelitian penulis yang terbit di jurnal ilmiah terindeks nasional atau internasional.",
      "Monograf: karya tulis mendalam tentang topik tertentu, berupa buku atau laporan panjang.",
      "Payung riset dosen: program yang menyatukan penelitian dosen dalam satu tema besar; proposal skripsi yang bagian dari payung riset tidak wajib seminar proposal.",
      "KBK (Kelompok Bidang Keahlian): kelompok dosen berdasarkan kesamaan keilmuan. P3KI (Pusat Pengembangan Publikasi dan Karya Ilmiah): unit universitas yang membantu mengelola publikasi ilmiah mahasiswa.",
      "Produk bisnis: barang atau jasa untuk operasional perusahaan atau organisasi. Produk kreatif: barang atau layanan dari ide orisinal dan inovatif, fisik atau digital.",
      "Prototype digital: model virtual hasil perangkat lunak desain 3D. Prototype visual: model yang menunjukkan bentuk dan estetika tanpa fokus fungsi.",
      "Katalog: daftar terstruktur produk dengan deskripsi, gambar, dan harga. Booklet: buku kecil berisi informasi ringkas.",
      "Cum laude: penghargaan bagi lulusan ber-IPK tinggi. Hak cipta: hak pencipta atas karya intelektualnya. Hak paten: hak eksklusif penemu atas penemuan baru.",
      "PMDSU (fastrack): program percepatan magister menuju doktor bagi sarjana unggul. RPL: rekognisi pembelajaran lampau.",
      "Direktur Kampus UPI di Daerah: pimpinan kampus di luar kampus utama (Cibiru, Sumedang, Tasikmalaya, Purwakarta, Serang).",
    ],
    closing: "Mau saya jelaskan jenis tugas akhir yang tersedia untuk S1?",
    answer:
      "Menurut Pedoman Penyusunan Tugas Akhir UPI 2024: monograf adalah karya tulis mendalam tentang topik tertentu; payung riset dosen menyatukan penelitian dosen dalam satu tema besar; KBK adalah kelompok dosen sebidang keilmuan; P3KI mengelola publikasi ilmiah mahasiswa; produk bisnis adalah barang atau jasa untuk operasional organisasi; produk kreatif adalah karya dari ide orisinal.",
    escalation:
      "Hubungi staf Program Studi Bisnis Digital kalau ada istilah yang belum ada di sini.",
    ...PEDOMAN_2024_GLOS,
  },
];
