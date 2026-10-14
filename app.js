import { knowledgeBase } from "./data/knowledge-base.js";
import { createChatResponse } from "./lib/chat-engine.js";
import { searchKnowledgeBase } from "./lib/search.js";
import { API_URL } from "./config.js";

const SPARKLE_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6Z"/></svg>';
const CHECK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 12 5 5L20 6"/></svg>';
const CLOCK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

const QUICK_CARDS = [
  {
    badgeClass: "badge-reguler",
    badgeText: "REGULER",
    icon: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    title: "Jalur Tugas Akhir",
    description: "Skripsi, artikel ilmiah, atau karya teknologi tepat guna.",
    footIcon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    footText: "3 Jalur",
    question: "Apa saja jalur penyelesaian tugas akhir?",
  },
  {
    badgeClass: "badge-revisi",
    badgeText: "MASA REVISI",
    icon: '<path d="M7 3.5h7.5L19 8v12.5H7z"/><path d="M14 3.5V8h5M10 12h6M10 15.5h6"/>',
    title: "Seminar Proposal",
    description: "Dokumen, alur pendaftaran, & ketentuan pelaksanaan.",
    footIcon: '<path d="M9 12.5 11 14.5l4-5"/><circle cx="12" cy="12" r="9"/>',
    footText: "Map Kuning",
    question: "Bagaimana cara mendaftar seminar proposal?",
  },
  {
    badgeClass: "badge-akhir",
    badgeText: "TINGKAT AKHIR",
    icon: '<path d="m2.5 9 9.5-4.5L21.5 9 12 13.5 2.5 9Z"/><path d="M6.5 11.2V16c3 2.2 8 2.2 11 0v-4.8M21.5 9v6"/>',
    title: "Sidang & Skripsi",
    description: "Syarat pendaftaran ujian sidang & berkas yang diperlukan.",
    footIcon: '<path d="M7 3.5h8.5A1.5 1.5 0 0 1 17 5v16l-5-3-5 3V5A1.5 1.5 0 0 1 7 3.5Z"/>',
    footText: "TESOL 400",
    question: "Apa saja persyaratan pendaftaran sidang?",
  },
  {
    badgeClass: "badge-layanan",
    badgeText: "LAYANAN",
    icon: '<rect x="4.5" y="3.5" width="15" height="17" rx="2.5"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
    title: "Penulisan Ilmiah",
    description: "Format penulisan, uji similaritas, & penggunaan AI.",
    footIcon: '<path d="M8.5 12.5 15 5a3 3 0 0 1 4 4l-8.5 8.5a5 5 0 0 1-7-7L12 2"/>',
    footText: "Pedoman 2024",
    question: "Bagaimana format penulisan skripsi?",
  },
];

const el = (id) => document.getElementById(id);

const elements =
  typeof document === "undefined"
    ? {}
    : {
        sidebar: el("sidebar"),
        sidebarOpen: el("sidebar-open"),
        sidebarClose: el("sidebar-close"),
        sidebarBackdrop: el("sidebar-backdrop"),
        resetChat: el("reset-chat"),
        homeScroll: el("home-scroll"),
        chatLog: el("chat-log"),
        quickCards: el("quick-cards"),
        chatForm: el("chat-form"),
        chatInput: el("chat-input"),
        deepSearchToggle: el("deep-search-toggle"),
        deepSearchToggleBottom: el("deep-search-toggle-bottom"),
        chatFormBottom: el("chat-form-bottom"),
        chatInputBottom: el("chat-input-bottom"),
        sidebarSearch: el("sidebar-search"),
        searchResults: el("search-results"),
        navChat: el("nav-chat"),
        modelChip: el("model-chip"),
        shareButton: el("share-button"),
        overflowButton: el("overflow-button"),
        voiceButton: el("voice-button"),
        savedButton: el("saved-button"),
        savedButtonBottom: el("saved-button-bottom"),
        popoverModel: el("popover-model"),
        popoverOverflow: el("popover-overflow"),
        popoverSaved: el("popover-saved"),
        toast: el("toast"),
        sidebarHistory: el("sidebar-history"),
        historyList: el("history-list"),
        accountNote: el("account-note"),
        loginButton: el("login-button"),
        accountSignedIn: el("account-signed-in"),
        accountName: el("account-name"),
        accountEmail: el("account-email"),
        logoutButton: el("logout-button"),
      };

