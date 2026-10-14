import test from "node:test";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

import { bearerToken, can, hashToken, createToken } from "../worker/src/auth.js";
import { isAllowedEmail, decodeIdToken, allowedDomains } from "../worker/src/google-oidc.js";
import { titleFrom } from "../worker/src/history.js";

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
