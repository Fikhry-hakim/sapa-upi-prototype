import assert from "node:assert/strict";
import test from "node:test";

import {
  attemptLogin,
  hashPassword,
  MAX_FAILURES,
  passwordProblem,
  verifyPassword,
} from "../worker/src/password.js";

/** Basis data kecil di memori yang mengerti tepat query milik modul ini. */
function memoryDb({ users = [], credentials = {} } = {}) {
  const failures = [];
  const run = (sql, args) => ({
    first: async () => {
      if (/COUNT\(\*\)/.test(sql)) {
        const [email, since] = args;
        return { n: failures.filter((f) => f.email === email && f.at > since).length };
      }
      if (/FROM users WHERE email/.test(sql)) return users.find((u) => u.email === args[0]) ?? null;
      if (/FROM credentials/.test(sql)) return credentials[args[0]] ? { hash: credentials[args[0]] } : null;
      return null;
    },
    run: async () => {
      if (/INSERT INTO login_failures/.test(sql)) failures.push({ email: args[0], at: args[1] });
      if (/DELETE FROM login_failures WHERE email/.test(sql)) {
        for (let i = failures.length - 1; i >= 0; i -= 1) if (failures[i].email === args[0]) failures.splice(i, 1);
      }
      return {};
    },
  });
  return {
    failures,
    prepare: (sql) => ({ bind: (...args) => run(sql, args) }),
  };
}

const domainOk = (email) => email.endsWith("@upi.edu");

test("a password verifies against its own hash and no other", async () => {
  const stored = await hashPassword("kata-sandi-panjang-1");
  assert.ok(stored.startsWith("pbkdf2$"));
  assert.ok(!stored.includes("kata-sandi-panjang-1"));
  assert.equal(await verifyPassword("kata-sandi-panjang-1", stored), true);
  assert.equal(await verifyPassword("kata-sandi-panjang-2", stored), false);
  assert.equal(await verifyPassword("apa saja", "bukan-hash"), false);
});

test("the same password hashes differently each time (random salt)", async () => {
  assert.notEqual(await hashPassword("kata-sandi-panjang-1"), await hashPassword("kata-sandi-panjang-1"));
});

test("password policy: length, email name, and trivial repeats", () => {
  assert.match(passwordProblem("pendek", "a@upi.edu"), /minimal/);
  assert.match(passwordProblem("x".repeat(200), "a@upi.edu"), /maksimal/);
  assert.match(passwordProblem("budisantoso123", "budisantoso@upi.edu"), /nama email/);
  assert.match(passwordProblem("aaaaaaaaaaaa", "b@upi.edu"), /mudah ditebak/);
  assert.equal(passwordProblem("kata-sandi-panjang-1", "b@upi.edu"), null);
});

test("a correct login returns the user and clears earlier failures", async () => {
  const stored = await hashPassword("kata-sandi-panjang-1");
  const db = memoryDb({
    users: [{ id: "g1", email: "ani@upi.edu", name: "Ani" }],
    credentials: { g1: stored },
  });
  await attemptLogin(db, { email: "ani@upi.edu", password: "salah-salah-1" }, { domainOk });
  assert.equal(db.failures.length, 1);

  const result = await attemptLogin(db, { email: " Ani@UPI.edu ", password: "kata-sandi-panjang-1" }, { domainOk });
  assert.equal(result.user.id, "g1");
  assert.equal(db.failures.length, 0);
});

test("unknown email, no password, wrong password and wrong domain all look the same", async () => {
  const stored = await hashPassword("kata-sandi-panjang-1");
  const db = memoryDb({
    users: [
      { id: "g1", email: "ani@upi.edu", name: "Ani" },
      { id: "g2", email: "tanpa@upi.edu", name: "T" },
      { id: "g3", email: "luar@gmail.com", name: "L" },
    ],
    credentials: { g1: stored, g3: stored },
  });
  const attempts = [
    { email: "tidakada@upi.edu", password: "kata-sandi-panjang-1" },
    { email: "tanpa@upi.edu", password: "kata-sandi-panjang-1" },
    { email: "ani@upi.edu", password: "salah-salah-1" },
    { email: "luar@gmail.com", password: "kata-sandi-panjang-1" },
  ];
  for (const attempt of attempts) {
    const result = await attemptLogin(db, attempt, { domainOk });
    assert.equal(result.user, undefined);
    assert.equal(result.status, 401);
    assert.equal(result.error, "Email atau kata sandi salah.");
  }
});

test("after too many failures even the right password is refused for a while", async () => {
  const stored = await hashPassword("kata-sandi-panjang-1");
  const db = memoryDb({ users: [{ id: "g1", email: "ani@upi.edu", name: "Ani" }], credentials: { g1: stored } });

  for (let i = 0; i < MAX_FAILURES; i += 1) {
    await attemptLogin(db, { email: "ani@upi.edu", password: "salah-salah-1" }, { domainOk });
  }
  const locked = await attemptLogin(db, { email: "ani@upi.edu", password: "kata-sandi-panjang-1" }, { domainOk });
  assert.equal(locked.status, 429);
  assert.equal(locked.user, undefined);
});
