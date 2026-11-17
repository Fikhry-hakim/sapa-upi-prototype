import test from "node:test";
import assert from "node:assert/strict";
import { MAX_SHARES_PER_USER, createShare, isToken, newToken, readShare, revokeShare, snapshotOf } from "../worker/src/shares.js";

/** D1 tiruan seperlunya: satu tabel shares di memori. */
function fakeDb() {
  const rows = [];
  const statement = (sql) => ({
    args: [],
    bind(...args) {
      this.args = args;
      return this;
    },
    async first() {
      if (/COUNT\(\*\)/.test(sql)) return { n: rows.filter((r) => r.user_id === this.args[0]).length };
      if (/FROM shares WHERE conversation_id/.test(sql)) {
        const [conversation, user, count] = this.args;
        return rows.find((r) => r.conversation_id === conversation && r.user_id === user && r.message_count === count) ?? null;
      }
      if (/FROM shares WHERE token/.test(sql)) return rows.find((r) => r.token === this.args[0]) ?? null;
      return null;
    },
    async run() {
      if (/INSERT INTO shares/.test(sql)) {
        const [token, user_id, conversation_id, title, snapshot, message_count] = this.args;
        rows.push({ token, user_id, conversation_id, title, snapshot, message_count, created_at: "2026-11-17" });
        return { meta: { changes: 1 } };
      }
      if (/DELETE FROM shares/.test(sql)) {
        const index = rows.findIndex((r) => r.token === this.args[0] && r.user_id === this.args[1]);
        if (index >= 0) rows.splice(index, 1);
        return { meta: { changes: index >= 0 ? 1 : 0 } };
      }
      return { meta: { changes: 0 } };
    },
  });
  return { rows, prepare: statement };
}

const conversation = (n = 2) => ({
  id: "c1",
  title: "Syarat sidang",
  messages: Array.from({ length: n }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: `pesan ${i}`, entry_id: "x", answer_source: "llm" })),
});

test("tokens are 22 url-safe characters and never repeat", () => {
  const seen = new Set(Array.from({ length: 200 }, newToken));
  assert.equal(seen.size, 200);
  for (const token of seen) assert.ok(isToken(token));
  assert.equal(isToken("short"), false);
  assert.equal(isToken("x".repeat(21) + "/"), false);
});

test("only role and content are shared", () => {
  assert.deepEqual(snapshotOf(conversation(2).messages), [
    { role: "user", content: "pesan 0" },
    { role: "assistant", content: "pesan 1" },
  ]);
});

test("sharing creates a readable snapshot, and the same chat reuses its link until it grows", async () => {
  const db = fakeDb();
  const user = { id: "u1", email: "a@upi.edu", name: "A" };
  const first = await createShare(db, user, conversation(2));
  const again = await createShare(db, user, conversation(2));
  assert.equal(again.token, first.token);
  const grown = await createShare(db, user, conversation(4));
  assert.notEqual(grown.token, first.token, "new messages need a new snapshot");

  const read = await readShare(db, first.token);
  assert.equal(read.title, "Syarat sidang");
  assert.equal(read.messages.length, 2);
  assert.equal(JSON.stringify(read).includes("a@upi.edu"), false, "the owner's identity is never in the shared copy");
});

test("an empty chat cannot be shared, and a bad token reads nothing", async () => {
  const db = fakeDb();
  assert.equal(await createShare(db, { id: "u1" }, conversation(0)), null);
  assert.equal(await readShare(db, "not-a-token"), null);
  assert.equal(await readShare(db, newToken()), null);
});

test("only the owner can revoke, and a revoked link stops working", async () => {
  const db = fakeDb();
  const share = await createShare(db, { id: "u1" }, conversation(2));
  assert.equal(await revokeShare(db, { id: "u2" }, share.token), false);
  assert.ok(await readShare(db, share.token));
  assert.equal(await revokeShare(db, { id: "u1" }, share.token), true);
  assert.equal(await readShare(db, share.token), null);
});

test("a user cannot hold more links than the limit", async () => {
  const db = fakeDb();
  for (let i = 0; i < MAX_SHARES_PER_USER; i += 1) {
    db.rows.push({ token: newToken(), user_id: "u1", conversation_id: `other${i}`, message_count: 2, title: "t", snapshot: "[]", created_at: "x" });
  }
  assert.deepEqual(await createShare(db, { id: "u1" }, conversation(2)), { error: "limit" });
});
