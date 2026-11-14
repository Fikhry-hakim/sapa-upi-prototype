import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../app.js", import.meta.url), "utf8");
const lines = source.split("\n");

// Panggilan yang memang tidak boleh menyingkirkan sesi sendiri: pemeriksaan sesi saat
// halaman dimuat (loadAccount mengurusnya), keluar, dan bertanya (tetap dijawab anonim).
const EXEMPT = [/\/auth\/me/, /\/auth\/logout/, /fetch\(API_URL, \{/, /\/feedback/, /\/documents`/];

test("every request that carries the session token drops an expired session instead of leaving a stale login", () => {
  const sites = [];
  lines.forEach((line, i) => {
    if (!/\bfetch\(/.test(line) || /^\s*\/\//.test(line)) return;
    const block = lines.slice(i, i + 6).join("\n");
    if (!/authHeaders\(\)/.test(block)) return;
    if (EXEMPT.some((pattern) => pattern.test(line))) return;
    // Pemeriksaan harus ada di fungsi yang sama: berhenti di akhir fungsi (kurung kurawal
    // di kolom 0) atau di fetch berikutnya, supaya penanganan milik fungsi tetangga tidak ikut terhitung.
    let end = i + 1;
    while (end < lines.length && !/^\}/.test(lines[end]) && !/\bfetch\(/.test(lines[end])) end += 1;
    sites.push({ line: i + 1, text: line.trim(), after: lines.slice(i, end).join("\n") });
  });

  assert.ok(sites.length >= 6, `harus menemukan fetch bertoken, ditemukan ${sites.length}`);
  for (const site of sites) {
    assert.match(site.after, /dropExpiredSession\(/, `app.js:${site.line} memakai token tetapi tidak menangani 401: ${site.text}`);
  }
});

test("the admin api() helper and the guard against a stale response both exist", () => {
  const api = source.slice(source.indexOf("async function api("), source.indexOf("const owner = createOwner"));
  assert.match(api, /dropExpiredSession\(/);
  // Respons lama tidak boleh menendang keluar sesi yang baru dibuat.
  assert.match(source, /state\.sessionToken !== sentToken/);
});
