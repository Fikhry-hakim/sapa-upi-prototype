/**
 * Umpan balik singkat setelah jawaban: Buruk, Cukup, atau Baik.
 *
 * Tidak ada teks pertanyaan dan tidak ada identitas pengguna yang disimpan,
 * sama seperti tabel events. Penilaian hanya disertai jenis jawaban dan topik
 * rujukannya, supaya Dashboard bisa menunjukkan topik mana yang sering dinilai
 * kurang tanpa menjadi arsip apa yang ditanyakan mahasiswa.
 */

import { sqlTime } from "./events.js";

export const RATINGS = ["buruk", "cukup", "baik"];
export const KINDS = ["ai", "offline", "fallback"];

/** Isian yang sah, atau null. */
export function checkFeedback(body) {
  const rating = String(body?.rating ?? "");
  const kind = String(body?.kind ?? "");
  if (!RATINGS.includes(rating) || !KINDS.includes(kind)) return null;
  const entryId = String(body?.entryId ?? "").trim().slice(0, 80);
  return { rating, kind, entryId: entryId || null };
}

export async function recordFeedback(db, value) {
  if (!db) return;
  await db
    .prepare("INSERT INTO feedback (rating, kind, entry_id) VALUES (?, ?, ?)")
    .bind(value.rating, value.kind, value.entryId)
    .run();
}

/** Jumlah per penilaian dalam rentang waktu, ditambah topik yang paling sering dinilai buruk. */
export async function feedbackSummary(db, window) {
  const { results } = await db
    .prepare("SELECT rating, COUNT(*) AS n FROM feedback WHERE at >= ? AND at < ? GROUP BY rating")
    .bind(sqlTime(window.start), sqlTime(window.end))
    .all();

  const counts = Object.fromEntries(RATINGS.map((rating) => [rating, 0]));
  for (const row of results ?? []) if (row.rating in counts) counts[row.rating] = row.n;
  const total = RATINGS.reduce((sum, rating) => sum + counts[rating], 0);

  return {
    total,
    counts,
    // Persentase penilaian "baik"; null kalau belum ada penilaian sama sekali.
    goodShare: total ? Math.round((counts.baik / total) * 1000) / 10 : null,
  };
}
