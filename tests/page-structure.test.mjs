import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../style.css", import.meta.url), "utf8");
const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const kb = await readFile(new URL("../data/knowledge-base.js", import.meta.url), "utf8");

test("app shell is the entry point, with no login gate in front of it", () => {
  assert.match(html, /id=["']app-shell["'](?![^>]*\bhidden\b)/);

  for (const removed of ["screen-login", "screen-error", "screen-splash", "login-form", "error-retry-button"]) {
    assert.doesNotMatch(html, new RegExp(`id=["']${removed}["']`), `${removed} should be gone`);
  }
  assert.doesNotMatch(app, /showScreen|handleLoginSubmit|runSplashSequence/);
});

test("page exposes every required chat control", () => {
  for (const id of ["chat-form", "chat-input", "chat-log", "sidebar", "reset-chat", "quick-cards", "deep-search-toggle"]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
});

test("MVP scope: no module dashboards, side pages, or search overlay", () => {
  for (const id of [
    "modal-search",
    "modal-jadwal",
    "modal-krs",
    "modal-sidang",
    "modal-administrasi",
    "view-explore",
    "view-library",
    "view-files",
    "view-history",
    "popover-notification",
  ]) {
    assert.doesNotMatch(html, new RegExp(`id=["']${id}["']`), `${id} is outside MVP scope`);
  }
  assert.doesNotMatch(app, /renderJadwalModal|renderKrsModal|renderSidangModal|renderExplorePage/);
});

test("the hub carries exactly one h1, and the chat form is accessible", () => {
  assert.equal((html.match(/<h1\b/gi) ?? []).length, 1);
  assert.match(html, /<label[^>]+for=["']chat-input["']/i);
  assert.match(html, /id=["']chat-log["'][^>]+aria-live=["']polite["']/i);
});

test("page loads the module app", () => {
  assert.match(html, /<script[^>]+type=["']module["'][^>]+src=["']\.\/app\.js["']/i);
});

test("hub carries the SAPA UPI brand identity", () => {
  for (const marker of ["SAPA UPI", "AI ACADEMIC HUB", "mascot-sapa", "Kalender Aktif"]) {
    assert.ok(html.includes(marker), `missing required marker: ${marker}`);
  }
});

test("hub greets the student and offers four quick-access question shortcuts", () => {
  assert.match(html, /Halo, <span class="accent">Rizky Pratama/);
  assert.match(app, /QUICK_CARDS/);
  for (const title of ["Jadwal Kuliah", "Perkuliahan & KRS", "Sidang & Skripsi", "Administrasi"]) {
    assert.ok(app.includes(title), `missing quick card: ${title}`);
  }

  // every card must submit a question that the knowledge base can actually answer
  const questions = [...app.matchAll(/question:\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(questions.length, 4);
  for (const q of questions) {
    assert.ok(kb.includes(q), `quick-card question not in knowledge base: ${q}`);
  }
});

test("mascot image has useful alternative text and is never used as a background", () => {
  assert.match(
    html,
    /<img[^>]+src="\.\/assets\/mascot-sapa\.png"[^>]+alt="Maskot SAPA mengenakan toga wisuda"/,
  );
  assert.doesNotMatch(css, /background(?:-image)?:[^;]*mascot-sapa/);
});

test("chatbot messages consistently use the SAPA mascot avatar", () => {
  assert.match(app, /message-avatar[^`]*mascot-sapa\.png/);
});

test("sidebar keeps only the Chat Workspace destination", () => {
  assert.match(html, /data-nav="chat"/);
  assert.equal((html.match(/data-nav=/g) ?? []).length, 1);
});

test("sidebar navigation exposes an off-canvas toggle for small screens", () => {
  for (const id of ["sidebar-open", "sidebar-close", "sidebar-backdrop"]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(css, /\.sidebar\.is-open/);
});

test("sidang answer renders as a data table with pass/fail status", () => {
  assert.match(app, /data-table/);
  assert.match(app, /status-ok/);
  const kb = app; // table markup lives in app.js render logic
  assert.match(kb, /entry\.table/);
});
