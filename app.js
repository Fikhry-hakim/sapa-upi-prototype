import { knowledgeBase } from "./data/knowledge-base.js";
import { createChatResponse } from "./lib/chat-engine.js";
import * as SD from "./data/student-data.js";

const SPARKLE_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6Z"/></svg>';
const CHECK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 12 5 5L20 6"/></svg>';
const CLOCK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

const QUICK_CARDS = [
  {
    key: "jadwal",
    badgeClass: "badge-reguler",
    badgeText: "REGULER",
    icon: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    title: "Jadwal Kuliah",
    description: "Informasi jadwal perkuliahan, ruang, & dosen berjalan.",
    footIcon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    footText: "SIAKAD Aktif",
  },
  {
    key: "krs",
    badgeClass: "badge-revisi",
    badgeText: "MASA REVISI",
    icon: '<path d="M7 3.5h7.5L19 8v12.5H7z"/><path d="M14 3.5V8h5M10 12h6M10 15.5h6"/>',
    title: "KRS Online",
    description: "Panduan pengisian, kuota mata kuliah & revisi KRS berjalan.",
    footIcon: '<path d="M9 12.5 11 14.5l4-5"/><circle cx="12" cy="12" r="9"/>',
    footText: "Maks 24 SKS",
  },
  {
    key: "sidang",
    badgeClass: "badge-akhir",
    badgeText: "TINGKAT AKHIR",
    icon: '<path d="m2.5 9 9.5-4.5L21.5 9 12 13.5 2.5 9Z"/><path d="M6.5 11.2V16c3 2.2 8 2.2 11 0v-4.8M21.5 9v6"/>',
    title: "Sidang & Skripsi",
    description: "Syarat dan alur pendaftaran sidang sarjana & seminar proposal.",
    footIcon: '<path d="M7 3.5h8.5A1.5 1.5 0 0 1 17 5v16l-5-3-5 3V5A1.5 1.5 0 0 1 7 3.5Z"/>',
    footText: "Alur SK Rektor",
  },
  {
    key: "administrasi",
    badgeClass: "badge-layanan",
    badgeText: "LAYANAN",
    icon: '<rect x="4.5" y="3.5" width="15" height="17" rx="2.5"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
    title: "Administrasi",
    description: "Cuti kuliah, surat izin aktif kuliah & berkas kemahasiswaan.",
    footIcon: '<path d="M8.5 12.5 15 5a3 3 0 0 1 4 4l-8.5 8.5a5 5 0 0 1-7-7L12 2"/>',
    footText: "Format Resmi TU",
  },
];

const el = (id) => document.getElementById(id);

const elements =
  typeof document === "undefined"
    ? {}
    : {
        loginForm: el("login-form"),
        loginId: el("login-id"),
        loginPassword: el("login-password"),
        loginError: el("login-error"),
        togglePassword: el("toggle-password"),
        loginReset: el("login-reset"),
        errorRetry: el("error-retry-button"),
        screenLogin: el("screen-login"),
        screenError: el("screen-error"),
        screenSplash: el("screen-splash"),
        splashSteps: el("splash-steps"),
        appShell: el("app-shell"),
        sidebar: el("sidebar"),
        sidebarOpen: el("sidebar-open"),
        sidebarClose: el("sidebar-close"),
        sidebarBackdrop: el("sidebar-backdrop"),
        sidebarNav: document.querySelector(".sidebar-nav"),
        resetChat: el("reset-chat"),
        profileTrigger: el("profile-trigger"),
        topbarAvatar: el("topbar-avatar"),
        notificationTrigger: el("notification-trigger"),
        popoverProfile: el("popover-profile"),
        popoverNotification: el("popover-notification"),
        viewHome: el("view-home"),
        chatLog: el("chat-log"),
        quickCards: el("quick-cards"),
        chatForm: el("chat-form"),
        chatInput: el("chat-input"),
        deepSearchToggle: el("deep-search-toggle"),
        chatFormBottom: el("chat-form-bottom"),
        chatInputBottom: el("chat-input-bottom"),
        modalSearch: el("modal-search"),
        globalSearchInput: el("global-search-input"),
        searchAskButton: el("search-ask-button"),
        modalJadwal: el("modal-jadwal"),
        modalKrs: el("modal-krs"),
        modalSidang: el("modal-sidang"),
        modalAdministrasi: el("modal-administrasi"),
        viewExplore: el("view-explore"),
        viewLibrary: el("view-library"),
        viewFiles: el("view-files"),
        viewHistory: el("view-history"),
      };

let responseTimer = null;
let chatStarted = false;
const viewCache = new Set();

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
   AUTH FLOW: Login -> Error -> Splash -> App
============================================================ */

function showScreen(name) {
  elements.screenLogin.hidden = name !== "login";
  elements.screenError.hidden = name !== "error";
  elements.screenSplash.hidden = name !== "splash";
  elements.appShell.hidden = name !== "app";
}

