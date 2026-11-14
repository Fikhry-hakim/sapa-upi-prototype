import test from "node:test";
import assert from "node:assert/strict";

import worker from "../worker/src/index.js";

const env = (db = null) => ({ sapa_upi_kb: db, ALLOWED_ORIGINS: "https://app.example" });
const call = (path, init, db) => worker.fetch(new Request(`https://api.example${path}`, init), env(db), {});

/** DB palsu: satu sesi yang sah, dan penghitung batas laju yang jumlahnya bisa diatur. */
function dbWithHits(hits) {
  return {
    prepare: (sql) => ({
      bind: () => ({
        first: async () => {
          if (/FROM sessions s/.test(sql)) {
            return { id: "u1", email: "a@upi.edu", name: "A", expires_at: new Date(Date.now() + 60_000).toISOString() };
          }
          if (/INTO rate_limits/.test(sql)) return { hits };
          return null;
        },
        all: async () => ({ results: [] }),
        run: async () => ({ meta: { changes: 0 } }),
      }),
    }),
    batch: async () => [],
  };
}

const emptyCatalog = { prepare: () => ({ all: async () => ({ results: [] }) }) };

test("every API response tells the browser not to sniff content types", async () => {
  for (const [path, init] of [
    ["/", { method: "OPTIONS" }],
    ["/documents", undefined],
    ["/auth/me", undefined],
    ["/conversations", undefined],
  ]) {
    const response = await call(path, init, emptyCatalog);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff", path);
  }
});

test("session, history and manager responses are never cacheable; public ones are left alone", async () => {
  for (const path of ["/auth/me", "/auth/logout", "/conversations", "/conversations/export", "/admin/overview", "/admin/documents"]) {
    const response = await call(path);
    assert.equal(response.headers.get("cache-control"), "no-store", path);
  }
  const publicList = await call("/documents", undefined, emptyCatalog);
  assert.notEqual(publicList.headers.get("cache-control"), "no-store");
});

test("a signed-in account cannot write history without limit", async () => {
  const init = {
    method: "POST",
    headers: { authorization: "Bearer token-apa-saja", "content-type": "application/json" },
    body: JSON.stringify({ question: "tanya", answer: "jawab" }),
  };

  const over = await call("/conversations/record", init, dbWithHits(31));
  assert.equal(over.status, 429);
  assert.ok(over.headers.get("retry-after"));

  // Di bawah batas: lolos ke pemeriksaan isi, bukan ditolak karena laju.
  const under = await call(
    "/conversations/record",
    { ...init, body: JSON.stringify({ question: "", answer: "" }) },
    dbWithHits(1),
  );
  assert.equal(under.status, 400);
});

/* ---------- dokumen yang tidak berlaku tidak terbuka untuk umum ---------- */

const docRow = (id, status) => ({
  id, title: `Dokumen ${id}`, owner: "Prodi", reference: "SK", period: "2026", kind: "PDF", pages: 1, size_bytes: 10,
  file: `/files/${id}`, bundled: 0, status, rag_active: 1, uploaded_by: "dosen@upi.edu", validated_by: null,
  created_at: "2026-11-01", updated_at: "2026-11-01", category: null, effective_date: null, description: null,
  related_to: null, supersedes: null,
});

function catalogDb(rows) {
  return {
    prepare: (sql) => ({
      bind: (...args) => ({
        first: async () => (/FROM documents WHERE id/.test(sql) ? rows.find((r) => r.id === args[0]) ?? null : null),
        all: async () => ({ results: rows }),
      }),
      all: async () => ({ results: rows }),
    }),
  };
}

const pdfStore = { get: async () => new TextEncoder().encode("%PDF-1.4 isi").buffer };

test("an expired document can no longer be downloaded or listed by the public", async () => {
  const rows = [docRow("berlaku-aaa111", "ready"), docRow("lama-bbb222", "expired"), docRow("draf-ccc333", "validating")];
  const withFiles = { ...env(catalogDb(rows)), sapa_upi_files: pdfStore };
  const get = (path) => worker.fetch(new Request(`https://api.example${path}`), withFiles, {});

  assert.equal((await get("/files/berlaku-aaa111")).status, 200);
  assert.equal((await get("/files/lama-bbb222")).status, 404, "dokumen tidak berlaku masih terbuka");
  assert.equal((await get("/files/draf-ccc333")).status, 404);

  const listed = (await (await get("/documents")).json()).documents.map((d) => d.id);
  assert.deepEqual(listed, ["berlaku-aaa111"]);
});

/* ---------- kata sandi pertama menuntut Google yang baru ---------- */

function passwordDb({ googleSessionAgeMs, hasPassword = false }) {
  const created = new Date(Date.now() - googleSessionAgeMs).toISOString();
  return {
    prepare: (sql) => ({
      bind: () => ({
        first: async () => {
          if (/FROM sessions s/.test(sql)) {
            return { id: "u1", email: "mhs@upi.edu", name: "M", expires_at: new Date(Date.now() + 60_000).toISOString() };
          }
          if (/SELECT method, created_at FROM sessions/.test(sql)) return { method: "google", created_at: created };
          if (/SELECT hash FROM credentials/.test(sql)) return hasPassword ? { hash: "x" } : null;
          return null;
        },
        run: async () => ({ meta: { changes: 1 } }),
        all: async () => ({ results: [] }),
      }),
    }),
  };
}

const setPassword = (db) =>
  call(
    "/auth/password/set",
    {
      method: "POST",
      headers: { authorization: "Bearer token-apa-saja", "content-type": "application/json" },
      body: JSON.stringify({ password: "kata-sandi-panjang-123" }),
    },
    db,
  );

test("a first password can only be set right after a fresh Google sign-in", async () => {
  const stale = await setPassword(passwordDb({ googleSessionAgeMs: 24 * 60 * 60 * 1000 }));
  assert.equal(stale.status, 403);
  assert.match((await stale.json()).error, /Google/);

  const fresh = await setPassword(passwordDb({ googleSessionAgeMs: 60 * 1000 }));
  assert.equal(fresh.status, 200);
});

/* ---------- gerbang anti-banjir ---------- */

test("a flooding client is stopped before the database is touched; a broken gate never blocks service", async () => {
  let touched = 0;
  const db = { prepare: () => ((touched += 1), { all: async () => ({ results: [] }) }) };
  const withGate = (limit) => ({ ...env(db), FLOOD_GATE: { limit } });
  const get = (e) => worker.fetch(new Request("https://api.example/documents"), e, {});

  const blocked = await get(withGate(async () => ({ success: false })));
  assert.equal(blocked.status, 429);
  assert.equal(touched, 0, "permintaan yang diblokir tidak boleh menyentuh D1");

  assert.equal((await get(withGate(async () => ({ success: true })))).status, 200);
  assert.equal((await get(withGate(async () => { throw new Error("gerbang error"); }))).status, 200, "gerbang rusak harus fail-open");
  assert.equal((await get(env(db))).status, 200, "tanpa binding, gerbang dilewati");
});