let latestRequestId = 0;
let chatStarted = false;

/** Whether the last answer came from the model; null before the first question. */
let lastAnswerWasGenerated = null;

/** The question the last answer belongs to, so it can be saved from the answer. */
let lastQuestion = "";

/** Signed-in reader, or null. Only used to store and show their own history. */
let account = null;

/** The conversation this session is appending to, assigned by the server. */
let conversationId = null;

function createElement(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function formatTime() {
  return new Date()
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    .replace(".", ":");
}

function scrollChat() {
  requestAnimationFrame(() => {
    elements.chatLog.scrollTop = elements.chatLog.scrollHeight;
  });
}

/* ============================================================
   SIDEBAR (mobile off-canvas)
============================================================ */

function openSidebar() {
  elements.sidebar.classList.add("is-open");
  elements.sidebarBackdrop.hidden = false;
  requestAnimationFrame(() => elements.sidebarBackdrop.classList.add("is-visible"));
}

function closeSidebar() {
  elements.sidebar.classList.remove("is-open");
  elements.sidebarBackdrop.classList.remove("is-visible");
  elements.sidebarBackdrop.hidden = true;
}

/* ============================================================
   HOME: quick cards
============================================================ */

function renderQuickCards() {
  elements.quickCards.replaceChildren();
  for (const card of QUICK_CARDS) {
    const button = createElement("button", "quick-card");
    button.type = "button";
    button.innerHTML = `
      <div class="quick-card-top">
        <span class="quick-card-icon"><svg viewBox="0 0 24 24">${card.icon}</svg></span>
        <span class="quick-card-badge ${card.badgeClass}">${card.badgeText}</span>
      </div>
      <strong>${card.title}</strong>
      <p>${card.description}</p>
      <span class="quick-card-foot"><svg viewBox="0 0 24 24">${card.footIcon}</svg>${card.footText}</span>
    `;
    button.addEventListener("click", () => submitQuestion(card.question));
    elements.quickCards.append(button);
  }
}

/* ============================================================
   CHAT
============================================================ */

function enterChatState() {
  if (chatStarted) return;
  chatStarted = true;
  elements.homeScroll.hidden = true;
  elements.chatLog.hidden = false;
  elements.chatFormBottom.hidden = false;
}

function appendUserMessage(text) {
  const article = createElement("article", "message user-message");
  article.innerHTML = `
    <div class="user-bubble"></div>
    <div class="user-meta-row"><span>${formatTime()}</span>${CHECK_ICON}</div>
  `;
  article.querySelector(".user-bubble").textContent = text;
  elements.chatLog.append(article);
  scrollChat();
}

function createBotArticle() {
  const article = createElement("article", "message bot-message");
  article.innerHTML = `
    <div class="message-avatar"><img src="./assets/mascot-sapa.png" alt=""/></div>
    <div class="message-body"></div>
  `;
  return { article, body: article.querySelector(".message-body") };
}

function showProcessing() {
  const { article, body } = createBotArticle();
  article.dataset.processing = "true";
  body.innerHTML = `
    <div class="bot-label-row"><strong>SAPA AI Academic Hub</strong><span class="pill pill-soft">RETRIEVAL AUGMENTED GENERATION</span></div>
    <div class="processing-card">
      <p class="processing-title">Mencari rujukan yang sesuai di pedoman akademik...</p>
      <div class="processing-steps">
        <span class="step-done">${CHECK_ICON}Mencocokkan pertanyaan</span>
        <span class="step-done">${CHECK_ICON}Memilih rujukan pedoman</span>
        <span>${CLOCK_ICON}Menyusun jawaban</span>
      </div>
      <div class="skeleton-lines"><span style="width:100%"></span><span style="width:88%"></span><span style="width:64%"></span></div>
      <div class="processing-footer"><i class="dot dot-live"></i><span>Menyusun jawaban dari rujukan yang ditemukan...</span><span class="grow"></span><span>Gemini via Worker</span></div>
    </div>
  `;
  elements.chatLog.append(article);
  scrollChat();
}

function removeProcessing() {
  elements.chatLog.querySelector("[data-processing='true']")?.remove();
}

function renderAnswerBody(response, body) {
  const badge = response.generated
    ? `<span class="pill pill-soft">${CHECK_ICON}Dijawab AI &bull; dirujuk ke Pedoman</span>`
    : `<span class="pill pill-muted">Mode offline &bull; pencocokan kata kunci</span>`;
  body.innerHTML = `<div class="bot-label-row"><strong>SAPA AI Academic Hub</strong>${badge}</div>`;

  const card = createElement("div", "answer-card");
  const entry = response.entry;
  const prose = response.generated ? response.message : entry?.lead ?? response.message;
  card.innerHTML = `<p></p>`;
  card.querySelector("p").textContent = prose;

  // Offline, the lead is only an introduction — the points carry the actual
  // guidance. A generated answer already states them in its own prose.
  if (!response.generated && entry?.points?.length) {
    const list = createElement("ul", "answer-points");
    for (const point of entry.points) {
      const item = document.createElement("li");
      item.textContent = point;
      list.append(item);
    }
    card.append(list);
  }

  if (entry?.table) {
    // Rendered from the knowledge base exactly as written, with as many columns
    // as the table actually has. Nothing here reflects the reader's own record:
    // there is no SIAKAD integration, so no cell may claim to know their status.
    const wrap = createElement("div", "answer-table-wrap");
    const head = createElement("div", "answer-table-head");
    head.innerHTML = `<strong><span class="num">1</span></strong>`;
    head.querySelector("strong").append(entry.table.title);

    const table = createElement("table", "data-table");
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    for (const column of entry.table.columns) {
      const th = document.createElement("th");
      th.textContent = column;
      headRow.append(th);
    }
    thead.append(headRow);

    const tbody = document.createElement("tbody");
    for (const row of entry.table.rows) {
      const tr = document.createElement("tr");
      for (const cell of row) {
        const td = document.createElement("td");
        td.textContent = cell;
        tr.append(td);
      }
      tbody.append(tr);
    }

    table.append(thead, tbody);
    wrap.append(head, table);
    card.append(wrap);
  }

  if (!response.generated && entry?.closing) {
    card.insertAdjacentHTML("beforeend", `<p>${entry.closing}</p>`);
  }
  body.append(card);

  if (entry) renderSourceRow(entry, body);
  if (response.followUpQuestions) renderFollowUps(response.followUpQuestions, body);
}

function renderSourceRow(entry, body) {
  const row = createElement(
    "div",
    "source-row",
    `<button type="button" class="source-pill"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h7.5L19 8v12.5H7z"/><path d="M14 3.5V8h5"/></svg><span>Source: ${entry.sourceTitle}</span></button><span class="message-time">${formatTime()}</span>`,
  );
  body.append(row);

  const detail = createElement("div", "source-detail");
  detail.hidden = true;
  const fields = [
    ["Dokumen", entry.sourceRef],
    ["Pemilik informasi", entry.sourceOwner],
    ["Periode berlaku", entry.validPeriod],
    ["Terakhir diperbarui", entry.updatedAt],
    ["Kategori", entry.category],
  ];
  detail.innerHTML = `
    <dl class="source-meta">${fields.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
    <p class="escalation-text">Jika masih perlu dipastikan: ${entry.escalation}</p>
  `;
  const pill = row.querySelector(".source-pill");
  pill.addEventListener("click", () => {
    detail.hidden = !detail.hidden;
  });
  body.append(detail);
}

function renderFollowUps(questions, body) {
  const row = createElement("div", "chip-row");
  for (const question of questions) {
    const button = createElement("button", "chip-button", `${SPARKLE_ICON}<span>${question}</span>`);
    button.type = "button";
    button.addEventListener("click", () => submitQuestion(question));
    row.append(button);
  }
  body.append(row);
}

function renderSuggestionsBody(response, body) {
  body.innerHTML = `<div class="bot-label-row"><strong>SAPA AI Academic Hub</strong></div>`;
  const card = createElement("div", "answer-card", `<p>${response.message}</p>`);
  body.append(card);
  const list = createElement("div", "suggestion-list");
  for (const suggestion of response.suggestions) {
    const button = createElement(
      "button",
      "suggestion-button",
      `<span><strong>${suggestion.title}</strong><small>${suggestion.category}</small></span><span>→</span>`,
    );
    button.type = "button";
    button.addEventListener("click", () => submitQuestion(suggestion.sampleQuestion));
    list.append(button);
  }
  body.append(list);
}

function renderFallbackBody(response, body) {
  body.innerHTML = `<div class="bot-label-row"><strong>SAPA AI Academic Hub</strong></div>`;
  const card = createElement("div", "answer-card", `<p>${response.message}</p>`);
  const fallback = createElement(
    "div",
    "fallback-card",
    `<strong>Butuh bantuan? Hubungi pihak berwenang</strong><ul>${response.escalationOptions
      .map((o) => `<li>${o}</li>`)
      .join("")}</ul>`,
  );
  card.append(fallback);
  body.append(card);
}

/** Lets the reader keep the question that produced this answer. */
function renderSaveQuestion(question, body) {
  const button = createElement("button", "save-question");
  button.type = "button";
  button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.8 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8L12 3.8Z"/></svg><span>Simpan pertanyaan</span>`;
  button.addEventListener("click", () => saveQuestion(question));
  body.append(button);
}

function appendBotResponse(response) {
  const { article, body } = createBotArticle();
  if (response.type === "answer") renderAnswerBody(response, body);
  else if (response.type === "suggestions") renderSuggestionsBody(response, body);
  else if (response.type === "fallback") renderFallbackBody(response, body);
  else body.innerHTML = `<div class="answer-card"><p>${response.message}</p></div>`;
  if (lastQuestion) renderSaveQuestion(lastQuestion, body);
  elements.chatLog.append(article);
  scrollChat();
}

/** Ask the Worker, which grounds Gemini on the knowledge base. */
/**
 * How long to wait for a grounded answer before answering locally instead.
 * A slow or throttled model must not leave the question hanging: the offline
 * matcher has an answer ready, and says so in its badge.
 */
const BACKEND_TIMEOUT_MS = 15_000;

async function askBackend(question) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify({ question, conversationId }),
    signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`API ${response.status}`);

  const data = await response.json();
  // The server decides which conversation this belongs to; it is the only
  // thing about the reader that comes back, and it never changes the answer.
  if (data.conversationId) conversationId = data.conversationId;
  return {
    type: "answer",
    generated: true,
    message: data.answer,
    entry: data.entry,
    followUpQuestions: data.followUps ?? [],
  };
}

