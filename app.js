import { knowledgeBase } from "./data/knowledge-base.js";
import { documents, citationFor, documentIdForFile } from "./data/sources.js";
import { createChatResponse } from "./lib/chat-engine.js";
import { clarifiedSentence, clarifyQuestion, isBullet, isExplainable, shouldNumber, splitSentences, stripBullet } from "./lib/clarify.js";
import { API_URL } from "./config.js";
import { createViewer } from "./viewer.js";
import { catalogDocuments, catalogMessage, fileRequestMessage, findRequestedDocuments, isCatalogQuestion } from "./lib/doc-request.js";
import { createSettings } from "./settings.js";
import { createOwner } from "./owner.js";
import { getLang, initLang, onLangChange, setLang } from "./lib/i18n.js";
import { MAX_RECORD_MS, startRecording } from "./lib/recorder.js";
import { pickSuggestion } from "./lib/suggest.js";

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
  edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9a2.1 2.1 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.2"/><path d="M5 15V6.2A2.2 2.2 0 0 1 7.2 4H15"/></svg>',
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
  download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>',
  link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  archive: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4" width="17" height="5" rx="1.5"/><path d="M5 9v9.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V9"/><path d="M10 13h4"/></svg>',
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
  toast: $("toast"),
};

const VIEWS = ["home", "chat", "search", "files", "settings", "dashboard", "metrics", "kb", "shared"];

/* ============================================================
   STATE
============================================================ */

// Sedikit di atas batas total Worker (15 dtk), supaya galatnya sampai sebelum browser menyerah.
// Sedikit lebih lama dari anggaran waktu Worker (20 detik), supaya jawaban yang tiba di detik terakhir tetap terpakai.
const BACKEND_TIMEOUT_MS = 24_000;

const state = {
  view: "home",
  account: null, // { id, email, name, role? }
  loginEnabled: Boolean(API_URL),
  sessionToken: null,
  conversationId: null, // percakapan yang sedang dibuka (id dari server)
  history: [], // giliran sebelumnya di chat ini ({ q, a, entryId }), dikirim supaya pertanyaan lanjutan nyambung
  conversations: [], // riwayat tersimpan milik pengguna
  sessionChats: [], // percakapan sesi ini bagi yang belum masuk (tidak disimpan)
  activeLocalChat: null,
  scopeDocumentId: null,
  suggestedQuestion: null, // pertanyaan lanjutan dari topik yang sedang dibahas, ditampilkan sebagai placeholder
  latestRequestId: 0,
  filesTab: "suggested",
  filesLayout: readLayout(),
  searchTab: "all",
};

const viewer = createViewer({ onCopy: (message) => showToast(message) });

/** Membuka dokumen sekaligus mencatatnya sebagai berkas yang sudah dicari. */
function openDocument(doc, options) {
  markSeen(doc);
  return viewer.open(doc, options);
}

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
  fitMenu(menu, trigger);
}

/**
 * Menu melayang dibatasi ke ruang yang tersedia di atas atau di bawah tombolnya, supaya tidak
 * pernah keluar dari layar (layar pendek, ponsel). Isi yang lebih panjang digulir di dalam menu.
 */
function fitMenu(menu, trigger) {
  menu.style.maxHeight = "";
  const rect = trigger.getBoundingClientRect();
  const above = menu.classList.contains("pop-menu-up") || getComputedStyle(menu).bottom !== "auto";
  const room = above ? rect.top - 20 : window.innerHeight - rect.bottom - 20;
  menu.style.maxHeight = `${Math.max(140, Math.min(room, 520))}px`;
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
  dismissDrawer();

  if (name === "home" || name === "chat") refs.question.focus({ preventScroll: true });
}

const WIDE = window.matchMedia("(min-width: 901px)");
const SIDEBAR_KEY = "sapa-sidebar-collapsed";

/** Layar lebar: sidebar ditutup atau dibuka dari tombolnya, dan pilihannya diingat. */
function setSidebarCollapsed(collapsed) {
  refs.app.classList.toggle("sidebar-collapsed", collapsed);
  refs.menuButton.setAttribute("aria-expanded", String(!collapsed));
  refs.menuButton.setAttribute("aria-label", collapsed ? "Buka navigasi" : "Tutup navigasi");
  try {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
  } catch {
    // Mode privat: pilihan tidak diingat, tombol tetap bekerja.
  }
}

function openSidebar() {
  if (WIDE.matches) return setSidebarCollapsed(false);
  refs.sidebar.classList.add("is-open");
  refs.scrim.hidden = false;
}

function closeSidebar() {
  if (WIDE.matches) return setSidebarCollapsed(true);
  refs.sidebar.classList.remove("is-open");
  refs.scrim.hidden = true;
}

/** Berpindah halaman menutup laci di ponsel, tapi tidak boleh menutup sidebar di layar lebar. */
function dismissDrawer() {
  refs.sidebar.classList.remove("is-open");
  refs.scrim.hidden = true;
}

try {
  if (localStorage.getItem(SIDEBAR_KEY) === "1") setSidebarCollapsed(true);
} catch {
  // Tanpa penyimpanan: sidebar mulai terbuka.
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
    if (entry.saved && state.account) {
      item.className = "recent-row";
      const archive = make("button", "recent-archive");
      archive.type = "button";
      archive.title = "Arsipkan percakapan ini";
      archive.setAttribute("aria-label", "Arsipkan percakapan ini");
      archive.innerHTML = ICON.archive;
      archive.addEventListener("click", (event) => {
        event.stopPropagation();
        archiveConversation(entry.id, { leave: false });
      });
      item.append(archive);
    }
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

/** Dokumen template bawaan untuk sebuah URL (di mana pun situs ini di-host), atau null. */
function templateFor(url) {
  const at = url.indexOf("/dokumen/template/");
  if (at < 0) return null;
  const id = documentIdForFile(`.${url.slice(at).split(/[?#]/)[0]}`);
  return id ? documents[id] : null;
}

/** Teks biasa dengan tautan http(s) yang bisa diklik; tidak pernah memakai innerHTML. */
function appendRichText(parent, text) {
  // Tautan lengkap (https://...), atau tanpa skema untuk bit.ly, www., dan laman *.upi.edu yang sering ditulis polos.
  const pattern = /((?:https?:\/\/|www\.|bit\.ly\/|(?:[a-z0-9-]+\.)+upi\.edu\b)(?:[^\s)]*[^\s).,;:])?)/gi;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) parent.append(text.slice(last, match.index));
    const link = document.createElement("a");
    link.href = /^https?:\/\//i.test(match[0]) ? match[0] : `https://${match[0]}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = match[0];
    // Template yang ada di situs ini dibuka di pembaca dokumen (pratinjau + tombol unduh).
    const templateDoc = templateFor(match[0]);
    if (templateDoc) {
      // Alamat berkas yang panjang diganti label pendek (alamatnya tetap di title dan href).
      link.title = match[0];
      link.textContent = "Buka & unduh";
      link.addEventListener("click", (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        openDocument(templateDoc, { page: 1 });
      });
    }
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
function clarifyMarker(number, sentence, topic) {
  const button = make("button", "clarify-num", String(number));
  button.type = "button";
  button.setAttribute("aria-label", `Jelaskan lebih lanjut poin ${number}`);
  button.title = `Jelaskan lebih lanjut poin ${number}`;
  button.addEventListener("click", () => submitQuestion(clarifyQuestion(number, sentence), { topic }));
  return button;
}

