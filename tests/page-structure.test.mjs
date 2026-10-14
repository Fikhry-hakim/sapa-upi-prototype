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

test("hub welcomes anyone and offers four quick-access question shortcuts", () => {
  assert.match(html, /Selamat datang di <span class="accent">SAPA UPI/);
  assert.match(app, /QUICK_CARDS/);
  for (const title of ["Jalur Tugas Akhir", "Seminar Proposal", "Sidang & Skripsi", "Penulisan Ilmiah"]) {
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

test("a knowledge-base table renders as data, with its own columns", () => {
  // It used to render a pass/fail column reporting the reader's own SIAKAD
  // status. Nothing knows that, so the table is now just the pedoman's own.
  assert.match(app, /data-table/);
  assert.match(app, /entry\.table/);
  assert.match(app, /entry\.table\.columns/);
  assert.ok(!app.includes("status-ok"), "no cell may report a per-student status");
});

test("identity comes from signing in, never from fabricated data", () => {
  // There is a login now, but the page must still never invent a student.
  for (const leak of ["Rizky Pratama", "2304068", "NIM:", "profile-trigger", "topbar-avatar", "popover-profile"]) {
    assert.ok(!html.includes(leak), `page still implies a signed-in user: ${leak}`);
    assert.ok(!app.includes(leak), `app.js still implies a signed-in user: ${leak}`);
  }

  assert.ok(!app.includes("student-data"), "student-data.js was removed; nothing should import it");

  // The name and email shown are filled in from /auth/me, not written into the page.
  assert.match(html, /id="account-name"><\/strong>/);
  assert.match(html, /id="account-email"><\/small>/);
  assert.match(app, /auth\/me/);
});

test("no answer claims to know the reader's own academic record", () => {
  // There is no SIAKAD integration, so nothing may report "your" SKS, GPA or
  // document status. A table that did would be the most convincing lie here.
  assert.ok(!kb.includes("STATUS BERKAS ANDA"), "knowledge base claims a per-student status");
  assert.ok(!kb.includes("SIAKAD)"), "knowledge base implies a SIAKAD lookup");
  assert.ok(!app.includes("Auto-checked"), "the table header implied a live check that never runs");

  // Table cells are rendered as written, with as many columns as the data has.
  assert.ok(
    !app.includes("const [name, standard, status] = row"),
    "the renderer must not assume a status column",
  );
});

test("an offline answer renders the guidance points, not just lead and closing", () => {
  // Offline, entry.lead only introduces the answer; dropping entry.points left
  // the card saying "Berikut ketentuan utama..." and nothing else.
  assert.match(app, /!response\.generated && entry\?\.points/);
  assert.match(app, /answer-points/);
  assert.match(css, /\.answer-points\s*\{/);
});

test("every button either does something or says why it cannot", () => {
  // The complaint this guards against: controls that look live and do nothing.
  // A button must be submit, be handled by id in app.js, or declare itself
  // unavailable so clicking it explains instead of failing silently.
  const buttons = [...html.matchAll(/<button\b([^>]*)>/g)].map((m) => m[1]);
  assert.ok(buttons.length > 10, "expected the page to have buttons to check");

  const unhandled = [];
  for (const attrs of buttons) {
    const id = (attrs.match(/id="([^"]+)"/) ?? [])[1];
    const isSubmit = /type="submit"/.test(attrs);
    const declaresUnavailable = /data-unavailable=/.test(attrs);
    const handledById = id && app.includes(`el("${id}")`);

    if (!isSubmit && !declaresUnavailable && !handledById) {
      unhandled.push(id ?? attrs.trim().slice(0, 60));
    }
  }

  assert.deepEqual(unhandled, [], `buttons with no behaviour: ${unhandled.join(", ")}`);
});

test("the saved-question count is read from storage, not written into the page", () => {
  // It used to read "Pertanyaan tersimpan (4)" with nothing saved.
  assert.ok(!/Pertanyaan tersimpan \(\d/.test(html), "count must not be hardcoded");
  assert.match(html, /data-saved-count/);
  assert.match(app, /refreshSavedCount/);
});

test("the processing card does not claim checks the prototype never performs", () => {
  // It previously reported "Dit-Akademik & SIAKAD terverifikasi" and a model
  // called UPI-LLM-RAG-v4, neither of which exists.
  for (const invention of ["SIAKAD terverifikasi", "UPI-LLM-RAG", "Matriks Jawaban"]) {
    assert.ok(!app.includes(invention), `processing card still claims: ${invention}`);
  }
});

test("sidebar search ranks with the same scorer that answers the question", () => {
  // A sidebar that disagreed with the answer about which topic a question
  // belongs to would be worse than no sidebar search at all.
  assert.match(app, /import \{ searchKnowledgeBase \} from "\.\/lib\/search\.js"/);
  assert.match(app, /renderSearchResults/);
});

test("startup wiring lives in initialize, not in whatever function matched a patch", () => {
  // The account wiring was once appended to writeSaved() because that function
  // happened to end the same way as initialize(). Everything still parsed and
  // every other test passed, but the login button was never shown and the
  // listeners were re-attached on every save.
  const init = app.slice(app.indexOf("function initialize("));
  assert.ok(init.length > 0, "initialize() must exist");

  for (const call of ["renderAccount()", "loadAccount()", "captureTokenFromUrl()", "refreshSavedCount()"]) {
    assert.ok(init.includes(call), `initialize() must perform startup step: ${call}`);
  }

  // Each of these belongs to startup and must run exactly once in the file.
  for (const call of ["loadAccount();", "captureTokenFromUrl();"]) {
    const occurrences = app.split(call).length - 1;
    assert.equal(occurrences, 1, `${call} should be called once, found ${occurrences}`);
  }

  // Listener registration must not sit inside a function called repeatedly.
  const writeSaved = app.slice(app.indexOf("function writeSaved("), app.indexOf("function refreshSavedCount("));
  assert.ok(!writeSaved.includes("addEventListener"), "writeSaved must not register listeners");
});

test("a locally answered question still reaches the history", () => {
  // The browser must send what it answered itself, or the record has holes
  // exactly when the model is flaky.
  assert.match(app, /recordLocalAnswer/);
  assert.match(app, /conversations\/record/);
  assert.match(app, /answeredLocally/);
});

test("the shell fills the viewport so the panes scroll, not the page", () => {
  // Every level used min-height, so each grew to fit its content and the whole
  // document scrolled — carrying the sidebar off the top with it.
  assert.match(css, /\.app-shell\s*\{[^}]*height:\s*100vh/s);
  assert.match(css, /body\s*\{[^}]*overflow:\s*hidden/s);
  assert.ok(!/\.app-shell\s*\{[^}]*min-height:\s*100vh/s.test(css), "the shell must not grow past the viewport");
  assert.ok(!/\.chat-main\s*\{[^}]*min-height:\s*100vh/s.test(css), "the chat column must not grow past the viewport");

  // and the panes that hold content are the ones that scroll
  assert.match(css, /\.chat-log\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(css, /\.sidebar\s*\{[^}]*overflow-y:\s*auto/s);
});
