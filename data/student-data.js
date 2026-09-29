export const student = {
  name: "Rizky Pratama",
  nim: "2304068",
  program: "S1 Bisnis Digital",
  faculty: "Fakultas Pendidikan Ekonomi dan Bisnis",
  semesterLabel: "Semester 8 • Tingkat Akhir",
  status: "Aktif Terdaftar",
  gpa: "3.78",
  gpaPredicate: "Dengan Pujian",
  sksCompleted: 140,
  sksTotal: 144,
  advisor1: { name: "Prof. Dr. H. M. Soleh, M.I", role: "Pembimbing I", progress: "8/8 Selesai", done: true },
  advisor2: { name: "Dr. Ratna Juwita, M.Si", role: "Pembimbing II", progress: "7/8 Selesai", done: false },
};

export const krsPlan = {
  semester: "Semester Ganjil 2025/2026",
  status: "Final Valid",
  totalSks: 22,
  maxSks: 24,
  loadPercent: 91.8,
  approvedBy: "Disetujui DPA",
  approverName: "Prof. Dr. H. M. Soleh",
  approverNip: "NIP: 19680512198403",
  gpaLast: "3.78",
  gpaPredicate: "Predikat: Terpuji",
  revisionDaysLeft: 2,
  revisionDeadline: "Batas: 14 Feb, 23:59",
  signatureToken: "UPI-SIAKAD-2025-GENAP-D089240",
  curriculum: "Kurikulum OBE 2024",
  courses: [
    {
      code: "BD-301",
      name: "Strategi Pemasaran Digital Lanjutan",
      note: "Prasyarat: BD-202 (Lulus)",
      sks: 3,
      cls: "A",
      schedule: "Senin, 07:00–09:30",
      room: "Lab FPEB 302",
      status: "Terverifikasi",
    },
    {
      code: "BD-304",
      name: "Analitika Big Data & Business Intelligence",
      note: "Prasyarat: STAT-101 (Lulus)",
      sks: 3,
      cls: "B",
      schedule: "Selasa, 09:30–12:00",
      room: "Lab Komputer 4",
      status: "Terverifikasi",
    },
    {
      code: "BD-308",
      name: "Manajemen Fintech & Pembayaran Digital",
      note: "Konsentrasi: Perbankan Digital",
      sks: 3,
      cls: "A",
      schedule: "Rabu, 13:00–15:30",
      room: "Gd. FPEB Lt.4 R.401",
      status: "Terverifikasi",
    },
    {
      code: "BD-312",
      name: "Metodologi Penelitian Bisnis & Skripsi",
      note: "Kolektif Proposal Pra-Skripsi",
      sks: 4,
      cls: "A",
      schedule: "Kamis, 08:00–11:20",
      room: "Aud. Microteaching FPEB",
      status: "Terverifikasi",
    },
  ],
};

export const jadwalKuliah = {
  period: "Ganjil 2025/2026",
  program: "S1 Bisnis Digital + FPEB UPI Bandung",
  note: "Ruang Fisik Kampus Bumi Siliwangi & Sinkronisasi Kelas Hybrid LMS SPOT UPI",
  days: [
    { label: "Senin", date: "6 Okt" },
    { label: "Selasa", date: "7 Okt" },
    { label: "Rabu", date: "8 Okt" },
    { label: "Kamis", date: "9 Okt", active: true },
    { label: "Jumat", date: "10 Okt" },
  ],
  classes: [
    {
      day: "Senin",
      time: "07:00–09:00",
      sks: 3,
      course: "Strategi Pemasaran Digital Lanjutan",
      room: "Lab FPEB 302",
      lecturer: "Dr. Ratna Juwita",
    },
    {
      day: "Selasa",
      time: "09:00–12:00",
      sks: 3,
      course: "Analitika Big Data & BI",
      room: "Lab Komputer 4",
      lecturer: "Herdiana Pratama, M.Kom",
    },
    {
      day: "Selasa",
      time: "13:00–15:30",
      sks: 3,
      course: "Bahasa Inggris Bisnis",
      room: "Lab Bahasa 2",
      lecturer: "Wulan Sari, M.Pd",
    },
    {
      day: "Rabu",
      time: "13:00–15:30",
      sks: 3,
      course: "Fintech & Pembayaran Digital",
      room: "R. 401 FPEB",
      lecturer: "Gian Anggoro, Ph.D",
    },
    {
      day: "Kamis",
      time: "08:00–11:30",
      sks: 4,
      course: "Metodologi Penelitian Bisnis Digital",
      room: "Aud. Microteaching",
      lecturer: "Prof. Soleh",
      highlight: true,
    },
    {
      day: "Jumat",
      time: "07:00–08:40",
      sks: 3,
      course: "Etika Profesi & Budaya",
      room: "R. B-201",
      lecturer: "Kang Bagiswatt, M.Hum",
    },
  ],
  detail: {
    code: "BD-409",
    sks: 4,
    tag: "Tatap Muka Prioritas",
    course: "Metodologi Penelitian Bisnis Digital",
    lecturer: "Prof. Dr. H. Soleh, M.M.",
    room: "Auditorium Microteaching FPEB",
    time: "Kamis, 08:00 – 11:30 WIB",
    attendancePercent: 100,
    attendanceLabel: "Kehadiran: 100% (4/4 Hadir)",
    passRequirement: "Syarat UAS: Min. 80%",
  },
};

