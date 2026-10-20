import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";

import { squash, findSpanRange, ZOOM_STEPS } from "../viewer.js";
import { documents, citations, citationFor, documentIdForFile } from "../data/sources.js";
import { knowledgeBase } from "../data/knowledge-base.js";

test("squash keeps letters and digits only, so spacing and punctuation do not matter", () => {
  assert.equal(squash("n askah  artikel, (full paper)"), "naskahartikelfullpaper");
  assert.equal(squash("Ujian Sidang — Pasal 24"), "ujiansidangpasal24");
  assert.equal(squash(null), "");
});

test("a quoted sentence is found across spans, however the PDF split it", () => {
  // PDF text arrives in fragments with unreliable spacing.
  const spans = ["Bab VIII", "Persyaratan ujian", " sidang dian", "taranya: 1) 3 eksemplar", "Draf Skripsi", "Penutup"];
  const range = findSpanRange(spans, "Persyaratan ujian sidang diantaranya");
  assert.deepEqual(range, { first: 1, last: 3 });
});

test("a phrase that is not on the page highlights nothing", () => {
  assert.equal(findSpanRange(["lorem ipsum", "dolor sit amet"], "kalimat yang tidak ada di halaman"), null);
  assert.equal(findSpanRange(["abc"], "x"), null, "too short to be meaningful");
});

test("zoom steps include 100% and are ascending", () => {
  assert.ok(ZOOM_STEPS.includes(1));
  assert.deepEqual([...ZOOM_STEPS], [...ZOOM_STEPS].sort((a, b) => a - b));
});

test("every published document exists on disk and has a thumbnail", async () => {
  for (const [id, doc] of Object.entries(documents)) {
    await assert.doesNotReject(() => access(new URL(`../${doc.file.slice(2)}`, import.meta.url)), `${id} PDF missing`);
    await assert.doesNotReject(() => access(new URL(`../assets/thumbs/${id}.jpg`, import.meta.url)), `${id} thumbnail missing`);
  }
});

test("every entry with a document has a citation inside that document's page range", () => {
  for (const entry of knowledgeBase) {
    if (!entry.sourceUrl) continue;
    const id = documentIdForFile(entry.sourceUrl);
    assert.ok(id, `${entry.id} points at an unknown document: ${entry.sourceUrl}`);

    const citation = citations[entry.id];
    assert.ok(citation, `${entry.id} has no page citation`);
    assert.ok(citation.page >= 1 && citation.page <= documents[id].pages, `${entry.id} cites page ${citation.page} of ${documents[id].pages}`);
    assert.ok(citation.highlight.length >= 8, `${entry.id} has no sentence to highlight`);
  }
});

test("an entry without a published document has no citation, rather than a made-up one", () => {
  const unpublished = knowledgeBase.filter((entry) => !entry.sourceUrl);
  assert.ok(unpublished.length >= 1);
  for (const entry of unpublished) assert.equal(citationFor(entry), null);
});

test("no citation points at a page that does not exist in the catalogue", () => {
  for (const id of Object.keys(citations)) {
    assert.ok(knowledgeBase.some((entry) => entry.id === id), `citation for unknown entry ${id}`);
  }
});
