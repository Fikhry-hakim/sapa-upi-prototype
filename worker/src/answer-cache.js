/**
 * Cache jawaban model.
 *
 * Jawaban disusun hanya dari pertanyaan, bahasa, dan kutipan pedoman yang dikirim (kunci acak tetap,
 * tanpa data pengguna), jadi pertanyaan yang sama dengan kutipan yang sama selalu berhak atas jawaban
 * yang sama. Menyimpannya membuat pertanyaan yang sering diulang selesai seketika dan tidak memakai
 * kuota model.
 *
 * Kuncinya SHA-256 dari seluruh masukan model (instruksi, pertanyaan, bahasa, isi kutipan), jadi
 * mengubah knowledge base atau instruksi otomatis membuat jawaban lama tidak terpakai. Hanya hash dan
 * jawaban yang disimpan, tidak pernah teks pertanyaannya. Semua fungsi menelan galat: tanpa tabelnya,
 * jawaban tetap datang dari model.
 */

import { BASE_INSTRUCTION, buildInput } from "./gemini.js";

export const CACHE_TTL_HOURS = 12;
export const MAX_CACHED_ANSWER = 6_000;

const hex = (buffer) => [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");

/** Hash dari semua yang menentukan jawaban. Sama masukan, sama kunci. */
export async function answerCacheKey({ question, entries, lang }) {
  const normalized = String(question ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  const payload = JSON.stringify([BASE_INSTRUCTION, lang, buildInput(normalized, entries, lang, [])]);
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload)));
}

export async function readCachedAnswer(db, key) {
  if (!db || !key) return null;
  try {
    const row = await db
      .prepare(`SELECT answer FROM answer_cache WHERE key = ? AND created_at > datetime('now', ?)`)
      .bind(key, `-${CACHE_TTL_HOURS} hours`)
      .first();
    return row?.answer ?? null;
  } catch {
    return null;
  }
}

export async function writeCachedAnswer(db, key, answer) {
  if (!db || !key || !answer || answer.length > MAX_CACHED_ANSWER) return;
  try {
    await db
      .prepare(`INSERT INTO answer_cache (key, answer) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET answer = excluded.answer, created_at = datetime('now')`)
      .bind(key, answer)
      .run();
    // Sesekali buang yang sudah kedaluwarsa, supaya tabelnya tidak tumbuh tanpa batas.
    if (Math.random() < 0.02) {
      await db.prepare(`DELETE FROM answer_cache WHERE created_at <= datetime('now', ?)`).bind(`-${CACHE_TTL_HOURS} hours`).run();
    }
  } catch {
    // Cache gagal ditulis: tidak apa-apa.
  }
}