async function submitQuestion(rawQuestion) {
  const question = String(rawQuestion ?? "").trim();
  if (!question) return;

  const requestId = ++latestRequestId;
  enterChatState();
  removeProcessing();
  appendUserMessage(question);
  elements.chatInput.value = "";
  elements.chatInputBottom.value = "";
  showProcessing();

  let response;
  if (API_URL) {
    try {
      response = await askBackend(question);
    } catch (error) {
      // Quota habis, Worker mati, atau offline — jatuh ke mesin lokal.
      console.warn("Backend tidak tersedia, pakai pencocokan lokal:", error);
    }
  }
  if (!response) {
    response = createChatResponse(question, knowledgeBase);
  }

  // A newer question was asked while this one was in flight.
  if (requestId !== latestRequestId) return;

  removeProcessing();
  lastAnswerWasGenerated = Boolean(response.generated);
  lastQuestion = question;
  appendBotResponse(response);

  if (account) refreshHistory();
}

function resetConversation() {
  latestRequestId += 1; // drop any in-flight answer
  elements.chatLog.replaceChildren();
  chatStarted = false;
  elements.homeScroll.hidden = false;
  elements.chatLog.hidden = true;
  elements.chatFormBottom.hidden = true;
  elements.chatInput.value = "";
  elements.chatInputBottom.value = "";
  conversationId = null;
  closeAllPopovers();
  closeSidebar();
}

