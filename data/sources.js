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
  "sanksi-plagiat": { page: 51, highlight: "Pelanggaran plagiarisme dalam karya ilmiah, pihak UPI akan melakukan tindakan tegas" },
};

/** Rujukan lengkap untuk sebuah topik, atau null kalau tidak punya berkas. */
export function citationFor(entry) {
  const id = documentIdForFile(entry?.sourceUrl);
  if (!id) return null;
  const hit = citations[entry.id] ?? { page: 1, highlight: "" };
  return { documentId: id, document: documents[id], ...hit };
}
