import { knowledgeBase } from "./data/knowledge-base.js";
import { createChatResponse } from "./lib/chat-engine.js";
import { student } from "./data/student-data.js";

const SPARKLE_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6Z"/></svg>';
const CHECK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 12 5 5L20 6"/></svg>';
const CLOCK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

const QUICK_CARDS = [
  {
    badgeClass: "badge-reguler",
    badgeText: "REGULER",
    icon: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    title: "Jadwal Kuliah",
    description: "Informasi jadwal perkuliahan, ruang, & dosen berjalan.",
    footIcon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    footText: "SIAKAD Aktif",
    question: "Di mana saya dapat melihat jadwal kuliah?",
  },
  {
    badgeClass: "badge-revisi",
    badgeText: "MASA REVISI",
    icon: '<path d="M7 3.5h7.5L19 8v12.5H7z"/><path d="M14 3.5V8h5M10 12h6M10 15.5h6"/>',
    title: "Perkuliahan & KRS",
    description: "Ketentuan presensi, beban SKS & kontrak perkuliahan.",
    footIcon: '<path d="M9 12.5 11 14.5l4-5"/><circle cx="12" cy="12" r="9"/>',
    footText: "Maks 24 SKS",
    question: "Berapa minimal kehadiran untuk mengikuti ujian?",
  },
  {
    badgeClass: "badge-akhir",
    badgeText: "TINGKAT AKHIR",
    icon: '<path d="m2.5 9 9.5-4.5L21.5 9 12 13.5 2.5 9Z"/><path d="M6.5 11.2V16c3 2.2 8 2.2 11 0v-4.8M21.5 9v6"/>',
    title: "Sidang & Skripsi",
    description: "Syarat dan alur pendaftaran sidang sarjana & seminar proposal.",
    footIcon: '<path d="M7 3.5h8.5A1.5 1.5 0 0 1 17 5v16l-5-3-5 3V5A1.5 1.5 0 0 1 7 3.5Z"/>',
    footText: "Alur SK Rektor",
    question: "Apa saja persyaratan pendaftaran sidang?",
  },
  {
    badgeClass: "badge-layanan",
    badgeText: "LAYANAN",
    icon: '<rect x="4.5" y="3.5" width="15" height="17" rx="2.5"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
    title: "Administrasi",
    description: "Cuti kuliah, surat izin aktif kuliah & berkas kemahasiswaan.",
    footIcon: '<path d="M8.5 12.5 15 5a3 3 0 0 1 4 4l-8.5 8.5a5 5 0 0 1-7-7L12 2"/>',
    footText: "Format Resmi TU",
    question: "Bagaimana cara mengajukan surat keterangan mahasiswa aktif?",
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
        profileTrigger: el("profile-trigger"),
        topbarAvatar: el("topbar-avatar"),
        popoverProfile: el("popover-profile"),
        homeScroll: el("home-scroll"),
        chatLog: el("chat-log"),
        quickCards: el("quick-cards"),
        chatForm: el("chat-form"),
        chatInput: el("chat-input"),
        deepSearchToggle: el("deep-search-toggle"),
        deepSearchToggleBottom: el("deep-search-toggle-bottom"),
        chatFormBottom: el("chat-form-bottom"),
        chatInputBottom: el("chat-input-bottom"),
      };

let responseTimer = null;
let chatStarted = false;

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
      <p class="processing-title">SAPA sedang mengekstrak &amp; memvalidasi Pedoman Akademik UPI...</p>
      <div class="processing-steps">
        <span class="step-done">${CHECK_ICON}Dit-Akademik &amp; SIAKAD terverifikasi</span>
        <span class="step-done">${CHECK_ICON}Merinci Pedoman Terkait</span>
        <span>${CLOCK_ICON}Menyusun Matriks Jawaban</span>
      </div>
      <div class="skeleton-lines"><span style="width:100%"></span><span style="width:88%"></span><span style="width:64%"></span></div>
      <div class="processing-footer"><i class="dot dot-live"></i><span>SAPA sedang memformulasikan jawaban akademik...</span><span class="grow"></span><span>Model: UPI-LLM-RAG-v4</span></div>
    </div>
  `;
  elements.chatLog.append(article);
  scrollChat();
}

function removeProcessing() {
  elements.chatLog.querySelector("[data-processing='true']")?.remove();
}

function renderAnswerBody(response, body) {
  body.innerHTML = `<div class="bot-label-row"><strong>SAPA AI Academic Hub</strong><span class="pill pill-soft">${CHECK_ICON}Jawaban Resmi Terverifikasi AI RAG UPI</span></div>`;

  const card = createElement("div", "answer-card");
  const entry = response.entry;
  card.innerHTML = `<p>${entry?.lead ?? response.message}</p>`;

  if (entry?.table) {
    const wrap = createElement("div", "answer-table-wrap");
    const rowsHtml = entry.table.rows
      .map((row) => {
        const [name, standard, status] = row;
        const isDone = /terpenuhi|terverifikasi/i.test(status);
        return `<tr><td>${name}</td><td>${standard}</td><td>${
          isDone
            ? `<span class="status-ok">${CHECK_ICON}${status}</span>`
            : `<span class="status-pending">${CLOCK_ICON}${status}</span>`
        }</td></tr>`;
      })
      .join("");
    wrap.innerHTML = `
      <div class="answer-table-head">
        <strong><span class="num">1</span>${entry.table.title}</strong>
        <small>Auto-checked: ${formatTime()} WIB</small>
      </div>
      <table class="data-table">
        <thead><tr>${entry.table.columns.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;
    card.append(wrap);
  }

  if (entry?.closing) card.insertAdjacentHTML("beforeend", `<p>${entry.closing}</p>`);
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

function appendBotResponse(response) {
  const { article, body } = createBotArticle();
  if (response.type === "answer") renderAnswerBody(response, body);
  else if (response.type === "suggestions") renderSuggestionsBody(response, body);
  else if (response.type === "fallback") renderFallbackBody(response, body);
  else body.innerHTML = `<div class="answer-card"><p>${response.message}</p></div>`;
  elements.chatLog.append(article);
  scrollChat();
}

function submitQuestion(rawQuestion) {
  const question = String(rawQuestion ?? "").trim();
  if (!question) return;

  enterChatState();
  clearTimeout(responseTimer);
  removeProcessing();
  appendUserMessage(question);
  elements.chatInput.value = "";
  elements.chatInputBottom.value = "";
  showProcessing();

  responseTimer = window.setTimeout(() => {
    removeProcessing();
    appendBotResponse(createChatResponse(question, knowledgeBase));
  }, 900);
}

function resetConversation() {
  clearTimeout(responseTimer);
  elements.chatLog.replaceChildren();
  chatStarted = false;
  elements.homeScroll.hidden = false;
  elements.chatLog.hidden = true;
  elements.chatFormBottom.hidden = true;
  elements.chatInput.value = "";
  elements.chatInputBottom.value = "";
  elements.popoverProfile.hidden = true;
  closeSidebar();
}

/* ============================================================
   PROFILE POPOVER
============================================================ */

function toggleProfilePopover() {
  const willOpen = elements.popoverProfile.hidden;
  elements.popoverProfile.hidden = true;
  if (!willOpen) return;

  elements.popoverProfile.innerHTML = `
    <div class="profile-pop-head">
      <span class="profile-avatar">RP</span>
      <div><strong>${student.name} <span class="pill pill-muted">Sem. 8</span></strong><small>NIM ${student.nim}</small><small>${student.program} &bull; ${student.faculty}</small></div>
    </div>
    <div class="profile-pop-stats">
      <div><span>IPK KUMULATIF</span><strong>${student.gpa} / 4.00</strong><small style="color:var(--ink-400)">${student.gpaPredicate}</small></div>
      <div><span>BEBAN SKS</span><strong>${student.sksCompleted} / ${student.sksTotal} SKS</strong></div>
    </div>
    <div class="profile-pop-list">
      <button type="button"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.2"/><path d="M5 20c1.4-3.4 4-5 7-5s5.6 1.6 7 5"/></svg>Profil &amp; Pengaturan Akun</button>
      <button type="button"><svg viewBox="0 0 24 24"><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 5v4h4"/></svg>SIAKAD &amp; SPOT Sync <span class="pill pill-muted" style="margin-left:auto">Terhubung</span></button>
      <button type="button"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>Bantuan &amp; Panduan Sistem</button>
    </div>
  `;
  elements.popoverProfile.hidden = false;
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

  for (const trigger of [elements.profileTrigger, elements.topbarAvatar]) {
    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleProfilePopover();
    });
  }

  document.addEventListener("click", (event) => {
    if (
      !elements.popoverProfile.hidden &&
      !elements.popoverProfile.contains(event.target) &&
      !elements.profileTrigger.contains(event.target) &&
      !elements.topbarAvatar.contains(event.target)
    ) {
      elements.popoverProfile.hidden = true;
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSidebar();
      elements.popoverProfile.hidden = true;
    }
  });
}

if (typeof document !== "undefined") initialize();
