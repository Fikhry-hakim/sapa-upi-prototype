import test from "node:test";
import assert from "node:assert/strict";

import { knowledgeBase } from "../data/knowledge-base.js";

const requiredCategories = [
  "Jadwal",
  "Administrasi",
  "Perkuliahan",
  "Tugas Akhir",
  "Sidang",
  "Kelulusan",
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
  "sourceUrl",
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