function handleLoginSubmit(event) {
  event.preventDefault();
  const id = elements.loginId.value.trim();
  const password = elements.loginPassword.value.trim();

  if (!id || !password) {
    elements.loginError.hidden = false;
    return;
  }

  elements.loginError.hidden = true;
  showScreen("error");
}

function handleErrorRetry() {
  showScreen("splash");
  runSplashSequence();
}

function runSplashSequence() {
  const items = [...elements.splashSteps.querySelectorAll("li")];
  items.forEach((item) => item.classList.remove("is-active", "is-done"));

  let index = 0;
  const advance = () => {
    if (index > 0) items[index - 1]?.classList.add("is-done");
    if (index >= items.length) {
      window.setTimeout(() => showScreen("app"), 500);
      return;
    }
    items[index].classList.add("is-active");
    index += 1;
    window.setTimeout(advance, 750);
  };
  advance();
}

function togglePasswordVisibility() {
  const isPassword = elements.loginPassword.type === "password";
  elements.loginPassword.type = isPassword ? "text" : "password";
}

function resetLoginForm() {
  elements.loginForm.reset();
  elements.loginError.hidden = true;
}

/* ============================================================
   SIDEBAR (mobile off-canvas) + NAV SWITCHING
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

const NAV_VIEWS = {
  chat: elements.viewHome,
  explore: elements.viewExplore,
  library: elements.viewLibrary,
  files: elements.viewFiles,
  history: elements.viewHistory,
};

function switchNav(name) {
  for (const [key, node] of Object.entries(NAV_VIEWS)) {
    node.hidden = key !== name;
  }
  elements.sidebarNav.querySelector(".active")?.classList.remove("active");
  elements.sidebarNav.querySelector(`[data-nav="${name}"]`)?.classList.add("active");
  elements.chatFormBottom.hidden = !(name === "chat" && chatStarted);

  if (!viewCache.has(name) && name !== "chat") {
    renderPage(name);
    viewCache.add(name);
  }
  closeSidebar();
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
    button.addEventListener("click", () => openModal(card.key));
    elements.quickCards.append(button);
  }
}

/* ============================================================
   CHAT
============================================================ */

function enterChatState() {
  if (chatStarted) return;
  chatStarted = true;
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

  switchNav("chat");
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
  elements.chatLog.hidden = true;
  elements.chatInput.value = "";
  elements.chatInputBottom.value = "";
  switchNav("chat");
  closeAllOverlays();
}

/* ============================================================
   MODALS
============================================================ */

const MODAL_MAP = {
  jadwal: elements.modalJadwal,
  krs: elements.modalKrs,
  sidang: elements.modalSidang,
  administrasi: elements.modalAdministrasi,
};

function closeAllOverlays() {
  for (const modal of Object.values(MODAL_MAP)) modal.hidden = true;
  elements.modalSearch.hidden = true;
  elements.popoverProfile.hidden = true;
  elements.popoverNotification.hidden = true;
}

function openModal(key) {
  closeAllOverlays();
  const modal = MODAL_MAP[key];
  if (!modal) return;
  if (!modal.dataset.rendered) {
    modal.innerHTML = MODAL_RENDERERS[key]();
    modal.dataset.rendered = "true";
    wireModal(key, modal);
  }
  modal.hidden = false;
}

function wireModal(key, modal) {
  modal.querySelectorAll("[data-close-modal]").forEach((btn) =>
    btn.addEventListener("click", () => {
      modal.hidden = true;
    }),
  );
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.hidden = true;
  });

  if (key === "administrasi") {
    modal.querySelectorAll(".option-card").forEach((card) => {
      card.addEventListener("click", () => {
        modal.querySelector(".option-card.is-active")?.classList.remove("is-active");
        card.classList.add("is-active");
      });
    });
  }
}

