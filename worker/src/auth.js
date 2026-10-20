/**
 * Sesi dan peran.
 *
 * Dua hal yang dijaga di sini:
 *  - Peran tidak pernah disimpulkan dari email atau dari apa pun yang dikirim
 *    browser. Peran hanya ada kalau tercatat di tabel staff_roles.
 *  - Yang disimpan adalah hash token sesi, bukan tokennya, sehingga akses baca
 *    ke basis data tidak cukup untuk menyamar sebagai pengguna.
 */

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 hari
export const AUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 menit

/** Token acak 256 bit, dalam bentuk base64url. */
export function createToken(randomValues = crypto.getRandomValues.bind(crypto)) {
  const bytes = randomValues(new Uint8Array(32));
  return base64url(bytes);
}

export function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Hash token sesi. Tabel menyimpan hasil ini, bukan tokennya. */
export async function hashToken(token) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return base64url(new Uint8Array(digest));
}

/** Ambil bearer token dari header Authorization, kalau ada. */
export function bearerToken(request) {
  const header = request.headers.get("Authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  return match ? match[1] : null;
}

const iso = (ms) => new Date(ms).toISOString();

export const FRESH_LOGIN_MS = 10 * 60 * 1000;

/** method: "google" atau "password"; dipakai untuk menilai seberapa baru identitas terbukti. */
export async function createSession(db, userId, method = "google", now = Date.now) {
  const token = createToken();
  await db
    .prepare("INSERT INTO sessions (token_hash, user_id, expires_at, method) VALUES (?, ?, ?, ?)")
    .bind(await hashToken(token), userId, iso(now() + SESSION_TTL_MS), method)
    .run();
  return token;
}

/**
 * Apakah sesi ini baru saja dibuka lewat Google. Hanya sesi seperti itu boleh
 * mengatur ulang kata sandi tanpa menyebut yang lama.
 */
export async function isFreshGoogleSession(db, request, now = Date.now) {
  const token = bearerToken(request);
  if (!token || !db) return false;
  const row = await db
    .prepare("SELECT method, created_at FROM sessions WHERE token_hash = ?")
    .bind(await hashToken(token))
    .first();
  if (!row || row.method !== "google") return false;
  const created = Date.parse(`${String(row.created_at).replace(" ", "T")}Z`);
  return Number.isFinite(created) && now() - created <= FRESH_LOGIN_MS;
}

/**
 * Pengguna di balik sebuah permintaan, atau null kalau tidak ada sesi yang sah.
 * Sesi yang kedaluwarsa diperlakukan sama dengan tidak ada sesi.
 */
export async function authenticate(db, request, now = Date.now) {
  const token = bearerToken(request);
  if (!token || !db) return null;

  const row = await db
    .prepare(
      `SELECT u.id, u.email, u.name, s.expires_at
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ?`,
    )
    .bind(await hashToken(token))
    .first();

  if (!row) return null;
  if (Date.parse(row.expires_at) <= now()) return null;

  return { id: row.id, email: row.email, name: row.name };
}

export async function destroySession(db, request) {
  const token = bearerToken(request);
  if (!token || !db) return;
  await db
    .prepare("DELETE FROM sessions WHERE token_hash = ?")
    .bind(await hashToken(token))
    .run();
}

/**
 * Peran pengguna, atau null kalau tidak diberi penugasan.
 *
 * Hanya tabel ini yang menentukan. Tidak ada email, domain, atau klaim dari
 * penyedia identitas yang bisa memberi peran dengan sendirinya.
 */
export async function roleOf(db, email) {
  if (!db || !email) return null;
  const row = await db
    .prepare("SELECT role, unit FROM staff_roles WHERE email = ? AND active = 1")
    .bind(email.toLowerCase())
    .first();
  return row ? { role: row.role, unit: row.unit ?? null } : null;
}

/** Apakah pengguna boleh melakukan aksi tertentu. */
export function can(assignment, action) {
  if (!assignment) return false;
  const allowed = {
    view: ["upload", "review", "admin"],
    upload: ["upload", "admin"],
    review: ["review", "admin"],
    manage: ["admin"],
  }[action];
  return Boolean(allowed?.includes(assignment.role));
}

export async function upsertUser(db, { id, email, name }, now = Date.now) {
  await db
    .prepare(
      `INSERT INTO users (id, email, name, last_seen_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           email = excluded.email,
           name = excluded.name,
           last_seen_at = excluded.last_seen_at`,
    )
    .bind(id, email.toLowerCase(), name ?? null, iso(now()))
    .run();
}

/** Akhiri setiap sesi milik pengguna, di semua perangkat. */
export async function destroyAllSessions(db, user) {
  if (!db || !user) return 0;
  const { meta } = await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user.id).run();
  return meta?.changes ?? 0;
}
