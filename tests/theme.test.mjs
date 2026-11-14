import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

const block = (selector) => {
  const start = css.indexOf(selector);
  assert.ok(start >= 0, `${selector} exists`);
  return css.slice(start, css.indexOf("\n}", start));
};
const colorVars = (text) => [...text.matchAll(/^\s*(--[\w-]+):\s*(#[0-9a-f]{3,8}|rgba?\()/gim)].map((m) => m[1]);

test("the dark theme restyles every colour variable the light theme defines", () => {
  const light = colorVars(block(":root {"));
  const dark = new Set(colorVars(block(':root[data-theme="dark"] {')));
  // Text on brand colour stays white in both themes, so it is the one variable not redefined.
  const missing = light.filter((name) => name !== "--on-accent" && !dark.has(name));
  assert.deepEqual(missing, [], `dark theme is missing: ${missing.join(", ")}`);
});

test("the theme is applied before first paint by a script the CSP allows", () => {
  assert.match(html, /<script src="\.\/theme-init\.js"><\/script>\s*<link rel="stylesheet"/);
  assert.ok(!/<script>[^<]/.test(html), "no inline script, the CSP forbids it");
  const init = readFileSync(new URL("../theme-init.js", import.meta.url), "utf8");
  assert.match(init, /prefers-color-scheme: dark/);
  assert.match(init, /sapa-theme/);
});

test("the theme toggle exists in the top bar", () => {
  assert.match(html, /id="theme-button"/);
});