/* ============================================================
   PROFILE POPOVER
============================================================ */

/* ============================================================
   TOAST
============================================================ */

let toastTimer;

/** Brief, non-blocking feedback. Nothing important lives only here. */
function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  // restart the entrance animation even if a toast is already showing
  elements.toast.classList.remove("is-visible");
  void elements.toast.offsetWidth;
  elements.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => {
    elements.toast.classList.remove("is-visible");
    toastTimer = setTimeout(() => (elements.toast.hidden = true), 200);
  }, 2600);
}

/* ============================================================
   POPOVERS
============================================================ */

const popovers = () => [
  [elements.popoverModel, elements.modelChip],
  [elements.popoverOverflow, elements.overflowButton],
  [elements.popoverSaved, elements.savedButton, elements.savedButtonBottom],
];

function closeAllPopovers() {
  for (const [popover, ...triggers] of popovers()) {
    popover.hidden = true;
    for (const trigger of triggers) trigger?.setAttribute("aria-expanded", "false");
  }
}

/** Opens one popover and closes the rest, or closes it if it was already open. */
function togglePopover(popover, trigger, render) {
  const wasOpen = !popover.hidden;
  closeAllPopovers();
  if (wasOpen) return;

  render();
  popover.hidden = false;
  trigger.setAttribute("aria-expanded", "true");

  // Anchor under the trigger on the trigger's own side, kept on screen.
  const rect = trigger.getBoundingClientRect();
  const width = popover.offsetWidth || 300;
  const margin = 12;

  popover.style.right = "auto";
  const left = Math.min(
    Math.max(margin, rect.left),
    Math.max(margin, window.innerWidth - width - margin),
  );
  popover.style.left = `${left}px`;

  const below = rect.bottom + 8;
  const maxTop = window.innerHeight - popover.offsetHeight - margin;
  popover.style.top = `${Math.max(margin, Math.min(below, maxTop))}px`;
}

