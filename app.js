import { knowledgeBase } from "./data/knowledge-base.js";
import { documents, citationFor } from "./data/sources.js";
import { createChatResponse } from "./lib/chat-engine.js";
import { clarifyQuestion, isBullet, isClarifiable, splitSentences, stripBullet } from "./lib/clarify.js";
import { API_URL } from "./config.js";
import { createViewer } from "./viewer.js";
import { createOwner } from "./owner.js";

/* ============================================================
   PRIMITIF
============================================================ */

const $ = (id) => document.getElementById(id);

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Ikon sebagai string SVG; dipakai di tempat yang dibangun dari JS. */
const ICON = {
  more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5.5" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="12" cy="18.5" r="1.4" /></svg>',
  chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.6A7.5 7.5 0 1 1 20 11.5z"/><path d="M9 11.5h.01M12 11.5h.01M15 11.5h.01"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
  file: '<svg class="file-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h7.5L19 8v12.5H7z"/><path d="M14 3.5V8h5M10 12.5h6M10 16h4"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.8 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8Z"/></svg>',
  user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c1.4-3.4 4-5 7-5s5.6 1.6 7 5"/></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.4 3 7.6 7.5 9.5 4.5-1.9 7.5-5.1 7.5-9.5V6Z"/><path d="m9 12 2.2 2.2L15.5 10"/></svg>',
  database: '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>',
  help: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5M12 17h.01"/></svg>',
  doc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h7.5L19 8v12.5H7z"/><path d="M14 3.5V8h5"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
};

const refs = {
  app: $("app"),
  sidebar: $("sidebar"),
  scrim: $("scrim"),
  menuButton: $("menu-button"),
  sidebarClose: $("sidebar-close"),
  navNew: $("nav-new"),
  navSearch: $("nav-search"),
  navFiles: $("nav-files"),
  navDashboard: $("nav-dashboard"),
  navMetrics: $("nav-metrics"),
  navKb: $("nav-kb"),
  dashboardRoot: $("dashboard-root"),
  metricsRoot: $("metrics-root"),
  kbRoot: $("kb-root"),
  navRecent: $("nav-recent"),
  recentList: $("recent-list"),
  loginButton: $("login-button"),
  loginNote: $("login-note"),
  profile: $("profile"),
  profileTrigger: $("profile-trigger"),
  profileMenu: $("profile-menu"),
  profileName: $("profile-name"),
  profileSub: $("profile-sub"),
  homeComma: $("home-comma"),
  homeName: $("home-name"),
  homeSlot: $("home-slot"),
  chatSlot: $("chat-slot"),
  chatScroll: $("chat-scroll"),
  chatLog: $("chat-log"),
  composer: $("composer"),
  question: $("question"),
  sendButton: $("send-button"),
  voiceButton: $("voice-button"),
  attachButton: $("attach-button"),
  attachMenu: $("attach-menu"),
  attachChip: $("attach-chip"),
  attachTitle: $("attach-title"),
  attachRemove: $("attach-remove"),
  historyButton: $("history-button"),
  shareButton: $("share-button"),
  moreButton: $("more-button"),
  moreMenu: $("more-menu"),
  searchInput: $("search-input"),
  searchResults: $("search-results"),
  searchTabs: $("search-tabs"),
  signinPage: $("signin-page"),
  searchClear: $("search-clear"),
  searchEsc: $("search-esc"),
  searchEmpty: $("search-empty"),
  filesSearch: $("files-search"),
  filesTabs: $("files-tabs"),
  filesGridView: $("files-grid-view"),
  filesListView: $("files-list-view"),
  fileGrid: $("file-grid"),
  filesEmpty: $("files-empty"),
  settingsBack: $("settings-back"),
  settingsItems: $("settings-items"),
  settingsTitle: $("settings-title"),
  settingsCard: $("settings-card"),
  toast: $("toast"),
};

const VIEWS = ["home", "chat", "search", "files", "settings", "dashboard", "metrics", "kb"];

/* ============================================================
   STATE
============================================================ */

// Sedikit di atas batas total Worker (15 dtk), supaya galatnya sampai sebelum browser menyerah.
const BACKEND_TIMEOUT_MS = 18_000;

const state = {
  view: "home",
  account: null, // { id, email, name, role? }
  loginEnabled: Boolean(API_URL),
  sessionToken: null,
  conversationId: null, // percakapan yang sedang dibuka (id dari server)
  conversations: [], // riwayat tersimpan milik pengguna
  sessionChats: [], // percakapan sesi ini bagi yang belum masuk (tidak disimpan)
  activeLocalChat: null,
  scopeDocumentId: null,
  latestRequestId: 0,
  settingsSection: "profile",
  filesTab: "suggested",
  filesLayout: readLayout(),
  searchTab: "all",
};

const viewer = createViewer({ onCopy: (message) => showToast(message) });

/* ============================================================
   TOAST + MENU
============================================================ */

let toastTimer;

function showToast(message) {
  clearTimeout(toastTimer);
  refs.toast.textContent = message;
  refs.toast.hidden = false;
  refs.toast.classList.remove("is-visible");
  void refs.toast.offsetWidth;
  refs.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => {
    refs.toast.classList.remove("is-visible");
    toastTimer = setTimeout(() => (refs.toast.hidden = true), 200);
  }, 2600);
}

const menus = () => [
  [refs.profileMenu, refs.profileTrigger],
  [refs.moreMenu, refs.moreButton],
  [refs.attachMenu, refs.attachButton],
];

function closeMenus(except) {
  for (const [menu, trigger] of menus()) {
    if (menu === except) continue;
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  }
}

function toggleMenu(menu, trigger, build) {
  const open = menu.hidden;
  closeMenus(open ? menu : null);
  if (!open) {
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    return;
  }
  build?.();
  menu.hidden = false;
  trigger.setAttribute("aria-expanded", "true");
}

async function copyText(text, success) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(success);
    return;
  } catch {
    /* lanjut ke cara lama */
  }

  const scratch = document.createElement("textarea");
  scratch.value = text;
  scratch.setAttribute("readonly", "");
  scratch.style.cssText = "position:fixed;opacity:0";
  document.body.append(scratch);
  scratch.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  scratch.remove();

  if (copied) showToast(success);
  else window.prompt("Salin manual dengan Cmd/Ctrl+C:", text);
}

/* ============================================================
   TAMPILAN
============================================================ */

function showView(name) {
  if (!VIEWS.includes(name)) return;
  state.view = name;
  refs.app.dataset.view = name;
  closeMenus();

  for (const view of VIEWS) {
    const section = $(`view-${view}`);
    if (section) section.hidden = view !== name;
  }

  // Composer hanya ada di beranda dan percakapan, dan berpindah di antara keduanya.
  const composerHost = name === "home" ? refs.homeSlot : name === "chat" ? refs.chatSlot : null;
  if (composerHost) {
    composerHost.append(refs.composer);
    refs.composer.hidden = false;
    resizeComposer();
  } else {
    refs.composer.hidden = true;
  }

  refs.navNew.classList.toggle("is-active", name === "home");
  refs.navSearch.classList.toggle("is-active", name === "search");
  refs.navFiles.classList.toggle("is-active", name === "files");
  refs.navDashboard.classList.toggle("is-active", name === "dashboard");
  refs.navMetrics.classList.toggle("is-active", name === "metrics");
  refs.navKb.classList.toggle("is-active", name === "kb");
  highlightRecent();
  closeSidebar();

  if (name === "home" || name === "chat") refs.question.focus({ preventScroll: true });
}

function openSidebar() {
  refs.sidebar.classList.add("is-open");
  refs.scrim.hidden = false;
}

function closeSidebar() {
  refs.sidebar.classList.remove("is-open");
  refs.scrim.hidden = true;
}

function firstWord(name) {
  return String(name ?? "").trim();
}

function renderGreeting() {
  const signedIn = Boolean(state.account);
  const name = signedIn ? firstWord(state.account.name || state.account.email.split("@")[0]) : "";
  refs.homeName.textContent = name;
  refs.homeComma.textContent = signedIn ? ", " : "!";
}

