/**
 * Glosarium singkatan dan istilah SAPA UPI.
 *
 * Satu sumber kebenaran, dipakai di dua tempat:
 *  1. lib/search.js (expandAbbreviations) — menambahkan bentuk yang hilang dari
 *     sebuah pertanyaan sebelum dicocokkan, supaya pencarian menemukan topik yang
 *     sama baik ditanya dengan singkatan, bentuk panjangnya, atau istilah gaul
 *     mahasiswa (mis. "dospem"). Menambah satu entri di sini langsung berlaku,
 *     tanpa menyentuh kata kunci tiap topik satu per satu.
 *  2. worker/src/gemini.js (glossaryContext) — disertakan sebagai referensi
 *     istilah di konteks Gemini, supaya jawaban yang mengutip singkatan dari
 *     dokumen (mis. "LoA", "WCU") dijelaskan dengan benar tanpa model menebak.
 *
 * Aturan pengisian:
 *  - `full` dipakai untuk ekspansi pencarian. Hanya diisi kalau istilahnya
 *    benar-benar menentukan satu topik tertentu (ada entri knowledge base yang
 *    membahasnya) — bukan nama layanan yang disebut berulang di banyak topik
 *    (lihat `expandSearch: false` di bawah), supaya ekspansi tidak mendorong
 *    pertanyaan ke topik yang salah.
 *  - `source: "dokumen"` berarti kepanjangannya memang tertulis di salah satu
 *    dokumen sumber. `source: "umum"` berarti istilah akademik yang sudah baku
 *    secara nasional (IPK, SKS), bukan tebakan khusus dokumen ini. Tidak ada
 *    entri yang kepanjangannya ditebak: kalau tidak yakin, `full` dikosongkan
 *    dan hanya `note` yang diisi (lihat TESOL dan SIAS).
 */
export const GLOSSARY = [
  {
    abbr: "ttg",
    full: "teknologi tepat guna",
    note: "Salah satu jalur tugas akhir: karya teknologi untuk masyarakat, diakui setara skripsi.",
    source: "dokumen",
  },
  {
    abbr: "tps",
    full: "tim pertimbangan skripsi",
    note: "Pihak yang memvalidasi LoA publikasi artikel dan penetapan atau penggantian pembimbing.",
    source: "dokumen",
  },
  {
    abbr: "pa",
    full: "pembimbing akademik",
    note: "Dosen tempat konsultasi akademik rutin dan pemeriksaan SKS/IPK — berbeda dari pembimbing skripsi.",
    source: "dokumen",
  },
  {
    abbr: "sk",
    full: "surat keputusan",
    note: "Dasar penetapan dan perpanjangan pembimbing skripsi (\"SK Pembimbing\").",
    source: "dokumen",
  },
  {
    abbr: "loa",
    full: "letter of acceptance",
    note: "Bukti artikel diterima jurnal atau prosiding, disyaratkan untuk jalur artikel.",
    source: "dokumen",
  },
  {
    abbr: "wcu",
    full: "world class university",
    note: "Bagian judul \"Pedoman Penulisan Karya Ilmiah UPI Menuju World Class University\".",
    source: "dokumen",
  },
  {
    abbr: "semhas",
    full: "seminar hasil",
    note: "Tahap presentasi hasil penelitian sebelum ujian sidang.",
    source: "dokumen",
  },
  {
    abbr: "dospem",
    full: "dosen pembimbing",
    note: "Sebutan sehari-hari mahasiswa untuk dosen pembimbing skripsi.",
    source: "umum",
  },
  {
    abbr: "ipk",
    full: "indeks prestasi kumulatif",
    note: "Syarat nilai minimal 2,50 untuk mulai mengambil mata kuliah skripsi.",
    source: "umum",
  },
  {
    abbr: "sks",
    full: "satuan kredit semester",
    note: "Syarat minimal 110 SKS untuk mulai skripsi, 144–152 SKS pada transkrip untuk sidang.",
    source: "umum",
  },
  {
    abbr: "tesol",
    note: "Tes kemampuan bahasa Inggris yang diselenggarakan UPI sendiri (skor minimal 400 untuk sidang).",
    source: "dokumen",
    expandSearch: false,
  },
  {
    abbr: "sias",
    note: "Laman pengajuan administrasi akademik (siak.upi.edu/sias). Dokumen sumber tidak menyebutkan kepanjangannya — jangan menebak.",
    source: "dokumen",
    expandSearch: false,
  },
  {
    abbr: "sinta",
    note: "Indeks akreditasi jurnal nasional Indonesia (Science and Technology Index), dipakai sebagai syarat jalur artikel.",
    source: "umum",
    expandSearch: false,
  },
];

/** Entri yang kepanjangannya ikut dipakai untuk memperluas pencarian. */
const SEARCHABLE = GLOSSARY.filter((item) => item.full && item.expandSearch !== false);

/**
 * Tambahkan bentuk yang hilang (singkatan atau kepanjangannya) ke teks yang
 * sudah dinormalkan, supaya pertanyaan dalam bentuk mana pun menemukan tokoh
 * yang sama dengan dokumen. Aman dipanggil berulang: token duplikat berakhir
 * di dalam Set saat diindeks, jadi tidak mengubah skor.
 */
export function expandAbbreviations(normalizedText) {
  let expanded = normalizedText;
  for (const { abbr, full } of SEARCHABLE) {
    const hasAbbr = new RegExp(`\\b${abbr}\\b`, "i").test(expanded);
    const hasFull = new RegExp(`\\b${full}\\b`, "i").test(expanded);
    if (hasAbbr && !hasFull) expanded += ` ${full}`;
    else if (hasFull && !hasAbbr) expanded += ` ${abbr}`;
  }
  return expanded;
}

/** Baris glosarium untuk prompt Gemini: hanya entri yang punya catatan. */
export function glossaryContext() {
  const lines = GLOSSARY.filter((item) => item.note).map((item) => {
    const expansion = item.full ? `${item.abbr.toUpperCase()} = ${item.full}` : item.abbr.toUpperCase();
    return `- ${expansion}: ${item.note}`;
  });
  return `GLOSARIUM ISTILAH (hanya ini yang pasti; jangan menebak kepanjangan lain):\n${lines.join("\n")}`;
}
