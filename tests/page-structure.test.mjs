import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../style.css", import.meta.url), "utf8");
const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

test("page exposes every required interactive control", () => {
  for (const id of [
    "chat-form",
    "chat-input",
    "chat-log",
    "sidebar",
    "reset-chat",
    "quick-cards",
    "deep-search-toggle",
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
});

test("page has one primary heading and an accessible chat form", () => {
  assert.equal((html.match(/<h1\b/gi) ?? []).length, 1);
  assert.match(html, /<label[^>]+for=["']chat-input["']/i);
  assert.match(html, /id=["']chat-log["'][^>]+aria-live=["']polite["']/i);
});

test("page clearly identifies the prototype and loads the module app", () => {
  assert.match(html, /prototipe simulasi ai/i);
  assert.match(html, /<script[^>]+type=["']module["'][^>]+src=["']\.\/app\.js["']/i);
});

test("sidebar matches the SAPA UPI design shell", () => {
  const requiredMarkers = [
    "mascot-sapa",
    "Akses Akademik",
    "Chat Baru",
    "Cari percakapan...",
    "Kalender Aktif",
    "Semester Ganjil 2026",
  ];

  for (const marker of requiredMarkers) {
    assert.ok(html.includes(marker), `missing required marker: ${marker}`);
  }

  for (const item of ["Explore", "Library", "Files", "History"]) {
    assert.match(html, new RegExp(`data-nav="[a-z]+"[\\s\\S]{0,400}<span>${item}</span>`));
  }
});

test("sidebar and chat surface use the light design theme", () => {
  const sidebarRule = css.match(/\n\.sidebar\s*\{([^}]*)\}/)?.[1] ?? "";

  assert.match(sidebarRule, /background:\s*var\(--surface\)/);
  assert.match(css, /--surface:\s*#ffffff/i);
});

test("landing view greets the student and offers the composer", () => {
  assert.match(html, /Halo, Rizky Pratama/);
  assert.match(html, /Ada yang bisa saya bantu hari ini\?/);
  assert.match(html, /placeholder="Ketik pertanyaan akademik Anda\.\.\."/);
  assert.match(html, /Pencarian Mendalam/);
  assert.match(html, /Pertanyaan tersimpan/);
  assert.match(html, /Lampirkan file/);
});

test("chat main starts in the landing view and toggles via JS", () => {
  assert.match(html, /id=["']chat-main["'][^>]*data-view=["']landing["']/);
  assert.match(app, /function setView\(/);
  assert.match(app, /elements\.chatMain\.dataset\.view = view/);
});

test("mascot image has useful alternative text and is never used as a background", () => {
  assert.match(
    html,
    /<img[^>]+class="[^"]*mascot-sapa[^"]*"[^>]+alt="Maskot SAPA mengenakan toga wisuda"/,
  );
  assert.doesNotMatch(css, /background(?:-image)?:[^;]*mascot-sapa/);
});

test("chatbot messages consistently use the SAPA mascot avatar", () => {
  assert.match(app, /message-avatar[^`]*mascot-sapa\.png/);
});

test("quick action cards mirror the four design tiles with SVG icons", () => {
  const labels = app.match(/label:\s*"([^"]+)"/g) ?? [];

  assert.deepEqual(labels, [
    'label: "Jadwal Kuliah"',
    'label: "KRS Online"',
    'label: "Sidang & Skripsi"',
    'label: "Administrasi"',
  ]);
  assert.equal((app.match(/icon:\s*'[^']*'/g) ?? []).length, 4);
  assert.doesNotMatch(app, /[⌂▤▦◆✎★▧]/);
});

test("answers render as a card with red bullet points and source attribution", () => {
  assert.match(app, /answer-points/);
  assert.match(app, /Source: \$\{entry\.sourceTitle\}/);
  assert.match(css, /\.answer-points li::before[\s\S]*?background:\s*var\(--red-600\)/);
});

test("sidebar navigation exposes an off-canvas toggle for small screens", () => {
  for (const id of ["sidebar-open", "sidebar-close", "sidebar-backdrop"]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(css, /\.sidebar\.is-open/);
});
