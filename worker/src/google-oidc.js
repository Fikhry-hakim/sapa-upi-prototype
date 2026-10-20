/**
 * Masuk dengan akun Google, dibatasi domain yang diizinkan.
 *
 * Client secret hanya ada di Worker sebagai secret dan tidak pernah sampai ke
 * browser. Alur memakai PKCE dan state sekali pakai, sehingga callback yang
 * tidak berasal dari permintaan login yang kita mulai akan ditolak.
 */

import { base64url, createToken, AUTH_STATE_TTL_MS } from "./auth.js";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

async function sha256(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return base64url(new Uint8Array(digest));
}

/** Daftar domain email yang boleh masuk, dari ALLOWED_EMAIL_DOMAINS. */
export function allowedDomains(env) {
  return (env.ALLOWED_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Apakah email boleh masuk.
 *
 * Kecocokan dilakukan pada bagian setelah "@" secara utuh, bukan dengan
 * endsWith, supaya "upi.edu.penipu.com" tidak lolos sebagai "upi.edu".
 * Subdomain seperti "student.upi.edu" diizinkan secara eksplisit.
 */
export function isAllowedEmail(email, domains) {
  if (!domains.length) return true; // tanpa daftar, pembatasan tidak diberlakukan
  const at = String(email ?? "").lastIndexOf("@");
  if (at < 0) return false;
  const host = email.slice(at + 1).toLowerCase();
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

/**
 * Alamat tujuan setelah login yang boleh dipakai: hanya situs aplikasi sendiri
 * (APP_URL) dan localhost untuk pengembangan. Token sesi ikut terkirim ke
 * alamat itu, jadi alamat sembarang berarti token bisa dikirim ke pihak lain.
 * Mengembalikan alamat yang sudah dinormalkan, atau null kalau tidak boleh.
 */
export function safeRedirect(target, env) {
  if (!target) return null;
  let url;
  try {
    url = new URL(target);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;

  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) && url.protocol === "http:";
  let appOrigin = null;
  try {
    appOrigin = env.APP_URL ? new URL(env.APP_URL).origin : null;
  } catch {
    /* APP_URL tidak sah: hanya localhost yang lolos */
  }
  if (!local && !(appOrigin && url.origin === appOrigin && url.protocol === "https:")) return null;

  url.hash = "";
  return url.toString();
}

/** Mulai login: simpan state + verifier, lalu arahkan ke Google. */
export async function startLogin(db, env, redirectTo, now = Date.now) {
  const state = createToken();
  const codeVerifier = createToken();

  await db
    .prepare(
      "INSERT INTO auth_states (state, code_verifier, redirect_to, expires_at) VALUES (?, ?, ?, ?)",
    )
    .bind(state, codeVerifier, safeRedirect(redirectTo, env), new Date(now() + AUTH_STATE_TTL_MS).toISOString())
    .run();

  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", env.OAUTH_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", await sha256(codeVerifier));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");

  return url.toString();
}

/** Ambil state sekali pakai; mengembalikan null kalau tidak ada atau kedaluwarsa. */
export async function consumeState(db, state, now = Date.now) {
  if (!state) return null;
  const row = await db
    .prepare("SELECT code_verifier, redirect_to, expires_at FROM auth_states WHERE state = ?")
    .bind(state)
    .first();

  // Sekali pakai: dihapus baik yang masih berlaku maupun yang sudah lewat.
  await db.prepare("DELETE FROM auth_states WHERE state = ?").bind(state).run();

  if (!row) return null;
  if (Date.parse(row.expires_at) <= now()) return null;
  return { codeVerifier: row.code_verifier, redirectTo: row.redirect_to };
}

/** Bagian payload dari sebuah JWT, tanpa verifikasi tanda tangan. */
export function decodeIdToken(idToken) {
  const parts = String(idToken ?? "").split(".");
  if (parts.length !== 3) throw new Error("ID token tidak berbentuk JWT");
  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, "=")));
}

/**
 * Tukar authorization code dengan identitas pengguna.
 *
 * Tanda tangan ID token tidak diperiksa ulang di sini: token diambil langsung
 * dari endpoint Google melalui koneksi TLS dengan client secret kita, bukan
 * diterima dari browser, sehingga sumbernya sudah terpercaya.
 */
export async function exchangeCode({ code, codeVerifier, env, fetchImpl = fetch }) {
  const response = await fetchImpl(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.OAUTH_REDIRECT_URI,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Penukaran kode gagal (${response.status}): ${detail.slice(0, 200)}`);
  }

  const { id_token: idToken } = await response.json();
  const claims = decodeIdToken(idToken);

  if (!claims.email) throw new Error("ID token tidak memuat email");
  if (claims.email_verified === false) throw new Error("Email Google belum terverifikasi");

  return { id: claims.sub, email: claims.email, name: claims.name ?? null };
}
