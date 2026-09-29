import { knowledgeBase } from "./data/knowledge-base.js";
import { createChatResponse } from "./lib/chat-engine.js";

const QUICK_CARDS = [
  {
    label: "Jadwal Kuliah",
    description: "Informasi jadwal perkuliahan & kalender semester",
    category: "Jadwal",
    icon: '<rect x="4" y="5.5" width="16" height="14" rx="2.5"/><path d="M8 3.5v4M16 3.5v4M4 10h16"/>',
  },
  {
    label: "KRS Online",
    description: "Panduan pengisian & revisi KRS semester berjalan",
    category: "Perkuliahan",
    icon: '<path d="M7 3.5h7.5L19 8v12.5H7z"/><path d="M14 3.5V8h5M10 12h6M10 15.5h6"/>',
  },
  {
    label: "Sidang & Skripsi",
    description: "Syarat dan alur pendaftaran sidang sarjana",
    category: "Sidang",
    icon: '<path d="m2.5 9 9.5-4.5L21.5 9 12 13.5 2.5 9Z"/><path d="M6.5 11.2V16c3 2.2 8 2.2 11 0v-4.8M21.5 9v6"/>',
  },
  {
    label: "Administrasi",
    description: "Cuti kuliah, surat izin & berkas kemahasiswaan",
    category: "Administrasi",
    icon: '<rect x="4.5" y="3.5" width="15" height="17" rx="2.5"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
  },
];

const SPARKLE_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9 12 3.5Z"/></svg>';

const elements =
  typeof document === "undefined"
    ? {}
    : {
        chatMain: document.querySelector("#chat-main"),
        form: document.querySelector("#chat-form"),
        input: document.querySelector("#chat-input"),
        log: document.querySelector("#chat-log"),
        quickCards: document.querySelector("#quick-cards"),
        reset: document.querySelector("#reset-chat"),
        deepSearchToggle: document.querySelector("#deep-search-toggle"),
        sidebar: document.querySelector("#sidebar"),
        sidebarOpen: document.querySelector("#sidebar-open"),
        sidebarClose: document.querySelector("#sidebar-close"),
        sidebarBackdrop: document.querySelector("#sidebar-backdrop"),
        sidebarNav: document.querySelector(".sidebar-nav"),
      };

let responseTimer = null;

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function formatTime() {
  return new Date()
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    .replace(".", ":");
}

function scrollChat() {
  requestAnimationFrame(() => {
    elements.log.scrollTop = elements.log.scrollHeight;
  });
}

function setView(view) {
  elements.chatMain.dataset.view = view;
  elements.log.hidden = view === "landing";
}

export function appendUserMessage(text) {
  const article = createElement("article", "message user-message");
  const inner = createElement("div", "user-message-inner");
  const bubble = createElement("div", "user-bubble");
  bubble.append(createElement("p", "", text));

  const meta = createElement("span", "user-meta", formatTime());
  meta.insertAdjacentHTML(
    "beforeend",
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m2 13 4 4 7-7"/><path d="m11 15 2 2 9-9"/></svg>',
  );

  inner.append(bubble, meta);
  article.append(inner);
  elements.log.append(article);
  scrollChat();
  return article;
}

function createBotMessage(extraClass) {
  const article = createElement("article", `message bot-message${extraClass ? ` ${extraClass}` : ""}`);
  const avatar = createElement("div", "message-avatar");
  avatar.setAttribute("aria-hidden", "true");
  const mascot = createElement("img");
  mascot.src = "./assets/mascot-sapa.png";
  mascot.alt = "";
  avatar.append(mascot);
  const body = createElement("div", "message-body");
  article.append(avatar, body);
  return { article, body };
}

function showTyping() {
  const { article, body } = createBotMessage("typing-message");
  article.dataset.typing = "true";

  const bubble = createElement("div", "typing-bubble");
  bubble.setAttribute("aria-label", "SAPA UPI sedang mencari informasi");
  bubble.append(createElement("span", "", "SAPA sedang mencari informasi akademik..."));
  const dots = createElement("span", "typing-dots");
  dots.append(createElement("i"), createElement("i"), createElement("i"));
  bubble.append(dots);

  body.append(bubble, createElement("span", "message-time", "Baru saja"));
  elements.log.append(article);
  scrollChat();
}

function removeTyping() {
  elements.log.querySelector("[data-typing='true']")?.remove();
}

function renderAnswerCard(entry, message, body) {
  const card = createElement("div", "answer-card");
  card.append(createElement("p", "", entry.lead ?? message));

  if (entry.points?.length) {
    const list = createElement("ul", "answer-points");
    for (const point of entry.points) {
      list.append(createElement("li", "", point));
    }
    card.append(list);
  }

  if (entry.closing) card.append(createElement("p", "", entry.closing));
  body.append(card);
}

