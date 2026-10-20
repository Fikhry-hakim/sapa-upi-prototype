-- Akun, sesi, peran, dan riwayat percakapan SAPA UPI.
--
-- Riwayat percakapan hanya dapat dibaca oleh pemiliknya melalui aplikasi.
-- Tidak ada endpoint yang mengembalikan percakapan milik orang lain, termasuk
-- untuk peran admin: siapa pun yang perlu melihatnya harus membuka basis data
-- langsung, dan itu tindakan yang meninggalkan jejak di Cloudflare.

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,   -- subject dari penyedia identitas, bukan email
  email         TEXT NOT NULL UNIQUE,
  name          TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Wewenang adalah penugasan yang dicatat, bukan kesimpulan dari domain email
-- atau dari apa pun yang dikirim browser. Hanya dosen TPTA dan staf TU yang
-- berhak mengunggah dokumen; status dosen saja tidak cukup.
CREATE TABLE IF NOT EXISTS staff_roles (
  email        TEXT PRIMARY KEY,
  role         TEXT NOT NULL CHECK (role IN ('upload', 'review', 'admin')),
  unit         TEXT,               -- mis. "TPTA" atau "TU"
  assigned_by  TEXT NOT NULL,
  assigned_at  TEXT NOT NULL DEFAULT (datetime('now')),
  active       INTEGER NOT NULL DEFAULT 1
);

-- Yang disimpan adalah hash token, bukan tokennya. Dengan begitu akses baca ke
-- basis data tidak cukup untuk menyamar sebagai pengguna.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT NOT NULL,
  method      TEXT NOT NULL DEFAULT 'google'   -- 'google' atau 'password'
);

-- State OAuth berumur pendek, dipakai sekali untuk menolak callback palsu.
CREATE TABLE IF NOT EXISTS auth_states (
  state          TEXT PRIMARY KEY,
  code_verifier  TEXT NOT NULL,
  redirect_to    TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id               TEXT PRIMARY KEY,
  conversation_id  TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content          TEXT NOT NULL,
  entry_id         TEXT,            -- entri pedoman yang menjadi rujukan
  answer_source    TEXT,            -- 'llm' atau 'offline'
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS conversations_user ON conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS messages_conversation ON messages(conversation_id, created_at);

-- Masuk dengan kata sandi. Hanya akun yang sudah masuk lewat Google yang bisa
-- memasang kata sandi, jadi tidak ada pendaftaran atas nama email orang lain.
CREATE TABLE IF NOT EXISTS credentials (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  hash        TEXT NOT NULL,   -- pbkdf2$iterasi$garam$hash; bukan kata sandinya
  updated_at  TEXT NOT NULL
);

-- Percobaan masuk yang gagal, per email, untuk pembatasan.
CREATE TABLE IF NOT EXISTS login_failures (
  email  TEXT NOT NULL,
  at     TEXT NOT NULL,
  ip     TEXT               -- hash klien, supaya orang asing tak bisa mengunci akun orang lain
);

-- Pembatasan laju per klien (lihat schema-hardening.sql untuk basis data lama).
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket        TEXT NOT NULL,
  window_start  INTEGER NOT NULL,
  hits          INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window_start)
);
CREATE INDEX IF NOT EXISTS login_failures_email ON login_failures (email, at);
