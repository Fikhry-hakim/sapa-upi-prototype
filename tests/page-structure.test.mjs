import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../style.css", import.meta.url), "utf8");
const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

test("page exposes the auth, splash, and app shell screens", () => {
  for (const id of [
    "screen-login",
    "screen-error",
    "screen-splash",
    "app-shell",
    "login-form",
    "login-id",
    "login-password",
    "error-retry-button",
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
});

test("page exposes every required chat control", () => {
  for (const id of ["chat-form", "chat-input", "chat-log", "sidebar", "reset-chat", "quick-cards", "deep-search-toggle"]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
});

test("page exposes the four module modals and search overlay", () => {
  for (const id of ["modal-search", "modal-jadwal", "modal-krs", "modal-sidang", "modal-administrasi"]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
});

test("each top-level screen (SSO login, hub) carries exactly one h1, and the chat form is accessible", () => {
  assert.equal((html.match(/<h1\b/gi) ?? []).length, 2);
  assert.match(html, /<label[^>]+for=["']chat-input["']/i);
  assert.match(html, /id=["']chat-log["'][^>]+aria-live=["']polite["']/i);
});

test("page loads the module app", () => {
  assert.match(html, /<script[^>]+type=["']module["'][^>]+src=["']\.\/app\.js["']/i);
});

test("login screen carries the SAPA UPI SSO brand identity", () => {
  for (const marker of ["Single Sign-On UPI", "SAPA AI", "mascot-sapa", "LOGIN SSO"]) {
    assert.ok(html.includes(marker), `missing required marker: ${marker}`);
  }
});

test("hub greets the student and exposes the four quick-access modules", () => {
  assert.match(html, /Halo, <span class="accent">Rizky Pratama/);
  assert.match(app, /QUICK_CARDS/);
  assert.match(app, /Jadwal Kuliah/);
  assert.match(app, /KRS Online/);
  assert.match(app, /Sidang & Skripsi/);
  assert.match(app, /Administrasi/);
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

test("app wires the four sidebar nav destinations", () => {
  for (const nav of ["chat", "explore", "library", "files", "history"]) {
    assert.match(html, new RegExp(`data-nav="${nav}"`));
  }
  assert.match(app, /function switchNav\(/);
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