/* ============================================================
   RECENT
============================================================ */

function recentEntries() {
  if (state.account) return state.conversations.map((c) => ({ id: c.id, title: c.title, saved: true }));
  return state.sessionChats.map((c) => ({ id: c.localId, title: c.title, saved: false }));
}

function renderRecent() {
  refs.recentList.replaceChildren();
  const entries = recentEntries();

  if (!entries.length) {
    const empty = make("li", "recent-empty", state.account ? "Belum ada percakapan." : "Belum ada percakapan di sesi ini.");
    refs.recentList.append(empty);
  }

  for (const entry of entries) {
    const item = make("li");
    const button = make("button", "recent-item", entry.title);
    button.type = "button";
    button.title = entry.title;
    button.dataset.id = entry.id;
    button.addEventListener("click", () => {
      if (entry.saved) openConversation(entry.id);
      else openLocalChat(entry.id);
    });
    item.append(button);
    refs.recentList.append(item);
  }
  highlightRecent();
}

function highlightRecent() {
  const activeId = state.account ? state.conversationId : state.activeLocalChat;
  for (const button of refs.recentList.querySelectorAll(".recent-item")) {
    button.classList.toggle("is-active", state.view === "chat" && button.dataset.id === String(activeId));
  }
}

function setRecentOpen(open) {
  refs.navRecent.setAttribute("aria-expanded", String(open));
  refs.recentList.hidden = !open;
}

/* ============================================================
   CHAT
============================================================ */

function scrollToEnd() {
  requestAnimationFrame(() => {
    refs.chatScroll.scrollTo({ top: refs.chatScroll.scrollHeight, behavior: "smooth" });
  });
}

/** Teks biasa dengan tautan http(s) yang bisa diklik; tidak pernah memakai innerHTML. */
function appendRichText(parent, text) {
  const pattern = /(https?:\/\/[^\s)]+[^\s).,;])/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) parent.append(text.slice(last, match.index));
    const link = document.createElement("a");
    link.href = match[0];
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = match[0];
    parent.append(link);
    last = match.index + match[0].length;
  }
  if (last < text.length) parent.append(text.slice(last));
}

function paragraph(text) {
  const p = make("p");
  appendRichText(p, text);
  return p;
}

/* ------------------------------------------------------------ nomor penjelasan */

/** Jumlah nomor maksimum per jawaban; jawaban sepanjang itu sudah terlalu padat untuk ditelusuri. */
const MAX_NUMBERED = 20;

/** Nomor kecil di akhir kalimat; mengkliknya menanyakan penjelasan kalimat itu. */
function clarifyMarker(number, sentence) {
  const button = make("button", "clarify-num", String(number));
  button.type = "button";
  button.setAttribute("aria-label", `Tanyakan penjelasan poin ${number}`);
  button.title = `Tanyakan penjelasan poin ${number}`;
  button.addEventListener("click", () => submitQuestion(clarifyQuestion(number, sentence)));
  return button;
}

/** Teks dengan tautan, tiap kalimatnya diikuti nomor yang bisa diklik. Penghitung dipakai bersama satu jawaban. */
function appendNumberedText(parent, text, counter) {
  for (const sentence of splitSentences(text)) {
    appendRichText(parent, sentence);
    if (isClarifiable(sentence) && counter.n < MAX_NUMBERED) {
      counter.n += 1;
      parent.append(clarifyMarker(counter.n, sentence));
    }
    parent.append(" ");
  }
}

/** Jawaban AI: paragraf dan daftar, setiap kalimat bernomor. */
function appendNumberedAnswer(body, message, counter) {
  for (const block of String(message).split(/\n{2,}/)) {
    let list = null;
    for (const rawLine of block.split("\n")) {
      const line = rawLine.trim();
      if (!line) continue;
      if (isBullet(line)) {
        if (!list) {
          list = make("ul", "bot-list");
          body.append(list);
        }
        const item = document.createElement("li");
        appendNumberedText(item, stripBullet(line), counter);
        list.append(item);
      } else {
        list = null;
        const p = make("p");
        appendNumberedText(p, line, counter);
        body.append(p);
      }
    }
  }
}

function appendUserMessage(question, documentId) {
  if (documentId) {
    const doc = documents[documentId];
    const chip = make("div", "bubble-file");
    chip.innerHTML = ICON.file;
    chip.append(make("span", "", doc.title));
    refs.chatLog.append(chip);
  }
  refs.chatLog.append(make("p", "bubble", question));
}

function createBotCard() {
  const card = make("article", "bot-card");
  const head = make("header", "bot-head");
  head.append(make("strong", "", "SAPA AI Academic Hub"));
  const body = make("div", "bot-body");
  card.append(head, body);
  refs.chatLog.append(card);
  return { card, head, body };
}

function pill(text, kind) {
  const node = make("span", `pill${kind ? ` pill-${kind}` : ""}`);
  if (kind === "ok") node.innerHTML = ICON.check;
  node.append(text);
  return node;
}

function showProcessing() {
  const { card, head, body } = createBotCard();
  card.dataset.processing = "true";
  head.append(pill("Mencari rujukan...", "busy"));

  const steps = make("div", "steps");
  for (const [label, done] of [
    ["Mencocokkan pertanyaan", true],
    ["Memilih rujukan pedoman", true],
    ["Menyusun jawaban", false],
  ]) {
    const step = make("span", `step${done ? " is-done" : ""}`);
    if (done) step.innerHTML = ICON.check;
    step.append(label);
    steps.append(step);
  }
  const skeleton = make("div", "skeleton");
  skeleton.innerHTML = '<span style="width:100%"></span><span style="width:86%"></span><span style="width:58%"></span>';
  body.append(steps, skeleton);
  scrollToEnd();
  return card;
}

function renderTable(table, parent) {
  parent.append(make("h3", "section-title", `1. ${table.title}`));
  const wrap = make("div", "table-wrap");
  const element = make("table", "data-table");

  const headRow = document.createElement("tr");
  const noHead = make("th", "col-no", "NO");
  headRow.append(noHead);
  for (const column of table.columns) headRow.append(make("th", "", column));
  const thead = document.createElement("thead");
  thead.append(headRow);

  const tbody = document.createElement("tbody");
  table.rows.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.append(make("td", "col-no", String(index + 1).padStart(2, "0")));
    for (const cell of row) tr.append(make("td", "", cell));
    tbody.append(tr);
  });

  element.append(thead, tbody);
  wrap.append(element);
  parent.append(wrap);
}

function renderReferences(entry, parent, served = null) {
  // Jawaban dari dokumen unggahan membawa rujukannya sendiri dari Worker.
  const citation = served ?? citationFor(entry);
  const box = make("div", "refs");
  box.append(make("p", "refs-label", "RUJUKAN DOKUMEN RESMI"));
  const list = make("div", "refs-list");

  if (citation) {
    const chip = make("button", "ref-chip");
    chip.type = "button";
    chip.innerHTML = ICON.file;
    chip.append(`${citation.document.title}, hal. ${citation.page}`);
    chip.addEventListener("click", () =>
      viewer.open(citation.document, { page: citation.page, highlight: citation.highlight }),
    );
    list.append(chip);
  } else {
    const chip = make("span", "ref-chip ref-chip-muted");
    chip.innerHTML = ICON.file;
    chip.append(entry.sourceRef || entry.sourceTitle);
    list.append(chip);
  }
  box.append(list);

  if (!citation) box.append(make("p", "ref-note", "Dokumen sumber ini belum dipublikasikan di sini."));
  parent.append(box);
}

function renderFollowUps(questions) {
  if (!questions?.length) return;
  const row = make("div", "follow-ups");
  for (const question of questions) {
    const chip = make("button", "follow-chip");
    chip.type = "button";
    chip.append(question);
    chip.insertAdjacentHTML("beforeend", ICON.chevron);
    chip.addEventListener("click", () => submitQuestion(question));
    row.append(chip);
  }
  return row;
}

const FEEDBACK_OPTIONS = [
  ["buruk", "Kurang"],
  ["cukup", "Cukup"],
  ["baik", "Baik"],
];

