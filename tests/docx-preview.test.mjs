import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { readZipDirectory, readZipText } from "../lib/docx-preview.js";
import { documents } from "../data/sources.js";

const dir = new URL("../dokumen/template/", import.meta.url);

test("every bundled Word template is a readable zip with a document body", async () => {
  const names = (await readdir(dir)).filter((name) => name.endsWith(".docx"));
  assert.ok(names.length >= 14);
  for (const name of names) {
    const file = await readFile(new URL(name, dir));
    const buffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
    const entries = readZipDirectory(buffer);
    const xml = await readZipText(buffer, entries, "word/document.xml");
    assert.match(xml, /<w:body>/, `${name} has no body`);
  }
});

test("a non-zip file is rejected instead of rendered", () => {
  assert.throws(() => readZipDirectory(new TextEncoder().encode("bukan zip, hanya teks biasa yang cukup panjang").buffer), /zip/);
});

test("every template file is registered as a document the viewer can open", () => {
  const registered = Object.values(documents).filter((doc) => doc.file.startsWith("./dokumen/template/"));
  assert.equal(registered.length, 15);
  assert.equal(registered.filter((doc) => doc.kind === "DOCX").length, 14);
});
