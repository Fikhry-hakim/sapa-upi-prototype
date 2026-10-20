/**
 * Masuk dengan email dan kata sandi.
 *
 * Akun tidak bisa dibuat dari sini. Kata sandi hanya bisa dipasang oleh
 * pemilik akun yang sudah masuk lewat Google (email UPI-nya sudah terbukti),
 * jadi tidak ada cara mendaftar atas nama email orang lain.
 *
 * Yang disimpan adalah hasil PBKDF2 beserta garam acak, tidak pernah kata
 * sandinya. Percobaan gagal dibatasi per email, dan pesan galat sama untuk
 * email tak dikenal, akun tanpa kata sandi, dan kata sandi salah.
 */

import { base64url } from "./auth.js";

export const PBKDF2_ITERATIONS = 100_000; // batas tertinggi yang diizinkan Workers
export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_FAILURES = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;

const encoder = new TextEncoder();

function fromBase64url(text) {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(text.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

/** "pbkdf2$iterasi$garam$hash", semuanya base64url. */
export async function hashPassword(password, randomValues = crypto.getRandomValues.bind(crypto)) {
  const salt = randomValues(new Uint8Array(16));
  const hash = await derive(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${base64url(salt)}$${base64url(hash)}`;
}

/** Perbandingan waktu tetap, supaya lamanya tidak membocorkan seberapa mirip. */
function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function verifyPassword(password, stored) {
  const [scheme, iterations, salt, hash] = String(stored ?? "").split("$");
  if (scheme !== "pbkdf2" || !iterations || !salt || !hash) return false;
  const expected = fromBase64url(hash);
  const actual = await derive(password, fromBase64url(salt), Number(iterations));
  return sameBytes(actual, expected);
}

/** Galat kebijakan dalam bahasa pengguna, atau null kalau kata sandinya boleh. */
export function passwordProblem(password, email = "") {
  if (typeof password !== "string") return "Kata sandi wajib diisi.";
  if (password.length < MIN_PASSWORD_LENGTH) return `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  if (password.length > MAX_PASSWORD_LENGTH) return `Kata sandi maksimal ${MAX_PASSWORD_LENGTH} karakter.`;
  const local = String(email).split("@")[0].toLowerCase();
  if (local.length >= 4 && password.toLowerCase().includes(local)) return "Kata sandi tidak boleh memuat nama email.";
  if (/^(.)\1+$/.test(password)) return "Kata sandi terlalu mudah ditebak.";
  return null;
}

const iso = (ms) => new Date(ms).toISOString();

export async function isLockedOut(db, email, now = Date.now) {
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM login_failures WHERE email = ? AND at > ?")
    .bind(email, iso(now() - LOCKOUT_MS))
    .first();
  return (row?.n ?? 0) >= MAX_FAILURES;
}

export async function recordFailure(db, email, now = Date.now) {
  await db.prepare("INSERT INTO login_failures (email, at) VALUES (?, ?)").bind(email, iso(now())).run();
  // Catatan lama tidak berguna lagi; sekalian dibersihkan supaya tabel tidak tumbuh.
  await db.prepare("DELETE FROM login_failures WHERE at <= ?").bind(iso(now() - LOCKOUT_MS)).run();
}

export async function clearFailures(db, email) {
  await db.prepare("DELETE FROM login_failures WHERE email = ?").bind(email).run();
}

export async function storedHashFor(db, userId) {
  const row = await db.prepare("SELECT hash FROM credentials WHERE user_id = ?").bind(userId).first();
  return row?.hash ?? null;
}

export async function setPassword(db, userId, password) {
  const hash = await hashPassword(password);
  await db
    .prepare(
      `INSERT INTO credentials (user_id, hash, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET hash = excluded.hash, updated_at = excluded.updated_at`,
    )
    .bind(userId, hash, iso(Date.now()))
    .run();
}

export async function hasPassword(db, userId) {
  return Boolean(await storedHashFor(db, userId));
}

/**
 * Hasil percobaan masuk: { user } kalau berhasil, atau { error, status }.
 * Hash palsu dihitung untuk akun yang tidak ada, agar waktunya tak membedakan.
 */
const DECOY = `pbkdf2$${PBKDF2_ITERATIONS}$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`;

export async function attemptLogin(db, { email, password }, { domainOk }) {
  const clean = String(email ?? "").trim().toLowerCase();
  const generic = { error: "Email atau kata sandi salah.", status: 401 };
  if (!clean || typeof password !== "string" || password.length > MAX_PASSWORD_LENGTH) return generic;

  if (await isLockedOut(db, clean)) {
    return { error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit.", status: 429 };
  }

  const user = domainOk(clean)
    ? await db.prepare("SELECT id, email, name FROM users WHERE email = ?").bind(clean).first()
    : null;
  const stored = user ? await storedHashFor(db, user.id) : null;

  const ok = await verifyPassword(password, stored ?? DECOY);
  if (!user || !stored || !ok) {
    await recordFailure(db, clean);
    return generic;
  }

  await clearFailures(db, clean);
  return { user };
}