const feedbackKind = (response) => (response.type === "fallback" ? "fallback" : response.generated ? "ai" : "offline");

/**
 * Penilaian singkat di bawah jawaban baru. Yang dikirim hanya penilaian, jenis
 * jawaban, dan topik rujukannya: tidak ada teks pertanyaan dan tidak ada identitas.
 */
function feedbackRow(response) {
  const row = make("div", "feedback-row");
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", "Penilaian jawaban");
  row.append(make("span", "feedback-label", "Bagaimana jawaban SAPA ini?"));

  for (const [rating, label] of FEEDBACK_OPTIONS) {
    const button = make("button", `feedback-option feedback-${rating}`, label);
    button.type = "button";
    button.addEventListener("click", async () => {
      row.replaceChildren(make("span", "feedback-thanks", "Terima kasih atas masukanmu."));
      try {
        await fetch(`${API_URL}/feedback`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ rating, kind: feedbackKind(response), entryId: response.entry?.id ?? "" }),
          signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
        });
      } catch (error) {
        console.warn("Penilaian tidak terkirim:", error);
      }
    });
    row.append(button);
  }

  const dismiss = make("button", "feedback-dismiss");
  dismiss.type = "button";
  dismiss.setAttribute("aria-label", "Tutup penilaian");
  dismiss.innerHTML = ICON.close;
  dismiss.addEventListener("click", () => row.remove());
  row.append(dismiss);
  return row;
}

function fillCard(card, response, { feedback = false } = {}) {
  const head = card.querySelector(".bot-head");
  const body = card.querySelector(".bot-body");
  head.querySelector(".pill")?.remove();
  body.replaceChildren();
  delete card.dataset.processing;

  const entry = response.entry;
  let followUps = null;

  if (response.type === "answer") {
    head.append(
      response.generated
        ? pill("Dijawab AI • dirujuk ke Pedoman", "ok")
        : pill("Mode offline • pencocokan kata kunci"),
    );

    const counter = { n: 0 };
    if (response.generated) {
      appendNumberedAnswer(body, response.message, counter);
    } else {
      const lead = make("p");
      appendNumberedText(lead, entry?.lead ?? response.message, counter);
      body.append(lead);
      if (entry?.points?.length) {
        const list = make("ul", "bot-list");
        for (const point of entry.points) {
          const li = document.createElement("li");
          appendNumberedText(li, point, counter);
          list.append(li);
        }
        body.append(list);
      }
    }
    if (counter.n > 0) body.append(make("p", "clarify-hint", "Klik nomor untuk menanyakan penjelasan poin itu."));

    if (entry?.table) renderTable(entry.table, body);
    if (entry) renderReferences(entry, body, response.citation);
    followUps = renderFollowUps(response.followUpQuestions);
  } else if (response.type === "suggestions") {
    body.append(paragraph(response.message));
    const list = make("div", "result-list");
    for (const suggestion of response.suggestions) {
      const button = make("button", "result");
      button.type = "button";
      button.append(make("strong", "", suggestion.title), make("small", "", suggestion.category));
      button.addEventListener("click", () => submitQuestion(suggestion.sampleQuestion));
      list.append(button);
    }
    body.append(list);
  } else if (response.type === "fallback") {
    head.append(pill("Di luar cakupan pedoman"));
    body.append(paragraph(response.message));
    const box = make("div", "refs");
    box.append(make("p", "refs-label", "BUTUH BANTUAN? HUBUNGI PIHAK BERWENANG"));
    const list = make("ul", "bot-list");
    for (const option of response.escalationOptions ?? []) list.append(make("li", "", option));
    box.append(list);
    body.append(box);
  } else {
    body.append(paragraph(response.message ?? ""));
  }

  if (followUps) body.append(followUps);
  if (feedback && API_URL && (response.type === "answer" || response.type === "fallback")) {
    body.append(feedbackRow(response));
  }
}

/** Teks jawaban, apa adanya yang dilihat pembaca; dipakai untuk riwayat dan salin. */
function answerText(response) {
  if (response.type === "answer") {
    if (response.generated) return String(response.message);
    const entry = response.entry;
    return [entry?.lead ?? response.message, ...(entry?.points ?? []).map((p) => `- ${p}`)]
      .filter(Boolean)
      .join("\n");
  }
  return response.message ?? "";
}

/* ============================================================
   BACKEND + OFFLINE
============================================================ */

function authHeaders() {
  return state.sessionToken ? { Authorization: `Bearer ${state.sessionToken}` } : {};
}

function scopedEntries() {
  const scope = state.scopeDocumentId ? documents[state.scopeDocumentId]?.file : null;
  return scope ? knowledgeBase.filter((entry) => entry.sourceUrl === scope) : knowledgeBase;
}

async function askBackend(question) {
  const scope = state.scopeDocumentId ? documents[state.scopeDocumentId]?.file : null;
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify({ question, conversationId: state.conversationId, scope }),
    signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`API ${response.status}`);

  const data = await response.json();
  if (data.conversationId) state.conversationId = data.conversationId;
  return {
    type: "answer",
    generated: true,
    message: data.answer,
    entry: data.entry,
    citation: data.citation ?? null,
    followUpQuestions: data.followUps ?? [],
  };
}

async function recordLocalAnswer(question, response) {
  if (!state.account || !API_URL) return;
  const answer = answerText(response);
  if (!answer) return;

  try {
    const result = await fetch(`${API_URL}/conversations/record`, {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        conversationId: state.conversationId,
        question,
        answer,
        entryId: response.entry?.id ?? null,
      }),
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
    if (!result.ok) throw new Error(`record ${result.status}`);
    const data = await result.json();
    if (data.conversationId) state.conversationId = data.conversationId;
  } catch (error) {
    console.warn("Tidak bisa menyimpan percakapan offline:", error);
  }
}

function titleFrom(question) {
  const clean = question.replace(/\s+/g, " ").trim();
  return clean.length > 60 ? `${clean.slice(0, 59)}…` : clean;
}

/** Percakapan sesi ini bagi yang belum masuk: hanya ada selama tab terbuka. */
function trackLocalChat(question, response) {
  if (state.account) return;
  let chat = state.sessionChats.find((c) => c.localId === state.activeLocalChat);
  if (!chat) {
    chat = { localId: `local-${Date.now()}`, title: titleFrom(question), turns: [] };
    state.sessionChats.unshift(chat);
    state.activeLocalChat = chat.localId;
  }
  chat.turns.push({ question, response, documentId: state.scopeDocumentId });
  renderRecent();
  setRecentOpen(true);
}

async function submitQuestion(raw) {
  const question = String(raw ?? "").trim();
  if (!question) return;

  const requestId = ++state.latestRequestId;
  const documentId = state.scopeDocumentId;

  if (state.view !== "chat") {
    refs.chatLog.replaceChildren();
    showView("chat");
  }
  refs.question.value = "";
  resizeComposer();

  appendUserMessage(question, documentId);
  const card = showProcessing();

  let response;
  if (API_URL) {
    try {
      response = await askBackend(question);
    } catch (error) {
      console.warn("Backend tidak tersedia, pakai pencocokan lokal:", error);
    }
  }

  let answeredLocally = false;
  if (!response) {
    response = createChatResponse(question, scopedEntries());
    answeredLocally = true;
  }

  if (requestId !== state.latestRequestId) return;

  fillCard(card, response, { feedback: true });
  scrollToEnd();

  trackLocalChat(question, response);
  if (answeredLocally) await recordLocalAnswer(question, response);
  if (state.account) refreshHistory();
}

function resetChat() {
  state.latestRequestId += 1; // buang jawaban yang masih dalam perjalanan
  state.conversationId = null;
  state.activeLocalChat = null;
  clearScope();
  refs.chatLog.replaceChildren();
  refs.question.value = "";
  resizeComposer();
  showView("home");
}

function resizeComposer() {
  refs.question.style.height = "auto";
  // Saat composer tersembunyi scrollHeight 0; jangan biarkan kotaknya mengempis.
  const height = refs.question.scrollHeight;
  refs.question.style.height = height > 0 ? `${Math.min(height, 120)}px` : "";
}