/* ============================================================
   SAVED QUESTIONS
============================================================ */

const SAVED_KEY = "sapa-upi:saved-questions";
const MAX_SAVED = 20;

/** Stored per browser. Reading can throw in private mode, so never assume it works. */
function readSaved() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((q) => typeof q === "string") : [];
  } catch {
    return [];
  }
}

function writeSaved(questions) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(questions.slice(0, MAX_SAVED)));
  } catch {
    showToast("Browser menolak menyimpan. Coba matikan mode penyamaran.");
  }
  refreshSavedCount();
}

function refreshSavedCount() {
  const count = readSaved().length;
  for (const span of document.querySelectorAll("[data-saved-count]")) {
    span.textContent = String(count);
  }
}

function saveQuestion(question) {
  const saved = readSaved();
  if (saved.includes(question)) {
    showToast("Pertanyaan ini sudah tersimpan.");
    return;
  }
  writeSaved([question, ...saved]);
  showToast("Pertanyaan disimpan.");
}

function renderSavedPopover() {
  const saved = readSaved();
  elements.popoverSaved.replaceChildren();

  const head = createElement("div", "popover-head");
  head.textContent = saved.length ? "Pertanyaan tersimpan" : "Belum ada pertanyaan tersimpan";
  elements.popoverSaved.append(head);

  if (!saved.length) {
    const hint = createElement("p", "popover-empty");
    hint.textContent = "Simpan pertanyaan lewat tombol di bawah setiap jawaban.";
    elements.popoverSaved.append(hint);
    return;
  }

  const list = createElement("div", "popover-list");
  for (const question of saved) {
    const row = createElement("div", "popover-row");

    const ask = createElement("button", "popover-row-main");
    ask.type = "button";
    ask.textContent = question;
    ask.addEventListener("click", () => {
      closeAllPopovers();
      submitQuestion(question);
    });

    const remove = createElement("button", "popover-row-remove");
    remove.type = "button";
    remove.setAttribute("aria-label", `Hapus "${question}"`);
    remove.textContent = "\u00d7";
    remove.addEventListener("click", () => {
      writeSaved(readSaved().filter((q) => q !== question));
      renderSavedPopover();
    });

    row.append(ask, remove);
    list.append(row);
  }
  elements.popoverSaved.append(list);
}

/* ============================================================
   SIDEBAR SEARCH
============================================================ */

function renderSearchResults(query) {
  const results = elements.searchResults;
  results.replaceChildren();

  const trimmed = query.trim();
  if (trimmed.length < 2) {
    results.hidden = true;
    elements.sidebarSearch.setAttribute("aria-expanded", "false");
    return;
  }

  // Ranked by the same scorer the assistant answers with, so the sidebar and
  // the answer never disagree about which topic a question belongs to.
  const found = searchKnowledgeBase(trimmed, knowledgeBase);
  const entries = [found.best, ...found.alternatives]
    .filter(Boolean)
    .map(({ entry }) => entry)
    .filter((entry, index, all) => all.findIndex((e) => e.id === entry.id) === index)
    .slice(0, 5);

  if (!entries.length) {
    const empty = createElement("li", "search-empty");
    empty.textContent = "Tidak ada panduan yang cocok.";
    results.append(empty);
  }

  for (const entry of entries) {
    const item = createElement("li");
    const button = createElement("button", "search-result");
    button.type = "button";
    button.setAttribute("role", "option");
    button.innerHTML = `<strong></strong><small></small>`;
    button.querySelector("strong").textContent = entry.title;
    button.querySelector("small").textContent = entry.category;
    button.addEventListener("click", () => {
      elements.sidebarSearch.value = "";
      renderSearchResults("");
      closeSidebar();
      submitQuestion(entry.questions[0]);
    });
    item.append(button);
    results.append(item);
  }

  results.hidden = false;
  elements.sidebarSearch.setAttribute("aria-expanded", "true");
}

