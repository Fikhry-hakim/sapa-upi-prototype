import test from "node:test";
import assert from "node:assert/strict";

import {
  recordExchange,
  listConversations,
  readConversation,
  deleteConversation,
  likePattern,
  searchConversations,
  snippetAround,
  deleteAllConversations,
  exportConversations,
} from "../worker/src/history.js";

/**
 * A fake D1 that records every statement and the values bound to it, so the
 * tests can assert what the queries actually filter on — the point being that
 * no query may read a conversation without also matching its owner.
 */
function fakeDb({ first = null, results = [], changes = 0 } = {}) {
  const calls = [];
  const db = {
    calls,
    prepare(sql) {
      const call = { sql, bindings: [] };
      calls.push(call);
      const statement = {
        bind: (...values) => {
          call.bindings = values;
          return statement;
        },
        first: async () => (typeof first === "function" ? first(call) : first),
        all: async () => ({ results }),
        run: async () => ({ meta: { changes } }),
      };
      return statement;
    },
    batch: async (statements) => statements,
  };
  return db;
}

const user = { id: "user-1", email: "a@upi.edu" };
const other = { id: "user-2", email: "b@upi.edu" };

test("listing conversations always filters by the owner", async () => {
  const db = fakeDb({ results: [{ id: "c1", title: "Syarat sidang", updated_at: "2026-10-14" }] });

  const list = await listConversations(db, user);

  assert.equal(list.length, 1);
  const [call] = db.calls;
  assert.match(call.sql, /WHERE user_id = \?/);
  assert.equal(call.bindings[0], user.id, "the owner must be bound into the query");
});

test("reading a conversation matches the id and the owner together", async () => {
  const db = fakeDb({ first: { id: "c1", title: "Syarat sidang", updated_at: "x" } });

  await readConversation(db, user, "c1");

  const [lookup] = db.calls;
  assert.match(lookup.sql, /WHERE id = \? AND user_id = \?/);
  assert.deepEqual(lookup.bindings, ["c1", user.id]);
});

test("someone else's conversation reads as missing, not as forbidden-but-there", async () => {
  // The ownership filter is in the query, so a conversation belonging to
  // another user simply does not come back.
  const db = fakeDb({ first: null });

  assert.equal(await readConversation(db, other, "c1"), null);
});

test("deleting matches the owner too, so ids cannot be guessed away", async () => {
  const db = fakeDb({ changes: 0 });

  assert.equal(await deleteConversation(db, other, "c1"), false);
  assert.match(db.calls[0].sql, /DELETE FROM conversations WHERE id = \? AND user_id = \?/);
  assert.deepEqual(db.calls[0].bindings, ["c1", other.id]);
});

test("recording into an existing conversation first proves it belongs to the asker", async () => {
  const db = fakeDb({ first: null }); // ownership check finds nothing

  const id = await recordExchange(db, user, {
    conversationId: "milik-orang-lain",
    question: "Apa syarat sidang?",
    answer: "...",
  });

  const [ownership] = db.calls;
  assert.match(ownership.sql, /SELECT id FROM conversations WHERE id = \? AND user_id = \?/);
  assert.deepEqual(ownership.bindings, ["milik-orang-lain", user.id]);
  assert.notEqual(id, "milik-orang-lain", "must start a new conversation instead of writing there");
});

test("an anonymous reader is not recorded at all", async () => {
  const db = fakeDb();

  assert.equal(await recordExchange(db, null, { question: "x", answer: "y" }), null);
  assert.equal(db.calls.length, 0, "no statement should run without a user");
  assert.deepEqual(await listConversations(db, null), []);
  assert.equal(await readConversation(db, null, "c1"), null);
});

test("a new conversation stores both turns and what grounded the answer", async () => {
  const db = fakeDb({ first: null });

  const id = await recordExchange(db, user, {
    question: "Apa syarat sidang?",
    answer: "Persyaratannya ...",
    entryId: "sidang-syarat-skripsi",
    source: "llm",
  });

  assert.ok(id, "a conversation id is returned so the browser can continue it");

  const sql = db.calls.map((call) => call.sql).join("\n");
  assert.match(sql, /INSERT INTO conversations/);
  assert.match(sql, /role, content\) VALUES \(\?, \?, 'user', \?\)/);
  assert.match(sql, /'assistant'/);

  const assistant = db.calls.find((call) => call.sql.includes("'assistant'"));
  assert.ok(assistant.bindings.includes("sidang-syarat-skripsi"));
  assert.ok(assistant.bindings.includes("llm"));
});

test("an offline answer is recorded as offline, not as something the model wrote", async () => {
  // Gemini being unreachable used to mean the exchange was simply lost: the
  // Worker answered 502 and recorded nothing, while the reader still got an
  // answer from local matching.
  const db = fakeDb({ first: null });

  await recordExchange(db, user, {
    question: "Apa syarat mengambil skripsi?",
    answer: "Minimal 110 SKS dengan IPK 2,50.",
    entryId: "skripsi-syarat-mengambil",
    source: "offline",
  });

  const assistant = db.calls.find((call) => call.sql.includes("'assistant'"));
  assert.ok(assistant.bindings.includes("offline"), "the source must say where it came from");
  assert.ok(assistant.bindings.includes("skripsi-syarat-mengambil"));
});

test("search characters are matched literally, not as wildcards", () => {
  assert.equal(likePattern("50%"), "%50\\%%");
  assert.equal(likePattern("a_b"), "%a\\_b%");
  assert.equal(likePattern("sidang"), "%sidang%");
});

test("searching always filters by the owner, in the title and the messages", async () => {
  const db = fakeDb({ results: [{ id: "c1", title: "Syarat sidang", updated_at: "x" }] });

  const found = await searchConversations(db, user, "sidang");

  assert.equal(found.length, 1);
  const [call] = db.calls;
  assert.match(call.sql, /WHERE c\.user_id = \?1/);
  assert.equal(call.bindings[0], user.id);
  assert.match(call.sql, /m\.content LIKE/);
  assert.deepEqual(await searchConversations(db, null, "x"), []);
});

test("deleting everything touches only the asker's conversations", async () => {
  const db = fakeDb({ changes: 3 });

  assert.equal(await deleteAllConversations(db, user), 3);
  assert.match(db.calls[0].sql, /DELETE FROM conversations WHERE user_id = \?/);
  assert.deepEqual(db.calls[0].bindings, [user.id]);
  assert.equal(await deleteAllConversations(db, null), 0);
});

test("the export is scoped to the asker through the conversation owner", async () => {
  const db = fakeDb({ results: [] });

  const data = await exportConversations(db, user);

  assert.deepEqual(data.conversations, []);
  assert.equal(data.account, user.email);
  for (const call of db.calls) assert.ok(call.bindings.includes(user.id), "every export query must bind the owner");
  assert.deepEqual((await exportConversations(db, null)).conversations, []);
});

test("a search snippet is cut around the match and marked where it was trimmed", () => {
  const text = `${"a ".repeat(80)}sidang skripsi${" b".repeat(80)}`;
  const snippet = snippetAround(text, "sidang");
  assert.ok(snippet.includes("sidang skripsi"));
  assert.ok(snippet.startsWith("…") && snippet.endsWith("…"));
  assert.ok(snippet.length < 160);
  assert.equal(snippetAround("sidang dekat", "sidang"), "sidang dekat");
  assert.equal(snippetAround("", "x"), "");
});
