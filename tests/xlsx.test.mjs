import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { buildDashboardWorkbook } from "../lib/report.js";
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

test("the dashboard workbook carries the cards, both charts, and the data they read", () => {
  const outcomes = {
    berbasis_sumber: { label: "Berbasis Sumber", color: "#b91c2c" },
    klarifikasi: { label: "Klarifikasi Info", color: "#1f2a44" },
    bukti_terbatas: { label: "Bukti Terbatas", color: "#6b7a99" },
    di_luar_cakupan: { label: "Di Luar Cakupan", color: "#e08a2c" },
    gangguan_teknis: { label: "Gangguan Teknis", color: "#e8788a" },
  };
  const bytes = buildDashboardWorkbook({
    summary: {
      label: "4 Minggu Terakhir",
      total: 8,
      counts: { berbasis_sumber: 1, klarifikasi: 1, bukti_terbatas: 0, di_luar_cakupan: 0, gangguan_teknis: 6 },
      percents: { berbasis_sumber: 12.5, klarifikasi: 12.5, bukti_terbatas: 0, di_luar_cakupan: 0, gangguan_teknis: 75 },
      groundedAccuracy: 25,
      series: [{ label: "Minggu 1", total: 0 }, { label: "Minggu 2", total: 8 }],
    },
    documents: { total: 3, ready: 3, validating: 0, readiness: 100 },
    interactions: [{ code: "INT-1", at: "2026-10-20 03:00:00", category: "Sidang & <Skripsi>", outcome: "gangguan_teknis", ok: false, durationMs: 1500 }],
    outcomes,
    sources: [{ key: "ready", label: "Siap Digunakan", color: "#2e9e6b", note: "Tervalidasi" }],
    exportedAt: "20 Oktober 2026",
    wib: () => ({ label: "Hari ini", time: "10:00" }),
  });

  const dir = mkdtempSync(join(tmpdir(), "xlsx-"));
  const file = join(dir, "dashboard.xlsx");
  writeFileSync(file, bytes);
  const read = (part) => {
    try {
      return execFileSync("unzip", ["-p", file, part], { encoding: "utf8" });
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  };

  const dashboard = read("xl/worksheets/sheet1.xml");
  if (dashboard === null) return; // tanpa unzip tidak ada yang bisa diperiksa lebih jauh
  assert.match(execFileSync("unzip", ["-t", file], { encoding: "utf8" }), /No errors detected/);
  assert.ok(dashboard.includes("Dashboard Overview"));
  assert.ok(dashboard.includes("TOTAL INTERAKSI"));
  assert.ok(dashboard.includes("Sidang &amp; &lt;Skripsi&gt;"), "text is escaped");
  assert.ok(dashboard.includes('<drawing r:id="rId1"/>'));
  assert.match(read("xl/charts/chart1.xml"), /<c:lineChart>/);
  assert.match(read("xl/charts/chart2.xml"), /<c:doughnutChart>/);
  assert.ok(read("xl/charts/chart2.xml").includes('srgbClr val="B91C2C"'), "slice colours come from the web legend");
  assert.ok(read("xl/worksheets/sheet2.xml").includes("Minggu 2"), "the Data sheet feeds the charts");
  assert.ok(read("xl/charts/chart1.xml").includes("Data!$A$2:$A$3"), "chart ranges match the Data sheet");
});
