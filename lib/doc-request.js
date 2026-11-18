/**
 * Permintaan berkas: "ada file kalender akademik ga", "minta peraturan rektor 38".
 *
 * Orang yang meminta berkasnya ingin berkasnya, bukan kutipan di dalamnya. Jadi
 * permintaan seperti ini tidak dijawab lewat topik knowledge base (yang membuka
 * dokumen di halaman kutipan dan menyorot kalimatnya), melainkan dicocokkan ke
 * katalog dokumen dan dibuka dari halaman pertama tanpa sorotan.
 *
 * Fungsi di sini murni (tidak menyentuh DOM), supaya bisa diuji.
 */

import { documents } from "../data/sources.js";

/** Nama lain yang dipakai orang untuk satu dokumen; ditambahkan ke judul dan nomor suratnya. */
const ALIASES = {
  "buku-panduan": ["buku panduan ta", "panduan skripsi", "panduan tugas akhir bisnis digital"],
  "pedoman-karya-ilmiah": ["pedoman skripsi", "pedoman penulisan skripsi", "pedoman penulisan"],
  "kalender-akademik-2026": ["kalender akademik", "kalender upi", "kalender"],
  "edaran-48-2026": ["surat edaran ukt", "edaran ukt", "edaran perwalian", "surat edaran 48"],
  "edaran-68-2026": ["surat edaran cuti", "edaran cuti akademik", "surat edaran 68"],
  "edaran-092-2025": ["surat edaran msib", "edaran msib", "laporan msib", "surat edaran 092"],
  "pengumuman-t207": ["pengumuman seminar hasil", "pengumuman t-207"],
  "pengumuman-t150": ["pengumuman irs", "pengumuman perwalian", "pengumuman t-150"],
  "pengumuman-t45": ["pengumuman ttg", "pengumuman t-45", "pengumuman artikel angkatan 2023"],
  "peraturan-rektor-70-2026": ["perrek 70", "peraturan rektor 70", "peraturan rektor tugas akhir", "peraturan sidang dan kelulusan"],
  "peraturan-rektor-38-2026": ["perrek 38", "peraturan rektor 38", "peraturan penyelenggaraan pendidikan", "pedoman penyelenggaraan pendidikan"],
  "ppt-syarat-kelulusan-2025": ["ppt syarat kelulusan", "sosialisasi syarat kelulusan", "slide syarat kelulusan"],
  "pedoman-ta-2024": ["pedoman tugas akhir", "pedoman penyusunan tugas akhir"],
  "panduan-mandala": ["panduan mandala", "aplikasi mandala"],
  "panduan-simkatmawa-2026": ["panduan simkatmawa", "simkatmawa", "panduan kampus berdampak", "pengakuan pengalaman belajar"],
  "panduan-unggah-mandiri": ["unggah mandiri", "panduan suma", "unggah tugas akhir"],
  "panduan-bebas-pustaka": ["bebas pustaka", "panduan bebas pustaka"],
  "buku-magang": ["buku magang", "panduan magang", "petunjuk magang", "buku pkl"],
};

const STOP = new Set(
  (
    "ada adakah punya minta mintain mau tolong kasih kasi berikan bagikan share kirim kirimin mana dimana di ke dari yang untuk " +
    "tentang dan atau dong deh ya sih nih gak ga nggak tidak apa apakah bisa boleh bisakah saya aku gue gua kamu kak min " +
    "tahun nomor no nomer upi universitas pendidikan indonesia terbaru versi lengkap resmi saja aja dokumen berkas file filenya " +
    "dokumennya berkasnya unduh download link tautan pdf docx word ppt slide buku"
  ).split(" "),
);

/** Kata yang menandai orang sedang meminta sebuah berkas. */
const FILE_WORD = /\b(file|filenya|berkas|berkasnya|dokumen|dokumennya|pdf|ppt|docx|unduh|download|downloadnya|linknya|lampiran)\b/i;

/** "ada surat edaran cuti" tanpa kata file tetap permintaan berkas bila menyebut jenis dokumennya. */
const DOC_TYPE = /\b(ada|punya|minta|kasih|mana)\b.*\b(surat edaran|edaran|pengumuman|peraturan rektor|perrek|pedoman|panduan|kalender akademik|buku)\b/i;

const normalize = (text) =>
  String(text ?? "")
    .toLowerCase()
    .replace(/[‐‑–—]/g, "-")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokens = (text) =>
  normalize(text)
    .split(/[\s-]+/)
    .filter((word) => word && (word.length >= 3 || /^\d+$/.test(word) || /^[a-z]$/.test(word)));