/** Id topik sebuah jawaban (topik kurasi, atau "p:<dokumen>:<halaman>" untuk dokumen unggahan), dikirim saat angkanya diklik. */
function topicOf(entry) {
  return entry?.id ? String(entry.id) : null;
}

/** Teks dengan tautan, tiap kalimatnya diikuti nomor yang bisa diklik. Penghitung dipakai bersama satu jawaban. */
function appendNumberedText(parent, text, counter, topic) {
  for (const sentence of splitSentences(text)) {
    appendRichText(parent, sentence);
    if (counter.on !== false && isExplainable(sentence) && counter.n < MAX_NUMBERED) {
      counter.n += 1;
      parent.append(clarifyMarker(counter.n, sentence, topic));
    }
    parent.append(" ");
  }
}

/**
 * Jawaban AI: paragraf dan daftar, setiap kalimat bernomor.
 *
 * Gemini menjawab dengan kerangka pembuka, daftar bernomor/berpoin, lalu penutup
 * (lihat KERANGKA JAWABAN di SYSTEM_INSTRUCTION, Worker). Baris berisi beberapa
 * kalimat dipecah jadi butir list sendiri-sendiri — sama seperti poin
 * jawaban lokal (entry.points) — supaya tiap poin berdiri sendiri dan nomor
 * penjelasannya jelas milik kalimat yang mana. Baris berisi satu kalimat saja
 * tetap jadi paragraf biasa, karena daftar berisi satu butir tidak perlu bullet.
 */
function appendNumberedAnswer(body, message, counter, topic) {
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
        appendNumberedText(item, stripBullet(line), counter, topic);
        list.append(item);
        continue;
      }
      list = null;
      const sentences = splitSentences(line);
      if (sentences.length > 1) {
        const ul = make("ul", "bot-list");
        for (const sentence of sentences) {
          const item = document.createElement("li");
          appendNumberedText(item, sentence, counter, topic);
          ul.append(item);
        }
        body.append(ul);
      } else {
        const p = make("p");
        appendNumberedText(p, line, counter, topic);
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
  refs.chatLog.append(make("p", "bubble", question), userActions(question));
}