function renderJadwalModal() {
  const j = SD.jadwalKuliah;
  const dayIndex = Object.fromEntries(j.days.map((d, i) => [d.label, i]));
  const grid = j.days.map((d) => `<div class="week-grid-head ${d.active ? "active" : ""}">${d.label}<br>${d.date}</div>`).join("");
  const classesByDay = j.days.map((d) =>
    j.classes
      .filter((c) => c.day === d.label)
      .map(
        (c) => `<div class="class-block ${c.highlight ? "is-highlight" : ""}"><span class="sks-tag">${c.sks} SKS</span><strong>${c.time}</strong>${c.course}<br><small>${c.room} &bull; ${c.lecturer}</small></div>`,
      )
      .join(""),
  );

  return `
    <div class="modal-panel" style="max-width:920px">
      <div class="modal-head">
        <span class="modal-head-icon"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg></span>
        <div class="modal-head-text">
          <h2>Jadwal Perkuliahan Mingguan <span class="pill pill-muted">${j.period}</span></h2>
          <p>${j.note}</p>
        </div>
        <button class="modal-close" type="button" data-close-modal aria-label="Tutup"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </div>
      <div class="modal-body">
        <div class="modal-toolbar">
          <button class="text-button" type="button"><svg viewBox="0 0 24 24"><path d="M12 4v12M6 12l6 6 6-6"/></svg>Ekspor ke iCal/GCal</button>
          <button class="text-button" type="button"><svg viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="10" rx="2"/><path d="M8 8V5h8v3"/></svg>Cetak PDF</button>
        </div>
        <div class="week-grid">
          <div class="week-grid-head"></div>${grid}
          <div class="week-grid-time">Kelas</div>
          ${classesByDay.map((c) => `<div class="week-grid-cell">${c}</div>`).join("")}
        </div>
        <div class="detail-card">
          <span class="detail-card-badge">${j.detail.code} &bull; ${j.detail.sks} SKS</span>
          <div class="detail-card-main">
            <strong>${j.detail.course}</strong>
            <small>${j.detail.lecturer} &bull; ${j.detail.room} &bull; ${j.detail.time}</small>
          </div>
          <div class="detail-card-attendance">
            <span class="attendance-ring">${j.detail.attendancePercent}%</span>
            <div>
              <small>${j.detail.attendanceLabel}</small><br>
              <small>${j.detail.passRequirement}</small>
            </div>
            <button class="button-primary button-small" type="button">Tanya SAPA AI Materi Ini</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderKrsModal() {
  const k = SD.krsPlan;
  const rows = k.courses
    .map(
      (c) => `<tr>
        <td>${c.code}</td>
        <td><strong>${c.name}</strong><br><small style="color:var(--ink-400)">${c.note}</small></td>
        <td>${c.sks}</td>
        <td>${c.cls}</td>
        <td>${c.schedule}<br><small style="color:var(--ink-400)">${c.room}</small></td>
        <td><span class="status-ok">${CHECK_ICON}${c.status}</span></td>
      </tr>`,
    )
    .join("");

  return `
    <div class="modal-panel" style="max-width:900px">
      <div class="modal-head">
        <span class="modal-head-icon"><svg viewBox="0 0 24 24"><path d="M7 3.5h7.5L19 8v12.5H7z"/><path d="M14 3.5V8h5"/></svg></span>
        <div class="modal-head-text">
          <h2>KRS Online — ${k.semester} <span class="pill pill-muted">Status: ${k.status}</span></h2>
          <p>Rizky Pratama (2304068) &bull; S1 Bisnis Digital - FPEB</p>
        </div>
        <button class="modal-close" type="button" data-close-modal aria-label="Tutup"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </div>
      <div class="modal-body">
        <div class="krs-stat-row">
          <div class="krs-stat"><div class="krs-stat-label">Total Beban</div><div class="krs-stat-value">${k.totalSks} <small>/ ${k.maxSks} SKS</small></div><div class="krs-progress"><span style="width:${k.loadPercent}%"></span></div></div>
          <div class="krs-stat"><div class="krs-stat-label">Persetujuan</div><div class="krs-stat-value" style="font-size:0.86rem">${k.approvedBy}</div><div class="krs-stat-sub">${k.approverName}<br>${k.approverNip}</div></div>
          <div class="krs-stat"><div class="krs-stat-label">IPS Lalu</div><div class="krs-stat-value">${k.gpaLast}</div><div class="krs-stat-sub">${k.gpaPredicate}</div></div>
          <div class="krs-stat"><div class="krs-stat-label">Masa Revisi</div><div class="krs-stat-value" style="color:var(--red-600)">Sisa ${k.revisionDaysLeft} Hari</div><div class="krs-stat-sub">${k.revisionDeadline}</div></div>
        </div>
        <div class="krs-sign-row">
          <svg viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5l-8-3Z"/></svg>
          Tanda Tangan Digital Tersertifikasi BSrE &bull; Token Valid: ${k.signatureToken}
          <a href="#">Audit Log</a>
        </div>
        <div class="section-title-row"><h2>Daftar Rencana Kuliah</h2><small>${k.courses.length} Mata Kuliah &bull; ${k.curriculum}</small></div>
        <table class="data-table">
          <thead><tr><th>Kode</th><th>Mata Kuliah</th><th>SKS</th><th>Kls</th><th>Jadwal &amp; Ruangan</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderSidangModal() {
  const s = SD.sidangTracker;
  const stages = s.stages
    .map(
      (st, i) => `<div class="stage-item ${st.state === "done" ? "is-done" : st.state === "active" ? "is-active" : ""}">
        <div class="stage-dot">${st.state === "done" ? CHECK_ICON : i + 1}</div>
        <strong>${i + 1}. ${st.label}</strong>
        <small>${st.detail}</small>
        <small>${st.date}</small>
      </div>`,
    )
    .join("");

  const reqRows = s.requirements
    .map(
      (r) => `<tr>
        <td>${r.name}</td>
        <td>${r.standard}</td>
        <td>${r.actual}</td>
        <td>${r.status === "done" ? `<span class="status-ok">${CHECK_ICON}Lolos</span>` : `<span class="status-pending">${CLOCK_ICON}Tertunda</span>`}</td>
      </tr>`,
    )
    .join("");

  return `
    <div class="modal-panel" style="max-width:880px">
      <div class="modal-head">
        <span class="modal-head-icon"><svg viewBox="0 0 24 24"><path d="m2.5 9 9.5-4.5L21.5 9 12 13.5 2.5 9Z"/><path d="M6.5 11.2V16c3 2.2 8 2.2 11 0v-4.8"/></svg></span>
        <div class="modal-head-text">
          <h2>Tracker Progres Skripsi &amp; Sidang Sarjana <span class="pill pill-soft">${s.stageLabel}</span></h2>
          <p>Monitoring Alur Tugas Akhir Mahasiswa S1 Bisnis Digital FPEB UPI</p>
        </div>
        <button class="modal-close" type="button" data-close-modal aria-label="Tutup"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </div>
      <div class="modal-body">
        <div class="sidang-info-row">
          <span>Mahasiswa: <strong>Rizky Pratama</strong> <span class="pill pill-muted">NIM 2304068</span></span>
          <span>DP1: <strong>${s.advisor1}</strong></span>
          <span>DP2: <strong>${s.advisor2}</strong></span>
        </div>
        <p class="thesis-title">Judul TA: &ldquo;${s.title}&rdquo;</p>
        <div class="section-title-row"><h2>Alur Tahapan Akademik Tugas Akhir</h2><small>Klik tahapan untuk rincian arsip</small></div>
        <div class="stage-tracker">${stages}</div>
        <div class="requirement-head">
          <div>
            <strong>${s.requirementStage}</strong>
            <p class="requirement-note">${s.requirementNote}</p>
          </div>
          <div style="text-align:center">
            <div class="progress-ring">${s.progressPercent}%</div>
            <small style="color:var(--ink-400)">${s.progressLabel}</small>
          </div>
        </div>
        <table class="data-table">
          <thead><tr><th>Komponen Persyaratan</th><th>Standar Kelulusan</th><th>Capaian Mahasiswa</th><th>Status</th></tr></thead>
          <tbody>${reqRows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAdministrasiModal() {
  const options = SD.administrasiOptions
    .map(
      (o) => `<div class="option-card ${o.active ? "is-active" : ""}" data-option="${o.id}">
        <div class="option-card-title">${o.active ? CHECK_ICON : ""}${o.title}</div>
        <p>${o.description}</p>
        <div class="option-card-foot">${o.footer}${o.meta ? ` &bull; ${o.meta}` : ""}</div>
      </div>`,
    )
    .join("");

  return `
    <div class="modal-panel" style="max-width:820px">
      <div class="modal-head">
        <span class="modal-head-icon"><svg viewBox="0 0 24 24"><rect x="4.5" y="3.5" width="15" height="17" rx="2.5"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/></svg></span>
        <div class="modal-head-text">
          <h2>Pengajuan Dokumen &amp; Surat Keterangan Akademik Resmi</h2>
          <p>Layanan persuratan otomatis terintegrasi Bagian Tata Usaha Fakultas &amp; TTE Rektorat UPI.</p>
        </div>
        <button class="modal-close" type="button" data-close-modal aria-label="Tutup"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </div>
      <div class="modal-body">
        <div class="info-strip">
          <div class="info-strip-item"><span>Format Layanan</span><strong>Format &amp; TTE Digital</strong></div>
          <div class="info-strip-item"><span>Batas &amp; Pengerjaan</span><strong>Validasi SIAKAD &amp; Instansi</strong></div>
          <div class="info-strip-item"><span>Prasyarat &amp; Pengesahan</span><strong>QR Validasi BSrE</strong></div>
        </div>
        <div class="section-title-row"><h2>Pilih Jenis Surat Akademik</h2><small>4 Template Dokumen Tersedia</small></div>
        <div class="option-grid">${options}</div>
        <div class="verified-strip">
          <div class="verified-strip-head"><svg viewBox="0 0 24 24"><path d="m4 12 5 5L20 6"/></svg>Data Mahasiswa Terverifikasi SIAKAD UPI <span style="margin-left:auto;color:var(--ink-500);font-weight:500">Sinkronisasi Real-time: Hari ini, 09:41 WIB</span></div>
          <div class="verified-grid">
            <div><span>Nama Lengkap &amp; NIM</span><strong>Rizky Pratama</strong><strong style="color:var(--red-600)">NIM: 2304068</strong></div>
            <div><span>Program Studi / Fakultas</span><strong>S1 Bisnis Digital</strong><strong>FPEB Kampus Bumi Siliwangi</strong></div>
            <div><span>Semester &amp; Status</span><strong>Ganjil 2025/2026</strong><strong style="color:var(--success)">&bull; Aktif Terdaftar</strong></div>
            <div><span>Prestasi Akademik Kumulatif</span><strong>3.78 IPK</strong><strong>140 SKS Selesai (Memenuhi Syarat)</strong></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

const MODAL_RENDERERS = {
  jadwal: renderJadwalModal,
  krs: renderKrsModal,
  sidang: renderSidangModal,
  administrasi: renderAdministrasiModal,
};

/* ============================================================
   POPOVERS: profile + notifications
============================================================ */

function toggleProfilePopover() {
  const willOpen = elements.popoverProfile.hidden;
  closeAllOverlays();
  if (!willOpen) return;
  const p = SD.student;
  elements.popoverProfile.innerHTML = `
    <div class="profile-pop-head">
      <span class="profile-avatar">RP</span>
      <div><strong>${p.name} <span class="pill pill-muted">Sem. 8</span></strong><small>NIM ${p.nim}</small><small>${p.program} &bull; ${p.faculty}</small></div>
    </div>
    <div class="profile-pop-stats">
      <div><span>IPK KUMULATIF</span><strong>${p.gpa} / 4.00</strong><small style="color:var(--ink-400)">${p.gpaPredicate}</small></div>
      <div><span>BEBAN SKS</span><strong>${p.sksCompleted} / ${p.sksTotal} SKS</strong></div>
    </div>
    <div class="profile-pop-list">
      <button type="button"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.2"/><path d="M5 20c1.4-3.4 4-5 7-5s5.6 1.6 7 5"/></svg>Profil &amp; Pengaturan Akun</button>
      <button type="button"><svg viewBox="0 0 24 24"><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 5v4h4"/></svg>SIAKAD &amp; SPOT Sync <span class="pill pill-muted" style="margin-left:auto">Terhubung</span></button>
      <button type="button"><svg viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5l-8-3Z"/></svg>Log Keamanan SSO</button>
      <button type="button"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>Bantuan &amp; Panduan Sistem</button>
    </div>
    <div class="profile-pop-foot"><button type="button" class="button-ghost" id="logout-button"><svg viewBox="0 0 24 24"><path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M10 8.5 13.5 12 10 15.5M13.5 12H4"/></svg>Keluar dari SSO UPI</button></div>
  `;
  elements.popoverProfile.hidden = false;
  elements.popoverProfile.querySelector("#logout-button").addEventListener("click", handleLogout);
}

function toggleNotificationPopover() {
  const willOpen = elements.popoverNotification.hidden;
  closeAllOverlays();
  if (!willOpen) return;
  const items = [
    { title: "Masa Revisi KRS berakhir 2 hari lagi", body: "Pastikan DPA menyetujui seluruh mata kuliah sebelum 14 Feb, 23:59 WIB.", time: "10 menit lalu" },
    { title: "Validasi Sidang: 1 dokumen tertunda", body: "Persetujuan Pembimbing II belum diterima oleh Tim Akademik FPEB.", time: "1 jam lalu" },
    { title: "Pedoman Akademik UPI 2024 diperbarui", body: "Bab VIII Pasal 24 tentang kelayakan sidang direvisi.", time: "Kemarin" },
  ];
  elements.popoverNotification.innerHTML = `
    <div class="modal-head" style="padding:12px 14px">
      <div class="modal-head-text"><h2 style="font-size:0.9rem">Notifikasi Akademik</h2></div>
    </div>
    <div class="modal-body">
      ${items
        .map(
          (n) => `<div class="notif-item"><span class="notif-dot"></span><div><strong>${n.title}</strong><p>${n.body}</p><small>${n.time}</small></div></div>`,
        )
        .join("")}
    </div>
  `;
  elements.popoverNotification.hidden = false;
}

function handleLogout() {
  closeAllOverlays();
  resetConversation();
  viewCache.clear();
  elements.viewExplore.replaceChildren();
  elements.viewLibrary.replaceChildren();
  elements.viewFiles.replaceChildren();
  elements.viewHistory.replaceChildren();
  resetLoginForm();
  showScreen("login");
}

/* ============================================================
   NAV PAGES: Explore / Library / Files / History
============================================================ */

function renderPage(name) {
  if (name === "explore") elements.viewExplore.innerHTML = renderExplorePage();
  if (name === "library") elements.viewLibrary.innerHTML = renderLibraryPage();
  if (name === "files") elements.viewFiles.innerHTML = renderFilesPage();
  if (name === "history") {
    elements.viewHistory.innerHTML = renderHistoryPage();
    wireHistoryPage();
  }
}

function renderExplorePage() {
  const n = SD.exploreNews;
  const cardIcons = {
    mbkm: '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="M7 10.5V16c1.6 1.7 4 2.6 5 2.6s3.4-.9 5-2.6v-5.5"/>',
    thesis: '<path d="M7 3.5h8.5A1.5 1.5 0 0 1 17 5v16l-5-3-5 3V5A1.5 1.5 0 0 1 7 3.5Z"/>',
    finance: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5c0-1.4 1.2-2.5 2.5-2.5s2.5 1 2.5 2c0 2-5 1.5-5 4 0 1 1.2 2 2.5 2s2.5-1 2.5-2.5M12 5.5v1M12 17v1.5"/>',
  };
  return `
    <p class="page-crumb"><svg viewBox="0 0 24 24" style="width:14px;height:14px"><circle cx="12" cy="12" r="9"/><path d="m14.5 9.5-1.6 4.6-4.6 1.6 1.6-4.6 4.6-1.6Z"/></svg>Eksplorasi Portal / SAPA UPI Academic Intelligence Hub / Warta Terverifikasi</p>
    <div class="page-head">
      <div class="page-head-row">
        <div>
          <p class="section-kicker" style="font-size:0.68rem;letter-spacing:0.08em;color:var(--red-600)">DIREKTORAT AKADEMIK &amp; KEMAHASISWAAN</p>
          <h1>Eksplorasi Akademik &amp; Informasi Terkini UPI</h1>
          <p>Pusat warta regulasi resmi, tenggat waktu penting kalender akademik, rekognisi program MBKM, serta peluang beasiswa universitas berbasis data terverifikasi.</p>
        </div>
      </div>
    </div>
    <div class="page-search-row"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg><input type="text" placeholder="Cari agenda akademik, nomor SK Rektor, panduan MSIB, atau beasiswa..." /></div>
    <div class="filter-row">${n.categories.map((c, i) => `<button class="filter-pill ${i === 0 ? "active" : ""}" type="button">${c}</button>`).join("")}</div>

    <div class="urgent-card">
      <div class="urgent-head"><span class="pill pill-danger-soft">🚨 URGENT ACADEMIC NOTICE</span><span class="pill pill-muted">⏰ ${n.urgentDeadline}</span></div>
      <h3>${n.urgentTitle}</h3>
      <p>${n.urgentBody}</p>
      <div class="urgent-meta"><span>${CHECK_ICON}${n.serverStatus}</span><span>📄 ${n.reference}</span></div>
      <div class="urgent-actions"><button class="button-primary" type="button" data-nav-link="krs">Buka KRS Saya</button><button class="link-button" type="button">Pelajari Prosedur Keterlambatan</button></div>
    </div>

    <div class="section-title-row"><div><h2>Warta &amp; Regulasi Terverifikasi</h2><small>Dipublikasikan langsung oleh Rektorat, Biro Akademik, dan Fakultas UPI</small></div><a href="#">Arsip Warta Lengkap →</a></div>
    <div class="category-card-grid">
      ${n.cards
        .map(
          (c) => `<div class="category-card"><svg viewBox="0 0 24 24">${cardIcons[c.icon]}</svg><div><strong>${c.title}</strong>${c.tag ? `<span>${c.tag}</span>` : ""}</div></div>`,
        )
        .join("")}
    </div>
  `;
}

function renderLibraryPage() {
  const lib = SD.libraryDocs;
  return `
    <p class="page-crumb">📚 REPOSITORY KNOWLEDGE BASE &bull; SAPA AI RAG ENGINE v2.4</p>
    <div class="page-head">
      <div class="page-head-row">
        <div>
          <h1>Perpustakaan Regulasi &amp; Repositori Resmi UPI</h1>
          <p>Pangkalan data terpadu naskah SK Rektor, Pedoman Akademik, SOP Administrasi, dan Kurikulum MBKM yang terindeks langsung dalam AI RAG SAPA.</p>
        </div>
        <div class="page-stat-list">
          <div><span>Database Terindeks</span><strong>${lib.indexedCount} Dokumen</strong></div>
          <div><span>${lib.updatedAt}</span><strong style="color:var(--success)">RAG Vector Embeddings Active</strong></div>
        </div>
      </div>
    </div>
    <div class="filter-row">${lib.categories.map((c) => `<button class="filter-pill" type="button">${c}</button>`).join("")}</div>
    <div class="section-title-row"><div><h2>Rujukan Utama Terindeks Penuh</h2><small>Prioritas RAG SAPA High-Confidence Vector</small></div></div>
    <div class="doc-card-grid">
      ${lib.documents
        .map(
          (d) => `<div class="doc-card">
            <div class="doc-card-badges"><span class="pill pill-soft">${d.badge}</span><span class="pill pill-muted">${d.badgeTag}</span></div>
            <h3>${d.title}</h3>
            <div class="doc-card-meta">${d.meta}</div>
            <div class="doc-card-format"><svg viewBox="0 0 24 24" style="width:13px;height:13px"><path d="M7 3.5h7.5L19 8v12.5H7z"/></svg>${d.format}</div>
            <p>${d.description}</p>
            <div class="doc-card-actions"><button class="text-button" type="button">👁 Pratinjau</button><button class="text-button" type="button">⬇ Unduh PDF (${d.size})</button></div>
          </div>`,
        )
        .join("")}
    </div>
  `;
}

function renderFilesPage() {
  const f = SD.filesArchive;
  return `
    <p class="page-crumb">📁 DIREKTORAT SISTEM INFORMASI &amp; AKADEMIK &bull; Penyimpanan Terenkripsi BSrE</p>
    <div class="page-head">
      <div class="page-head-row">
        <div>
          <h1>Berkas &amp; Arsip Akademik Saya</h1>
          <p>Penyimpanan otomatis dokumen yang telah Anda terbitkan melalui SAPA UPI, riwayat transkrip, kartu rencana studi, dan draf tugas akhir.</p>
        </div>
        <div class="files-head-actions">
          <button class="text-button" type="button">🔄 Sinkronisasi Ulang SIAKAD</button>
          <button class="button-primary button-small" type="button">+ Unggah Dokumen Mandiri</button>
        </div>
      </div>
      <div class="storage-strip">☁ Kapasitas Cloud UPI &bull; ${f.storagePercent}% Terpakai <div class="storage-bar"><span style="width:${f.storagePercent}%"></span></div> ${f.storageUsedGb} GB digunakan / ${f.storageTotalGb} GB Alokasi Kampus</div>
    </div>
    <div class="page-search-row"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg><input type="text" placeholder="Cari riwayat dokumen, surat permohonan, atau draf naskah..." /></div>
    <div class="filter-row">${f.categories.map((c, i) => `<button class="filter-pill ${i === 0 ? "active" : ""}" type="button">${c}</button>`).join("")}</div>
    <div class="files-layout">
      <table class="file-table">
        <thead><tr><th>Nama Dokumen &amp; Format</th><th>Jenis Layanan</th></tr></thead>
        <tbody>
          ${f.documents
            .map(
              (d) => `<tr><td><div class="file-name-cell"><svg viewBox="0 0 24 24"><path d="M7 3.5h7.5L19 8v12.5H7z"/></svg><div><strong>${d.name}</strong><small>${d.meta}</small></div></div></td><td class="file-tag">${d.tag}</td></tr>`,
            )
            .join("")}
        </tbody>
      </table>
      <div class="side-panel">
        <div class="side-panel-head"><svg viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5l-8-3Z"/></svg>Integritas &amp; Autentikasi</div>
        <p>Sertifikasi Elektronik BSrE BSSN. Setiap dokumen resmi yang diunduh dari SAPA UPI dilengkapi QR-Code kriptografis untuk validasi keaslian publik secara instan.</p>
        <div class="qr-box"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM19 19h2v2h-2z"/></svg></div>
        <div class="side-panel-foot">
          <div>Portal Verifikasi Dokumen <strong>verifikasi.upi.edu ↗</strong></div>
          <div>Algoritma <strong>SHA-256</strong></div>
          <div>Status Node TTE <strong style="color:var(--success)">&bull; Tersinkronisasi</strong></div>
        </div>
      </div>
    </div>
  `;
}

function renderHistoryPage() {
  const h = SD.consultationHistory;
  const a = h.activeSession;
  return `
    <p class="page-crumb">SAPA UPI Academic Intelligence Hub / Riwayat Konsultasi &amp; Sesi AI</p>
    <div class="page-head">
      <div class="page-head-row">
        <div>
          <h1>Arsip Sesi Konsultasi &amp; Jejak Riwayat Akademik</h1>
          <p>Seluruh riwayat dialog penelusuran regulasi, validasi berkas skripsi, simulasi KRS, dan tanya jawab akademik bersama SAPA AI tersimpan terenkripsi.</p>
        </div>
        <div class="page-stat-list">
          <div><span>Total Dialog</span><strong>${h.totalSessions} Sesi</strong></div>
          <div><span>Rujukan Regulasi</span><strong>${h.totalCitations} Kutipan</strong></div>
          <div><span>Sinkronisasi</span><strong>${h.syncedAt}</strong></div>
        </div>
      </div>
    </div>
    <div class="filter-row">${h.categories.map((c, i) => `<button class="filter-pill ${i === 0 ? "active" : ""}" type="button">${c}</button>`).join("")}</div>
    <div class="section-title-row"><div><h2>Daftar Sesi Terindeks</h2></div><small>Urutkan: Terbaru</small></div>
    <div class="history-layout">
      <div>
        ${h.sessions
          .map(
            (s) => `<div class="session-card" data-session="${s.id}">
              <div class="session-card-head"><span>${s.tag}</span><small>${s.time}</small></div>
              <strong>${s.title}</strong>
              <p>${s.snippet}</p>
              <div class="session-card-foot">${s.meta ? `<span>🔒 ${s.meta}</span>` : ""}${s.docsCount ? `<span>📄 ${s.docsCount}</span>` : ""}${s.followUps ? `<span>${s.followUps}</span>` : ""}</div>
            </div>`,
          )
          .join("")}
      </div>
      <div class="session-preview">
        <div class="session-preview-head"><span class="pill pill-muted">Sesi Aktif #${a.id}</span><button class="button-primary button-small" type="button">Lanjutkan Percakapan Ini →</button></div>
        <small style="color:var(--ink-400)">${a.started}</small>
        <div class="session-preview-meta">
          <div><span>AKURASI RAG UPI</span><strong style="color:var(--success)">${a.ragAccuracy}</strong></div>
          <div><span>MODEL PEMBINA</span><strong>${a.model}</strong></div>
          <div><span>NODE SERVER</span><strong>${a.node}</strong></div>
        </div>
        <div class="session-chat-preview">
          <div class="user-bubble" style="justify-self:end;max-width:100%">${a.userMessage}</div>
          <div class="bot-bubble"><strong style="display:block;margin-bottom:4px;font-size:0.76rem">${a.botLabel} &bull; <span class="pill pill-muted">${a.botTag}</span> ${a.botTime}</strong></div>
        </div>
      </div>
    </div>
  `;
}

function wireHistoryPage() {
  elements.viewHistory.querySelectorAll("[data-session]").forEach((card) => {
    card.addEventListener("click", () => {
      elements.viewHistory.querySelectorAll(".session-card").forEach((c) => c.style.borderColor = "");
      card.style.borderColor = "var(--red-500)";
    });
  });
}

/* ============================================================
   GLOBAL SEARCH MODAL
============================================================ */

function openSearchModal() {
  closeAllOverlays();
  elements.modalSearch.hidden = false;
  elements.globalSearchInput.focus();
}

function closeSearchModal() {
  elements.modalSearch.hidden = true;
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
  showScreen("login");

  elements.loginForm.addEventListener("submit", handleLoginSubmit);
  elements.togglePassword.addEventListener("click", togglePasswordVisibility);
  elements.loginReset.addEventListener("click", resetLoginForm);
  elements.errorRetry.addEventListener("click", handleErrorRetry);

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
    textarea.addEventListener("focus", () => {
      if (textarea === elements.chatInput && !chatStarted) openSearchModal();
    });
  }

  elements.deepSearchToggle.addEventListener("click", () => {
    const pressed = elements.deepSearchToggle.getAttribute("aria-pressed") === "true";
    elements.deepSearchToggle.setAttribute("aria-pressed", String(!pressed));
  });

  elements.sidebarNav.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-nav]");
    if (!button) return;
    switchNav(button.dataset.nav);
  });

  elements.sidebarOpen.addEventListener("click", openSidebar);
  elements.sidebarClose.addEventListener("click", closeSidebar);
  elements.sidebarBackdrop.addEventListener("click", closeSidebar);
  elements.resetChat.addEventListener("click", resetConversation);

  elements.profileTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleProfilePopover();
  });
  elements.topbarAvatar.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleProfilePopover();
  });
  elements.notificationTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleNotificationPopover();
  });

  document.addEventListener("click", (event) => {
    if (
      !elements.popoverProfile.hidden &&
      !elements.popoverProfile.contains(event.target) &&
      !elements.profileTrigger.contains(event.target) &&
      !elements.topbarAvatar.contains(event.target)
    ) {
      elements.popoverProfile.hidden = true;
    }
    if (
      !elements.popoverNotification.hidden &&
      !elements.popoverNotification.contains(event.target) &&
      !elements.notificationTrigger.contains(event.target)
    ) {
      elements.popoverNotification.hidden = true;
    }
  });

  elements.modalSearch.addEventListener("click", (event) => {
    if (event.target === elements.modalSearch) closeSearchModal();
  });
  elements.searchAskButton.addEventListener("click", () => {
    const value = elements.globalSearchInput.value || elements.chatInput.value;
    closeSearchModal();
    submitQuestion(value);
  });
  elements.globalSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const value = elements.globalSearchInput.value;
      closeSearchModal();
      submitQuestion(value);
    }
    if (event.key === "Escape") closeSearchModal();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSidebar();
      closeAllOverlays();
    }
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-nav-link]");
    if (link) openModal(link.dataset.navLink);
  });
}

if (typeof document !== "undefined") initialize();
