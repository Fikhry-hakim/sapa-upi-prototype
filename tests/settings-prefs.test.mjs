import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SHORTCUTS,
  comboFromEvent,
  conflictsWith,
  isValidCombo,
  loadPrefs,
  loadShortcuts,
  matchShortcut,
  savePrefs,
  saveShortcuts,
} from "../lib/settings-prefs.js";

const memory = (seed = {}) => {
  const data = { ...seed };
  return { getItem: (key) => data[key] ?? null, setItem: (key, value) => void (data[key] = value), data };
};

test("preferences default to the design and survive a round trip", () => {
  const storage = memory();
  const prefs = loadPrefs(storage);
  assert.equal(prefs.language, "id");
  assert.equal(prefs.notifications.krs, "Push, Email");
  prefs.notifications.krs = "Email";
  prefs.dictation = false;
  savePrefs(storage, prefs);
  const again = loadPrefs(storage);
  assert.equal(again.notifications.krs, "Email");
  assert.equal(again.dictation, false);
});

test("stored values that are not valid choices are ignored, not trusted", () => {
  const storage = memory({ "sapa-prefs": JSON.stringify({ language: "xx", notifications: { krs: "SMS" }, dictation: "yes" }) });
  const prefs = loadPrefs(storage);
  assert.equal(prefs.language, "id");
  assert.equal(prefs.notifications.krs, "Push, Email");
  assert.equal(prefs.dictation, true);
  assert.deepEqual(loadPrefs(memory({ "sapa-prefs": "{not json" })).voice, { language: "auto" });
});

test("blocked storage never throws", () => {
  const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
  assert.equal(loadPrefs(blocked).language, "id");
  assert.equal(savePrefs(blocked, loadPrefs(blocked)), false);
});

test("shortcuts: defaults match the design, custom keys are kept and restored", () => {
  const storage = memory();
  const shortcuts = loadShortcuts(storage);
  assert.deepEqual(shortcuts.toggleSidebar.keys, ["Ctrl", "Shift", "S"]);
  shortcuts.switchChat.keys = ["Ctrl", "J"];
  shortcuts.newChat.on = false;
  saveShortcuts(storage, shortcuts);
  const again = loadShortcuts(storage);
  assert.deepEqual(again.switchChat.keys, ["Ctrl", "J"]);
  assert.equal(again.newChat.on, false);
  assert.deepEqual(DEFAULT_SHORTCUTS.switchChat.keys, ["Ctrl", "K"], "defaults are never mutated");
});

test("a key press becomes a combination, and Cmd counts as Ctrl", () => {
  assert.deepEqual(comboFromEvent({ key: "k", ctrlKey: true }), ["Ctrl", "K"]);
  assert.deepEqual(comboFromEvent({ key: "k", metaKey: true }), ["Ctrl", "K"]);
  assert.deepEqual(comboFromEvent({ key: "Escape", shiftKey: true }), ["Shift", "Esc"]);
  assert.equal(comboFromEvent({ key: "Shift", shiftKey: true }), null, "a lone modifier is not a combination");
});

test("a combination needs exactly one regular key", () => {
  assert.equal(isValidCombo(["Ctrl", "Shift", "O"]), true);
  assert.equal(isValidCombo(["Enter"]), true);
  assert.equal(isValidCombo(["Ctrl", "Shift"]), false);
  assert.equal(isValidCombo(["A", "B"]), false);
});

test("only switched-on shortcuts match, and clashes are reported", () => {
  const shortcuts = loadShortcuts(memory());
  assert.equal(matchShortcut(shortcuts, ["Ctrl", "K"]), "switchChat");
  shortcuts.switchChat.on = false;
  assert.equal(matchShortcut(shortcuts, ["Ctrl", "K"]), null);
  assert.deepEqual(conflictsWith(shortcuts, "sendBackground", ["Ctrl", "Enter"]), ["annotation"]);
});

import { detectLanguage } from "../lib/i18n.js";

test("Auto detect: Indonesian if any browser language is Indonesian, English only when it is the main one", () => {
  assert.equal(detectLanguage(["id-ID"]), "id");
  assert.equal(detectLanguage(["en-US", "id"]), "id", "an English-first browser that also lists Indonesian stays Indonesian");
  assert.equal(detectLanguage(["en-US"]), "en");
  assert.equal(detectLanguage(["fr-FR"]), "id", "unknown languages fall back to Indonesian");
  assert.equal(detectLanguage([]), "id");
});

import { SETTINGS_ID, SETTINGS_ID_FORMATS, SETTINGS_EN_FORMATS } from "../lib/settings-id.js";
import { NOTIFICATIONS, SHORTCUT_GROUPS } from "../lib/settings-prefs.js";

test("every notification and shortcut label has an Indonesian translation", () => {
  const needed = [
    ...NOTIFICATIONS.flatMap((item) => [item.title, item.text]),
    ...SHORTCUT_GROUPS.flatMap((group) => [group.label, ...group.items.map((item) => item.title)]),
  ];
  for (const text of needed) assert.ok(SETTINGS_ID[text], `missing Indonesian text for: ${text}`);
});

test("the Indonesian and English formats cover the same messages", () => {
  assert.deepEqual(Object.keys(SETTINGS_ID_FORMATS).sort(), Object.keys(SETTINGS_EN_FORMATS).sort());
  assert.equal(SETTINGS_ID_FORMATS.archivedCount(0), "Tidak ada chat untuk diarsipkan.");
});

test("every English string in settings.js that is shown has a translation", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../settings.js", import.meta.url), "utf8");
  // Titles, texts, and section labels written as plain literals.
  const literals = [...source.matchAll(/(?:title|text|label): "([^"]+)"/g)].map((m) => m[1]);
  const exempt = new Set(["Bantuan", "Program Studi", "Pihak yang menerbitkan pedoman", "Email", "Telepon", "Alamat", "Laman"]);
  const missing = [...new Set(literals)].filter((text) => !SETTINGS_ID[text] && !exempt.has(text) && /[A-Za-z]/.test(text) && !text.startsWith("Jawaban"));
  assert.deepEqual(missing, [], `no Indonesian text for: ${missing.join(" | ")}`);
});

test("a stored legacy auto language falls back to Indonesian", () => {
  assert.equal(loadPrefs(memory({ "sapa-prefs": JSON.stringify({ language: "auto" }) })).language, "id");
});
