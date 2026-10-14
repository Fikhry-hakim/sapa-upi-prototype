/**
 * Riwayat percakapan.
 *
 * Setiap kueri di berkas ini menyaring berdasarkan user_id, termasuk saat id
 * percakapan sudah diketahui. Tidak ada fungsi yang bisa mengembalikan
 * percakapan milik orang lain, dan tidak ada peran yang melewatinya — satu-
 * satunya cara membaca percakapan orang lain adalah membuka basis datanya
 * langsung.
 */

const MAX_TITLE_LENGTH = 80;
export const MAX_CONVERSATIONS = 50;
export const MAX_MESSAGES_PER_CONVERSATION = 200;

const newId = () => crypto.randomUUID();

/** Judul percakapan diambil dari pertanyaan pertama. */
export function titleFrom(question) {
  const trimmed = String(question ?? "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "Percakapan baru";
  return trimmed.length > MAX_TITLE_LENGTH
    ? `${trimmed.slice(0, MAX_TITLE_LENGTH - 1)}…`
    : trimmed;
}

/**
 * Catat satu tanya-jawab. Percakapan dibuat kalau belum ada.
 * Mengembalikan id percakapan supaya browser bisa melanjutkan yang sama.
 */
export async function recordExchange(db, user, { conversationId, question, answer, entryId, source }) {
  if (!db || !user) return null;

  let id = conversationId ?? null;

  if (id) {
    // Pastikan percakapan ini memang milik penanya sebelum menulis ke dalamnya.
    const owned = await db
      .prepare("SELECT id FROM conversations WHERE id = ? AND user_id = ?")
      .bind(id, user.id)
      .first();
    if (!owned) id = null;
  }

  const statements = [];

  if (!id) {
    id = newId();
    statements.push(
      db
        .prepare("INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)")
        .bind(id, user.id, titleFrom(question)),
    );
  } else {
    statements.push(
      db
        .prepare("UPDATE conversations SET updated_at = datetime('now') WHERE id = ? AND user_id = ?")
        .bind(id, user.id),
    );
  }

  statements.push(
    db
      .prepare("INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, 'user', ?)")
      .bind(newId(), id, question),
    db
      .prepare(
        `INSERT INTO messages (id, conversation_id, role, content, entry_id, answer_source)
         VALUES (?, ?, 'assistant', ?, ?, ?)`,
      )
      .bind(newId(), id, answer, entryId ?? null, source ?? null),
  );

  await db.batch(statements);
  return id;
}

/** Daftar percakapan milik pengguna, terbaru lebih dulu. */
export async function listConversations(db, user) {
  if (!db || !user) return [];
  const { results } = await db
    .prepare(
      `SELECT id, title, updated_at
         FROM conversations
        WHERE user_id = ?
        ORDER BY updated_at DESC
        LIMIT ?`,
    )
    .bind(user.id, MAX_CONVERSATIONS)
    .all();
  return results ?? [];
}

/** Isi satu percakapan, atau null kalau bukan milik pengguna ini. */
export async function readConversation(db, user, conversationId) {
  if (!db || !user) return null;

  const conversation = await db
    .prepare("SELECT id, title, updated_at FROM conversations WHERE id = ? AND user_id = ?")
    .bind(conversationId, user.id)
    .first();
  if (!conversation) return null;

  const { results } = await db
    .prepare(
      `SELECT role, content, entry_id, answer_source, created_at
         FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at, rowid
        LIMIT ?`,
    )
    .bind(conversationId, MAX_MESSAGES_PER_CONVERSATION)
    .all();

  return { ...conversation, messages: results ?? [] };
}

/** Hapus satu percakapan milik pengguna. */
export async function deleteConversation(db, user, conversationId) {
  if (!db || !user) return false;
  const { meta } = await db
    .prepare("DELETE FROM conversations WHERE id = ? AND user_id = ?")
    .bind(conversationId, user.id)
    .run();
  return (meta?.changes ?? 0) > 0;
}