export const sidangTracker = {
  title: "Pengaruh Adopsi Artificial Intelligence pada Efisiensi Operasional UMKM Sektor Kuliner di Kota Bandung",
  stageLabel: "Tahap 3: Pendaftaran Sidang Terbuka",
  advisor1: "Prof. Dr. H. M. Soleh, M.Pd",
  advisor2: "Dr. Ratna Juwita, M.Si",
  stages: [
    { label: "Judul & Proposal", detail: "Selesai • 100%", date: "10 Okt 2024", state: "done" },
    { label: "Sempro", detail: "Lulus (A / 88.5)", date: "18 Des 2024", state: "done" },
    { label: "Bimbingan & Riset", detail: "8/8 Log SIAKAD", date: "15 Jan 2025", state: "done" },
    { label: "Validasi Sidang", detail: "Sedang Aktif (4/5)", date: "Februari 2025", state: "active" },
    { label: "Sidang Sarjana", detail: "Terjadwal", date: "24–29 Mar 2025", state: "pending" },
    { label: "Revisi & Yudisium", detail: "Belum Dibuka", date: "", state: "pending" },
  ],
  requirementStage: "Tahap 4: Verifikasi Kelayakan Administrasi Sidang",
  requirementNote:
    "4 dari 5 syarat kelayakan akademik dan kepustakaan telah divalidasi oleh Tim Akademik FPEB UPI.",
  progressPercent: 80,
  progressLabel: "1 Verifikasi Tertunda",
  requirements: [
    { name: "SKS Lulus Kumulatif", standard: "Minimal 138 SKS (IPK ≥ 2.50)", actual: "140 SKS (IPK 3.68)", status: "done" },
    { name: "Sertifikat TOEFL/EPT", standard: "Skor Minimal 450 (Balai Bahasa UPI)", actual: "Skor: 485", status: "done" },
    { name: "Uji Bebas Plagiarisme (Turnitin)", standard: "Maksimal Similarity 20%", actual: "Terverifikasi (14%)", status: "done" },
    { name: "Persetujuan Pembimbing I & II", standard: "Tanda tangan digital BSrE", actual: "Menunggu DP2", status: "pending" },
  ],
};

