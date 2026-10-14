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
 */

const PEDOMAN_TA = {
  sourceTitle: "Buku Panduan Penyelesaian Tugas Akhir Mahasiswa",
  sourceOwner: "Tim Prodi Bisnis Digital, UPI Kampus Daerah Tasikmalaya",
  validPeriod: "Berlaku sejak April 2023",
  updatedAt: "April 2023",
  sourceRef: "Buku Panduan Penyelesaian Tugas Akhir, Prodi Bisnis Digital",
};

const PEDOMAN_KTI = {
  sourceTitle: "Pedoman Penulisan Karya Ilmiah UPI (Edisi 2024)",
  sourceOwner: "Universitas Pendidikan Indonesia",
  validPeriod: "Edisi 2024",
  updatedAt: "2024",
  sourceRef: "Pedoman Penulisan Karya Ilmiah UPI Menuju WCU, Edisi 2024",
};

const PENGUMUMAN_SEMHAS = {
  sourceTitle: "Pengumuman Ketentuan Pelaksanaan Semhas Jalur Artikel",
  sourceOwner: "Ketua Program Studi Bisnis Digital, Adam Hermawan",
  validPeriod: "Pendaftaran 5–23 Oktober 2026",
  updatedAt: "5 Oktober 2026",
  sourceRef: "Nomor T-207/UN40.C3.4.4/PK.03.03/2026",
};

