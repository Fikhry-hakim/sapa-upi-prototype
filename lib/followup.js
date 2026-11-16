/**
 * Percakapan yang nyambung.
 *
 * Mahasiswa jarang mengulang topiknya: "berarti aku ikut yang mana?", "kalau telat
 * gimana?", "angkatan 2023 kapan?". Pertanyaan seperti itu tidak bisa dicari sendirian.
 * Modul ini memutuskan kapan sebuah pertanyaan melanjutkan percakapan, dan menyusun
 * kueri pencarian dari beberapa giliran sebelumnya.
 */

export const MAX_TURNS = 3;
export const MAX_TURN_QUESTION = 300;
export const MAX_TURN_ANSWER = 500;

/** Kata yang menunjuk ke sesuatu yang sudah dibahas, atau menyambung ke ucapan sebelumnya. */
const ANAPHORA =
  /\b(berarti|jadi|terus|lalu|trus|kalau begitu|kalo gitu|kalau gitu|kalo begitu|tadi|itu|tersebut|yang mana|yang itu|yang tadi|kok|bedanya|beda|sama aja|gimana kalau|bagaimana kalau|kalau|kalo)\b/i;

const SHORT_WORDS = 7;
/** Skor pencarian di atas ini berarti pertanyaan itu punya topik sendiri. */
export const OWN_TOPIC_SCORE = 60;

/** Rapikan riwayat dari klien: hanya teks, dibatasi panjang dan jumlah giliran. */
export function cleanHistory(history, previous = null) {
  let turns = Array.isArray(history) ? history : [];
  if (!turns.length && typeof previous === "string" && previous.trim()) turns = [{ q: previous }];
  return turns
    .filter((turn) => turn && typeof turn.q === "string" && turn.q.trim())
    .slice(-MAX_TURNS)
    .map((turn) => ({
      q: turn.q.trim().slice(0, MAX_TURN_QUESTION),
      a: typeof turn.a === "string" ? turn.a.trim().slice(0, MAX_TURN_ANSWER) : "",
      entryId: typeof turn.entryId === "string" ? turn.entryId.slice(0, 80) : null,
    }));
}

function wordCount(text) {
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

/** Apakah pertanyaan ini terdengar seperti lanjutan dari yang sebelumnya. */
export function soundsLikeFollowUp(question) {
  return wordCount(question) <= SHORT_WORDS || ANAPHORA.test(question);
}

/**
 * Perlukah pencarian memakai riwayat?
 *
 * - tanpa riwayat: tidak
 * - tidak ada yang cocok, atau cocok ke banyak topik: ya
 * - kata penyambung ("berarti", "kok", "kalau") atau sangat pendek, dan topiknya sendiri
 *   belum kuat: ya
 * Pertanyaan yang jelas topiknya sendiri tetap dicari sendiri, supaya ganti topik tidak
 * terseret topik sebelumnya.
 */
export function needsContext(question, own, history) {
  if (!history.length) return false;
  if (!own || !own.entries?.length || own.status === "ambiguous") return true;
  if (!soundsLikeFollowUp(question)) return false;
  return ANAPHORA.test(question) ? (own.score ?? 0) < 120 : (own.score ?? 0) < OWN_TOPIC_SCORE;
}

/** Kueri gabungan: pertanyaan dari dua giliran terakhir, lalu pertanyaan baru. */
export function contextQuery(question, history, translate = (text) => text) {
  const earlier = history.slice(-2).map((turn) => translate(turn.q));
  return [...earlier, question].join(" ");
}

/**
 * Susun entri konteks setelah pencarian memakai riwayat.
 *
 * Yang muncul di pencarian sendiri DAN pencarian gabungan didahulukan: itu topik yang
 * ditanyakan sekarang sekaligus nyambung ke percakapan. Kalau pertanyaannya tidak punya
 * topik sendiri sama sekali, topik jawaban terakhir ikut sebagai pegangan.
 */
export function mergeContext(own, combined, last = null, limit = 3) {
  const ids = new Set((own?.entries ?? []).map((entry) => entry.id));
  const both = combined.entries.filter((entry) => ids.has(entry.id));
  const rest = combined.entries.filter((entry) => !ids.has(entry.id));
  const anchor = last && !(own?.entries?.length) ? [last] : [];
  const seen = new Set();
  return [...both, ...anchor, ...rest].filter((entry) => (seen.has(entry.id) ? false : seen.add(entry.id))).slice(0, limit);
}

/**
 * Pertanyaan yang terdengar seperti lanjutan tapi topiknya sendiri sudah jelas ("di kalender
 * akademik kok berbeda") tetap perlu topik jawaban sebelumnya di konteks, sebagai pembanding.
 * Ditaruh setelah entri pertama supaya topik pertanyaan sekarang tetap yang utama.
 */
export function withAnchor(entries, lasts, limit = 3) {
  const anchors = (Array.isArray(lasts) ? lasts : [lasts]).filter(Boolean);
  if (!anchors.length || !entries.length) return entries;
  const have = new Set(entries.map((entry) => entry.id));
  const extra = anchors.filter((entry) => !have.has(entry.id));
  return [entries[0], ...extra, ...entries.slice(1)].slice(0, limit);
}

/** Entri dari jawaban-jawaban sebelumnya, yang terakhir lebih dulu, tanpa duplikat. */
export function lastEntries(history, knowledgeBase, excluded = new Set(), max = 2) {
  const ids = [];
  for (const turn of [...history].reverse()) if (turn.entryId && !ids.includes(turn.entryId)) ids.push(turn.entryId);
  return ids
    .map((id) => knowledgeBase.find((entry) => entry.id === id))
    .filter((entry) => entry && !excluded.has(entry.sourceUrl))
    .slice(0, max);
}