/* ------------------------------------------------------------ dokumen terlampir */

const NARROW = window.matchMedia("(max-width: 520px)");

/** Placeholder yang muat dalam satu baris, karena textarea tidak memotongnya. */
function placeholderText() {
  if (state.scopeDocumentId) {
    return NARROW.matches ? "Tanyakan dokumen ini..." : "Tanyakan sesuatu tentang dokumen ini...";
  }
  return NARROW.matches
    ? "Tanyakan seputar pedoman..."
    : "Tanyakan informasi KRS, Jadwal, atau Pedoman Akademik...";
}

function setScope(documentId) {
  state.scopeDocumentId = documentId;
  refs.attachChip.hidden = !documentId;
  if (documentId) refs.attachTitle.textContent = documents[documentId].title;
  refs.question.placeholder = placeholderText();
}

function clearScope() {
  setScope(null);
}

function buildAttachMenu() {
  refs.attachMenu.replaceChildren(make("p", "pop-menu-label", "Tanya tentang dokumen"));
  for (const [id, doc] of Object.entries(documents)) {
    // Pembatasan dokumen bekerja pada topik yang sudah dikurasi; dokumen unggahan belum.
    if (doc.uploaded) continue;
    const button = make("button", "menu-doc");
    button.type = "button";
    button.setAttribute("role", "menuitem");
    button.innerHTML = ICON.doc;
    const text = make("span");
    text.append(make("span", "", doc.title), make("small", "", `${doc.reference} • ${doc.pages} halaman`));
    button.append(text);
    button.addEventListener("click", () => {
      setScope(id);
      closeMenus();
      refs.question.focus();
    });
    refs.attachMenu.append(button);
  }
}

/* ------------------------------------------------------------ percakapan tersimpan */

function openLocalChat(localId) {
  const chat = state.sessionChats.find((c) => c.localId === localId);
  if (!chat) return;

  state.latestRequestId += 1;
  state.activeLocalChat = localId;
  refs.chatLog.replaceChildren();
  showView("chat");

  for (const turn of chat.turns) {
    appendUserMessage(turn.question, turn.documentId);
    const { card } = createBotCard();
    fillCard(card, turn.response);
  }
  scrollToEnd();
}

async function openConversation(id) {
  try {
    const response = await fetch(`${API_URL}/conversations/${id}`, { headers: authHeaders() });
    if (!response.ok) {
      showToast("Percakapan tidak ditemukan.");
      return;
    }
    const { conversation } = await response.json();

    state.latestRequestId += 1;
    state.conversationId = conversation.id;
    clearScope();
    refs.chatLog.replaceChildren();
    showView("chat");

    for (const message of conversation.messages) {
      if (message.role === "user") {
        appendUserMessage(message.content);
      } else {
        const entry = knowledgeBase.find((e) => e.id === message.entry_id) ?? null;
        const { card } = createBotCard();
        fillCard(card, {
          type: "answer",
          generated: message.answer_source === "llm",
          message: message.content,
          entry,
          followUpQuestions: [],
        });
      }
    }
    scrollToEnd();
  } catch (error) {
    console.warn("Tidak bisa membuka percakapan:", error);
    showToast("Gagal membuka percakapan.");
  }
}

async function refreshHistory() {
  if (!state.account) return;
  try {
    const response = await fetch(`${API_URL}/conversations`, { headers: authHeaders() });
    if (!response.ok) return;
    state.conversations = (await response.json()).conversations ?? [];
    renderRecent();
  } catch (error) {
    console.warn("Tidak bisa memuat riwayat:", error);
  }
}

