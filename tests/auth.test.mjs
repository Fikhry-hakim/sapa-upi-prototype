import test from "node:test";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

import { bearerToken, can, hashToken, createToken, STAFF_IDLE_TIMEOUT_MS, touchStaffSession } from "../worker/src/auth.js";
import { isAllowedEmail, decodeIdToken, allowedDomains, safeRedirect } from "../worker/src/google-oidc.js";
import { titleFrom } from "../worker/src/history.js";
import { clientKey, hit } from "../worker/src/rate-limit.js";

/** Satu baris `sessions`, cukup untuk apa yang disentuh touchStaffSession. */
function sessionDb(row) {
  let current = row ? { ...row } : null;
  return {
    get current() {
      return current;
    },
    prepare: (sql) => ({
      bind: (...args) => ({
        first: async () => (current && /SELECT last_used_at/.test(sql) ? { last_used_at: current.last_used_at } : null),
        run: async () => {
          if (/DELETE FROM sessions/.test(sql)) current = null;
          if (/UPDATE sessions SET last_used_at/.test(sql)) current = { ...current, last_used_at: args[0] };
          return {};
        },
      }),
    }),
  };
}

const request = (headers = {}) => new Request("https://example.test", { headers });

test("a session token is long, random, and never stored as itself", async () => {
  const a = createToken();
  const b = createToken();

  assert.notEqual(a, b, "two tokens must differ");
  assert.ok(a.length >= 40, "token must carry real entropy");

  const hash = await hashToken(a);
  assert.notEqual(hash, a, "the table stores a hash, not the token");
  assert.equal(hash, await hashToken(a), "hashing must be stable");
  assert.notEqual(hash, await hashToken(b));
});

test("bearer tokens are read from the Authorization header only", () => {
  assert.equal(bearerToken(request({ Authorization: "Bearer abc123" })), "abc123");
  assert.equal(bearerToken(request({ Authorization: "bearer abc123" })), "abc123");
  assert.equal(bearerToken(request({ Authorization: "Basic abc123" })), null);
  assert.equal(bearerToken(request()), null);
});

test("a role is only what the assignment table grants", () => {
  // Nothing derived from the email, and nothing sent by the browser, may grant
  // upload rights: only an explicit assignment does.
  assert.equal(can(null, "upload"), false);
  assert.equal(can({ role: "review" }, "upload"), false);
  assert.equal(can({ role: "upload" }, "upload"), true);
  assert.equal(can({ role: "admin" }, "upload"), true);
  assert.equal(can({ role: "upload" }, "manage"), false);
  assert.equal(can({ role: "admin" }, "manage"), true);
});

test("domain restriction matches the host, not a suffix of the string", () => {
  const domains = ["upi.edu"];

  assert.ok(isAllowedEmail("mahasiswa@upi.edu", domains));
  assert.ok(isAllowedEmail("dosen@student.upi.edu", domains), "subdomain is part of UPI");

  // The trap a naive endsWith check falls into.
  assert.ok(!isAllowedEmail("penyerang@upi.edu.penipu.com", domains));
  assert.ok(!isAllowedEmail("orang@notupi.edu", domains));
  assert.ok(!isAllowedEmail("orang@gmail.com", domains));
  assert.ok(!isAllowedEmail("tanpa-at", domains));
});

test("an empty domain list does not silently restrict anyone", () => {
  assert.deepEqual(allowedDomains({}), []);
  assert.ok(isAllowedEmail("siapa@pun.com", []));
});

test("decodeIdToken reads the claims and rejects anything that is not a JWT", () => {
  const payload = Buffer.from(JSON.stringify({ sub: "123", email: "a@upi.edu" })).toString(
    "base64url",
  );
  const claims = decodeIdToken(`header.${payload}.signature`);

  assert.equal(claims.sub, "123");
  assert.equal(claims.email, "a@upi.edu");
  assert.throws(() => decodeIdToken("bukan-jwt"), /JWT/);
});

test("a conversation is titled from the question, trimmed but not mangled", () => {
  assert.equal(titleFrom("  Apa   syarat sidang?  "), "Apa syarat sidang?");
  assert.equal(titleFrom(""), "Percakapan baru");
  assert.equal(titleFrom(null), "Percakapan baru");

  const long = titleFrom("x".repeat(200));
  assert.ok(long.length <= 80);
  assert.ok(long.endsWith("…"));
});

test("CORS admits the session header and the methods the history needs", async () => {
  // Login completed server-side while the browser could never read the session:
  // the preflight allowed only content-type, so Authorization was refused, and
  // only POST, so reading or deleting a conversation was refused too.
  const source = await readFile(new URL("../worker/src/index.js", import.meta.url), "utf8");
  const headers = source.match(/"Access-Control-Allow-Headers":\s*"([^"]+)"/)[1];
  const methods = source.match(/"Access-Control-Allow-Methods":\s*"([^"]+)"/)[1];

  assert.match(headers, /authorization/i, "the bearer token must survive the preflight");
  for (const method of ["GET", "POST", "DELETE"]) {
    assert.ok(methods.includes(method), `history needs ${method}`);
  }
});