export const administrasiOptions = [
  {
    id: "surat-aktif",
    icon: "note",
    title: "Surat Keterangan Mahasiswa Aktif",
    description:
      "Kebutuhan klaim BPJS Kesehatan, keringanan gaji orang tua (PNS/Swasta), dan verifikasi magang MBKM.",
    footer: "Penerbitan Instan via TTE",
    meta: "Masa Berlaku: 1 Semester",
    active: true,
  },
  {
    id: "surat-riset",
    icon: "doc",
    title: "Surat Pengantar Riset / Skripsi",
    description:
      "Izin riset observasi lapangan, pengambilan data kuisioner, wawancara instansi pemerintah daerah, BUMN, atau swasta mitra.",
    footer: "Verifikasi Dosen Pembimbing (1x24 Jam)",
  },
  {
    id: "cuti",
    icon: "leave",
    title: "Surat Permohonan Cuti Akademik",
    description:
      "Penundaan kegiatan perkuliahan sementara karena kendala finansial mendesak, kendala medis, atau izin luar daerah (Maks. 2 Semester).",
    footer: "Persetujuan Dekan FPEB",
  },
  {
    id: "lomba",
    icon: "trophy",
    title: "Rekomendasi Lomba / Delegasi",
    description:
      "Dispensasi perkuliahan resmi & dukungan keikutsertaan kompetisi ilmiah tingkat nasional (PIMNAS/PKM/LKTIN) atau internasional.",
    footer: "Disetujui Wadek Kemahasiswaan",
  },
];

export const filesArchive = {
  storageUsedGb: 1.2,
  storageTotalGb: 15,
  storagePercent: 8,
  categories: ["Semua Dokumen (12)", "Surat Resmi Terbit (4)", "Transkrip & KHS (3)", "KRS Ber-barcode (2)", "Naskah & Turnitin (3)"],
  documents: [
    {
      name: "Surat_Keterangan_Mahasiswa_Aktif_2304068_2025.pdf",
      meta: "No: 0428/UN40.FPEB/KM/2025",
      tag: "Administrasi TU / Beasiswa",
    },
    {
      name: "Kartu_Rencana_Studi_KRS_Ganjil_2026.pdf",
      meta: "Otorisasi QR SIAKAD UPI",
      tag: "KRS Online SIAKAD",
    },
    {
      name: "Laporan_Hasil_Uji_Turnitin_Skripsi_Bab1_Bab3.pdf",
      meta: "Turnitin Repository Class #884920",
      tag: "Uji Similaritas",
    },
    {
      name: "Transkrip_Akademik_Kumulatif_Sementara_Semester_7.pdf",
      meta: "Bilingual ID/EN • Berstempel Digital",
      tag: "Transkrip Nilai",
    },
  ],
};

export const libraryDocs = {
  indexedCount: "1,280",
  updatedAt: "Diperbarui hari ini, 07:00 WIB",
  categories: ["Semua Fakultas / Unit", "Semua Tipe Dokumen", "Tahun 2024/2025"],
  documents: [
    {
      badge: "Sumber Utama SAPA AI",
      badgeTag: "Terindeks Penuh (100%)",
      title: "Buku Pedoman Penyelenggaraan Pendidikan Tahun Akademik 2024/2025",
      meta: "SK Rektor No. 1042/UN40/HK/2025 • 184 Halaman",
      format: "PDF Resmi Ber-TTE",
      description:
        "Mencakup ketentuan yudisium/cumlaude, batas semester DO, dan kaitan tugas akhir.",
      size: "4.8 MB",
    },
    {
      badge: "Format Baru",
      badgeTag: "Bisnis Digital & Manajemen",
      title: "Standar Operasional Prosedur (SOP) Ujian Sidang Skripsi & Tugas Akhir FPEB 2024/2025",
      meta: "SK Dekan FPEB No. 0418/UN40.F8/AK/2025 • 42 Halaman",
      format: "Prosedur Revisi & Form Bebas Lab",
      description:
        "Mencakup template surat persetujuan pembimbing, format lembar acara ujian komprehensif, dan syarat bebas plagiarisme < 20%.",
      size: "1.9 MB",
    },
  ],
};