async function deleteCurrentConversation() {
  if (!state.account || !state.conversationId) {
    showToast("Percakapan ini belum tersimpan.");
    return;
  }
  const id = state.conversationId;
  const response = await fetch(`${API_URL}/conversations/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!response.ok) {
    showToast("Gagal menghapus percakapan.");
    return;
  }
  showToast("Percakapan dihapus.");
  resetChat();
  refreshHistory();
}

function transcript() {
  const lines = [];
  for (const node of refs.chatLog.children) {
    if (node.classList.contains("bubble")) lines.push(`Mahasiswa:\n${node.textContent}`);
    else if (node.classList.contains("bot-card") && !node.dataset.processing) {
      lines.push(`SAPA UPI:\n${node.querySelector(".bot-body").innerText.trim()}`);
    }
  }
  return lines.join("\n\n");
}

function buildMoreMenu() {
  refs.moreMenu.replaceChildren();
  const actions = [
    [
      "Salin transkrip percakapan",
      () => {
        const text = transcript();
        if (text) copyText(text, "Transkrip disalin.");
        else showToast("Belum ada percakapan untuk disalin.");
      },
    ],
    ["Mulai percakapan baru", () => resetChat()],
  ];
  if (state.account) actions.push(["Hapus percakapan ini", deleteCurrentConversation]);

  for (const [label, action] of actions) {
    const button = make("button", "", label);
    button.type = "button";
    button.setAttribute("role", "menuitem");
    button.addEventListener("click", () => {
      closeMenus();
      action();
    });
    refs.moreMenu.append(button);
  }
}

/* ============================================================
   SEARCH CHATS
============================================================ */

let searchTimer;

const SEARCH_TABS = [
  ["all", "All"],
  ["chats", "Chats"],
  ["documents", "Documents"],
];

function renderSearchTabs() {
  refs.searchTabs.replaceChildren();
  for (const [id, label] of SEARCH_TABS) {
    const tab = make("button", "tab", label);
    tab.type = "button";
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", String(state.searchTab === id));
    tab.addEventListener("click", () => {
      state.searchTab = id;
      runSearch();
    });
    refs.searchTabs.append(tab);
  }
}

function loginPrompt(message) {
  refs.searchEmpty.hidden = false;
  refs.searchEmpty.replaceChildren(message);
  if (state.loginEnabled) {
    const button = make("button", "login-btn");
    button.type = "button";
    button.innerHTML = ICON.user;
    button.append(make("span", "", "Masuk dengan akun UPI"));
    button.addEventListener("click", () => showAuthScreen("login"));
    refs.searchEmpty.append(document.createElement("br"), button);
  }
}

/** Teks dengan kata yang dicari dibungkus <mark>; dibangun lewat node, bukan innerHTML. */
function highlighted(text, term) {
  const out = document.createDocumentFragment();
  const needle = term.toLowerCase();
  if (!needle) {
    out.append(text);
    return out;
  }
  const lower = text.toLowerCase();
  let from = 0;
  for (let at = lower.indexOf(needle); at >= 0; at = lower.indexOf(needle, from)) {
    out.append(text.slice(from, at), make("mark", "", text.slice(at, at + needle.length)));
    from = at + needle.length;
  }
  out.append(text.slice(from));
  return out;
}

function searchResult({ icon, title, snippet, date, term, onOpen }) {
  const item = make("li");
  const button = make("button", "result");
  button.type = "button";
  const text = make("span", "result-text");
  const strong = make("strong");
  strong.append(highlighted(title, term));
  text.append(strong);
  if (snippet) {
    const small = make("small");
    small.append(highlighted(snippet, term));
    text.append(small);
  }
  button.insertAdjacentHTML("afterbegin", icon);
  button.append(text, make("time", "result-date", date));
  button.addEventListener("click", onOpen);
  item.append(button);
  return item;
}

async function runSearch() {
  renderSearchTabs();
  const term = refs.searchInput.value.trim();
  refs.searchClear.hidden = !term;
  refs.searchEsc.hidden = !term;
  const tab = state.searchTab;
  const wantChats = tab !== "documents";
  const wantDocs = tab !== "chats";

  let chats = [];
  if (wantChats && state.account) {
    chats = state.conversations;
    if (term) {
      try {
        const response = await fetch(`${API_URL}/conversations?q=${encodeURIComponent(term)}`, {
          headers: authHeaders(),
        });
        if (response.ok) chats = (await response.json()).conversations ?? [];
      } catch (error) {
        console.warn("Pencarian gagal:", error);
      }
    }
  }

  const needle = term.toLowerCase();
  const docs = wantDocs
    ? Object.entries(documents).filter(
        ([, doc]) => !needle || `${doc.title} ${doc.owner} ${doc.reference}`.toLowerCase().includes(needle),
      )
    : [];

  refs.searchResults.replaceChildren();
  for (const conversation of chats) {
    refs.searchResults.append(
      searchResult({
        icon: ICON.chat,
        title: conversation.title,
        snippet: conversation.snippet ?? "",
        term,
        date: formatDate(conversation.updated_at),
        onOpen: () => openConversation(conversation.id),
      }),
    );
  }
  for (const [, doc] of docs) {
    refs.searchResults.append(
      searchResult({
        icon: ICON.file,
        title: doc.title,
        snippet: `${doc.reference} • ${doc.pages} halaman`,
        term,
        date: doc.dateLabel ?? "",
        onOpen: () => viewer.open(doc, { page: 1 }),
      }),
    );
  }

  const shown = chats.length + docs.length;
  if (wantChats && !state.account) {
    loginPrompt("Masuk untuk mencari di riwayat percakapanmu. Percakapan sebelum masuk tidak disimpan.");
    if (shown) refs.searchEmpty.classList.add("empty-inline");
    return;
  }
  refs.searchEmpty.classList.remove("empty-inline");
  refs.searchEmpty.hidden = shown > 0;
  refs.searchEmpty.textContent = term
    ? "Tidak ada hasil yang cocok."
    : tab === "documents"
      ? "Belum ada dokumen."
      : "Belum ada percakapan tersimpan.";
}

function formatDate(value) {
  const date = new Date(String(value).includes("T") ? value : `${String(value).replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

/* ============================================================
   FILES
============================================================ */

const LAYOUT_KEY = "sapa-upi:files-layout";

function readLayout() {
  try {
    return localStorage.getItem(LAYOUT_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function setLayout(layout) {
  state.filesLayout = layout;
  try {
    localStorage.setItem(LAYOUT_KEY, layout);
  } catch {
    /* tampilan tetap berganti untuk sesi ini */
  }
  renderFiles();
}

const FAV_KEY = "sapa-upi:favorite-documents";

function readFavorites() {
  try {
    const raw = JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]");
    return new Set(Array.isArray(raw) ? raw : []);
  } catch {
    return new Set();
  }
}

function writeFavorites(set) {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify([...set]));
  } catch {
    showToast("Browser menolak menyimpan favorit.");
  }
}

const FILE_TABS = [
  ["suggested", "Suggested"],
  ["favorites", "Favorites"],
  ["all", "All"],
];

function renderFilesTabs() {
  refs.filesTabs.replaceChildren();
  for (const [id, label] of FILE_TABS) {
    const tab = make("button", "tab", label);
    tab.type = "button";
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", String(state.filesTab === id));
    tab.addEventListener("click", () => {
      state.filesTab = id;
      renderFiles();
    });
    refs.filesTabs.append(tab);
  }
}

function closeFileMenu() {
  document.querySelector(".file-menu")?.remove();
}

function openFileMenu(anchor, id, doc) {
  const existing = document.querySelector(".file-menu");
  closeFileMenu();
  if (existing?.dataset.for === id) return;

  const menu = make("div", "file-menu");
  menu.setAttribute("role", "menu");
  menu.dataset.for = id;

  const entries = [
    ["Buka dokumen", () => viewer.open(doc, { page: 1 })],
    [
      "Salin tautan",
      async () => {
        const link = new URL(doc.file, location.href).href;
        try {
          await navigator.clipboard.writeText(link);
          showToast("Tautan disalin.");
        } catch {
          showToast("Browser menolak menyalin tautan.");
        }
      },
    ],
  ];
  for (const [label, action] of entries) {
    const item = make("button", "", label);
    item.type = "button";
    item.setAttribute("role", "menuitem");
    item.addEventListener("click", () => {
      closeFileMenu();
      action();
    });
    menu.append(item);
  }

  anchor.closest(".file-card").append(menu);
}

function renderFiles() {
  renderFilesTabs();
  const term = refs.filesSearch.value.trim().toLowerCase();
  const favorites = readFavorites();

  let list = Object.entries(documents);
  if (state.filesTab === "favorites") list = list.filter(([id]) => favorites.has(id));
  if (term) {
    list = list.filter(([, doc]) =>
      `${doc.title} ${doc.owner} ${doc.reference}`.toLowerCase().includes(term),
    );
  }

  refs.fileGrid.replaceChildren();
  refs.fileGrid.classList.toggle("is-list", state.filesLayout === "list");
  refs.filesGridView.setAttribute("aria-pressed", String(state.filesLayout === "grid"));
  refs.filesListView.setAttribute("aria-pressed", String(state.filesLayout === "list"));
  refs.filesEmpty.hidden = list.length > 0;
  refs.filesEmpty.textContent =
    state.filesTab === "favorites" && !term
      ? "Belum ada favorit. Tandai dokumen dengan bintang."
      : "Tidak ada dokumen yang cocok.";

  for (const [id, doc] of list) {
    const card = make("div", "file-card");
    const open = make("button", "file-open");
    open.type = "button";
    open.style.cssText = "all:unset;display:grid;gap:10px;cursor:pointer";
    open.setAttribute("aria-label", `Buka ${doc.title}`);

    const thumb = make("div", "file-thumb");
    const image = document.createElement("img");
    image.src = `./assets/thumbs/${id}.jpg`;
    image.alt = "";
    image.loading = "lazy";
    image.addEventListener("error", () => image.remove());
    thumb.append(image, make("span", "file-tag", doc.kind));

    const info = make("div", "file-info");
    info.append(
      make("span", "file-name", doc.title),
      make("span", "file-sub", doc.reference),
      make("span", "file-meta", `${doc.kind} • ${doc.sizeLabel} • ${doc.pages} halaman • ${doc.dateLabel}`),
    );
    open.append(thumb, info);
    open.addEventListener("click", () => viewer.open(doc, { page: 1 }));

    const star = make("button", "file-star");
    star.type = "button";
    star.innerHTML = ICON.star;
    star.setAttribute("aria-pressed", String(favorites.has(id)));
    star.setAttribute("aria-label", `Favoritkan ${doc.title}`);
    star.addEventListener("click", () => {
      const current = readFavorites();
      if (current.has(id)) current.delete(id);
      else current.add(id);
      writeFavorites(current);
      renderFiles();
    });

    const more = make("button", "file-more");
    more.type = "button";
    more.innerHTML = ICON.more;
    more.setAttribute("aria-label", `Menu ${doc.title}`);
    more.setAttribute("aria-haspopup", "menu");
    more.addEventListener("click", (event) => {
      event.stopPropagation();
      openFileMenu(more, id, doc);
    });

    card.append(open, star, more);
    refs.fileGrid.append(card);
  }
}

/* ============================================================
   SETTINGS
============================================================ */

const HELP_CONTACT = {
  program: "Program Studi Bisnis Digital, UPI Kampus Tasikmalaya",
  email: "bisnisdigital@upi.edu",
  phone: "(0265) 331860",
  address: "Jalan Dadaha Nomor 18, Kota Tasikmalaya 46115",
  site: "http://www.kd-tasikmalaya.upi.edu",
};

const SETTINGS_SECTIONS = [
  { id: "profile", label: "Profile", icon: ICON.user, needsAccount: true },
  { id: "security", label: "Security and login", icon: ICON.shield, needsAccount: true },
  { id: "data", label: "Data controls", icon: ICON.database, needsAccount: true },
  { id: "help", label: "Help", icon: ICON.help, needsAccount: false },
];

function row(label, description, value) {
  const wrap = make("div", "settings-row");
  const text = make("div", "label");
  text.append(make("strong", "", label));
  if (description) text.append(make("small", "", description));
  wrap.append(text);
  if (value instanceof Node) wrap.append(value);
  else if (value !== undefined) wrap.append(make("span", "value", value));
  return wrap;
}

function actionButton(label, handler, danger = false) {
  const button = make("button", `btn${danger ? " btn-danger" : ""}`, label);
  button.type = "button";
  button.addEventListener("click", handler);
  return button;
}

function renderSettings() {
  refs.settingsItems.replaceChildren();
  for (const section of SETTINGS_SECTIONS) {
    const button = make("button", `settings-item${state.settingsSection === section.id ? " is-active" : ""}`);
    button.type = "button";
    button.innerHTML = section.icon;
    button.append(make("span", "", section.label));
    button.addEventListener("click", () => {
      state.settingsSection = section.id;
      renderSettings();
    });
    refs.settingsItems.append(button);
  }

  const section = SETTINGS_SECTIONS.find((s) => s.id === state.settingsSection);
  refs.settingsTitle.textContent = section.label;
  refs.settingsCard.replaceChildren();

  if (section.needsAccount && !state.account) {
    refs.settingsCard.append(row("Belum masuk", "Masuk dengan akun UPI untuk membuka pengaturan ini."));
    return;
  }

  const account = state.account;

  if (section.id === "profile") {
    refs.settingsCard.append(
      row("Nama", "Sesuai akun Google UPI", account.name || "—"),
      row("Email", "Dipakai untuk masuk", account.email),
      row("Peran", "Hak akses pada SAPA UPI", account.role ? roleLabel(account) : "Pengguna"),
    );
  } else if (section.id === "security") {
    refs.settingsCard.append(
      row("Akun masuk", "Email UPI terbukti lewat Google", "Google • upi.edu"),
      row(
        "Kata sandi",
        account.hasPassword
          ? "Dipakai untuk masuk dengan email. Mengganti menuntut kata sandi saat ini"
          : "Pasang kata sandi untuk masuk dengan email, tanpa Google",
        actionButton(account.hasPassword ? "Ganti" : "Atur", openPasswordDialog),
      ),
      row(
        "Keluar dari semua perangkat",
        "Mengakhiri setiap sesi yang sedang aktif, termasuk yang ini",
        actionButton("Keluar semua", logoutEverywhere),
      ),
    );
  } else if (section.id === "data") {
    refs.settingsCard.append(
      row(
        "Unduh riwayat percakapan",
        "Seluruh percakapanmu dalam satu berkas JSON",
        actionButton("Unduh", exportHistory),
      ),
      row(
        "Hapus semua riwayat",
        "Menghapus seluruh percakapan tersimpan. Tidak bisa dibatalkan",
        actionButton("Hapus semua", deleteAllHistory, true),
      ),
    );
  } else if (section.id === "help") {
    const link = (href, text) => {
      const a = make("a", "", text);
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener";
      return a;
    };
    refs.settingsCard.append(
      row("Program Studi", "Pihak yang menerbitkan pedoman", HELP_CONTACT.program),
      row("Email", "", link(`mailto:${HELP_CONTACT.email}`, HELP_CONTACT.email)),
      row("Telepon", "", HELP_CONTACT.phone),
      row("Alamat", "", HELP_CONTACT.address),
      row("Laman", "", link(HELP_CONTACT.site, "kd-tasikmalaya.upi.edu")),
      row(
        "Tentang jawaban SAPA",
        "Dirujuk ke pedoman yang tersedia. Keputusan resmi tetap pada program studi",
        "",
      ),
    );
  }
}

function openPasswordDialog() {
  const account = state.account;
  const dialog = make("div", "modal");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "password-title");
  const scrim = make("div", "modal-scrim");
  const box = make("form", "modal-box");
  box.noValidate = true;
  dialog.append(scrim, box);

  const close = () => {
    dialog.remove();
    document.removeEventListener("keydown", onKey);
  };
  function onKey(event) {
    if (event.key === "Escape") close();
  }
  document.addEventListener("keydown", onKey);
  scrim.addEventListener("click", close);

  const head = make("div", "modal-head");
  const title = make("h2", "", account.hasPassword ? "Ganti kata sandi" : "Atur kata sandi");
  title.id = "password-title";
  head.append(title);

  const field = (label, id, autocomplete) => {
    const wrap = make("div", "auth-field");
    const labelEl = make("label", "auth-label", label);
    labelEl.htmlFor = id;
    const input = make("input", "auth-input");
    input.id = id;
    input.type = "password";
    input.autocomplete = autocomplete;
    wrap.append(labelEl, input);
    return { wrap, input };
  };

  const current = field("Kata sandi saat ini", "pw-current", "current-password");
  const next = field("Kata sandi baru", "pw-new", "new-password");
  const again = field("Ulangi kata sandi baru", "pw-again", "new-password");

  const intro = make(
    "p",
    "modal-intro",
    account.hasPassword
      ? "Kosongkan kata sandi saat ini hanya jika kamu baru saja masuk dengan Google (dalam 10 menit terakhir)."
      : "Dengan kata sandi, kamu bisa masuk memakai email UPI tanpa Google. Minimal 10 karakter.",
  );
  const message = make("p", "modal-message");
  message.hidden = true;
  const submit = make("button", "btn btn-primary", "Simpan");
  submit.type = "submit";
  const cancel = make("button", "btn", "Batal");
  cancel.type = "button";
  cancel.addEventListener("click", close);
  const actions = make("div", "modal-actions");
  actions.append(cancel, submit);

  box.append(head, intro);
  if (account.hasPassword) box.append(current.wrap);
  box.append(next.wrap, again.wrap, message, actions);

  box.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.hidden = false;
    if (next.input.value !== again.input.value) {
      message.textContent = "Kata sandi baru dan pengulangannya tidak sama.";
      return;
    }
    submit.disabled = true;
    try {
      await api("/auth/password/set", {
        method: "POST",
        body: JSON.stringify({ password: next.input.value, current: current.input.value || undefined }),
      });
      state.account.hasPassword = true;
      close();
      renderSettings();
      showToast("Kata sandi disimpan.");
    } catch (error) {
      message.textContent = error.status ? error.message : "Gagal menyimpan kata sandi.";
    } finally {
      submit.disabled = false;
    }
  });

  document.body.append(dialog);
  (account.hasPassword ? current : next).input.focus();
}