/* ============================================================
   VOICE INPUT
============================================================ */

const SpeechRecognition =
  typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

let recognition = null;

function stopVoice() {
  recognition?.stop();
  recognition = null;
  elements.voiceButton.setAttribute("aria-pressed", "false");
}

function toggleVoice() {
  if (recognition) {
    stopVoice();
    return;
  }
  if (!SpeechRecognition) {
    showToast("Browser ini tidak mendukung input suara. Coba Chrome.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "id-ID";
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.addEventListener("result", (event) => {
    const transcript = [...event.results].map((r) => r[0].transcript).join("");
    elements.chatInput.value = transcript;
    resizeTextarea(elements.chatInput);
  });
  recognition.addEventListener("error", (event) => {
    showToast(
      event.error === "not-allowed"
        ? "Akses mikrofon ditolak."
        : "Input suara gagal. Coba lagi.",
    );
    stopVoice();
  });
  recognition.addEventListener("end", stopVoice);

  recognition.start();
  elements.voiceButton.setAttribute("aria-pressed", "true");
  showToast("Mendengarkan... bicara sekarang.");
}

/* ============================================================
   TOPBAR ACTIONS
============================================================ */

/**
 * The clipboard API is refused without a trusted gesture, in insecure contexts
 * and under some permission settings, so fall back to the old selection trick
 * and, failing that, hand the text over for the reader to copy by hand.
 */
async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
    return;
  } catch {
    // fall through
  }

  const scratch = document.createElement("textarea");
  scratch.value = text;
  scratch.setAttribute("readonly", "");
  scratch.style.position = "fixed";
  scratch.style.opacity = "0";
  document.body.append(scratch);
  scratch.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  scratch.remove();

  if (copied) showToast(successMessage);
  else window.prompt("Salin manual dengan Cmd/Ctrl+C:", text);
}

function conversationTranscript() {
  const lines = [];
  for (const message of elements.chatLog.querySelectorAll(".message")) {
    const who = message.classList.contains("bot-message") ? "SAPA UPI" : "Mahasiswa";
    const text = message.innerText.replace(/\s*\n\s*/g, "\n").trim();
    if (text) lines.push(`${who}:\n${text}`);
  }
  return lines.join("\n\n");
}

function renderModelPopover() {
  const mode = lastAnswerWasGenerated
    ? "Jawaban terakhir disusun model, dibatasi rujukan pedoman."
    : lastAnswerWasGenerated === false
      ? "Jawaban terakhir dari pencocokan kata kunci lokal (mode offline)."
      : "Belum ada pertanyaan pada sesi ini.";

  elements.popoverModel.replaceChildren();
  const head = createElement("div", "popover-head");
  head.textContent = "Dari mana jawabannya";
  const body = createElement("div", "popover-body");
  body.innerHTML = `
    <p></p>
    <dl class="popover-facts">
      <dt>Model</dt><dd>Gemini (gemini-3.5-flash-lite)</dd>
      <dt>Rujukan</dt><dd>Pedoman tugas akhir prodi, pedoman karya ilmiah UPI, dan pengumuman prodi</dd>
      <dt>Cadangan</dt><dd>Pencocokan kata kunci di browser bila model tak terjangkau</dd>
    </dl>
  `;
  body.querySelector("p").textContent = mode;
  elements.popoverModel.append(head, body);
}

