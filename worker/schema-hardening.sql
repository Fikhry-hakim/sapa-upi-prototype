-- Pembatasan laju dan penguncian login per alamat klien.
-- Jalankan sekali pada basis data yang sudah ada. Pada instalasi baru, tabel dan kolom
-- ini sudah ada di schema-auth.sql, dan baris ALTER di bawah tidak perlu dijalankan.

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket        TEXT NOT NULL,      -- mis. 'ask:<hash klien>'
  window_start  INTEGER NOT NULL,   -- awal jendela, ms sejak epoch
  hits          INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window_start)
);

ALTER TABLE login_failures ADD COLUMN ip TEXT;
CREATE INDEX IF NOT EXISTS login_failures_ip ON login_failures (email, ip, at);