function roleLabel(account) {
  const unit = account.unit ? ` • ${account.unit}` : "";
  return `${account.role}${unit}`;
}

function openSettings(section = "profile") {
  state.settingsSection = section;
  renderSettings();
  showView("settings");
}

async function exportHistory() {
  try {
    const response = await fetch(`${API_URL}/conversations/export`, { headers: authHeaders() });
    if (!response.ok) throw new Error(`export ${response.status}`);
    const blob = new Blob([JSON.stringify(await response.json(), null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "riwayat-sapa-upi.json";
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.warn("Ekspor gagal:", error);
    showToast("Gagal mengunduh riwayat.");
  }
}

async function deleteAllHistory() {
  if (!window.confirm("Hapus semua riwayat percakapan? Ini tidak bisa dibatalkan.")) return;
  try {
    const response = await fetch(`${API_URL}/conversations`, { method: "DELETE", headers: authHeaders() });
    if (!response.ok) throw new Error(`delete ${response.status}`);
    state.conversations = [];
    state.conversationId = null;
    renderRecent();
    showToast("Semua riwayat dihapus.");
  } catch (error) {
    console.warn("Hapus riwayat gagal:", error);
    showToast("Gagal menghapus riwayat.");
  }
}

/* ============================================================
   API UNTUK HALAMAN PENGELOLA
============================================================ */

/** Panggilan terautentikasi; kegagalan dilempar dengan status HTTP-nya. */
async function api(path, options = {}) {
  const headers = { ...authHeaders(), ...(options.headers ?? {}) };
  if (typeof options.body === "string" && !headers["content-type"]) headers["content-type"] = "application/json";

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `API ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

const owner = createOwner({
  api,
  getAccount: () => state.account,
  showToast,
  openViewer: (doc, options) => viewer.open(doc, options),
  authHeaders: () => authHeaders(),
});
owner.setApiBase(API_URL);

/** Dokumen unggahan yang sudah tervalidasi, supaya tampil di Files dan bisa dibuka. */
async function loadPublicDocuments() {
  if (!API_URL) return;
  try {
    const response = await fetch(`${API_URL}/documents`);
    if (!response.ok) return;
    for (const doc of (await response.json()).documents ?? []) {
      documents[doc.id] = {
        file: doc.file,
        title: doc.title,
        owner: doc.owner,
        reference: doc.reference,
        period: doc.period,
        kind: doc.kind,
        pages: doc.pages,
        sizeLabel: `${(doc.sizeBytes / 1048576).toFixed(1).replace(".", ",")} MB`,
        dateLabel: formatDate(doc.updatedAt),
        uploaded: true,
      };
    }
    if (state.view === "files") renderFiles();
  } catch (error) {
    console.warn("Tidak bisa memuat dokumen tambahan:", error);
  }
}

/* ============================================================
   AKUN
============================================================ */

const TOKEN_KEY = "sapa-upi:session";
const HINT_KEY = "sapa-upi:account-hint";

/**
 * Salinan terakhir profil, hanya untuk menggambar sidebar seketika saat halaman
 * dibuka. Bukan sumber wewenang: /auth/me tetap menentukan, dan Worker yang
 * menjaga setiap rute pengelola.
 */
function readAccountHint() {
  try {
    const hint = JSON.parse(localStorage.getItem(HINT_KEY) ?? "null");
    return hint && typeof hint.email === "string" ? hint : null;
  } catch {
    return null;
  }
}

function writeAccountHint(account) {
  try {
    if (account) localStorage.setItem(HINT_KEY, JSON.stringify(account));
    else localStorage.removeItem(HINT_KEY);
  } catch {
    /* tanpa salinan, sidebar hanya muncul setelah /auth/me */
  }
}

function readStoredToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token, remember = true) {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    if (token) (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  } catch {
    /* sesi hanya bertahan selama halaman terbuka */
  }
}

const AUTH_COPY = {
  login: {
    title: "Selamat Datang Kembali!",
    sub: "Masuk dengan akun UPI Anda untuk menyimpan riwayat percakapan.",
    hint: "",
    google: "Continue with Google",
    note: "Hanya akun dengan domain upi.edu yang dapat masuk. Kata sandi dipasang dari Settings setelah masuk dengan Google. Tanpa masuk, kamu tetap bisa bertanya dan membuka dokumen.",
    alert: false,
  },
  domain: {
    title: "Akun Tidak Diizinkan",
    sub: "SAPA UPI hanya bisa dimasuki dengan akun Google UPI (@upi.edu atau subdomainnya).",
    hint: "Akun yang kamu pilih bukan akun UPI, jadi tidak dibuatkan sesi masuk.",
    google: "Coba dengan akun upi.edu",
    note: "Kamu tetap bisa bertanya dan membuka dokumen tanpa masuk. Masuk hanya diperlukan untuk menyimpan riwayat.",
    alert: true,
  },
  failed: {
    title: "Gagal Masuk",
    sub: "Proses masuk dengan Google tidak selesai.",
    hint: "Coba lagi sebentar lagi. Kalau terus gagal, kamu tetap bisa memakai SAPA tanpa masuk.",
    google: "Coba lagi",
    note: "",
    alert: true,
  },
};

function showAuthScreen(mode) {
  const copy = AUTH_COPY[mode] ?? AUTH_COPY.login;
  $("auth-title").textContent = copy.title;
  $("auth-sub").textContent = copy.sub;
  $("auth-hint").textContent = copy.hint;
  $("auth-hint").hidden = !copy.hint;
  $("auth-google-label").textContent = copy.google;
  $("auth-note").textContent = copy.note;
  $("auth-icon").hidden = !copy.alert;
  const isLogin = mode === "login";
  $("auth-form").hidden = !isLogin;
  $("auth-divider").hidden = !isLogin;
  $("auth-error").hidden = true;
  $("auth-password").value = "";
  refs.signinPage.dataset.mode = mode;
  if (refs.signinPage.hidden) authOpener = document.activeElement;
  refs.signinPage.hidden = false;
  document.body.classList.add("auth-open");
  (isLogin ? $("auth-email") : $("auth-google")).focus();
}

function authError(message) {
  $("auth-error").textContent = message;
  $("auth-error").hidden = !message;
}

async function submitPasswordLogin(event) {
  event.preventDefault();
  const email = $("auth-email").value.trim();
  const password = $("auth-password").value;
  if (!email || !password) return authError("Isi email dan kata sandi.");

  const button = $("auth-submit");
  button.disabled = true;
  authError("");
  try {
    const response = await fetch(`${API_URL}/auth/password/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return authError(data.error || "Tidak bisa masuk sekarang. Coba lagi.");

    state.sessionToken = data.token;
    storeToken(data.token, $("auth-remember").checked);
    $("auth-password").value = "";
    hideAuthScreen();
    await loadAccount();
    showToast("Berhasil masuk.");
  } catch {
    authError("Tidak bisa terhubung ke server. Coba lagi.");
  } finally {
    button.disabled = false;
  }
}

let authOpener = null;

function hideAuthScreen() {
  refs.signinPage.hidden = true;
  document.body.classList.remove("auth-open");
  authOpener?.focus?.();
  authOpener = null;
}

/** Tab dan Shift+Tab berputar di dalam layar masuk, tidak keluar ke halaman di belakangnya. */
function trapAuthFocus(event) {
  if (event.key !== "Tab" || refs.signinPage.hidden) return;
  const focusable = [...refs.signinPage.querySelectorAll("button, input, a[href], select, textarea")].filter(
    (node) => !node.disabled && node.offsetParent !== null,
  );
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && (document.activeElement === first || !refs.signinPage.contains(document.activeElement))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !refs.signinPage.contains(document.activeElement))) {
    event.preventDefault();
    first.focus();
  }
}

