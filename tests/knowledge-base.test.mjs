import test from "node:test";
import assert from "node:assert/strict";

import { knowledgeBase } from "../data/knowledge-base.js";

// The categories the four source documents actually cover. Adding one here
// without a document behind it would be padding, not coverage.
const requiredCategories = [
  "Tugas Akhir",
  "Sidang",
  "Kelulusan",
  "Penulisan Ilmiah",
  "Administrasi",
];

const requiredFields = [
  "id",
  "category",
  "title",
  "questions",
  "followUps",
  "keywords",
  "answer",
  "sourceTitle",
  "sourceOwner",
  "validPeriod",
  "updatedAt",
  "sourceRef",
  "escalation",
];

test("knowledge base covers every academic demonstration category", () => {
  const categories = new Set(knowledgeBase.map((entry) => entry.category));

  assert.deepEqual([...categories].sort(), [...requiredCategories].sort());
});

test("every knowledge entry has complete source and answer metadata", () => {
  for (const entry of knowledgeBase) {
    for (const field of requiredFields) {
      const value = entry[field];

      if (Array.isArray(value)) {
        assert.ok(value.length > 0, `${entry.id}.${field} must not be empty`);
        assert.ok(value.every((item) => typeof item === "string" && item.trim()));
      } else {
        assert.equal(typeof value, "string", `${entry.id}.${field} must be a string`);
        assert.ok(value.trim(), `${entry.id}.${field} must not be empty`);
      }
    }
  }
});

test("knowledge entry IDs are unique", () => {
  const ids = knowledgeBase.map((entry) => entry.id);

  assert.equal(new Set(ids).size, ids.length);
});

test("knowledge base terminology does not use kanal", () => {
  const serialized = JSON.stringify(knowledgeBase);

  assert.doesNotMatch(serialized, /kanal/i);
});

test("an entry either links its source document or is silent about it", async () => {
  // Readers must be able to check the pedoman themselves, so every entry that
  // cites a published document links to the file served with the site.
  const { readFile } = await import("node:fs/promises");

  for (const entry of knowledgeBase) {
    if (entry.sourceUrl === null || entry.sourceUrl === undefined) continue;

    assert.match(entry.sourceUrl, /^\.\/dokumen\/[\w.-]+\.pdf$/, `odd document path on ${entry.id}`);

    const file = new URL(`../${entry.sourceUrl.slice(2)}`, import.meta.url);
    await assert.doesNotReject(
      () => readFile(file),
      `${entry.id} points at a document that is not published: ${entry.sourceUrl}`,
    );
  }
});

test("documents are linked, never invented", () => {
  // sourceUrl used to hold example.com links that went nowhere.
  for (const entry of knowledgeBase) {
    if (!entry.sourceUrl) continue;
    assert.ok(!entry.sourceUrl.includes("example.com"), `${entry.id} links to a placeholder`);
    assert.ok(!entry.sourceUrl.startsWith("http"), `${entry.id} should link the published copy`);
  }
});