const index = Object.entries(documents).map(([id, doc]) => {
  const haystack = [doc.title, doc.reference, ...(ALIASES[id] ?? [])].join(" ");
  return { id, doc, words: new Set(tokens(haystack)), aliases: (ALIASES[id] ?? []).map(normalize) };
});

export function isFileRequest(question) {
  const text = String(question ?? "");
  return FILE_WORD.test(text) || DOC_TYPE.test(text);
}

/**
 * Dokumen yang dimaksud pertanyaan, paling cocok lebih dulu. Daftar kosong bila
 * pertanyaannya bukan permintaan berkas, atau tidak jelas dokumen yang mana.
 *
 * @returns {{ id: string, doc: object, score: number }[]}
 */
export function findRequestedDocuments(question, { max = 4 } = {}) {
  if (!isFileRequest(question)) return [];

  const text = normalize(question);
  const asked = tokens(text).filter((word) => !STOP.has(word));
  if (!asked.length) return [];

  const scored = index
    .map(({ id, doc, words, aliases }) => {
      const hits = asked.filter((word) => words.has(word)).length;
      // Nama lain yang disebut utuh ("peraturan rektor 38") bernilai lebih daripada kata lepas.
      const aliasBonus = aliases.some((alias) => alias.length >= 6 && text.includes(alias)) ? 2 : 0;
      return { id, doc, hits, score: hits + aliasBonus, coverage: hits / asked.length };
    })
    .filter((item) => item.hits > 0 && (item.coverage >= 0.6 || item.score >= 3))
    .sort((a, b) => b.score - a.score || b.coverage - a.coverage);

  if (!scored.length) return [];
  const best = scored[0];
  const close = scored.filter((item) => item.score >= best.score * 0.8);
  // Dua dokumen yang sama kuat dan sama-sama menyebut jenis yang sama: tampilkan keduanya.
  return (close.length === 1 ? [best] : close.slice(0, max)).map(({ id, doc, score }) => ({ id, doc, score }));
}

/** Kalimat pembuka untuk daftar berkas yang cocok. */
export function fileRequestMessage(found, lang = "id") {
  const en = lang === "en";
  if (found.length === 1) {
    const title = found[0].doc.title;
    return en
      ? `Yes, the file is available: ${title}. Open it from the card below, from the first page, or download it.`
      : `Ya, berkasnya ada: ${title}. Buka lewat kartu di bawah dari halaman pertama, atau unduh langsung.`;
  }
  return en
    ? "Several files match. Pick the one you mean:"
    : "Ada beberapa berkas yang cocok. Pilih yang kamu maksud:";
}

/* ------------------------------------------------------------ daftar dokumen */

const DOC_WORD = /\b(dokumen|dokumennya|berkas|berkasnya|file|filenya)\b/i;
const LIST_WORD = /\b(apa\s*(saja|aja)|daftar|list|katalog|semua)\b/i;
const KB_WORD = /\b(kb|knowledge\s*base|basis\s*pengetahuan|tersedia|(yang\s+)?(sudah\s+|udah\s+)?ada|punya|dimiliki|terdaftar|sapa)\b/i;

/**
 * Pertanyaan tentang isi koleksi itu sendiri: "dokumen apa aja yang udah ada di knowledge base".
 * Bukan topik di dalam dokumen, jadi tidak ada entri yang bisa menjawabnya; katalog dokumenlah yang menjawab.
 * "dokumen apa saja yang diperlukan untuk sidang" bukan pertanyaan seperti ini: tidak menyebut koleksinya.
 */
export function isCatalogQuestion(question) {
  const text = String(question ?? "");
  if (!DOC_WORD.test(text)) return false;
  if (/\b(daftar|list|katalog)\s+(dokumen|berkas|file)\b/i.test(text)) return true;
  return LIST_WORD.test(text) && KB_WORD.test(text);
}

/** Dokumen resmi yang bisa dibuka; template formulir dihitung terpisah karena bukan bahan bacaan. */
export function catalogDocuments() {
  const entries = Object.entries(documents).filter(([, doc]) => !doc.uploaded);
  const official = entries.filter(([id]) => !id.startsWith("template-")).map(([id, doc]) => ({ id, doc }));
  const templates = entries.length - official.length;
  return { official, templates };
}

export function catalogMessage(count, templates, lang = "id") {
  if (lang === "en") {
    return `These are the official documents available in SAPA UPI (${count} documents).${
      templates ? ` There are also ${templates} form templates; ask for one by name, for example "proposal seminar template".` : ""
    }`;
  }
  return `Berikut dokumen resmi yang tersedia di SAPA UPI (${count} dokumen).${
    templates ? ` Ada juga ${templates} template formulir; minta satu per satu, misalnya "template sempro".` : ""
  }`;
}
