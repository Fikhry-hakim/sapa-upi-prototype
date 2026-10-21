/**
 * Nomor penjelasan di jawaban AI.
 *
 * Setiap kalimat jawaban diberi nomor yang bisa diklik. Mengklik sebuah nomor
 * mengirim pertanyaan lanjutan yang memuat kalimat itu sendiri, sehingga
 * pencarian rujukan menemukan topik yang sama dan jawabannya menjelaskan poin
 * tersebut, bukan menebak "poin 2" dari percakapan.
 */

/**
 * Singkatan yang diikuti titik dan hampir selalu bukan akhir kalimat ("hal. 33",
 * "No. 207", "Prof. Budi"). Singkatan penutup daftar ("dll.", "dst.", "dsb.") sengaja
 * tidak ada di sini: bisa menutup kalimat, dan huruf besar sesudahnya menentukan.
 */
const ABBREVIATIONS = new Set([
  "no", "hal", "mis", "yg", "dgn", "tgl", "sks", "ttd",
  "dr", "drs", "prof", "ir", "mm", "ed", "vol", "cth", "spt", "pp", "bab", "psl",
]);

/** Panjang minimum sebuah kalimat agar layak diberi nomor. */
export const MIN_SENTENCE_LENGTH = 12;

/** Batas panjang pertanyaan yang diterima Worker. */
export const MAX_QUESTION_LENGTH = 300;

const BULLET = /^\s*(?:[-*•]|\d{1,2}[.)])\s+/;

/** Apakah baris ini butir daftar (-, *, •, atau "1.")? */
export function isBullet(line) {
  return BULLET.test(line);
}

export function stripBullet(line) {
  return line.replace(BULLET, "");
}

/**
 * Pecah teks menjadi kalimat. Titik di dalam angka desimal ("29,7 cm", "2.5"),
 * di singkatan ("hal. 33", "dll."), dan di tengah tautan tidak dianggap akhir kalimat.
 */
export function splitSentences(text) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const sentences = [];
  let start = 0;

  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    if (char !== "." && char !== "!" && char !== "?") continue;

    const next = clean[i + 1];
    // Tanda baca di tengah kata atau angka ("2.5", "upi.edu", "a.b").
    if (next !== undefined && next !== " " && next !== '"' && next !== ")" && next !== "”") continue;

    if (char === ".") {
      const word = /([A-Za-z]+)$/.exec(clean.slice(start, i))?.[1]?.toLowerCase();
      if (word && ABBREVIATIONS.has(word)) continue;
      // "hal. 33": titik sesudah singkatan diikuti angka juga bukan akhir kalimat.
      if (/^\s*\d/.test(clean.slice(i + 1, i + 3)) && word && word.length <= 4) continue;
    }

    // Kalimat baru dimulai dengan huruf besar, angka, atau tanda kutip; selain itu lanjut.
    const rest = clean.slice(i + 1).trimStart();
    if (rest && !/^["“(]?[A-Z0-9]/.test(rest)) continue;

    sentences.push(clean.slice(start, i + 1 + (next === '"' || next === ")" || next === "”" ? 1 : 0)).trim());
    start = i + 1 + (next === '"' || next === ")" || next === "”" ? 1 : 0);
  }

  const tail = clean.slice(start).trim();
  if (tail) sentences.push(tail);
  return sentences;
}

/** Kalimat layak bernomor kalau cukup panjang untuk dijelaskan. */
export function isClarifiable(sentence) {
  return sentence.replace(/[^A-Za-z0-9]/g, "").length >= MIN_SENTENCE_LENGTH;
}

/**
 * Pertanyaan lanjutan untuk poin bernomor. Kalimatnya dipotong supaya seluruh
 * pertanyaan muat dalam batas panjang yang diterima Worker.
 */
export function clarifyQuestion(number, sentence) {
  const prefix = `Jelaskan lebih detail poin ${number}: "`;
  const suffix = '"';
  const room = MAX_QUESTION_LENGTH - prefix.length - suffix.length;
  const text = String(sentence).replace(/\s+/g, " ").trim();
  const quoted = text.length > room ? `${text.slice(0, room - 1).trimEnd()}…` : text;
  return `${prefix}${quoted}${suffix}`;
}