/** Worker mengembalikan alasan penolakan lewat fragment (tanpa data pribadi). */
function captureLoginErrorFromUrl() {
  const match = /^#login_error=(\w+)/.exec(window.location.hash);
  if (!match) return;
  history.replaceState(null, "", window.location.pathname + window.location.search);
  showAuthScreen(match[1] === "domain" ? "domain" : "failed");
}

/** Token datang dari Worker lewat fragment URL, supaya tidak masuk log server. */
function captureTokenFromUrl() {
  if (!window.location.hash.startsWith("#token=")) return;
  const token = decodeURIComponent(window.location.hash.slice("#token=".length));
  if (token) {
    state.sessionToken = token;
    storeToken(token);
  }
  history.replaceState(null, "", window.location.pathname + window.location.search);
}

function renderAccount() {
  const signedIn = Boolean(state.account);

  const isStaff = signedIn && Boolean(state.account.role);
  for (const item of document.querySelectorAll("[data-owner]")) item.hidden = !isStaff;
  refs.loginButton.hidden = signedIn || !state.loginEnabled;
  refs.loginNote.hidden = signedIn || !state.loginEnabled;
  refs.profile.hidden = !signedIn;

  if (signedIn) {
    refs.profileName.textContent = state.account.name || state.account.email;
    refs.profileSub.textContent = state.account.role
      ? `${state.account.email} • ${state.account.role}`
      : state.account.email;
  }
  renderGreeting();
  renderRecent();
}

async function loadAccount() {
  if (!API_URL) return;
  try {
    const response = await fetch(`${API_URL}/auth/me`, { headers: authHeaders() });
    if (!response.ok) throw new Error(`auth/me ${response.status}`);
    const data = await response.json();
    state.loginEnabled = Boolean(data.loginEnabled);
    state.account = data.user ?? null;
    writeAccountHint(state.account);
    if (!state.account) {
      state.sessionToken = null;
      storeToken(null);
    }
  } catch (error) {
    // Pemeriksaan yang gagal tidak boleh menyembunyikan jalan masuk.
    console.warn("Tidak bisa memeriksa sesi:", error);
    state.account = null;
  }
  renderAccount();
  if (state.account) refreshHistory();
}

function startLogin() {
  const back = encodeURIComponent(window.location.href.split("#")[0]);
  window.location.href = `${API_URL}/auth/start?redirect_to=${back}`;
}

