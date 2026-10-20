/**
 * Pembatasan laju per klien dengan jendela tetap di D1.
 *
 * Kunci klien adalah hash dari IP, bukan IP-nya, supaya tabel ini tidak menjadi
 * daftar alamat pengunjung. Kalau basis data bermasalah, pembatasan dilonggarkan
 * (fail-open): layanan tetap jalan, hanya perlindungannya yang sementara hilang.
 */

import { base64url } from "./auth.js";

/** Hash pendek dan stabil dari alamat klien. */
export async function clientKey(request) {
  const ip = request.headers.get("CF-Connecting-IP") ?? request.headers.get("X-Forwarded-For") ?? "tanpa-ip";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`sapa-upi:${ip}`));
  return base64url(new Uint8Array(digest)).slice(0, 16);
}

/**
 * Catat satu permintaan pada ember `bucket`. Mengembalikan
 * { allowed, retryAfter } — retryAfter dalam detik, hanya berarti kalau ditolak.
 */
export async function hit(db, bucket, { limit, windowMs, now = Date.now }) {
  if (!db) return { allowed: true, retryAfter: 0 };
  const current = now();
  const windowStart = Math.floor(current / windowMs) * windowMs;

  try {
    const row = await db
      .prepare(
        `INSERT INTO rate_limits (bucket, window_start, hits) VALUES (?, ?, 1)
           ON CONFLICT(bucket, window_start) DO UPDATE SET hits = hits + 1
         RETURNING hits`,
      )
      .bind(bucket, windowStart)
      .first();

    // Jendela lama tidak berguna lagi; dibersihkan sesekali agar tabel tidak tumbuh.
    if (row?.hits === 1 && Math.random() < 0.05) {
      await db.prepare("DELETE FROM rate_limits WHERE window_start < ?").bind(windowStart - windowMs * 2).run();
    }

    const hits = row?.hits ?? 1;
    return { allowed: hits <= limit, retryAfter: Math.max(1, Math.ceil((windowStart + windowMs - current) / 1000)) };
  } catch (error) {
    console.warn("rate-limit:", error.message);
    return { allowed: true, retryAfter: 0 };
  }
}
