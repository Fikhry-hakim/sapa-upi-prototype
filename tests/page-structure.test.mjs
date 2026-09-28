import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

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