export const exploreNews = {
  urgentDeadline: "Tersisa 48 Jam (Batas: 14 Februari 2025, 23:59 WIB)",
  urgentTitle: "Peringatan Kalender Akademik: Masa Pengisian & Perubahan KRS Semester Ganjil 2025/2026 Segera Ditutup",
  urgentBody:
    "Seluruh mahasiswa S1/S2/S3 diwajibkan memastikan seluruh mata kuliah dan beban SKS telah disetujui Dosen Pembimbing Akademik (DPA) pada sistem SIAKAD. Sistem akan terkunci otomatis tanpa perpanjangan mandiri.",
  serverStatus: "Kapasitas server SIAKAD terpantau normal (99.8%)",
  reference: "Rujukan: Surat Edaran Dit-Akademik No. 042/UN40.R1/PK/2025",
  categories: ["Semua Kategori", "Tenggat Waktu Penting (2)", "Regulasi Baru", "MBKM Mandiri", "Beasiswa & Hibah Riset"],
  cards: [
    { icon: "mbkm", title: "MBKM & Rekognisi", tag: "" },
    { icon: "thesis", title: "Tugas Akhir", tag: "Pendaftaran Dibuka" },
    { icon: "finance", title: "Financial & UKT", tag: "" },
  ],
};

export const consultationHistory = {
  totalSessions: 28,
  totalCitations: 84,
  syncedAt: "Hari ini, 09:41",
  categories: ["Semua Topik (28)", "Skripsi & Sidang (12)", "KRS & SKS (8)", "Beasiswa & Financial (5)", "Administrasi & Cuti (3)"],
  sessions: [
    {
      id: "AKD-88219",
      tag: "Arsip & Sesi Ulang",
      title: "Persyaratan Pendaftaran Sidang Sarjana & Timeline Sempro FPEB",
      snippet:
        "Berdasarkan SK Rektor No.1042/UN40/HK/2024 Bab VIII Pasal 24: SKS minimum 138 (Anda 140), TOEFL...",
      meta: "Terenkripsi (SIAKAD)",
      docsCount: "3 Dokumen Terkait",
      followUps: "1 Pertanyaan Lanjutan",
      time: "Hari ini, 09:41 WIB",
    },
    {
      id: "KRS-24120",
      tag: "KRS & Registrasi",
      title: "Konsultasi Penambahan Beban 24 SKS Semester Ganjil 2025/2026",
      snippet:
        "IPK Anda 3.78 memenuhi syarat maksimal 24 SKS sesuai Pedoman Akademik Pasal 18 ayat 3. Rencana...",
      meta: "Kemarin, 14:20 WIB",
      docsCount: "",
      followUps: "",
      time: "Kemarin, 14:20 WIB",
    },
  ],
  activeSession: {
    id: "AKD-88219",
    started: "Dimulai 12 Februari 2025, 09:32 – 09:41 WIB (Durasi 9m 14d)",
    ragAccuracy: "99.4% Verified",
    model: "Llama-3-Academ",
    node: "Bumi Siliwangi #1",
    userMessage:
      "Halo SAPA, saya ingin menanyakan syarat pendaftaran sidang sarjana untuk Program Studi Bisnis Digital FPEB Semester Genap 2024/2025. Apakah syarat SKS dan skor tes bahasa Inggris saya di SIAKAD sudah memenuhi batas regulasi?",
    botLabel: "SAPA UPI Co-Pilot",
    botTag: "RAG Retrieved",
    botTime: "09:34 WIB",
  },
};

export const thesisWorkspace = {
  chapter: "Bab IV",
  chapterNote: "Analisis Data dan Pembahasan Model",
  chapterStatus: "Revisi Catatan Update 2",
  chapterBy: "Dosen",
  turnitinPercent: "11.4%",
  turnitinMax: "Maks 20%",
  turnitinNote: "Standar FPEB Terpenuhi",
  citationCount: "42",
  citationScope: "38 Scopus",
  citationStyle: "APA 7th Ed.",
  files: [
    { name: "Naskah_Skripsi_Bab4_Analisis_SEM_PLS_v3.docx", meta: "4.8 MB • Diubah hari ini, 10:14 WIB", tag: "Tersinkronisasi Drive UPI" },
    { name: "Dataset_Responden_Survei_UMKM_Jabar_N320.xlsx", meta: "1.2 MB • Kemarin, 16:40 WIB", tag: "Anonim Validasi Lolos" },
    { name: "Lembar_Persetujuan_Sidang_Seminar_Hasil_Signed.pdf", meta: "820 KB • 3 Mar 2025", tag: "TTE Kadep Valid" },
  ],
  semhas: { room: "Ruang Sidang FPEB Gedung Baru Lt. 3", date: "14 Maret" },
};
