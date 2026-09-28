import { knowledgeBase } from "./data/knowledge-base.js";
import { createChatResponse } from "./lib/chat-engine.js";

const welcomeMarkup = `
  <article class="message bot-message welcome-message">
    <div class="message-avatar" aria-hidden="true">✦</div>
    <div class="message-content">
      <span class="message-label">SAPA UPI</span>
      <p>Halo! Tanyakan informasi tentang jadwal, administrasi, perkuliahan, tugas akhir, sidang, atau kelulusan.</p>
      <p class="message-hint">Coba: “Apa saja persyaratan pendaftaran sidang?”</p>
    </div>
  </article>`;

const elements =
  typeof document === "undefined"
    ? {}
    : {
        form: document.querySelector("#chat-form"),
        input: document.querySelector("#chat-input"),
        log: document.querySelector("#chat-log"),
        categoryList: document.querySelector("#category-list"),
        sampleQuestions: document.querySelector("#sample-questions"),
        questionCount: document.querySelector("#question-count"),
        reset: document.querySelector("#reset-chat"),
      };

let activeCategory = "Semua";
let responseTimer = null;

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function scrollChat() {
  requestAnimationFrame(() => {
    elements.log.scrollTop = elements.log.scrollHeight;
  });
}

export function appendUserMessage(text) {
  const article = createElement("article", "message user-message");
  const content = createElement("div", "message-content");
  content.append(createElement("p", "", text));
  article.append(content);
  elements.log.append(article);
  scrollChat();
  return article;
}

function createBotMessage() {
  const article = createElement("article", "message bot-message");
  const avatar = createElement("div", "message-avatar", "✦");
  avatar.setAttribute("aria-hidden", "true");
  const content = createElement("div", "message-content");
  content.append(createElement("span", "message-label", "SAPA UPI"));
  article.append(avatar, content);
  return { article, content };
}

function showTyping() {
  const article = createElement("article", "message bot-message typing-message");
  article.dataset.typing = "true";
  const avatar = createElement("div", "message-avatar", "✦");
  avatar.setAttribute("aria-hidden", "true");
  const content = createElement("div", "message-content");
  content.setAttribute("aria-label", "SAPA UPI sedang mencari informasi");
  content.append(createElement("i"), createElement("i"), createElement("i"));
  article.append(avatar, content);
  elements.log.append(article);
  scrollChat();
}

function removeTyping() {
  elements.log.querySelector("[data-typing='true']")?.remove();
}

export function renderSourceCard(entry) {
  const card = createElement("section", "source-card");
  const header = createElement("div", "source-card-header");
  const titleWrap = createElement("div");
  titleWrap.append(
    createElement("span", "message-label", "Sumber informasi contoh"),
    createElement("h3", "", entry.sourceTitle),
  );

  const link = createElement("a", "", "Buka rujukan ↗");
  link.href = entry.sourceUrl;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.setAttribute("aria-label", `Buka rujukan contoh ${entry.sourceTitle}`);
  header.append(titleWrap, link);

  const metadata = createElement("dl", "source-meta");
  const fields = [
    ["Pemilik informasi", entry.sourceOwner],
    ["Periode berlaku", entry.validPeriod],
    ["Terakhir diperbarui", entry.updatedAt],
    ["Kategori", entry.category],
  ];
  for (const [label, value] of fields) {
    const item = createElement("div");
    item.append(createElement("dt", "", label), createElement("dd", "", value));
    metadata.append(item);
  }

  const escalation = createElement(
    "p",
    "escalation-text",
    `Jika masih perlu dipastikan: ${entry.escalation}`,
  );
  card.append(header, metadata, escalation);
  return card;
}

function renderSuggestions(response, content) {
  content.append(createElement("p", "", response.message));
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
  content.append(list);
}

function renderFallback(response, content) {
  content.append(createElement("p", "", response.message));
  const card = createElement("div", "fallback-card");
  card.append(createElement("strong", "", "Arah klarifikasi yang disarankan"));
  const list = createElement("ul");
  for (const option of response.escalationOptions) {
    list.append(createElement("li", "", option));
  }
  card.append(list);
  content.append(card);
}

export function appendBotResponse(response) {
  const { article, content } = createBotMessage();

  if (response.type === "answer") {
    const status = createElement("div", "answer-status");
    status.append(
      createElement("span", "", response.verificationLabel),
      createElement("span", "", response.confidenceLabel),
    );
    content.append(status, createElement("p", "", response.message));
    content.append(renderSourceCard(response.entry));
  } else if (response.type === "suggestions") {
    renderSuggestions(response, content);
  } else if (response.type === "fallback") {
    renderFallback(response, content);
  } else {
    content.append(createElement("p", "", response.message));
  }

  elements.log.append(article);
  scrollChat();
  return article;
}

function updateSamples(category = activeCategory) {
  activeCategory = category;
  const filtered =
    category === "Semua"
      ? knowledgeBase
      : knowledgeBase.filter((entry) => entry.category === category);

  elements.sampleQuestions.replaceChildren();
  for (const entry of filtered.slice(0, 5)) {
    const button = createElement("button", "sample-question");
    button.type = "button";
    button.append(
      createElement("span", "", entry.questions[0]),
      createElement("span", "", "↗"),
    );
    button.addEventListener("click", () => submitQuestion(entry.questions[0]));
    elements.sampleQuestions.append(button);
  }
  elements.questionCount.textContent = `${filtered.length} topik`;
}

function resizeInput() {
  elements.input.style.height = "auto";
  elements.input.style.height = `${Math.min(elements.input.scrollHeight, 120)}px`;
}

function submitQuestion(rawQuestion) {
  const question = String(rawQuestion ?? "").trim();
  if (!question) return;

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
  }, 480);
}

export function resetConversation() {
  clearTimeout(responseTimer);
  elements.log.innerHTML = welcomeMarkup;
  elements.input.value = "";
  resizeInput();
  elements.input.focus();
}

function initialize() {
  updateSamples();

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitQuestion(elements.input.value);
  });

  elements.input.addEventListener("input", resizeInput);
  elements.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      elements.form.requestSubmit();
    }
  });

  elements.categoryList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    elements.categoryList.querySelector(".active")?.classList.remove("active");
    button.classList.add("active");
    updateSamples(button.dataset.category);
  });

  elements.reset.addEventListener("click", resetConversation);
}

if (typeof document !== "undefined") initialize();
