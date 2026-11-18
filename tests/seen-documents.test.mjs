import test from "node:test";
import assert from "node:assert/strict";
import { MAX_SEEN_PER_USER, addSeen, cleanIds, isDocumentId, listSeen } from "../worker/src/seen-documents.js";

/** D1 tiruan seperlunya: satu tabel seen_documents di memori. */
function fakeDb() {
  const rows = [];
  let tick = 0;
  const statement = (sql) => ({
    args: [],
    bind(...args) {
      this.args = args;
      return this;
    },
    async all() {
      const [user, limit] = this.args;
      const mine = rows.filter((r) => r.user_id === user).sort((a, b) => b.seen_at - a.seen_at);
      return { results: mine.slice(0, limit).map((r) => ({ document_id: r.document_id })) };
    },
    async run() {
      if (/^INSERT/.test(sql)) {
        const [user_id, document_id] = this.args;
        const hit = rows.find((r) => r.user_id === user_id && r.document_id === document_id);
        if (hit) hit.seen_at = ++tick;
        else rows.push({ user_id, document_id, seen_at: ++tick });
      } else if (/^DELETE/.test(sql)) {
        const [user, , keep] = this.args;
        const mine = rows.filter((r) => r.user_id === user).sort((a, b) => b.seen_at - a.seen_at);
        for (const extra of mine.slice(keep)) rows.splice(rows.indexOf(extra), 1);
      }
    },
  });
  return {
    rows,
    prepare: statement,
    async batch(list) {
      for (const item of list) await item.run();
    },
  };
}

test("document ids are plain slugs", () => {
  assert.equal(isDocumentId("kalender-akademik-2026"), true);
  assert.equal(isDocumentId("../etc/passwd"), false);
  assert.equal(isDocumentId("A B"), false);
  assert.equal(isDocumentId(""), false);
});

test("cleanIds drops junk and duplicates and caps the batch", () => {
  assert.deepEqual(cleanIds(["a-1", "a-1", 5, null, "<script>", "b-2"]), ["a-1", "b-2"]);
  assert.deepEqual(cleanIds("nope"), []);
  assert.equal(cleanIds(Array.from({ length: 500 }, (_, i) => `doc-${i}`)).length, 50);
});

test("seen documents are saved per user, newest first, without duplicates", async () => {
  const db = fakeDb();
  const ana = { id: "ana" };
  const budi = { id: "budi" };
  await addSeen(db, ana, ["kalender", "pedoman"]);
  await addSeen(db, ana, ["kalender"]);
  await addSeen(db, budi, ["buku-magang"]);
  assert.deepEqual(await listSeen(db, ana), ["kalender", "pedoman"]);
  assert.deepEqual(await listSeen(db, budi), ["buku-magang"]);
  assert.equal(db.rows.length, 3);
});

test("a user cannot keep more than the cap, the oldest go first", async () => {
  const db = fakeDb();
  const user = { id: "u" };
  for (let i = 0; i < MAX_SEEN_PER_USER + 5; i += 50) {
    await addSeen(db, user, Array.from({ length: 50 }, (_, j) => `doc-${i + j}`));
  }
  const ids = await listSeen(db, user);
  assert.equal(ids.length <= MAX_SEEN_PER_USER, true);
  assert.equal(ids.includes("doc-0"), false);
});

test("without a user or a database nothing is read or written", async () => {
  assert.deepEqual(await listSeen(null, { id: "x" }), []);
  assert.equal(await addSeen(fakeDb(), null, ["a"]), 0);
  assert.equal(await addSeen(fakeDb(), { id: "x" }, []), 0);
});
