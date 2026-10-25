import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../style.css", import.meta.url), "utf8");
const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const viewerSource = await readFile(new URL("../viewer.js", import.meta.url), "utf8");
const kb = await readFile(new URL("../data/knowledge-base.js", import.meta.url), "utf8");

/* ---------- entry point & identity ---------- */

test("the app is the entry point, with no login gate in front of it", () => {
  assert.match(html, /id=["']app["'](?![^>]*\bhidden\b)/);
  assert.ok(!/\bsso\b|login-screen|auth-screen|splash/i.test(html), "a login gate or splash is back");
});

test("page loads the module app", () => {
  assert.match(html, /<script[^>]+type=["']module["'][^>]+src=["']\.\/app\.js["']/i);
});

test("the page carries the SAPA UPI brand, with a described mascot", () => {
  for (const marker of ["SAPA UPI", "AI ACADEMIC HUB", "mascot-sapa"]) {
    assert.ok(html.includes(marker), `missing brand marker: ${marker}`);
  }
  assert.match(html, /<img[^>]+mascot-sapa[^>]+alt="[^"]{8,}"/);
});

test("identity comes from signing in, never from fabricated data", () => {
  for (const leak of ["Rizky Pratama", "2304068", "NIM:", "Mahasiswa UPI"]) {
    assert.ok(!html.includes(leak), `page implies an identity: ${leak}`);
    assert.ok(!app.includes(leak), `app.js implies an identity: ${leak}`);
  }
  assert.ok(!app.includes("student-data"), "student-data.js was removed");

  // The name shown is filled in from /auth/me, not written into the page.
  assert.match(html, /id="home-name"><\/span>/);
  assert.match(html, /id="profile-name"><\/strong>/);
  assert.match(app, /auth\/me/);
});

test("no answer claims to know the reader's own academic record", () => {
  // There is no SIAKAD integration, so nothing may report "your" SKS, GPA or
  // document status — that would be the most convincing lie in the product.
  assert.ok(!kb.includes("STATUS BERKAS ANDA"), "knowledge base claims a per-student status");
  assert.ok(!kb.includes("SIAKAD)"), "knowledge base implies a SIAKAD lookup");
  assert.ok(!app.includes("Auto-checked"), "a table header implied a live check that never runs");
  assert.ok(!app.includes("status-ok"), "no cell may report a per-student status");
  for (const invention of ["SIAKAD terverifikasi", "UPI-LLM-RAG", "Terkoneksi ke Pusat Data"]) {
    assert.ok(!app.includes(invention) && !html.includes(invention), `claims something untrue: ${invention}`);
  }
});

/* ---------- layout follows the MVP frames ---------- */

test("the sidebar offers exactly the MVP destinations", () => {
  for (const label of ["New Chat", "Search Chats", "Files", "Recent"]) {
    assert.ok(html.includes(`<span>${label}</span>`), `missing nav item: ${label}`);
  }
  // Present in the older design, absent from the MVP New Chat frame.
  for (const gone of ["Chat Workspace", "Kalender Aktif", "Pencarian Mendalam", "model-chip", "quick-cards"]) {
    assert.ok(!html.includes(gone), `old-design element is back: ${gone}`);
  }
});

test("the sidebar is 181px wide, as in the New Chat frame", () => {
  assert.match(css, /--sidebar-w:\s*181px/);
});

test("the shell fills the viewport so the panes scroll, not the page", () => {
  assert.match(css, /\.app\s*\{[^}]*height:\s*100vh/s);
  assert.match(css, /body\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.chat-scroll\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(css, /\.sidebar\s*\{[^}]*overflow-y:\s*auto/s);
});

test("the mobile layout moves the sidebar off-canvas", () => {
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.sidebar\s*\{[^}]*position:\s*fixed/);
  assert.match(css, /\.sidebar\.is-open/);
  assert.match(html, /id="menu-button"/);
  assert.match(html, /id="scrim"/);
});

test("every view has one heading and the composer has a label", () => {
  for (const id of ["home-title", "search-title", "files-title", "settings-title"]) {
    assert.match(html, new RegExp(`<h1 id="${id}"`), `missing heading ${id}`);
  }
  assert.equal([...html.matchAll(/<h1\b/g)].length, 4, "one h1 per view");
  assert.match(html, /<label class="sr-only" for="question">/);
});

/* ---------- every control does something ---------- */

test("every button has a handler, submits, or is a profile menu entry", () => {
  const buttons = [...html.matchAll(/<button\b([^>]*)>/g)].map((m) => m[1]);
  assert.ok(buttons.length > 10, "expected the page to have buttons to check");

  const unhandled = [];
  for (const attrs of buttons) {
    const id = (attrs.match(/id="([^"]+)"/) ?? [])[1];
    const isSubmit = /type="submit"/.test(attrs);
    const isProfileEntry = /data-profile=/.test(attrs);
    const handledById = id && app.includes(`$("${id}")`);
    if (!isSubmit && !isProfileEntry && !handledById) unhandled.push(id ?? attrs.trim().slice(0, 60));
  }
  assert.deepEqual(unhandled, [], `buttons with no behaviour: ${unhandled.join(", ")}`);
});

test("each profile menu entry is handled", () => {
  for (const action of [...html.matchAll(/data-profile="(\w+)"/g)].map((m) => m[1])) {
    assert.ok(app.includes(`"${action}"`), `profile menu entry has no handler: ${action}`);
  }
});

test("settings only lists sections that do something", () => {
  const sections = [...app.matchAll(/\{ id: "(\w+)", label:/g)].map((m) => m[1]);
  assert.ok(sections.length >= 3);
  for (const id of sections) {
    assert.ok(app.includes(`section.id === "${id}"`), `settings section "${id}" renders nothing`);
  }
});

test("startup wiring lives in initialize, not in whatever function matched a patch", () => {
  const init = app.slice(app.indexOf("function initialize("));
  assert.ok(init.length > 0, "initialize() must exist");
  for (const call of ["renderAccount()", "loadAccount()", "captureTokenFromUrl()", "showView(\"home\")"]) {
    assert.ok(init.includes(call), `initialize() must perform startup step: ${call}`);
  }
  // loadAccount runs at startup and once more right after a password login.
  const expected = { "loadAccount();": 2, "captureTokenFromUrl();": 1 };
  for (const [call, times] of Object.entries(expected)) {
    const occurrences = app.split(call).length - 1;
    assert.equal(occurrences, times, `${call} should be called ${times}x, found ${occurrences}`);
  }
  assert.ok(app.includes("await loadAccount();"), "the second call must be the post-login refresh");
});

/* ---------- answers ---------- */

test("a knowledge-base table renders as data, with a NO column and its own columns", () => {
  assert.match(app, /entry\.table|renderTable\(entry\.table/);
  assert.match(app, /table\.columns/);
  assert.match(app, /"NO"/);
  assert.match(css, /\.data-table/);
});

test("an offline answer renders the guidance points, not just the lead", () => {
  assert.match(app, /entry\?\.points\?\.length/);
  assert.match(app, /bot-list/);
});

test("the processing card does not claim checks the prototype never performs", () => {
  for (const invention of ["SIAKAD terverifikasi", "UPI-LLM-RAG", "Matriks Jawaban", "Gemini via Worker"]) {
    assert.ok(!app.includes(invention), `processing card still claims: ${invention}`);
  }
});

test("the answer badge says where the answer came from, honestly", () => {
  assert.match(app, /Dijawab AI/);
  assert.match(app, /Mode offline/);
  assert.ok(!app.includes("Jawaban Resmi Terverifikasi"), "an AI answer must not be called officially verified");
});

test("a locally answered question still reaches the history", () => {
  assert.match(app, /recordLocalAnswer/);
  assert.match(app, /conversations\/record/);
  assert.match(app, /answeredLocally/);
});

test("answers are built with text nodes, never with untrusted HTML", () => {
  // Answer text comes from a model; assigning it with innerHTML would let it
  // inject markup. innerHTML is allowed only for fixed icon strings.
  const uses = [...app.matchAll(/\.innerHTML\s*=\s*([^;]+);/g)].map((m) => m[1].trim());
  for (const value of uses) {
    assert.ok(
      /^ICON\.|^'|^"|^`<|^section\.icon|^\s*$/.test(value) || /ICON\./.test(value),
      `innerHTML assigned from something that may be untrusted: ${value.slice(0, 60)}`,
    );
  }
});

/* ---------- documents ---------- */

test("the source chip opens the document, for anyone", () => {
  assert.match(app, /viewer\.open\(citation\.document/);
  assert.match(app, /RUJUKAN DOKUMEN RESMI/);
  assert.ok(!/state\.account\s*&&[^\n]*viewer\.open/.test(app), "opening a document must not need an account");
  assert.match(viewerSource, /SUMBER RESMI/);
  assert.match(viewerSource, /Rujukan Resmi Jawaban SAPA/);
});

test("the Files page lists the published documents without an account", () => {
  assert.match(app, /Object\.entries\(documents\)/);
  assert.match(html, /id="file-grid"/);
  assert.ok(!/renderFiles[\s\S]{0,200}state\.account/.test(app), "Files must not require signing in");
});

test("a reader can ask about a single document", () => {
  assert.match(app, /scopeDocumentId/);
  assert.match(app, /scope/);
  assert.match(html, /Pertanyaan dibatasi pada dokumen ini/);
});

test("every real answer shows a contact line, with a generic fallback when no single topic was matched", () => {
  // renderReferences always appends escalation-note, and its text comes from
  // contactNote(), which falls back to HELP_CONTACT rather than silently
  // showing nothing when an entry has no escalation of its own.
  const refs = app.slice(app.indexOf("function renderReferences"), app.indexOf("function renderFollowUps"));
  assert.match(refs, /escalation-note.*contactNote\(entry\)/);

  const contactNote = app.slice(app.indexOf("function contactNote"), app.indexOf("function renderContactOnly"));
  assert.match(contactNote, /entry\?\.escalation\s*\|\|/, "a missing escalation falls back, it does not disappear");
  assert.match(contactNote, /HELP_CONTACT/);

  // The two branches that can reach "answer"/"suggestions" without one settled
  // topic (no curated entry, or several topics tied) still call a contact
  // renderer, not just the citation box that assumes an entry exists.
  const fillCard = app.slice(app.indexOf("function fillCard"), app.indexOf("/** Teks jawaban, apa adanya"));
  assert.match(fillCard, /if \(entry\) renderReferences\(entry, body, response\.citation\);\s*\n\s*else renderContactOnly/);
  assert.match(
    fillCard.slice(fillCard.indexOf('"suggestions"'), fillCard.indexOf('"fallback"')),
    /renderContactOnly\(body, null\)/,
  );
});
