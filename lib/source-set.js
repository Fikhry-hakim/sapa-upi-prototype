import { citationFor } from "../data/sources.js";

/**
 * Himpunan sumber untuk satu jawaban.
 *
 * Kalau jawaban bersandar pada lebih dari satu dokumen (mis. surat edaran
 * lama dan surat edaran pembaruannya), semuanya ditampilkan, dan yang tanggalnya
 * paling baru ditandai sebagai yang berlaku.
 */

const MONTHS = {
  januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5, juli: 6,
  agustus: 7, september: 8, oktober: 9, november: 10, desember: 11,
};

/** "26 Agustus 2026" → waktu; "Oktober 2026" atau "2024" juga dikenali. Selain itu null. */
export function parseIdDate(text) {
  const raw = String(text ?? "").toLowerCase();
  const year = raw.match(/\b(20\d{2})\b/)?.[1];
  if (!year) return null;
  const monthName = Object.keys(MONTHS).find((name) => raw.includes(name));
  const day = raw.match(/\b(\d{1,2})\s+[a-z]+\s+20\d{2}\b/)?.[1];
  return Date.UTC(Number(year), monthName ? MONTHS[monthName] : 0, day ? Number(day) : 1);
}

/** Bagian nomor surat yang cukup khas untuk dicari di teks jawaban. */
function referenceTokens(ref) {
  const text = String(ref ?? "");
  const tokens = [text];
  const number = text.match(/\b(?:Nomor|No\.?)\s*([A-Za-z0-9\-]+)/i)?.[1];
  if (number) {
    // "T-150/UN40…" → "T-150"; "48" butuh kata "Nomor" di depannya supaya tidak ambigu.
    tokens.push(/\D/.test(number) ? number : `Nomor ${number}`);
  }
  return tokens.filter(Boolean);
}

/** Apakah teks jawaban menyebut dokumen milik entri ini. */
export function mentions(answer, entry) {
  const haystack = String(answer ?? "").toLowerCase();
  return referenceTokens(entry.sourceRef).some((token) => haystack.includes(token.toLowerCase()));
}

/**
 * @param entries entri konteks, urut paling relevan lebih dulu
 * @param answer  teks jawaban; dokumen yang disebut di dalamnya ikut ditampilkan
 * @returns       sumber terurut dari yang terbaru; `newest` hanya bila ada pembanding yang lebih lama
 */
export function sourceSet(entries, answer) {
  const picked = [];
  const seen = new Set();
  entries.forEach((entry, index) => {
    if (!entry?.sourceUrl || seen.has(entry.sourceUrl)) return;
    if (index > 0 && !mentions(answer, entry)) return;
    const citation = citationFor(entry);
    if (!citation) return;
    seen.add(entry.sourceUrl);
    picked.push({ entry, citation, updatedAt: entry.updatedAt ?? "", time: parseIdDate(entry.updatedAt), order: index });
  });

  picked.sort((a, b) => (b.time ?? -Infinity) - (a.time ?? -Infinity) || a.order - b.order);

  const [first, ...rest] = picked;
  const newest = Boolean(first && first.time != null && rest.some((other) => other.time != null && other.time < first.time));
  return picked.map((item, index) => ({ ...item, newest: newest && index === 0 }));
}