/** Salin dan ubah pertanyaan sendiri. Mengubah memuat teksnya kembali ke kolom ketik untuk dikirim lagi. */
function userActions(question) {
  const row = make("div", "bubble-actions");

  const copy = make("button", "bubble-action");
  copy.type = "button";
  copy.innerHTML = ICON.copy;
  copy.setAttribute("aria-label", "Salin pertanyaan");
  copy.title = "Salin pertanyaan";
  copy.addEventListener("click", async () => {
    await copyText(question, "Pertanyaan disalin.");
    copy.innerHTML = ICON.check;
    setTimeout(() => (copy.innerHTML = ICON.copy), 1600);
  });

  const edit = make("button", "bubble-action");
  edit.type = "button";
  edit.innerHTML = ICON.edit;
  edit.setAttribute("aria-label", "Ubah pertanyaan");
  edit.title = "Ubah pertanyaan";
  edit.addEventListener("click", () => {
    refs.question.value = question.slice(0, 300);
    resizeComposer();
    refs.question.focus();
    refs.question.setSelectionRange(refs.question.value.length, refs.question.value.length);
  });

  row.append(copy, edit);
  return row;
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
  head.append(pill("Mencari di dokumen...", "busy"));

  const steps = make("div", "steps");
  for (const [label, done] of [
    ["Membaca pertanyaan", true],
    ["Mencari di dokumen resmi", true],
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

/** Berkas yang diminta: dibuka dari halaman pertama tanpa sorotan, atau diunduh langsung. */
function fileResults(ids) {
  markSeen(...ids);
  const list = make("div", "file-results");
  for (const id of ids) {
    const doc = documents[id];
    if (!doc) continue;
    const row = make("div", "file-result");
    row.dataset.kind = doc.kind;
    const open = make("button", "file-result-open");
    open.type = "button";
    open.setAttribute("aria-label", `Buka ${doc.title}`);
    const icon = make("span", "file-result-icon");
    icon.innerHTML = ICON.file;
    const text = make("span", "file-result-text");
    text.append(
      make("strong", "", doc.title),
      make("small", "", [doc.kind, doc.pages > 1 ? `${doc.pages} halaman` : null, doc.sizeLabel, doc.dateLabel].filter(Boolean).join(" • ")),
    );
    open.append(icon, text);
    open.addEventListener("click", () => openDocument(doc, { page: 1 }));

    const download = make("a", "file-result-download");
    download.href = doc.download ?? doc.file;
    download.setAttribute("download", (doc.download ?? doc.file).split("/").pop());
    download.setAttribute("aria-label", `Unduh ${doc.title}`);
    download.title = "Unduh";
    download.innerHTML = ICON.download;
    row.append(open, download);
    list.append(row);
  }
  return list;
}

function renderReferences(entry, parent, served = null, many = []) {
  // Beberapa dokumen: semuanya ditampilkan, yang terbaru paling atas dan bertanda.
  if (many?.length > 1 || many?.some((item) => item.related)) return renderManyReferences(entry, parent, many);
  // Jawaban dari dokumen unggahan membawa rujukannya sendiri dari Worker.
  const citation = served ?? citationFor(entry);
  if (citation?.document) markSeen(citation.document);
  const box = make("div", "refs");
  box.append(make("p", "refs-label", "SUMBER DOKUMEN RESMI"));
  const list = make("div", "refs-list");

  if (citation) {
    list.append(sourceChip(citation));
  } else {
    const chip = make("span", "ref-chip ref-chip-muted");
    chip.innerHTML = ICON.file;
    // Teks dibungkus satu elemen: tanpa itu, teks dan tautan di dalamnya menjadi kolom flex terpisah yang menyempit.
    const label = make("span", "ref-chip-text");
    appendRichText(label, entry.sourceRef || entry.sourceTitle);
    chip.append(label);
    list.append(chip);
  }
  box.append(list);

  if (!citation) box.append(make("p", "ref-note", "Dokumen ini belum bisa dibuka di SAPA."));
  box.append(make("p", "ref-note escalation-note", contactNote(entry)));
  box.append(ultNote());
  parent.append(box);
}

function sourceChip(citation) {
  const chip = make("button", "ref-chip");
  chip.type = "button";
  chip.innerHTML = ICON.file;
  chip.dataset.kind = citation.document.kind;
  // Template satu halaman: "hal. 1" tidak berarti apa-apa.
  chip.append(make("span", "ref-chip-text", citation.document.pages > 1 ? `${citation.document.title}, hal. ${citation.page}` : citation.document.title));
  chip.addEventListener("click", () =>
    openDocument(citation.document, { page: citation.page, highlight: citation.highlight }),
  );
  return chip;
}

/** Dua dokumen atau lebih: yang terbaru ditonjolkan sebagai yang berlaku. */
function renderManyReferences(entry, parent, allCitations) {
  markSeen(...allCitations.map((item) => item.document).filter(Boolean));
  const citations = allCitations.filter((item) => !item.related);
  const related = allCitations.filter((item) => item.related);
  const box = make("div", "refs refs-many");
  box.append(make("p", "refs-label", "SUMBER DOKUMEN RESMI"));
  const list = make("div", "refs-stack");
  const newest = citations.find((item) => item.newest);

  for (const item of citations) {
    const row = make("div", item.newest ? "ref-row ref-row-newest" : "ref-row");
    const head = make("div", "ref-row-head");
    if (item.newest) head.append(make("span", "ref-badge", "Terbaru · berlaku"));
    else if (newest) head.append(make("span", "ref-badge ref-badge-old", "Sebelumnya"));
    if (item.updatedAt) head.append(make("span", "ref-date", item.updatedAt));
    if (head.children.length) row.append(head);
    row.append(sourceChip(item));
    list.append(row);
  }
  box.append(list);

  if (newest) {
    box.append(
      make(
        "p",
        "ref-note ref-newest-note",
        `Kalau ada perbedaan, ikuti dokumen terbaru: ${newest.document.reference || newest.document.title} (${newest.updatedAt}).`,
      ),
    );
  }

  // Dokumen serupa yang mungkin berguna juga; bukan dasar jawaban di atas.
  if (related.length) {
    box.append(make("p", "refs-label refs-label-related", "DOKUMEN TERKAIT"));
    const more = make("div", "refs-stack");
    for (const item of related) {
      const row = make("div", "ref-row");
      row.append(sourceChip(item));
      more.append(row);
    }
    box.append(more);
  }

  box.append(make("p", "ref-note escalation-note", contactNote(entry)));
  box.append(ultNote());
  parent.append(box);
}

/**
 * Kalimat kontak penanggung jawab. Setiap topik kurasi dan setiap halaman
 * dokumen unggahan sudah membawa `escalation` sendiri (lihat
 * data/knowledge-base.js dan worker/src/documents.js), jadi ini biasanya
 * dipakai apa adanya — `HELP_CONTACT` hanya jaring pengaman kalau suatu saat
 * ada jalur jawaban yang entrinya kosong.
 */
function contactNote(entry) {
  return entry?.escalation || `Untuk memastikan, hubungi ${HELP_CONTACT.program} (${HELP_CONTACT.email}).`;
}

/**
 * Kontak penanggung jawab tanpa kotak rujukan dokumen di sekitarnya — dipakai
 * saat jawaban tidak (atau belum tentu) merujuk satu topik tertentu. Setiap
 * jawaban nyata tetap menampilkan kontak, bukan cuma saat sistem menolak
 * menjawab sama sekali.
 */
function renderContactOnly(parent, entry) {
  const box = make("div", "refs");
  box.append(make("p", "ref-note escalation-note", contactNote(entry)));
  box.append(ultNote());
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

/** Teks jawaban untuk disalin: isi jawabannya saja, tanpa nomor, kartu sumber, atau ajakan. */
function copyableAnswer(response) {
  const text = answerText(response).trim();
  if (response.type !== "files") return text;
  const titles = (response.files ?? []).map((id) => documents[id]?.title).filter(Boolean);
  return [text, ...titles.map((title) => `- ${title}`)].filter(Boolean).join("\n");
}

function addCopyButton(head, text) {
  head.querySelector(".bot-copy")?.remove();
  if (!text) return;
  const button = make("button", "bot-copy");
  button.type = "button";
  button.innerHTML = ICON.copy;
  button.setAttribute("aria-label", "Salin jawaban");
  button.title = "Salin jawaban";
  button.addEventListener("click", async () => {
    await copyText(text, "Jawaban disalin.");
    button.innerHTML = ICON.check;
    button.classList.add("is-copied");
    setTimeout(() => {
      button.innerHTML = ICON.copy;
      button.classList.remove("is-copied");
    }, 1600);
  });
  head.append(button);
}

function fillCard(card, response, { feedback = false, question = "" } = {}) {
  const head = card.querySelector(".bot-head");
  const body = card.querySelector(".bot-body");
  head.querySelector(".pill")?.remove();
  body.replaceChildren();
  delete card.dataset.processing;

  const entry = response.entry;
  let followUps = null;

  addCopyButton(head, copyableAnswer(response));

  if (response.type === "files") {
    head.append(pill("Berkas resmi", "ok"));
    body.append(paragraph(response.message));
    body.append(fileResults(response.files));
    renderContactOnly(body, null);
    if (feedback) body.append(feedbackRow(response));
    return;
  }

  if (response.type === "answer") {
    head.append(
      response.generated
        ? pill("Dijawab AI • berdasarkan dokumen resmi", "ok")
        : pill("Jawaban cadangan • AI sedang tidak tersedia"),
    );

    const counter = {
      n: 0,
      // Jawaban pendek sudah jelas: tanpa nomor dan tanpa ajakan "klik angka".
      on: shouldNumber(response.generated ? [response.message] : [entry?.lead ?? response.message, ...(entry?.points ?? [])]),
    };
    if (response.generated) {
      appendNumberedAnswer(body, response.message, counter, topicOf(entry));
    } else {
      const lead = make("p");
      appendNumberedText(lead, entry?.lead ?? response.message, counter, topicOf(entry));
      body.append(lead);
      if (entry?.points?.length) {
        const list = make("ul", "bot-list");
        for (const point of entry.points) {
          const li = document.createElement("li");
          appendNumberedText(li, point, counter, topicOf(entry));
          list.append(li);
        }
        body.append(list);
      }
    }
    if (counter.n > 0) body.append(make("p", "clarify-hint", "Mau penjelasan lebih lanjut? Klik angka di ujung kalimat."));

    if (entry?.table) renderTable(entry.table, body);
    if (entry) renderReferences(entry, body, response.citation, response.citations);
    else renderContactOnly(body, null); // Gemini menjawab tanpa satu topik kurasi yang jelas — tetap wajib ada kontak.
    followUps = renderFollowUps(response.followUpQuestions);
    // Placeholder kotak ketik mengikuti topik yang sedang dibahas, bukan kalimat tetap.
    setSuggestedQuestion(suggestionFor(entry, question));
  } else if (response.type === "suggestions") {
    setSuggestedQuestion(null);
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
    renderContactOnly(body, null); // Beberapa topik cocok sekaligus: belum ada satu entri untuk dirujuk, tapi kontak tetap wajib ada.
  } else if (response.type === "fallback") {
    setSuggestedQuestion(null);
    head.append(pill("Belum ada di dokumen"));
    body.append(paragraph(response.message));
    const box = make("div", "refs");
    box.append(make("p", "refs-label", "BUTUH BANTUAN? HUBUNGI:"));
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

async function askBackend(question, topic = null) {
  const scope = state.scopeDocumentId ? documents[state.scopeDocumentId]?.file : null;
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify({ question, conversationId: state.conversationId, scope, lang: getLang(), improve: settings.prefs.improve, ...(state.history.length ? { history: state.history.slice(-3) } : {}), ...(topic ? { topic } : {}) }),
    signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`API ${response.status}`);

  const data = await response.json();
  if (data.conversationId) state.conversationId = data.conversationId;
  // Permintaan berkas: Worker menjawab dengan daftar id dokumen, bukan kutipan topik.
  if (Array.isArray(data.files) && data.files.length) {
    return { type: "files", message: data.answer, files: data.files.filter((id) => documents[id]) };
  }
  return {
    type: "answer",
    generated: true,
    message: data.answer,
    entry: data.entry,
    citation: data.citation ?? null,
    citations: data.citations ?? [],
    followUpQuestions: data.followUps ?? [],
  };
}

async function recordLocalAnswer(question, response) {
  if (!state.account || !API_URL) return;
  const sentToken = state.sessionToken;
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
    if (dropExpiredSession(result, sentToken)) return;
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

async function submitQuestion(raw, { topic = null } = {}) {
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
      response = await askBackend(question, topic);
    } catch (error) {
      console.warn("Backend tidak tersedia, pakai pencocokan lokal:", error);
    }
  }

  let answeredLocally = false;
  if (!response) {
    const skip = state.scopeDocumentId || clarifiedSentence(question);
    const catalog = !skip && isCatalogQuestion(question);
    const { official, templates } = catalogDocuments();
    const asked = skip ? [] : catalog ? official : findRequestedDocuments(question);
    response = asked.length
      ? {
          type: "files",
          message: catalog ? catalogMessage(asked.length, templates, getLang()) : fileRequestMessage(asked, getLang()),
          files: asked.map(({ id }) => id),
        }
      : createChatResponse(question, scopedEntries(), { topic, lang: getLang() });
    answeredLocally = true;
  }

  if (requestId !== state.latestRequestId) return;

  fillCard(card, response, { feedback: true, question });
  scrollToEnd();
  // Untuk pertanyaan lanjutan; klik-angka bukan pertanyaan baru, jadi tidak ikut dicatat.
  if (!clarifiedSentence(question) && response.type === "answer") {
    state.history.push({ q: question, a: answerText(response).slice(0, 500), entryId: response.entry?.id ?? null });
    state.history = state.history.slice(-3);
  }

  trackLocalChat(question, response);
  if (answeredLocally) await recordLocalAnswer(question, response);
  if (state.account) refreshHistory();
}

function resetChat() {
  state.latestRequestId += 1; // buang jawaban yang masih dalam perjalanan
  state.conversationId = null;
  state.activeLocalChat = null;
  state.suggestedQuestion = null;
  state.history = [];
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
  if (state.suggestedQuestion) {
    return state.suggestedQuestion;
  }
  return NARROW.matches
    ? "Tanyakan seputar pedoman..."
    : "Tanyakan informasi KRS, Jadwal, atau Pedoman Akademik...";
}

/** Saran pertanyaan untuk topik ini yang paling dekat dengan yang baru ditanyakan (lihat lib/suggest.js). */
function suggestionFor(entry, asked) {
  const local = knowledgeBase.find((e) => e.id === entry?.id) ?? entry;
  return pickSuggestion(local, asked, { lang: getLang() });
}

function setSuggestedQuestion(question) {
  state.suggestedQuestion = question;
  refs.question.placeholder = placeholderText();
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
  refs.attachMenu.replaceChildren(
    make("p", "pop-menu-label", "Tanya tentang dokumen"),
    // Fitur ini sering disalahpahami sebagai unggah berkas — ditegaskan di
    // sini karena ini satu-satunya tempat pengguna melihat menunya.
    make("p", "pop-menu-note", "Jawaban hanya diambil dari dokumen yang kamu pilih. Tidak ada berkas yang diunggah atau disimpan."),
  );
  for (const [id, doc] of Object.entries(documents)) {
    // Pembatasan dokumen bekerja pada topik yang sudah dikurasi; dokumen unggahan belum.
    if (doc.uploaded) continue;
    // Template formulir bukan bahan untuk ditanyai; daftar ini hanya untuk dokumen berisi aturan dan panduan.
    if (id.startsWith("template-")) continue;
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
  setSuggestedQuestion(null);
  refs.chatLog.replaceChildren();
  showView("chat");

  for (const turn of chat.turns) {
    appendUserMessage(turn.question, turn.documentId);
    const { card } = createBotCard();
    fillCard(card, turn.response, { question: turn.question });
  }
  scrollToEnd();
}

async function openConversation(id) {
  setSuggestedQuestion(null);
  try {
    const sentToken = state.sessionToken;
    const response = await fetch(`${API_URL}/conversations/${id}`, { headers: authHeaders() });
    if (dropExpiredSession(response, sentToken)) return;
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
    // Percakapan yang dibuka bisa dilanjutkan: tiga giliran terakhirnya jadi riwayat.
    state.history = [];
    let pendingQuestion = null;
    for (const message of conversation.messages) {
      if (message.role === "user") pendingQuestion = message.content;
      else if (pendingQuestion) {
        state.history.push({ q: pendingQuestion, a: String(message.content).slice(0, 500), entryId: message.entry_id ?? null });
        pendingQuestion = null;
      }
    }
    state.history = state.history.slice(-3);
    scrollToEnd();
  } catch (error) {
    console.warn("Tidak bisa membuka percakapan:", error);
    showToast("Gagal membuka percakapan.");
  }
}

async function refreshHistory() {
  if (!state.account) return;
  try {
    const sentToken = state.sessionToken;
    const response = await fetch(`${API_URL}/conversations`, { headers: authHeaders() });
    if (dropExpiredSession(response, sentToken)) return;
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
  const sentToken = state.sessionToken;
  const response = await fetch(`${API_URL}/conversations/${id}`, { method: "DELETE", headers: authHeaders() });
  if (dropExpiredSession(response, sentToken)) return;
  if (!response.ok) {
    showToast("Gagal menghapus percakapan.");
    return;
  }
  showToast("Percakapan dihapus.");
  resetChat();
  refreshHistory();
}

/** Arsipkan satu percakapan tersimpan: hilang dari riwayat, bisa dipulihkan dari Setting > Archived chats. */
async function archiveConversation(id, { leave = false } = {}) {
  if (!state.account || !id) {
    showToast("Percakapan ini belum tersimpan.");
    return;
  }
  try {
    await api(`/conversations/${id}/archive`, { method: "POST" });
  } catch {
    showToast("Gagal mengarsipkan percakapan.");
    return;
  }
  showToast("Percakapan diarsipkan.");
  if (leave || String(state.conversationId) === String(id)) resetChat();
  refreshHistory();
}

/* ============================================================
   BAGIKAN CHAT
============================================================ */

/** Alamat yang dibuka orang lain: aplikasi ini dengan tokennya, bukan halaman biasa. */
function shareUrl(token) {
  return `${window.location.origin}${window.location.pathname}#share=${token}`;
}

/** Isi sebuah jawaban yang tersimpan sebagai teks: paragraf dan daftar ("- ..."), tautan bisa diklik. */
function renderPlainAnswer(container, text) {
  let list = null;
  for (const line of String(text).split("\n")) {
    if (!line.trim()) {
      list = null;
      continue;
    }
    if (line.startsWith("- ")) {
      if (!list) {
        list = make("ul", "bot-list");
        container.append(list);
      }
      const item = document.createElement("li");
      appendRichText(item, line.slice(2));
      list.append(item);
    } else {
      list = null;
      const p = make("p");
      appendRichText(p, line);
      container.append(p);
    }
  }
}

/** Pesan-pesan sebuah chat dalam bentuk hanya-baca (dipakai pratinjau dan halaman yang dibagikan). */
function renderMessages(container, messages) {
  for (const message of messages) {
    if (message.role === "user") {
      container.append(make("p", "bubble", message.content));
    } else {
      const card = make("article", "bot-card");
      const head = make("header", "bot-head");
      head.append(make("strong", "", "SAPA AI Academic Hub"));
      const body = make("div", "bot-body");
      renderPlainAnswer(body, message.content);
      card.append(head, body);
      container.append(card);
    }
  }
}

async function openShareDialog() {
  const id = state.conversationId;
  if (!state.account || !id || state.view !== "chat") {
    showToast("Masuk dan buka sebuah percakapan dulu untuk membagikannya.");
    return;
  }

  let conversation;
  let share;
  try {
    ({ conversation } = await api(`/conversations/${id}`));
    ({ share } = await api(`/conversations/${id}/share`, { method: "POST" }));
  } catch (error) {
    showToast(error.status === 429 ? error.message : "Gagal membuat tautan bagikan.");
    return;
  }

  const dialog = make("div", "modal");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "share-title");
  const scrim = make("div", "modal-scrim");
  const box = make("div", "modal-box share-box");
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

  const head = make("div", "share-head");
  const title = make("h2", "", `Bagikan ${conversation.title}`);
  title.id = "share-title";
  const x = make("button", "share-close");
  x.type = "button";
  x.setAttribute("aria-label", "Tutup");
  x.innerHTML = ICON.close;
  x.addEventListener("click", close);
  head.append(title, x);

  const intro = make("p", "share-intro", "Namamu dan pesan yang kamu tambahkan setelah membagikan tidak akan muncul di chat yang dibagikan.");

  const preview = make("div", "share-preview");
  const previewLog = make("div", "share-preview-log");
  renderMessages(previewLog, conversation.messages);
  preview.append(previewLog);

  const access = make("p", "share-access", "Siapa pun yang punya tautan bisa melihat chat ini");
  const url = shareUrl(share.token);
  const field = make("input", "share-url");
  field.readOnly = true;
  field.value = url;
  field.setAttribute("aria-label", "Tautan chat");
  field.addEventListener("focus", () => field.select());

  const copy = make("button", "btn btn-primary share-copy");
  copy.type = "button";
  copy.innerHTML = ICON.link;
  copy.append(make("span", "", "Salin tautan"));
  copy.addEventListener("click", async () => {
    await copyText(url, "Tautan chat disalin.");
    copy.querySelector("span").textContent = "Tersalin";
    setTimeout(() => (copy.querySelector("span").textContent = "Salin tautan"), 1800);
  });
  const foot = make("div", "share-foot");
  foot.append(copy);

  box.append(head, intro, preview, access, field, foot);
  document.body.append(dialog);
  copy.focus();
}

/** Membuka chat yang dibagikan seseorang, hanya-baca. Tanpa masuk pun bisa. */
async function openSharedChat(token) {
  const log = $("shared-log");
  log.replaceChildren();
  $("shared-title").textContent = "";
  showView("shared");
  try {
    const response = await fetch(`${API_URL}/share/${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error(`share ${response.status}`);
    const { share } = await response.json();
    $("shared-title").textContent = share.title;
    renderMessages(log, share.messages);
  } catch {
    $("shared-title").textContent = "Tautan tidak ditemukan";
    log.append(make("p", "shared-missing", "Chat ini tidak ada lagi atau tautannya sudah dicabut oleh pemiliknya."));
  }
}

/** Alamat yang memuat #share=<token> membuka halaman bagikan alih-alih beranda. */
function openSharedFromUrl() {
  const match = /^#share=([\w-]{22})$/.exec(window.location.hash);
  if (!match) return false;
  openSharedChat(match[1]);
  return true;
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
  if (state.account) {
    actions.push(["Arsipkan percakapan ini", () => archiveConversation(state.conversationId)]);
    actions.push(["Hapus percakapan ini", deleteCurrentConversation]);
  }

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
  ["all", "Semua"],
  ["chats", "Chat"],
  ["documents", "Dokumen"],
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
  // Tanpa login tidak ada yang dicari: tidak ada riwayat, dan daftar dokumen juga tidak dipajang.
  const wantDocs = tab !== "chats" && Boolean(state.account);
  refs.searchTabs.hidden = !state.account;

  let chats = [];
  if (wantChats && state.account) {
    chats = state.conversations;
    if (term) {
      try {
        const sentToken = state.sessionToken;
        const response = await fetch(`${API_URL}/conversations?q=${encodeURIComponent(term)}`, {
          headers: authHeaders(),
        });
        if (dropExpiredSession(response, sentToken)) return;
        if (response.ok) chats = (await response.json()).conversations ?? [];
      } catch (error) {
        console.warn("Pencarian gagal:", error);
      }
    }
  }

  const needle = term.toLowerCase();
  const seen = isStaff() ? null : readSeen(); // pengguna biasa hanya mencari di berkas yang sudah pernah ia cari
  const docs = wantDocs
    ? Object.entries(documents).filter(
        ([id, doc]) => (!seen || seen.has(id)) && (!needle || `${doc.title} ${doc.owner} ${doc.reference}`.toLowerCase().includes(needle)),
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
        onOpen: () => openDocument(doc, { page: 1 }),
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

/* Berkas yang pernah dicari atau dibuka pengguna lewat chat; hanya ini yang tampil di halaman Berkas mahasiswa dan dosen.
   Akun yang masuk menyimpannya di server (ikut berpindah perangkat); pengunjung tanpa akun menyimpannya di browser ini. */
const SEEN_KEY = "sapa-upi:seen-documents";
let serverSeen = null; // Set id dari server untuk akun yang masuk; null sebelum dimuat atau tanpa akun

function readLocalSeen() {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
    return new Set(Array.isArray(raw) ? raw.filter((id) => typeof id === "string" && documents[id]) : []);
  } catch {
    return new Set();
  }
}

function writeLocalSeen(set) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...set]));
  } catch {
    /* daftar hanya berlaku selama halaman terbuka */
  }
}

function readSeen() {
  const ids = readLocalSeen();
  if (state.account && serverSeen) for (const id of serverSeen) if (documents[id]) ids.add(id);
  return ids;
}

function sendSeen(ids) {
  if (!API_URL || !state.account || !ids.length) return;
  const sentToken = state.sessionToken;
  fetch(`${API_URL}/conversations/seen-documents`, {
    method: "POST",
    headers: { ...authHeaders(), "content-type": "application/json" },
    body: JSON.stringify({ ids }),
    signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
  })
    .then((response) => dropExpiredSession(response, sentToken))
    .catch((error) => console.warn("Daftar berkas tidak tersimpan di server:", error));
}

function markSeen(...found) {
  const ids = found.map((item) => (typeof item === "string" ? item : Object.keys(documents).find((id) => documents[id] === item))).filter(Boolean);
  if (!ids.length) return;
  const local = readLocalSeen();
  const fresh = ids.filter((id) => !local.has(id) && !serverSeen?.has(id));
  for (const id of ids) local.add(id);
  writeLocalSeen(local);
  if (state.account && fresh.length) {
    serverSeen ??= new Set();
    for (const id of fresh) serverSeen.add(id);
    sendSeen(fresh);
  }
}

/** Setelah masuk: ambil daftar dari server, dan kirim yang tadinya hanya ada di browser ini (sebelum masuk). */
async function syncSeen() {
  if (!API_URL || !state.account) {
    serverSeen = null;
    return;
  }
  try {
    const sentToken = state.sessionToken;
    const response = await fetch(`${API_URL}/conversations/seen-documents`, { headers: authHeaders(), signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS) });
    if (dropExpiredSession(response, sentToken)) return;
    if (!response.ok) throw new Error(`seen ${response.status}`);
    const data = await response.json();
    serverSeen = new Set((data.ids ?? []).filter((id) => typeof id === "string"));
    const local = [...readLocalSeen()].filter((id) => !serverSeen.has(id));
    for (let i = 0; i < local.length; i += 50) sendSeen(local.slice(i, i + 50));
    for (const id of local) serverSeen.add(id);
    if (state.view === "files") renderFiles();
  } catch (error) {
    console.warn("Daftar berkas belum bisa dimuat:", error);
  }
}

/** Pengelola melihat semua berkas; pengguna biasa hanya yang sudah mereka cari. */
const isStaff = () => Boolean(state.account?.role);

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

const STAFF_TABS = [
  ["suggested", "Disarankan"],
  ["favorites", "Favorit"],
  ["all", "Semua"],
];
const USER_TABS = [
  ["all", "Sudah dicari"],
  ["favorites", "Favorit"],
];

function renderFilesTabs() {
  refs.filesTabs.replaceChildren();
  const tabs = isStaff() ? STAFF_TABS : USER_TABS;
  if (!tabs.some(([id]) => id === state.filesTab)) state.filesTab = tabs[0][0];
  for (const [id, label] of tabs) {
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
    ["Buka dokumen", () => openDocument(doc, { page: 1 })],
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
  if (!isStaff()) {
    const seen = readSeen();
    list = list.filter(([id]) => seen.has(id));
  }
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
      : !isStaff() && !term
        ? "Belum ada berkas. Berkas yang kamu cari lewat chat akan muncul di sini."
        : "Tidak ada dokumen yang cocok.";

  for (const [id, doc] of list) {
    const card = make("div", "file-card");
    const open = make("button", "file-open");
    open.type = "button";
    open.style.cssText = "all:unset;display:grid;gap:10px;cursor:pointer";
    open.setAttribute("aria-label", `Buka ${doc.title}`);

    const thumb = make("div", "file-thumb");
    const image = document.createElement("img");
    image.src = `./assets/thumbs/${id}.jpg?v=3`; // v naik tiap thumbnail dibuat ulang, supaya cache browser tidak menahan yang lama
    image.alt = "";
    image.loading = "lazy";
    image.addEventListener("error", () => image.remove());
    const tag = make("span", "file-tag", doc.kind);
    tag.dataset.kind = doc.kind;
    card.dataset.kind = doc.kind;
    thumb.append(image, tag);

    const info = make("div", "file-info");
    info.append(
      make("span", "file-name", doc.title),
      make("span", "file-sub", doc.reference),
      make("span", "file-meta", `${doc.kind} • ${doc.sizeLabel} • ${doc.pages} halaman • ${doc.dateLabel}`),
    );
    open.append(thumb, info);
    open.addEventListener("click", () => openDocument(doc, { page: 1 }));

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

/**
 * Jalur bantuan umum di luar kontak spesifik topik, ditampilkan di setiap
 * jawaban (lihat ultNote()).
 */
const ULT = {
  name: "ULT (Unit Layanan Terpadu)",
  phone: "+62 811-2096-229",
};

/**
 * Baris bantuan umum ULT; nomor telepon ikut ditampilkan dan jadi tautan ke
 * WhatsApp hanya kalau sudah diisi di atas. Nomor WA dibentuk dari ULT.phone
 * sendiri (bukan diketik ulang) supaya keduanya tidak pernah berbeda.
 */
function ultNote() {
  const p = make("p", "ref-note escalation-note escalation-note-ult");
  const waNumber = ULT.phone.replace(/\D/g, "");
  if (waNumber) {
    p.append(`Butuh bantuan umum? Hubungi ${ULT.name} di `);
    const link = make("a", "ult-phone-link", ULT.phone);
    link.href = `https://wa.me/${waNumber}`;
    link.target = "_blank";
    link.rel = "noopener";
    p.append(link, ".");
  } else {
    p.append(`Butuh bantuan umum? Hubungi ${ULT.name}.`);
  }
  return p;
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
      : "Dengan kata sandi, kamu bisa masuk memakai email UPI tanpa Google. Minimal 10 karakter. Kamu harus baru saja masuk dengan Google (dalam 10 menit terakhir); kalau belum, keluar lalu masuk lagi.",
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
      settings.render();
      showToast("Password saved.");
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

function openSettings(section = "general") {
  settings.open(section);
}

async function exportHistory() {
  try {
    const sentToken = state.sessionToken;
    const response = await fetch(`${API_URL}/conversations/export`, { headers: authHeaders() });
    if (dropExpiredSession(response, sentToken)) return;
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
    const sentToken = state.sessionToken;
    const response = await fetch(`${API_URL}/conversations`, { method: "DELETE", headers: authHeaders() });
    if (dropExpiredSession(response, sentToken)) return;
    if (!response.ok) throw new Error(`delete ${response.status}`);
    state.conversations = [];
    state.conversationId = null;
    state.history = [];
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

  const sentToken = state.sessionToken;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Pesan "sesi berakhir karena tidak aktif" dari server lebih jelas daripada "Perlu masuk".
    dropExpiredSession(response, sentToken, /berakhir/i.test(data.error ?? "") ? data.error : undefined);
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
  openViewer: (doc, options) => openDocument(doc, options),
  authHeaders: () => authHeaders(),
});
owner.setApiBase(API_URL);

/** Halaman Setting (9 tab sesuai desain). Pintasan keyboard di seluruh aplikasi juga dijalankan dari sini. */
const settings = createSettings({
  api,
  apiEnabled: Boolean(API_URL),
  getAccount: () => state.account,
  showToast,
  getLang,
  setLang,
  goHome: () => showView("home"),
  show: () => showView("settings"),
  openPasswordDialog,
  logoutEverywhere,
  exportHistory,
  deleteAllHistory,
  refreshHistory,
  helpContact: HELP_CONTACT,
  onPrefsChange: (prefs) => {
    // Dikte mati: tombol mikrofon disembunyikan dari kolom ketik.
    refs.voiceButton.hidden = !prefs.dictation;
  },
  actions: {
    focus: () => refs.question.focus(),
    send: () => {},
    sendBackground: () => refs.composer.requestSubmit(),
    annotation: () => refs.composer.requestSubmit(),
    attach: () => (isStaff() ? refs.attachButton.click() : null),
    selectText: () => {
      const answers = refs.chatLog.querySelectorAll(".bot-body");
      const last = answers[answers.length - 1];
      if (!last) return;
      const range = document.createRange();
      range.selectNodeContents(last);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    },
    deleteChat: async () => {
      if (!state.conversationId) return resetChat();
      if (!window.confirm("Delete this chat? This cannot be undone.")) return;
      try {
        await api(`/conversations/${state.conversationId}`, { method: "DELETE" });
        refreshHistory();
      } catch {
        showToast("Could not delete this chat.");
      }
      resetChat();
    },
    newChat: () => resetChat(),
    showShortcuts: () => settings.showShortcuts(),
    switchChat: () => document.getElementById("nav-search").click(),
    toggleSidebar: () => (refs.app.classList.contains("sidebar-collapsed") ? openSidebar() : closeSidebar()),
  },
});
refs.voiceButton.hidden = !settings.prefs.dictation;

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

/**
 * Tanpa akun, aplikasi hanya menampilkan layar masuk Google. Pengecualian: tautan bagikan
 * (#share=...) yang hanya-baca, dan keadaan ketika masuk memang tidak tersedia (server
 * tidak terjangkau atau login dimatikan), supaya tidak ada yang terkunci di luar.
 */
const LOGIN_REQUIRED = true;
const isShareUrl = () => /^#share=/.test(window.location.hash);

function enforceLoginGate() {
  if (!LOGIN_REQUIRED) return;
  const open = !state.account && !isShareUrl() && state.loginEnabled;
  if (open) {
    if (refs.signinPage.hidden) showAuthScreen("login");
  } else if (!refs.signinPage.hidden && state.account) {
    hideAuthScreen();
  } else if (!refs.signinPage.hidden && !state.loginEnabled) {
    hideAuthScreen();
  } else if (!refs.signinPage.hidden && isShareUrl()) {
    hideAuthScreen();
  }
}

const AUTH_COPY = {
  login: {
    title: "Selamat Datang Kembali!",
    sub: "Masuk dengan akun UPI kamu untuk mulai bertanya.",
    hint: "",
    google: "Continue with Google",
    note: "Hanya akun dengan domain upi.edu yang dapat masuk.",
    alert: false,
  },
  domain: {
    title: "Akun Tidak Diizinkan",
    sub: "SAPA UPI hanya bisa dimasuki dengan akun Google UPI (@upi.edu atau subdomainnya).",
    hint: "Akun yang kamu pilih bukan akun UPI, jadi tidak dibuatkan sesi masuk.",
    google: "Coba dengan akun upi.edu",
    note: "Hanya akun dengan domain upi.edu yang dapat masuk.",
    alert: true,
  },
  failed: {
    title: "Gagal Masuk",
    sub: "Proses masuk dengan Google tidak selesai.",
    hint: "Coba lagi sebentar lagi.",
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
  // Masuk hanya lewat Google: formulir email dan kata sandi disembunyikan dulu, dan layar ini tidak bisa dilewati.
  $("auth-form").hidden = LOGIN_REQUIRED || !isLogin;
  $("auth-divider").hidden = LOGIN_REQUIRED || !isLogin;
  $("auth-skip").hidden = LOGIN_REQUIRED;
  $("auth-error").hidden = true;
  $("auth-password").value = "";
  refs.signinPage.dataset.mode = mode;
  if (refs.signinPage.hidden) authOpener = document.activeElement;
  refs.signinPage.hidden = false;
  document.body.classList.add("auth-open");
  (isLogin && !LOGIN_REQUIRED ? $("auth-email") : $("auth-google")).focus();
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

  const staff = isStaff();
  for (const item of document.querySelectorAll("[data-owner]")) item.hidden = !staff;
  refs.loginButton.hidden = signedIn || !state.loginEnabled;
  refs.loginNote.hidden = signedIn || !state.loginEnabled;
  refs.profile.hidden = !signedIn;
  refs.attachButton.closest(".menu-anchor").hidden = !staff; // pilih dokumen khusus hanya untuk admin
  if (!staff) {
    refs.attachMenu.hidden = true;
    if (state.scopeDocumentId) setScope(null);
  }

  if (signedIn) {
    refs.profileName.textContent = state.account.name || state.account.email;
    refs.profileSub.textContent = state.account.role
      ? `${state.account.email} • ${state.account.role}`
      : state.account.email;
  }
  renderGreeting();
  renderRecent();
  if (state.view === "files") renderFiles();
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
    state.loginEnabled = false; // server tidak terjangkau: jangan mengunci pengunjung di layar masuk
  }
  renderAccount();
  enforceLoginGate();
  if (state.account) {
    refreshHistory();
    syncSeen();
  }
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

/**
 * Server menjawab 401 untuk token yang masih disimpan browser: sesinya sudah tidak
 * ada (kedaluwarsa, pengelola terlalu lama tidak aktif, atau dicabut dari perangkat
 * lain). Sisa token dan akunnya dibuang dan pengguna kembali ke halaman utama sebagai
 * pengunjung, bukan dibiarkan melihat halaman kosong "Perlu masuk" dengan nama akun
 * yang seolah masih masuk. `sentToken` memastikan jawaban lama tidak menendang keluar
 * sesi yang baru saja dibuat. Mengembalikan true kalau sesinya dibuang.
 */
function dropExpiredSession(response, sentToken, message) {
  if (response.status !== 401 || !sentToken || state.sessionToken !== sentToken) return false;
  // Layar yang tidak butuh akun (beranda, percakapan, Files) dibiarkan: pertanyaan tetap
  // dijawab sebagai pengunjung, dan jawaban yang baru diterima tidak boleh lenyap hanya
  // karena riwayatnya gagal direkam. Halaman yang butuh akun kembali ke beranda.
  const keepScreen = ["home", "chat", "files"].includes(state.view);
  signOutLocally(message || "Sesi berakhir. Masuk lagi untuk melanjutkan.", { keepScreen });
  return true;
}

function signOutLocally(message, { keepScreen = false } = {}) {
  state.sessionToken = null;
  storeToken(null);
  writeAccountHint(null);
  state.account = null;
  state.conversations = [];
  state.conversationId = null;
  state.history = [];
  // Komputer bisa dipakai bergantian: daftar berkas orang sebelumnya tidak ikut tinggal di browser ini.
  serverSeen = null;
  try {
    localStorage.removeItem(SEEN_KEY);
  } catch {
    /* abaikan */
  }
  if (!keepScreen) refs.chatLog.replaceChildren();
  renderAccount();
  if (!keepScreen) showView("home");
  enforceLoginGate();
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

/* ---- Dikte lewat server: rekam di browser, ubah jadi teks lewat Worker (Whisper) ---- */

/** Dikte Google tidak tersedia di browser Electron (termasuk panel aplikasi desktop) dan beberapa browser lain. */
let serverVoice = !SpeechRecognition || /Electron|Claude\//.test(navigator.userAgent);
let recorder = null;
let recordTimer = null;

const RECORD_ERRORS = {
  NotAllowedError: "Akses mikrofon ditolak. Izinkan mikrofon untuk situs ini di pengaturan browser.",
  NotFoundError: "Mikrofon tidak terdeteksi. Periksa apakah mikrofon terpasang dan tidak dipakai aplikasi lain.",
};

async function toggleServerVoice() {
  if (recorder) {
    await finishServerVoice();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    showToast("Browser ini belum mendukung dikte suara. Pakai Chrome atau Edge (versi desktop).");
    return;
  }
  try {
    recorder = await startRecording();
  } catch (error) {
    recorder = null;
    showToast(RECORD_ERRORS[error?.name] ?? "Mikrofon belum bisa dipakai. Coba lagi sebentar.");
    return;
  }
  refs.voiceButton.setAttribute("aria-pressed", "true");
  showToast("Merekam... tekan mikrofon lagi kalau sudah selesai.");
  recordTimer = setTimeout(finishServerVoice, MAX_RECORD_MS);
}

async function finishServerVoice() {
  const active = recorder;
  if (!active) return;
  recorder = null;
  clearTimeout(recordTimer);
  refs.voiceButton.setAttribute("aria-pressed", "false");
  const base = refs.question.value.trim();
  try {
    const { wav, peak } = await active.stop();
    if (peak < 0.01) {
      showToast("Suara tidak terdengar. Tekan mikrofon lagi dan bicara lebih dekat.");
      return;
    }
    showToast("Mengubah suara jadi teks...");
    // Bahasa suara dari Setting > Voice > Language; "Auto detect" mengikuti bahasa tampilan.
    const spoken = settings.prefs.voice.language === "auto" ? getLang() : settings.prefs.voice.language;
    const response = await fetch(`${API_URL}/transcribe?lang=${spoken}`, {
      method: "POST",
      headers: { "content-type": "audio/wav" },
      body: wav,
      signal: AbortSignal.timeout(20_000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      showToast(data.error || "Dikte suara gagal. Coba lagi.");
      return;
    }
    if (!data.text) {
      showToast("Suara tidak terdengar. Tekan mikrofon lagi dan bicara lebih dekat.");
      return;
    }
    refs.question.value = [base, data.text].filter(Boolean).join(" ").slice(0, refs.question.maxLength);
    resizeComposer();
    refs.question.focus();
  } catch {
    showToast("Dikte suara gagal. Periksa koneksimu, lalu coba lagi.");
  }
}

function toggleVoice() {
  if (recorder || (serverVoice && API_URL)) {
    toggleServerVoice();
    return;
  }
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
  session.lang = getLang() === "en" ? "en-US" : "id-ID";
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
    // Browser berbasis Electron (termasuk panel browser aplikasi desktop) tidak punya akses ke layanan
    // suara Google, jadi kesalahannya selalu "network" walau internet lancar.
    // Layanan suara Google tidak terjangkau: pindah ke dikte lewat server dan langsung mulai merekam.
    if ((event.error === "network" || event.error === "service-not-allowed") && API_URL) {
      serverVoice = true;
      if (recognition === session) stopVoice();
      toggleServerVoice();
      return;
    }
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

/* ---- Mode terang / gelap ---- */

const THEME_KEY = "sapa-theme";

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const color = document.querySelector('meta[name="theme-color"]');
  if (color) color.setAttribute("content", theme === "dark" ? "#0f1013" : "#b91c2c");
  $("theme-button").setAttribute("aria-pressed", String(theme === "dark"));
}

function initThemeSwitch() {
  const current = () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  applyTheme(current());
  $("theme-button").addEventListener("click", () => {
    const next = current() === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* penyimpanan diblokir: pilihan berlaku sampai halaman ditutup */
    }
  });
}

function initLanguageSwitch() {
  // Bahasa dipilih di Setting > General; di sini hanya membaca pilihan tersimpan.
  initLang();
}

function initialize() {
  initThemeSwitch();
  initLanguageSwitch();
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

  refs.menuButton.addEventListener("click", openSidebar);
  refs.sidebarClose.addEventListener("click", closeSidebar);
  refs.scrim.addEventListener("click", dismissDrawer);

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

  refs.shareButton.addEventListener("click", openShareDialog);
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
    else if (action === "settings") openSettings("general");
    else if (action === "help") settings.help();
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
    authError("Masuk dengan Google di bawah, lalu atur ulang kata sandi di Pengaturan > Keamanan dan login (dalam 10 menit setelah masuk).");
  });
  $("auth-skip").addEventListener("click", hideAuthScreen);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !refs.signinPage.hidden && !LOGIN_REQUIRED) hideAuthScreen();
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
    dismissDrawer(); // Esc menutup laci ponsel; sidebar layar lebar hanya ditutup dari tombolnya
    stopVoice();
  });

  captureTokenFromUrl();
  captureLoginErrorFromUrl();
  state.sessionToken = state.sessionToken ?? readStoredToken();
  if (state.sessionToken) state.account = readAccountHint();

  setRecentOpen(false);
  renderAccount();
  showView("home");
  // Tanpa tanda akun tersimpan, layar masuk langsung tampil (tanpa kilasan beranda).
  if (LOGIN_REQUIRED && !state.account && state.loginEnabled && !isShareUrl() && refs.signinPage.hidden) showAuthScreen("login");
  // Tautan bagikan (#share=...) membuka chat itu, hanya-baca, alih-alih beranda.
  openSharedFromUrl();
  window.addEventListener("hashchange", () => {
    if (!openSharedFromUrl() && state.view === "shared") showView("home");
    enforceLoginGate();
  });
  $("shared-start").addEventListener("click", () => {
    history.replaceState(null, "", window.location.pathname + window.location.search);
    resetChat();
  });
  loadAccount();
  loadPublicDocuments();
}

initialize();