function renderOverflowPopover() {
  elements.popoverOverflow.replaceChildren();
  const list = createElement("div", "popover-list");

  const actions = [
    [
      "Salin transkrip percakapan",
      () => {
        const transcript = conversationTranscript();
        if (!transcript) {
          showToast("Belum ada percakapan untuk disalin.");
          return;
        }
        copyText(transcript, "Transkrip disalin.");
      },
    ],
    [
      "Mulai percakapan baru",
      () => {
        if (!chatStarted) {
          showToast("Percakapan sudah kosong.");
          return;
        }
        resetConversation();
      },
    ],
  ];

  for (const [label, action] of actions) {
    const button = createElement("button", "popover-row-main");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => {
      closeAllPopovers();
      action();
    });
    list.append(button);
  }
  elements.popoverOverflow.append(list);
}

/* ============================================================
   AKUN & RIWAYAT
============================================================ */

const TOKEN_KEY = "sapa-upi:session";

function readStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* penyimpanan ditolak; sesi hanya bertahan selama halaman terbuka */
  }
}

let sessionToken = null;

function authHeaders() {
  return sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
}

/** Token datang dari Worker lewat fragment URL, supaya tidak masuk log server. */
function captureTokenFromUrl() {
  if (!window.location.hash.startsWith("#token=")) return;
  const token = decodeURIComponent(window.location.hash.slice("#token=".length));
  if (token) {
    sessionToken = token;
    storeToken(token);
  }
  history.replaceState(null, "", window.location.pathname + window.location.search);
}

function renderAccount() {
  const signedIn = Boolean(account);

  elements.loginButton.hidden = signedIn || !loginEnabled;
  elements.accountSignedIn.hidden = !signedIn;
  elements.sidebarHistory.hidden = !signedIn;

  elements.accountNote.textContent = signedIn
    ? "Riwayat percakapan hanya terlihat oleh kamu."
    : loginEnabled
      ? "Masuk untuk menyimpan riwayat percakapan. Jawaban sama saja tanpa masuk."
      : "Jawaban dirujuk ke pedoman prodi dan UPI; keputusan resmi tetap pada program studi.";

  if (signedIn) {
    elements.accountName.textContent = account.name || account.email;
    elements.accountEmail.textContent = account.role
      ? `${account.email} \u00b7 ${account.role}`
      : account.email;
  }
}

let loginEnabled = Boolean(API_URL);

async function loadAccount() {
  if (!API_URL) return;
  try {
    const response = await fetch(`${API_URL}/auth/me`, { headers: authHeaders() });
    if (!response.ok) throw new Error(`auth/me ${response.status}`);
    const data = await response.json();
    loginEnabled = Boolean(data.loginEnabled);
    account = data.user ?? null;
    if (!account) {
      sessionToken = null;
      storeToken(null);
    }
  } catch (error) {
    // A failed check must not hide the way in. The button stays, and the
    // attempt to sign in will surface the real error rather than silence.
    console.warn("Tidak bisa memeriksa sesi:", error);
    account = null;
  }
  renderAccount();
  if (account) refreshHistory();
}

async function refreshHistory() {
  if (!account) return;
  try {
    const response = await fetch(`${API_URL}/conversations`, { headers: authHeaders() });
    if (!response.ok) return;
    const { conversations = [] } = await response.json();
    renderHistory(conversations);
  } catch (error) {
    console.warn("Tidak bisa memuat riwayat:", error);
  }
}