function renderSourceRow(entry, body) {
  const row = createElement("div", "source-row");

  const pill = createElement("button", "source-pill");
  pill.type = "button";
  pill.setAttribute("aria-expanded", "false");
  pill.title = "Lihat detail sumber";
  pill.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h7.5L19 8v12.5H7z"/><path d="M14 3.5V8h5"/></svg>';
  pill.append(createElement("span", "", `Source: ${entry.sourceTitle}`));

  row.append(pill, createElement("span", "message-time", formatTime()));

  const detail = createElement("div", "source-detail");
  detail.hidden = true;
  const meta = createElement("dl", "source-meta");
  const fields = [
    ["Pemilik informasi", entry.sourceOwner],
    ["Periode berlaku", entry.validPeriod],
    ["Terakhir diperbarui", entry.updatedAt],
    ["Kategori", entry.category],
  ];
  for (const [label, value] of fields) {
    meta.append(createElement("dt", "", label), createElement("dd", "", value));
  }
  detail.append(
    meta,
    createElement("p", "escalation-text", `Jika masih perlu dipastikan: ${entry.escalation}`),
  );

  pill.addEventListener("click", () => {
    detail.hidden = !detail.hidden;
    pill.setAttribute("aria-expanded", String(!detail.hidden));
  });

  body.append(row, detail);
}

function renderFollowUps(questions, body) {
  const row = createElement("div", "chip-row");
  for (const question of questions) {
    const button = createElement("button", "chip-button");
    button.type = "button";
    button.innerHTML = SPARKLE_ICON;
    button.append(createElement("span", "", question));
    button.addEventListener("click", () => submitQuestion(question));
    row.append(button);
  }
  body.append(row);
}

function renderSuggestions(response, body) {
  const card = createElement("div", "answer-card");
  card.append(createElement("p", "", response.message));
  body.append(card);

  const list = createElement("div", "suggestion-list");
  for (const suggestion of response.suggestions) {
    const button = createElement("button", "suggestion-button");
    button.type = "button";
    const labels = createElement("span");
    labels.append(
      createElement("strong", "", suggestion.title),
      createElement("small", "", suggestion.category),
    );
    button.append(labels, createElement("span", "", "→"));
    button.addEventListener("click", () => submitQuestion(suggestion.sampleQuestion));
    list.append(button);
  }
  body.append(list);
}

function renderFallback(response, body) {
  const card = createElement("div", "answer-card");
  card.append(createElement("p", "", response.message));
  body.append(card);

  const fallback = createElement("div", "fallback-card");
  fallback.append(createElement("strong", "", "Butuh bantuan? Hubungi pihak berwenang"));
  const list = createElement("ul");
  for (const option of response.escalationOptions) {
    list.append(createElement("li", "", option));
  }
  fallback.append(list);
  body.append(fallback);
}

export function appendBotResponse(response) {
  const { article, body } = createBotMessage();

  if (response.type === "answer") {
    renderAnswerCard(response.entry, response.message, body);
    renderSourceRow(response.entry, body);
    renderFollowUps(response.followUpQuestions, body);
  } else if (response.type === "suggestions") {
    renderSuggestions(response, body);
  } else if (response.type === "fallback") {
    renderFallback(response, body);
  } else {
    const card = createElement("div", "answer-card");
    card.append(createElement("p", "", response.message));
    body.append(card);
  }

  elements.log.append(article);
  scrollChat();
  return article;
}

function renderQuickCards() {
  elements.quickCards.replaceChildren();
  for (const meta of QUICK_CARDS) {
    const entry = knowledgeBase.find((item) => item.category === meta.category);
    if (!entry) continue;

    const card = createElement("button", "quick-card");
    card.type = "button";
    const icon = createElement("span", "quick-card-icon");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = `<svg viewBox="0 0 24 24">${meta.icon}</svg>`;
    card.append(
      icon,
      createElement("strong", "", meta.label),
      createElement("p", "", meta.description),
    );
    card.addEventListener("click", () => submitQuestion(entry.questions[0]));
    elements.quickCards.append(card);
  }
}

function resizeInput() {
  elements.input.style.height = "auto";
  elements.input.style.height = `${Math.min(elements.input.scrollHeight, 150)}px`;
}

function submitQuestion(rawQuestion) {
  const question = String(rawQuestion ?? "").trim();
  if (!question) return;

  setView("chat");
  clearTimeout(responseTimer);
  removeTyping();
  appendUserMessage(question);
  elements.input.value = "";
  resizeInput();
  showTyping();
  elements.input.focus();

  responseTimer = window.setTimeout(() => {
    removeTyping();
    appendBotResponse(createChatResponse(question, knowledgeBase));
  }, 620);
}

export function resetConversation() {
  clearTimeout(responseTimer);
  elements.log.replaceChildren();
  elements.input.value = "";
  resizeInput();
  setView("landing");
  closeSidebar();
  elements.input.focus();
}

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

function initialize() {
  renderQuickCards();
  setView("landing");

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitQuestion(elements.input.value);
  });

  elements.input.addEventListener("input", resizeInput);
  elements.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitQuestion(elements.input.value);
    }
  });

  elements.deepSearchToggle.addEventListener("click", () => {
    const pressed = elements.deepSearchToggle.getAttribute("aria-pressed") === "true";
    elements.deepSearchToggle.setAttribute("aria-pressed", String(!pressed));
  });

  elements.sidebarNav.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-nav]");
    if (!button) return;
    elements.sidebarNav.querySelector(".active")?.classList.remove("active");
    button.classList.add("active");
  });

  elements.sidebarOpen.addEventListener("click", openSidebar);
  elements.sidebarClose.addEventListener("click", closeSidebar);
  elements.sidebarBackdrop.addEventListener("click", closeSidebar);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSidebar();
  });

  elements.reset.addEventListener("click", resetConversation);
}

if (typeof document !== "undefined") initialize();
