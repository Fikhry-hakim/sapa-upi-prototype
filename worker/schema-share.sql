-- Tautan bagikan chat: potret (snapshot) percakapan saat dibagikan.
-- Pesan yang ditambahkan setelahnya, nama, dan email pemilik tidak ikut tersimpan.
CREATE TABLE IF NOT EXISTS shares (
  token            TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id  TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  snapshot         TEXT NOT NULL,
  message_count    INTEGER NOT NULL,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS shares_user ON shares(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS shares_conversation ON shares(conversation_id);
