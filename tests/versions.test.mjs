import test from "node:test";
import assert from "node:assert/strict";

import { versionInfo, versionLabel } from "../lib/versions.js";

const doc = (id, extra = {}) => ({ id, title: `Dokumen ${id}`, supersedes: null, relatedTo: null, ...extra });

test("a document with no relations is not shown as part of any version chain", () => {
  const docs = [doc("a"), doc("b")];
  const info = versionInfo(docs[0], docs);
  assert.equal(info.inChain, false);
  assert.equal(info.replaces, null);
  assert.deepEqual(info.replacedBy, []);
  assert.deepEqual(info.related, []);
});

test("a chain of three reads as version 1, 2 and 3 of 3, from either end", () => {
  const docs = [doc("v1"), doc("v2", { supersedes: "v1" }), doc("v3", { supersedes: "v2" })];
  const [one, two, three] = docs.map((d) => versionInfo(d, docs));

  assert.deepEqual([one.number, one.total], [1, 3]);
  assert.deepEqual([two.number, two.total], [2, 3]);
  assert.deepEqual([three.number, three.total], [3, 3]);
  assert.ok(one.inChain && two.inChain && three.inChain);

  assert.equal(one.replaces, null);
  assert.deepEqual(one.replacedBy.map((d) => d.id), ["v2"]);
  assert.equal(two.replaces.id, "v1");
  assert.deepEqual(two.replacedBy.map((d) => d.id), ["v3"]);
  assert.equal(three.replaces.id, "v2");
  assert.deepEqual(three.replacedBy, []);
});

test("a reference to a deleted document is kept and labelled instead of breaking the row", () => {
  const docs = [doc("v2", { supersedes: "v1-dihapus" })];
  const info = versionInfo(docs[0], docs);
  assert.equal(info.replaces.missing, true);
  assert.equal(versionLabel(info.replaces), "v1-dihapus (sudah dihapus)");
  assert.equal(versionLabel(docs[0]), "Dokumen v2");
  assert.deepEqual([info.number, info.total], [1, 1]);
});

test("a looping chain terminates", () => {
  const docs = [doc("a", { supersedes: "b" }), doc("b", { supersedes: "a" })];
  const info = versionInfo(docs[0], docs);
  assert.equal(info.number, 2);
  assert.equal(info.total, 2);
});

test("related documents are listed from both directions", () => {
  const docs = [doc("induk"), doc("lampiran", { relatedTo: "induk" }), doc("catatan", { relatedTo: "induk" })];
  assert.deepEqual(versionInfo(docs[1], docs).related.map((d) => d.id), ["induk"]);
  assert.deepEqual(versionInfo(docs[0], docs).related.map((d) => d.id), ["lampiran", "catatan"]);
  assert.equal(versionInfo(docs[0], docs).inChain, false, "terkait bukan versi");
});

test("when two documents both replace the same one, both are listed as its successors", () => {
  const docs = [doc("lama"), doc("baru-1", { supersedes: "lama" }), doc("baru-2", { supersedes: "lama" })];
  assert.deepEqual(versionInfo(docs[0], docs).replacedBy.map((d) => d.id), ["baru-1", "baru-2"]);
});
