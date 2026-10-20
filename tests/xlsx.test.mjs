import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { bold, buildXlsx, columnName, crc32, sheetName } from "../lib/xlsx.js";

test("crc32 matches the standard check value", () => {
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
});

test("column names count like a spreadsheet", () => {
  assert.equal(columnName(0), "A");
  assert.equal(columnName(25), "Z");
  assert.equal(columnName(26), "AA");
  assert.equal(columnName(27), "AB");
});

test("sheet names are cleaned to what Excel accepts", () => {
  assert.equal(sheetName("Ringkasan: 2026/10", 0), "Ringkasan  2026 10");
  assert.equal(sheetName("x".repeat(50), 0).length, 31);
  assert.equal(sheetName("///", 2), "Lembar 3");
});

test("the workbook is a valid zip with the expected parts and escaped text", () => {
  const bytes = buildXlsx([
    { name: "Ringkasan", rows: [bold(["Metrik", "Jumlah"]), ["A & B <x>", 12], ["kosong", ""]] },
    { name: "Tren", rows: [["Minggu 1", 3]] },
  ]);
  assert.equal(bytes[0], 0x50);
  assert.equal(bytes[1], 0x4b);

  const dir = mkdtempSync(join(tmpdir(), "xlsx-"));
  const file = join(dir, "laporan.xlsx");
  writeFileSync(file, bytes);

  let listing = "";
  try {
    listing = execFileSync("unzip", ["-l", file], { encoding: "utf8" });
  } catch (error) {
    if (error.code === "ENOENT") return; // tanpa unzip, cukup pemeriksaan tanda tangan di atas
    throw error;
  }
  for (const part of ["[Content_Types].xml", "xl/workbook.xml", "xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml", "xl/styles.xml"]) {
    assert.ok(listing.includes(part), `missing ${part}`);
  }
  // unzip -t memeriksa CRC setiap berkas.
  assert.match(execFileSync("unzip", ["-t", file], { encoding: "utf8" }), /No errors detected/);
  const sheet1 = execFileSync("unzip", ["-p", file, "xl/worksheets/sheet1.xml"], { encoding: "utf8" });
  assert.ok(sheet1.includes("A &amp; B &lt;x&gt;"));
  assert.ok(sheet1.includes("<v>12</v>"));
});
