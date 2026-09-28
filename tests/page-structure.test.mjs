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
    "category-list",
    "sample-questions",
    "reset-chat",
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

test("page applies the SAPA mascot GSM and Canva feature structure", () => {
  const requiredMarkers = [
    "mascot-sapa",
    "Sahabat Akses &amp; Panduan Akademik",
    "Akses Cepat",
    "Topik Populer",
    "Sumber Referensi",
    "Pertanyaan Lanjutan",
    "Butuh Bantuan? Hubungi Admin",
  ];

  for (const marker of requiredMarkers) {
    assert.ok(html.includes(marker), `missing required marker: ${marker}`);
  }
});

test("mascot image has useful alternative text and is never used as a background", () => {
  assert.match(
    html,
    /<img[^>]+class="[^"]*mascot-sapa[^"]*"[^>]+alt="Maskot SAPA mengenakan toga wisuda"/,
  );
  assert.doesNotMatch(css, /background(?:-image)?:[^;]*mascot-sapa/);
});

test("chatbot messages consistently use the SAPA mascot avatar", () => {
  assert.match(html, /message-avatar[^>]*>\s*<img[^>]+mascot-sapa\.png/);
  assert.match(app, /message-avatar[^`]*mascot-sapa\.png/);
});

test("quick access exposes consistent accessible SVG icons", () => {
  const start = html.indexOf('id="category-list"');
  const end = html.indexOf('class="question-block"', start);
  const quickAccess = html.slice(start, end);

  assert.equal((quickAccess.match(/class="quick-icon"/g) ?? []).length, 7);
  assert.equal((quickAccess.match(/<svg\b/g) ?? []).length, 7);
  assert.equal((quickAccess.match(/aria-hidden="true"/g) ?? []).length, 7);
  assert.doesNotMatch(quickAccess, /[⌂▤▦◆✎★▧]/);
});