function renderHistory(conversations) {
  elements.historyList.replaceChildren();

  if (!conversations.length) {
    const empty = createElement("li", "history-empty");
    empty.textContent = "Belum ada percakapan tersimpan.";
    elements.historyList.append(empty);
    return;
  }

  for (const conversation of conversations) {
    const item = createElement("li", "history-item");

    const open = createElement("button", "history-open");
    open.type = "button";
    open.textContent = conversation.title;
    open.addEventListener("click", () => openConversation(conversation.id));

    const remove = createElement("button", "history-remove");
    remove.type = "button";
    remove.setAttribute("aria-label", `Hapus "${conversation.title}"`);
    remove.textContent = "\u00d7";
    remove.addEventListener("click", async (event) => {
      event.stopPropagation();
      await fetch(`${API_URL}/conversations/${conversation.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (conversationId === conversation.id) conversationId = null;
      showToast("Percakapan dihapus.");
      refreshHistory();
    });

    item.append(open, remove);
    elements.historyList.append(item);
  }
}

async function openConversation(id) {
  try {
    const response = await fetch(`${API_URL}/conversations/${id}`, { headers: authHeaders() });
    if (!response.ok) {
      showToast("Percakapan tidak ditemukan.");
      return;
    }
    const { conversation } = await response.json();

    latestRequestId += 1; // batalkan jawaban yang masih dalam perjalanan
    elements.chatLog.replaceChildren();
    enterChatState();
    conversationId = conversation.id;

    for (const message of conversation.messages) {
      if (message.role === "user") {
        appendUserMessage(message.content);
      } else {
        lastQuestion = "";
        appendBotResponse({
          type: "answer",
          generated: message.answer_source === "llm",
          message: message.content,
          entry: knowledgeBase.find((entry) => entry.id === message.entry_id) ?? null,
          followUpQuestions: [],
        });
      }
    }
    closeSidebar();
  } catch (error) {
    console.warn("Tidak bisa membuka percakapan:", error);
    showToast("Gagal membuka percakapan.");
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
  sessionToken = null;
  storeToken(null);
  account = null;
  conversationId = null;
  elements.historyList.replaceChildren();
  renderAccount();
  showToast("Kamu sudah keluar.");
}

/* ============================================================
   INIT
============================================================ */

function resizeTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
}

function initialize() {
  renderQuickCards();

  elements.chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitQuestion(elements.chatInput.value);
  });
  elements.chatFormBottom.addEventListener("submit", (event) => {
    event.preventDefault();
    submitQuestion(elements.chatInputBottom.value);
  });

  for (const [textarea, form] of [
    [elements.chatInput, elements.chatForm],
    [elements.chatInputBottom, elements.chatFormBottom],
  ]) {
    textarea.addEventListener("input", () => resizeTextarea(textarea));
    textarea.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
      }
    });
  }

  const deepSearchToggles = [elements.deepSearchToggle, elements.deepSearchToggleBottom];
  for (const toggle of deepSearchToggles) {
    toggle.addEventListener("click", () => {
      const pressed = toggle.getAttribute("aria-pressed") === "true";
      for (const t of deepSearchToggles) t.setAttribute("aria-pressed", String(!pressed));
    });
  }

  elements.sidebarOpen.addEventListener("click", openSidebar);
  elements.sidebarClose.addEventListener("click", closeSidebar);
  elements.sidebarBackdrop.addEventListener("click", closeSidebar);
  elements.resetChat.addEventListener("click", resetConversation);

  // Chat Workspace is the only destination, so it just returns you to it.
  elements.navChat.addEventListener("click", closeSidebar);

  elements.sidebarSearch.addEventListener("input", (event) =>
    renderSearchResults(event.target.value),
  );
  elements.sidebarSearch.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      elements.sidebarSearch.value = "";
      renderSearchResults("");
    }
  });

  elements.shareButton.addEventListener("click", () =>
    copyText(window.location.href, "Tautan disalin."),
  );

  elements.voiceButton.addEventListener("click", toggleVoice);

  elements.modelChip.addEventListener("click", (event) => {
    event.stopPropagation();
    togglePopover(elements.popoverModel, elements.modelChip, renderModelPopover);
  });
  elements.overflowButton.addEventListener("click", (event) => {
    event.stopPropagation();
    togglePopover(elements.popoverOverflow, elements.overflowButton, renderOverflowPopover);
  });
  for (const trigger of [elements.savedButton, elements.savedButtonBottom]) {
    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      togglePopover(elements.popoverSaved, trigger, renderSavedPopover);
    });
  }

  // Controls the prototype cannot honestly provide say so instead of doing nothing.
  for (const button of document.querySelectorAll('[data-unavailable="lampiran"]')) {
    button.addEventListener("click", () =>
      showToast("Unggah berkas belum tersedia — butuh integrasi SIAKAD."),
    );
  }

  document.addEventListener("click", (event) => {
    const insidePopover = event.target.closest(".popover");
    if (!insidePopover) closeAllPopovers();
    if (!event.target.closest(".sidebar-search") && !event.target.closest(".search-results")) {
      elements.searchResults.hidden = true;
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeSidebar();
    closeAllPopovers();
    stopVoice();
  });

  elements.loginButton.addEventListener("click", startLogin);
  elements.logoutButton.addEventListener("click", logout);

  refreshSavedCount();

  captureTokenFromUrl();
  sessionToken = sessionToken ?? readStoredToken();
  renderAccount();
  loadAccount();
}

if (typeof document !== "undefined") initialize();