test("after login the token only ever goes back to this app, never to an arbitrary address", () => {
  const env = { APP_URL: "https://fikhry-hakim.github.io/sapa-upi-prototype/" };

  assert.equal(
    safeRedirect("https://fikhry-hakim.github.io/sapa-upi-prototype/?x=1#frag", env),
    "https://fikhry-hakim.github.io/sapa-upi-prototype/?x=1",
    "the app itself is fine, and any fragment is dropped",
  );
  assert.ok(safeRedirect("http://localhost:4173/", env), "local development is fine");
  assert.ok(safeRedirect("http://127.0.0.1:8080/index.html", env));

  for (const bad of [
    "https://evil.example/",
    "https://fikhry-hakim.github.io.evil.example/",
    "https://evil.example/https://fikhry-hakim.github.io/",
    "https://fikhry-hakim.github.io@evil.example/",
    "https://user:pw@fikhry-hakim.github.io/",
    "http://fikhry-hakim.github.io/sapa-upi-prototype/",
    "javascript:alert(1)",
    "//evil.example",
    "not a url",
    "",
    null,
  ]) {
    assert.equal(safeRedirect(bad, env), null, String(bad));
  }
  assert.equal(safeRedirect("https://fikhry-hakim.github.io/", {}), null, "no APP_URL configured: only localhost passes");
});

test("the rate limiter counts per window, refuses past the limit, and lets go when the database fails", async () => {
  const counts = new Map();
  const db = {
    prepare: () => ({
      bind: (bucket, windowStart) => ({
        first: async () => {
          const key = `${bucket}|${windowStart}`;
          counts.set(key, (counts.get(key) ?? 0) + 1);
          return { hits: counts.get(key) };
        },
        run: async () => ({}),
      }),
    }),
  };
  const options = { limit: 3, windowMs: 60_000, now: () => 1_000_000 };

  for (let i = 0; i < 3; i += 1) assert.equal((await hit(db, "ask:x", options)).allowed, true);
  const blocked = await hit(db, "ask:x", options);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfter >= 1 && blocked.retryAfter <= 60);
  assert.equal((await hit(db, "ask:y", options)).allowed, true, "another client is unaffected");
  assert.equal((await hit(db, "ask:x", { ...options, now: () => 1_000_000 + 60_000 })).allowed, true, "a new window starts fresh");

  const broken = { prepare: () => ({ bind: () => ({ first: async () => { throw new Error("D1 down"); } }) }) };
  assert.equal((await hit(broken, "ask:x", options)).allowed, true, "fails open");
  assert.equal((await hit(null, "ask:x", options)).allowed, true);
});

test("a staff session active within the idle window is kept alive, with its clock moved forward", async () => {
  const db = sessionDb({ last_used_at: "2026-10-25 09:00:00" });
  const request = new Request("https://x.test", { headers: { Authorization: "Bearer tok" } });
  const now = () => Date.parse("2026-10-25T09:10:00Z"); // 10 menit sejak dipakai terakhir

  assert.equal(await touchStaffSession(db, request, now), "ok");
  assert.equal(db.current.last_used_at, new Date(now()).toISOString(), "the clock is refreshed, not left stale");
});

test("a staff session idle past the timeout is deleted outright, not merely refused", async () => {
  const db = sessionDb({ last_used_at: "2026-10-25 09:00:00" });
  const request = new Request("https://x.test", { headers: { Authorization: "Bearer tok" } });
  const now = () => Date.parse("2026-10-25T09:00:00Z") + STAFF_IDLE_TIMEOUT_MS + 1_000;

  assert.equal(await touchStaffSession(db, request, now), "idle");
  assert.equal(db.current, null, "the row itself is gone, not just reported stale");
});

test("a timestamp already refreshed by an earlier touch (full ISO, not SQLite's space-separated form) is still read correctly", async () => {
  // A session's first idle check ever reads a SQLite datetime('now') value
  // ("2026-10-25 09:00:00"); every check after that reads back whatever this
  // module itself wrote last — a full "...Z" timestamp. Both must parse.
  const request = new Request("https://x.test", { headers: { Authorization: "Bearer tok" } });

  const stillActive = sessionDb({ last_used_at: "2026-10-25T09:00:00.000Z" });
  const tenMinutesLater = () => Date.parse("2026-10-25T09:00:00.000Z") + 10 * 60 * 1000;
  assert.equal(await touchStaffSession(stillActive, request, tenMinutesLater), "ok");

  const goneIdle = sessionDb({ last_used_at: "2026-10-25T09:00:00.000Z" });
  const pastTimeout = () => Date.parse("2026-10-25T09:00:00.000Z") + STAFF_IDLE_TIMEOUT_MS + 1_000;
  assert.equal(await touchStaffSession(goneIdle, request, pastTimeout), "idle");
});

test("touchStaffSession needs nothing it cannot find: no token, no db, or no matching row", async () => {
  const withToken = new Request("https://x.test", { headers: { Authorization: "Bearer tok" } });
  const noToken = new Request("https://x.test");

  assert.equal(await touchStaffSession(sessionDb(null), withToken), "none", "no row for this token");
  assert.equal(await touchStaffSession(sessionDb({ last_used_at: "2026-10-25 09:00:00" }), noToken), "none", "no bearer token at all");
  assert.equal(await touchStaffSession(null, withToken), "none", "no database");
});

test("the client key is a short hash, never the address itself", async () => {
  const key = await clientKey(new Request("https://x.test", { headers: { "CF-Connecting-IP": "203.0.113.7" } }));
  assert.equal(key.length, 16);
  assert.ok(!key.includes("203"));
  assert.equal(key, await clientKey(new Request("https://x.test", { headers: { "CF-Connecting-IP": "203.0.113.7" } })));
  assert.notEqual(key, await clientKey(new Request("https://x.test", { headers: { "CF-Connecting-IP": "203.0.113.8" } })));
});