async function logout() {
  try {
    await fetch(`${API_URL}/auth/logout`, { method: "POST", headers: authHeaders() });
  } catch {
    /* sesi tetap dibuang dari sisi browser */
  }
  signOutLocally("Kamu sudah keluar.");
}

async function logoutEverywhere() {
  try {
    const response = await fetch(`${API_URL}/auth/logout-all`, { method: "POST", headers: authHeaders() });
    if (!response.ok) throw new Error(`logout-all ${response.status}`);
  } catch (error) {
    console.warn("Keluar semua gagal:", error);
    showToast("Gagal keluar dari semua perangkat.");
    return;
  }
  signOutLocally("Keluar dari semua perangkat.");
}

function signOutLocally(message) {
  state.sessionToken = null;
  storeToken(null);
  writeAccountHint(null);
  state.account = null;
  state.conversations = [];
  state.conversationId = null;
  refs.chatLog.replaceChildren();
  renderAccount();
  showView("home");
  showToast(message);
}

/* ============================================================
   DIKTE SUARA
============================================================ */

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

/** Alasan yang bisa ditindaklanjuti pengguna, per kode galat Web Speech API. */
const VOICE_ERRORS = {
  "not-allowed": "Akses mikrofon ditolak. Izinkan mikrofon untuk situs ini di pengaturan browser.",
  "service-not-allowed": "Browser menolak dikte suara. Izinkan mikrofon, atau coba Chrome.",
  "audio-capture": "Mikrofon tidak terdeteksi. Periksa apakah mikrofon terpasang dan tidak dipakai aplikasi lain.",
  "no-speech": "Suara tidak terdengar. Tekan mikrofon lagi dan bicara lebih dekat.",
  network: "Dikte suara butuh koneksi internet ke layanan Google. Periksa koneksimu.",
  "language-not-supported": "Bahasa Indonesia tidak didukung dikte di browser ini.",
};

function stopVoice() {
  const current = recognition;
  recognition = null;
  refs.voiceButton.setAttribute("aria-pressed", "false");
  try {
    current?.stop();
  } catch {
    /* sudah berhenti */
  }
}

function toggleVoice() {
  if (recognition) {
    stopVoice();
    return;
  }
  if (!SpeechRecognition) {
    showToast("Browser ini belum mendukung dikte suara. Pakai Chrome atau Edge (versi desktop).");
    return;
  }
  if (!window.isSecureContext) {
    showToast("Dikte suara hanya jalan di halaman HTTPS.");
    return;
  }

  const session = new SpeechRecognition();
  session.lang = "id-ID";
  session.interimResults = true;
  session.continuous = false;
  session.maxAlternatives = 1;

  // Hasil dikte ditambahkan ke ketikan yang sudah ada, bukan menimpanya.
  const base = refs.question.value.trim();
  let heard = false;

  session.addEventListener("result", (event) => {
    heard = true;
    const spoken = [...event.results].map((r) => r[0].transcript).join("").trim();
    refs.question.value = [base, spoken].filter(Boolean).join(" ").slice(0, refs.question.maxLength);
    resizeComposer();
  });
  session.addEventListener("error", (event) => {
    if (event.error === "aborted") return;
    showToast(VOICE_ERRORS[event.error] ?? `Input suara gagal (${event.error}). Coba lagi.`);
    if (recognition === session) stopVoice();
  });
  session.addEventListener("end", () => {
    if (recognition !== session) return;
    stopVoice();
    if (heard) refs.question.focus();
  });

  recognition = session;
  try {
    session.start();
  } catch (error) {
    recognition = null;
    showToast("Mikrofon belum bisa dipakai. Coba lagi sebentar.");
    return;
  }
  refs.voiceButton.setAttribute("aria-pressed", "true");
  showToast("Mendengarkan... bicara sekarang.");
}

/* ============================================================
   INIT
============================================================ */

function initialize() {
  refs.composer.addEventListener("submit", (event) => {
    event.preventDefault();
    submitQuestion(refs.question.value);
  });
  refs.question.addEventListener("input", resizeComposer);
  refs.question.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      refs.composer.requestSubmit();
    }
  });

  refs.navNew.addEventListener("click", resetChat);
  refs.navSearch.addEventListener("click", () => {
    showView("search");
    runSearch();
    refs.searchInput.focus();
  });
  refs.navFiles.addEventListener("click", () => {
    showView("files");
    renderFiles();
  });
  refs.navDashboard.addEventListener("click", () => {
    showView("dashboard");
    owner.renderDashboard(refs.dashboardRoot);
  });
  refs.navMetrics.addEventListener("click", () => {
    showView("metrics");
    owner.renderMetrics(refs.metricsRoot);
  });
  refs.navKb.addEventListener("click", () => {
    showView("kb");
    owner.renderKnowledgeBase(refs.kbRoot);
  });
  refs.navRecent.addEventListener("click", () =>
    setRecentOpen(refs.navRecent.getAttribute("aria-expanded") !== "true"),
  );
  refs.historyButton.addEventListener("click", () => refs.navSearch.click());

  refs.menuButton.addEventListener("click", openSidebar);
  refs.sidebarClose.addEventListener("click", closeSidebar);
  refs.scrim.addEventListener("click", closeSidebar);

  refs.searchClear.addEventListener("click", () => {
    refs.searchInput.value = "";
    runSearch();
    refs.searchInput.focus();
  });
  refs.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && refs.searchInput.value) {
      event.preventDefault();
      refs.searchInput.value = "";
      runSearch();
    }
  });
  refs.searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(runSearch, 220);
  });
  refs.filesSearch.addEventListener("input", renderFiles);
  refs.filesGridView.addEventListener("click", () => setLayout("grid"));
  refs.filesListView.addEventListener("click", () => setLayout("list"));
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".file-menu")) closeFileMenu();
  });

  refs.shareButton.addEventListener("click", () =>
    copyText(window.location.href.split("#")[0], "Tautan disalin."),
  );
  refs.moreButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu(refs.moreMenu, refs.moreButton, buildMoreMenu);
  });

  refs.attachButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu(refs.attachMenu, refs.attachButton, buildAttachMenu);
  });
  refs.attachRemove.addEventListener("click", clearScope);
  refs.voiceButton.addEventListener("click", toggleVoice);

  refs.profileTrigger.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu(refs.profileMenu, refs.profileTrigger);
  });
  refs.profileMenu.addEventListener("click", (event) => {
    const item = event.target.closest("[data-profile]");
    if (!item) return;
    closeMenus();
    const action = item.dataset.profile;
    if (action === "logout") logout();
    else if (action === "settings") openSettings("security");
    else if (action === "help") openSettings("help");
    else openSettings("profile");
  });

  refs.loginButton.addEventListener("click", () => showAuthScreen("login"));
  $("auth-google").addEventListener("click", startLogin);
  $("auth-form").addEventListener("submit", submitPasswordLogin);
  $("auth-eye").addEventListener("click", () => {
    const input = $("auth-password");
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    $("auth-eye").setAttribute("aria-pressed", String(show));
    $("auth-eye").setAttribute("aria-label", show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
  });
  $("auth-forgot").addEventListener("click", () => {
    authError("Masuk dengan Google di bawah, lalu atur ulang kata sandi di Settings > Security and login (dalam 10 menit setelah masuk).");
  });
  $("auth-skip").addEventListener("click", hideAuthScreen);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !refs.signinPage.hidden) hideAuthScreen();
    trapAuthFocus(event);
  });
  refs.settingsBack.addEventListener("click", () => showView("home"));
  NARROW.addEventListener("change", () => (refs.question.placeholder = placeholderText()));
  refs.question.placeholder = placeholderText();

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".menu-anchor, .profile")) closeMenus();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeMenus();
    closeSidebar();
    stopVoice();
  });

  captureTokenFromUrl();
  captureLoginErrorFromUrl();
  state.sessionToken = state.sessionToken ?? readStoredToken();
  if (state.sessionToken) state.account = readAccountHint();

  setRecentOpen(false);
  renderAccount();
  showView("home");
  loadAccount();
  loadPublicDocuments();
}

initialize();
