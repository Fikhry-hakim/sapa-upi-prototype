/**
 * Saran pertanyaan berikutnya untuk placeholder kotak ketik.
 *
 * Saran dipilih dari `hints` (dan saran lanjutan) topik yang sedang dibahas, yang
 * paling dekat dengan kata-kata yang baru ditanyakan: tanya "UTS", saran yang muncul
 * soal UTS; tanya "nilai UAS", saran yang muncul soal UAS. Pertanyaan yang sudah
 * ditanyakan sendiri tidak disarankan lagi.
 */

import { toIndonesianQuery } from "./en-terms.js";

const FILLER = new Set([
  "kapan", "apa", "apakah", "bagaimana", "berapa", "siapa", "dimana", "mana", "yang", "di", "ke", "dan", "atau",
  "untuk", "saya", "si", "itu", "ini", "adalah", "ada", "dengan", "dari", "pada", "bisa", "boleh", "dong", "sih",
  "aja", "nih", "mau", "tanya", "tolong", "kah", "ya", "gimana", "cara", "saja", "lah", "sebagai", "oleh",
  "jelaskan", "lebih", "detail", "lanjut", "poin", "mengenai", "tentang", "kalau", "jika", "akan",
  // Nama institusi disebut di hampir semua pertanyaan dan tidak membedakan topik.
  "upi", "universitas", "kampus", "tasikmalaya", "prodi", "program", "studi",
]);

const words = (text) =>
  String(text ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !FILLER.has(w));

const isContactRequest = (q) => /hubungi/i.test(q);

/** Saran terbaik untuk `entry` setelah `asked` ditanyakan, atau null kalau tidak ada yang layak. */
export function pickSuggestion(entry, asked, { lang = "id" } = {}) {
  if (!entry) return null;
  // Hanya `hints`: tiap hint sudah dipastikan bisa dijawab. Saran lanjutan lama dipakai kalau topik belum punya hint.
  const source = entry.hints?.length ? entry.hints : entry.followUps ?? [];
  const pool = [...new Set(source)].filter(
    (q) => typeof q === "string" && q.trim() && !isContactRequest(q),
  );
  if (!pool.length) return null;

  const askedText = lang === "en" ? toIndonesianQuery(asked) : String(asked ?? "");
  const askedWords = new Set(words(askedText));
  // Singkatan huruf kapital (UTS, UAS, IRS) adalah penunjuk topik yang paling jelas; bobotnya lebih besar.
  const abbreviations = new Set((askedText.match(/\b[A-Z]{2,}\b/g) ?? []).map((w) => w.toLowerCase()));
  const boost = (t) => (abbreviations.has(t) ? 3 : 1);
  const tokensOf = new Map(pool.map((q) => [q, words(q)]));
  // Kata yang muncul di banyak saran ("semester") kurang membedakan daripada yang jarang ("UAS").
  const df = new Map();
  for (const tokens of tokensOf.values()) for (const t of new Set(tokens)) df.set(t, (df.get(t) ?? 0) + 1);

  let best = null;
  let bestScore = -1;
  let fallback = null; // kalau semua kandidat mirip pertanyaan tadi: yang paling tidak mirip
  let fallbackRatio = Infinity;
  for (const candidate of pool) {
    const tokens = tokensOf.get(candidate);
    const shared = tokens.filter((t) => askedWords.has(t));
    const total = tokens.reduce((sum, t) => sum + 1 / df.get(t), 0) || 1;
    const sharedWeight = shared.reduce((sum, t) => sum + 1 / df.get(t), 0);
    const ratio = sharedWeight / total;
    const score = shared.reduce((sum, t) => sum + boost(t) / df.get(t), 0);
    if (tokens.length && shared.length === tokens.length) continue; // persis yang ditanyakan
    // Dianggap sudah ditanyakan: hampir semua bobotnya cocok (>= 75%), atau dua kata pembeda cocok sekaligus.
    const distinctive = shared.filter((t) => df.get(t) === 1).length;
    if (askedWords.size && (ratio >= 0.75 || distinctive >= 2)) {
      if (ratio < fallbackRatio) {
        fallback = candidate;
        fallbackRatio = ratio;
      }
      continue;
    }
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  // Saran yang cocok sedikit dengan pertanyaan tadi tetap lebih berguna daripada saran yang tidak nyambung.
  return bestScore > 0 || !fallback ? best : fallback;
}
