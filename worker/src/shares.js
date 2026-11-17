/**
 * Tautan bagikan chat.
 *
 * Membagikan sebuah chat menyimpan potretnya (judul dan isi pesan saat itu) di bawah
 * token acak. Siapa pun yang punya tautannya bisa membaca potret itu tanpa masuk,
 * tetapi tidak melihat nama, email, atau pesan yang ditambahkan sesudahnya. Pemilik
 * bisa mencabut tautannya kapan saja, dan menghapus chat-nya ikut menghapus tautannya.
 */

export const MAX_SHARES_PER_USER = 50;
const MAX_SNAPSHOT_MESSAGES = 200;

const base64url = (bytes) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** Token acak 22 karakter (128 bit): tidak bisa ditebak. */
export const newToken = () => base64url(crypto.getRandomValues(new Uint8Array(16)));

export const isToken = (value) => /^[A-Za-z0-9_-]{22}$/.test(String(value ?? ""));

/** Hanya peran dan isi yang ikut dibagikan. */
export function snapshotOf(messages) {
  return (messages ?? []).slice(0, MAX_SNAPSHOT_MESSAGES).map((message) => ({
    role: message.role === "user" ? "user" : "assistant",
    content: String(message.content ?? ""),
  }));
}

/**
 * Bagikan satu chat milik pengguna. Kalau chat itu sudah punya tautan dengan isi yang sama
 * (jumlah pesan sama), tautan itu dipakai lagi; kalau sudah bertambah, dibuat tautan baru.
 * Mengembalikan { token, title, createdAt }, atau null bila chat bukan milik pengguna.
 */
export async function createShare(db, user, conversation) {
  if (!db || !user || !conversation) return null;

  const messages = snapshotOf(conversation.messages);
  if (!messages.length) return null;

  const existing = await db
    .prepare("SELECT token, title, created_at FROM shares WHERE conversation_id = ? AND user_id = ? AND message_count = ? ORDER BY created_at DESC LIMIT 1")
    .bind(conversation.id, user.id, messages.length)
    .first();
  if (existing) return { token: existing.token, title: existing.title, createdAt: existing.created_at };

  const count = await db.prepare("SELECT COUNT(*) AS n FROM shares WHERE user_id = ?").bind(user.id).first();
  if ((count?.n ?? 0) >= MAX_SHARES_PER_USER) return { error: "limit" };

  const token = newToken();
  await db
    .prepare("INSERT INTO shares (token, user_id, conversation_id, title, snapshot, message_count) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(token, user.id, conversation.id, String(conversation.title ?? "").slice(0, 120), JSON.stringify(messages), messages.length)
    .run();
  return { token, title: conversation.title, createdAt: new Date().toISOString() };
}

/** Tautan milik pengguna, yang terbaru lebih dulu. */
export async function listShares(db, user) {
  if (!db || !user) return [];
  const { results } = await db
    .prepare("SELECT token, title, message_count, created_at FROM shares WHERE user_id = ? ORDER BY created_at DESC LIMIT ?")
    .bind(user.id, MAX_SHARES_PER_USER)
    .all();
  return (results ?? []).map((row) => ({ token: row.token, title: row.title, messages: row.message_count, createdAt: row.created_at }));
}

/** Cabut satu tautan milik pengguna. */
export async function revokeShare(db, user, token) {
  if (!db || !user || !isToken(token)) return false;
  const { meta } = await db.prepare("DELETE FROM shares WHERE token = ? AND user_id = ?").bind(token, user.id).run();
  return (meta?.changes ?? 0) > 0;
}

/** Isi publik sebuah tautan: judul dan pesan saja. null bila tidak ada atau sudah dicabut. */
export async function readShare(db, token) {
  if (!db || !isToken(token)) return null;
  const row = await db.prepare("SELECT title, snapshot, created_at FROM shares WHERE token = ?").bind(token).first();
  if (!row) return null;
  let messages = [];
  try {
    messages = JSON.parse(row.snapshot);
  } catch {
    return null;
  }
  return { title: row.title, messages, createdAt: row.created_at };
}