const SURAT_KEWIRAUSAHAAN = {
  sourceTitle: "Imbauan Pelatihan Kewirausahaan sebagai Syarat Ujian Sidang",
  sourceOwner: "Wakil Direktur Bidang Pendidikan, Kampus UPI Tasikmalaya",
  validPeriod: "Berlaku sejak 10 September 2025",
  updatedAt: "10 September 2025",
  sourceRef: "Nomor B-5577/UN40.C3.1/TA.07.02/2025, merujuk Edaran Direktur Nomor 5572 Tahun 2025",
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
    keywords: ["mengambil skripsi", "kontrak skripsi", "mulai skripsi", "sks", "ipk", "metode penelitian", "110 sks"],
    lead: "Ketentuan umum untuk dapat mengikuti penyelesaian skripsi:",
    points: [
      "Telah menyelesaikan minimal 110 SKS dengan IPK minimal 2,50.",
      "Sudah lulus mata kuliah Metode Penelitian.",
      "Mengontrak mata kuliah skripsi dan disetujui oleh dosen Pembimbing Akademik (PA).",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan langkah pengajuan topik setelah syarat ini terpenuhi.",
    answer:
      "Mahasiswa yang akan mengambil mata kuliah skripsi harus telah menyelesaikan minimal 110 SKS dengan IPK minimal 2,50, sudah lulus mata kuliah Metode Penelitian, serta mengontrak mata kuliah skripsi dengan persetujuan dosen Pembimbing Akademik.",
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
    keywords: ["pembimbing", "dosen pembimbing", "bimbingan", "sk pembimbing", "masa bimbingan"],
    lead: "Ketentuan pembimbingan skripsi di Prodi Bisnis Digital:",
    points: [
      "Jumlah dosen pembimbing sebanyak-banyaknya 2 orang, ditetapkan melalui SK Pembimbing.",
      "Masa pembimbingan 1 semester, dapat diperpanjang selama tidak melebihi masa studi.",
      "Perpanjangan SK pembimbing diperbarui otomatis oleh prodi pada semester berikutnya.",
      "Dosen pembimbing minimal memiliki jabatan akademik asisten ahli.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan mekanisme penggantian pembimbing.",
    answer:
      "Jumlah dosen pembimbing skripsi sebanyak-banyaknya 2 orang dan ditetapkan melalui SK Pembimbing. Masa pembimbingan berlangsung 1 semester dan dapat diperpanjang selama tidak melebihi masa studi yang ditetapkan; perpanjangan SK diperbarui otomatis oleh prodi pada semester berikutnya. Dosen pembimbing minimal berjabatan akademik asisten ahli.",
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
    keywords: ["sidang", "daftar sidang", "persyaratan sidang", "ujian sidang", "berkas", "sias", "tesol", "turnitin"],
    lead: "Pendaftaran ujian sidang dilakukan melalui staf Prodi Bisnis Digital, lalu diteruskan ke bagian akademik. Pengajuan administrasi diakses melalui https://siak.upi.edu/sias. Persyaratannya:",
    points: [
      "3 eksemplar draf skripsi yang telah disahkan pembimbing dan ketua prodi.",
      "LoA publikasi artikel ilmiah yang telah divalidasi Tim Pertimbangan Skripsi.",
      "Kemampuan bahasa Inggris (TESOL dari UPI) dengan skor minimal 400.",
      "Sertifikasi kompetensi nasional atau internasional dari Lembaga Sertifikasi Profesi (LSP) atau sejenis.",
      "Uji kemiripan melalui Turnitin maksimal 35%.",
      "Transkrip nilai lengkap terakhir dengan jumlah SKS 144 sampai 152.",
      "Tidak ada mata kuliah yang mendapat nilai E.",
    ],
    table: {
      title: "Ringkasan Persyaratan Ujian Sidang Jalur Skripsi",
      columns: ["PERSYARATAN", "KETENTUAN"],
      rows: [
        ["Draf skripsi", "3 eksemplar, disahkan pembimbing dan ketua prodi"],
        ["Publikasi artikel", "LoA divalidasi Tim Pertimbangan Skripsi"],
        ["Bahasa Inggris", "TESOL UPI, skor minimal 400"],
        ["Sertifikasi kompetensi", "Nasional/internasional dari LSP atau sejenis"],
        ["Uji similaritas", "Turnitin maksimal 35%"],
        ["Jumlah SKS", "144 sampai 152 pada transkrip terakhir"],
        ["Nilai", "Tidak ada mata kuliah bernilai E"],
      ],
    },
    closing: "Kalau kamu mau, saya bisa jelaskan pelaksanaan ujian sidangnya.",
    answer:
      "Pendaftaran ujian sidang dilakukan melalui staf Prodi Bisnis Digital dan diteruskan ke bagian akademik, dengan pengajuan administrasi melalui laman https://siak.upi.edu/sias. Persyaratannya meliputi 3 eksemplar draf skripsi yang telah disahkan pembimbing dan ketua prodi, LoA publikasi artikel yang divalidasi Tim Pertimbangan Skripsi, TESOL UPI dengan skor minimal 400, sertifikasi kompetensi dari LSP atau sejenis, uji kemiripan Turnitin maksimal 35%, transkrip dengan jumlah SKS 144 sampai 152, dan tidak ada mata kuliah bernilai E. Petugas akademik memverifikasi persyaratan, lalu TPS dan petugas akademik menyusun jadwal ujian sidang.",
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
    keywords: ["pelaksanaan sidang", "penguji", "majelis", "gratifikasi", "konsumsi", "sidang"],
    lead: "Ketentuan pelaksanaan ujian sidang:",
    points: [
      "Satu peserta ujian sidang diuji oleh 3 dosen penguji.",
      "Dosen penguji minimal memiliki jabatan akademik asisten ahli.",
      "Dosen penguji bukan merupakan pembimbing mahasiswa yang bersangkutan.",
      "Majelis sidang terdiri dari tim penguji dan tim pembimbing, dan membuat rekomendasi kelulusan.",
      "TPS berkoordinasi dengan ketua prodi untuk menentukan kelulusan.",
      "Prodi tidak mewajibkan mahasiswa membawa konsumsi atau segala bentuk gratifikasi selama proses pembimbingan sampai sidang akhir.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan kategori hasil ujian sidangnya.",
    answer:
      "Ujian sidang dilaksanakan dengan komposisi satu peserta yang diuji oleh 3 dosen penguji berjabatan akademik minimal asisten ahli, dan penguji bukan merupakan pembimbing mahasiswa tersebut. Majelis sidang yang terdiri dari tim penguji dan tim pembimbing membuat rekomendasi kelulusan, lalu TPS berkoordinasi dengan ketua prodi untuk menentukannya. Prodi tidak mewajibkan mahasiswa membawa konsumsi atau bentuk gratifikasi apa pun selama proses pembimbingan sampai sidang akhir.",
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
    keywords: ["hasil sidang", "kelulusan", "yudisium", "revisi", "perbaikan", "lulus", "gagal"],
    lead: "Yudisium adalah prosesi peresmian kelulusan mahasiswa dalam menempuh sidang. Hasil ujian dikategorikan menjadi:",
    points: [
      "Lulus tanpa perbaikan.",
      "Lulus dengan perbaikan kecil/minor — waktu perbaikan paling lama 2 minggu sejak tanggal ujian, meliputi judul, abstrak, daftar pustaka, dan kebahasaan.",
      "Lulus dengan perbaikan besar/substansial — waktu perbaikan paling lama 30 hari sejak tanggal ujian, meliputi perubahan orientasi penelitian, analisis data, dan kerangka analisis.",
      "Gagal.",
      "Mahasiswa yang lulus dengan perbaikan melakukan revisi sesuai saran penguji bersama dosen pembimbing.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan proses setelah revisi sampai pemberkasan wisuda.",
    answer:
      "Hasil ujian sidang dikategorikan menjadi empat: lulus tanpa perbaikan; lulus dengan perbaikan kecil atau minor dengan waktu perbaikan paling lama 2 minggu sejak tanggal ujian yang meliputi judul, abstrak, daftar pustaka, dan kebahasaan; lulus dengan perbaikan besar atau substansial dengan waktu paling lama 30 hari yang meliputi perubahan orientasi penelitian, analisis data, dan kerangka analisis; serta gagal. Yudisium merupakan prosesi peresmian kelulusan mahasiswa.",
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
    keywords: ["wisuda", "pemberkasan", "wisudawan", "cd", "perpustakaan", "sias"],
    lead: "Pemberkasan wisuda dilakukan setelah skripsi disahkan:",
    points: [
      "Mahasiswa memperbarui data wisudawan melalui https://siak.upi.edu/sias.",
      "Menyerahkan skripsi yang telah disahkan pembimbing dan ketua prodi.",
      "Menyerahkan skripsi dan CD ke Perpustakaan serta dosen pembimbing.",
      "Menyerahkan CD ke Program Studi.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan ketentuan penjilidan sebelum pemberkasan.",
    answer:
      "Mahasiswa melakukan pembaruan data wisudawan melalui laman https://siak.upi.edu/sias. Persyaratan wisuda meliputi skripsi yang telah disahkan oleh pembimbing dan ketua prodi, penyerahan skripsi dan CD ke Perpustakaan dan dosen pembimbing, serta penyerahan CD ke Program Studi, di samping persyaratan lainnya.",
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
    keywords: ["sidang artikel", "syarat sidang", "jalur artikel", "loa", "bimbingan", "tesol"],
    lead: "Persyaratan ujian sidang bagi mahasiswa jalur artikel ilmiah:",
    points: [
      "3 eksemplar artikel yang telah diterbitkan, atau yang telah mendapat LoA beserta bukti bayar, dengan LoA divalidasi Tim Pertimbangan Skripsi.",
      "Kemampuan bahasa Inggris (TESOL) dengan skor minimal 400.",
      "Sertifikasi kompetensi nasional atau internasional dari Lembaga Sertifikasi Profesi (LSP) atau sejenis.",
      "Tidak ada mata kuliah bernilai E pada transkrip nilai terakhir.",
      "Bukti bimbingan minimal 10 kali, berupa buku bimbingan yang ditandatangani pembimbing.",
      "Dosen pembimbing dan ketua prodi memvalidasi pengajuan melalui https://siak.upi.edu/sias.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan pelaksanaan ujian sidangnya.",
    answer:
      "Persyaratan ujian sidang jalur artikel meliputi 3 eksemplar artikel yang telah diterbitkan atau yang telah mendapatkan LoA beserta bukti bayar dengan LoA divalidasi Tim Pertimbangan Skripsi, TESOL dengan skor minimal 400, sertifikasi kompetensi dari LSP atau sejenis, tidak ada mata kuliah bernilai E pada transkrip terakhir, serta bukti bimbingan minimal 10 kali berupa buku bimbingan yang ditandatangani pembimbing. Dosen pembimbing dan ketua prodi memvalidasi pengajuan melalui laman https://siak.upi.edu/sias.",
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
    keywords: ["ttg", "teknologi tepat guna", "pkm", "lomba", "juara", "inovasi", "karya"],
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
    ],
    followUps: [
      "Berapa batas maksimal similarity?",
      "Bagaimana aturan penggunaan AI?",
      "Bagaimana ketentuan penjilidan skripsi?",
      "Siapa yang harus saya hubungi?",
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
    keywords: ["similaritas", "kemiripan", "turnitin", "plagiat", "plagiarisme", "persen", "ithenticate"],
    lead: "Perlu diperhatikan: dua dokumen resmi menyebut angka yang berbeda, jadi pastikan dulu mana yang diberlakukan untuk jalurmu.",
    points: [
      "Pedoman Penulisan Karya Ilmiah UPI Edisi 2024: kemiripan di bawah 25% diizinkan untuk ujian sidang.",
      "Pedoman UPI Edisi 2024: kemiripan 25%–40% wajib diperbaiki pada bagian yang mirip.",
      "Pedoman UPI Edisi 2024: kemiripan di atas 40% wajib diperbaiki total dan tidak diizinkan untuk ujian sidang.",
      "Buku Panduan Tugas Akhir Prodi Bisnis Digital menyebut uji kemiripan Turnitin maksimal 35% sebagai syarat pendaftaran sidang.",
      "Alat uji yang disebutkan antara lain Turnitin, iThenticate, Grammarly, dan Quetext.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan sanksi atas tindakan plagiat.",
    answer:
      "Dua dokumen resmi menyebutkan batas yang berbeda. Pedoman Penulisan Karya Ilmiah UPI Edisi 2024 menetapkan kemiripan di bawah 25% diizinkan untuk ujian sidang, kemiripan 25% sampai 40% wajib diperbaiki pada bagian yang mirip, dan kemiripan di atas 40% wajib diperbaiki total serta tidak diizinkan untuk ujian sidang. Sementara itu Buku Panduan Penyelesaian Tugas Akhir Prodi Bisnis Digital menyebut uji kemiripan melalui Turnitin maksimal 35% sebagai syarat pendaftaran sidang. Karena keduanya berbeda, mahasiswa perlu memastikan ketentuan mana yang diberlakukan pada jalurnya.",
    escalation:
      "Pastikan batas yang berlaku kepada Tim Pertimbangan Skripsi atau staf prodi sebelum mendaftar sidang, karena dua pedoman menyebut angka berbeda.",
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
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan ketentuan uji similaritas yang berkaitan.",
    answer:
      "Karya tulis ilmiah di UPI dapat dibantu AI dengan ketentuan bahwa AI hanya menjadi alat bantu riset untuk masukan konsep, sementara akurasinya tetap harus berasal dari sumber dan referensi yang relevan. Penulis wajib menuliskan gagasannya dengan kalimat sendiri dan dilarang menyalin langsung hasil AI. AI boleh dipakai untuk merancang kerangka, memperbaiki parafrase, serta membantu tata bahasa dan struktur. Referensi yang diberikan AI wajib diverifikasi. Ide inti, argumen, analisis, dan kesimpulan harus merupakan hasil pemikiran penulis. Penulis wajib menyatakan penggunaan AI dengan melampirkan logbook berupa tangkapan layar pada semua bagian proses berbantuan AI, dan karya tulis yang berbantuan AI maksimal 20%.",
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
    keywords: ["kewirausahaan", "pelatihan", "wajib", "syarat sidang", "penyelesaian studi", "imbauan"],
    lead: "Berdasarkan Edaran Direktur Nomor 5572 Tahun 2025 tentang Pengaturan Pelaksanaan Program Wajib Mahasiswa Sarjana sebagai Syarat Ujian Sidang dan Penyelesaian Studi:",
    points: [
      "Seluruh mahasiswa program sarjana (S1) semester 3 dan 4 (Tingkat II) di lingkungan Kampus UPI Tasikmalaya diwajibkan mengikuti Program Pelatihan Intensif Kewirausahaan.",
      "Kewajiban ini juga berlaku bagi mahasiswa semester 5, 6, dan 7 (Tingkat III dan IV).",
      "Program ini merupakan syarat ujian sidang dan penyelesaian studi.",
    ],
    closing: "Kalau kamu mau, saya bisa jelaskan persyaratan pendaftaran sidang lainnya.",
    answer:
      "Berdasarkan Edaran Direktur Nomor 5572 Tahun 2025 tentang Pengaturan Pelaksanaan Program Wajib Mahasiswa Sarjana sebagai Syarat Ujian Sidang dan Penyelesaian Studi, seluruh mahasiswa program sarjana semester 3 dan 4 (Tingkat II), serta mahasiswa semester 5, 6, dan 7 (Tingkat III dan IV) di lingkungan Kampus UPI Tasikmalaya diwajibkan mengikuti Program Pelatihan Intensif Kewirausahaan. Program ini menjadi syarat ujian sidang dan penyelesaian studi.",
    escalation:
      "Hubungi Wakil Direktur Bidang Pendidikan, Kemahasiswaan dan Penjaminan Mutu Kampus UPI Tasikmalaya untuk jadwal dan bukti keikutsertaan pelatihan.",
    ...SURAT_KEWIRAUSAHAAN,
  },
];
