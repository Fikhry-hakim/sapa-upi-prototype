/**
 * Halaman Setting: 9 tab sesuai desain Figma (General, Notifications, Profile,
 * Security and login, Archived chats, Voice, Storage, Keyboard, Data controls).
 *
 * Teks memakai bahasa Inggris persis seperti di desain. Yang bisa dijalankan
 * betul-betul dijalankan: bahasa, dikte, pintasan keyboard, sesi aktif, ekspor,
 * arsip, dan hapus riwayat. Preferensi yang belum punya mesin di baliknya
 * (notifikasi, lokasi, "Improve SAPA UPI") hanya tersimpan di perangkat ini.
 *
 * Semua teks dipasang lewat textContent, tidak pernah innerHTML, kecuali ikon
 * SVG bawaan di bawah.
 */

import {
  CHANNELS,
  NOTIFICATIONS,
  SHORTCUT_GROUPS,
  DEFAULT_SHORTCUTS,
  capacityPercent,
  comboFromEvent,
  conflictsWith,
  formatBytes,
  isValidCombo,
  loadPrefs,
  loadShortcuts,
  matchShortcut,
  savePrefs,
  saveShortcuts,
  STORAGE_LIMIT_BYTES,
} from "./lib/settings-prefs.js";
import { LANG_KEY, onLangChange } from "./lib/i18n.js";
import { SETTINGS_EN_FORMATS, SETTINGS_ID, SETTINGS_ID_FORMATS, SETTINGS_MESSAGES_ID } from "./lib/settings-id.js";

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;

const ICONS = {
  general: svg('<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>'),
  notifications: svg('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
  profile: svg('<circle cx="12" cy="8" r="3.4"/><path d="M5 20c1.4-3.4 4-5 7-5s5.6 1.6 7 5"/>'),
  security: svg('<path d="M12 3 4.5 6v5.5c0 4.4 3 7.6 7.5 9.5 4.5-1.9 7.5-5.1 7.5-9.5V6z"/>'),
  archived: svg('<rect x="3.5" y="4" width="17" height="5" rx="1.5"/><path d="M5 9v9.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V9"/><path d="M10 13h4"/>'),
  voice: svg('<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/>'),
  storage: svg('<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>'),
  keyboard: svg('<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>'),
  data: svg('<circle cx="8.5" cy="8" r="2.8"/><path d="M3.5 18c.8-2.6 2.6-4 5-4s4.2 1.4 5 4"/><circle cx="17" cy="14" r="1.8"/><path d="M17 10.5v1M17 16.5v1M13.8 12.2l.9.5M19.3 15.3l.9.5M13.8 15.8l.9-.5M19.3 12.7l.9-.5"/>'),
  chevron: svg('<path d="m9 6 6 6-6 6"/>'),
  down: svg('<path d="m6 9 6 6 6-6"/>'),
  lock: svg('<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>'),
  pencil: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
  restore: svg('<path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4v4.5h4.5"/>'),
  doc: svg('<path d="M7 3.5h7.5L19 8v12.5H7z"/><path d="M14 3.5V8h5"/>'),
  image: svg('<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m4 17 5-4 4 3 3-2 4 3"/>'),
  archiveBig: svg('<rect x="3.5" y="4" width="17" height="5" rx="1.5"/><path d="M5 9v9.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V9"/><path d="M10 13h4"/>'),
};

const SECTIONS = [
  { id: "general", label: "General", icon: ICONS.general },
  { id: "notifications", label: "Notifications", icon: ICONS.notifications },
  { id: "profile", label: "Profile", icon: ICONS.profile, needsAccount: true },
  { id: "security", label: "Security and login", icon: ICONS.security, needsAccount: true },
  { id: "archived", label: "Archived chats", icon: ICONS.archived, needsAccount: true },
  { id: "voice", label: "Voice", icon: ICONS.voice },
  { id: "storage", label: "Storage", icon: ICONS.storage, needsAccount: true },
  { id: "keyboard", label: "Keyboard", icon: ICONS.keyboard },
  { id: "data", label: "Data controls", icon: ICONS.data, needsAccount: true },
  // Halaman Bantuan memakai desain aplikasi sendiri; tidak ada di daftar samping, dibuka dari menu profil.
  { id: "help", label: "Bantuan", icon: ICONS.general, hidden: true },
];

/** Kata yang bisa dicari di kotak "Search settings", selain nama tab-nya. */
const SEARCH_TERMS = {
  general: "language app ui auto detect",
  notifications: NOTIFICATIONS.map((item) => `${item.title} ${item.text}`).join(" "),
  profile: "full name email account",
  security: "password sessions login devices security recommendations how you log in",
  archived: "archived chats archive restore",
  voice: "voice language dictation recordings microphone",
  storage: "storage files images capacity used",
  keyboard: "shortcuts keys composer chat app restore defaults",
  data: "shared links improve location archived archive all delete export cookie privacy data",
};

const make = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const icon = (name, className = "") => {
  const span = make("span", `s-icon ${className}`.trim());
  span.innerHTML = ICONS[name];
  return span;
};


/* ------------------------------------------------------------ bahasa */

const ATTRS = ["aria-label", "title", "placeholder"];
const originals = new WeakMap(); // teks asli (Inggris) tiap simpul, supaya bisa dikembalikan saat bahasa berganti

/** Terjemahkan seluruh teks di bawah `root` ke Indonesia, atau kembalikan ke aslinya (Inggris). */
function localize(root, toId) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!originals.has(node)) originals.set(node, node.nodeValue);
    const original = originals.get(node);
    const key = original.trim();
    const translated = toId ? SETTINGS_ID[key] : null;
    node.nodeValue = translated ? original.replace(key, translated) : original;
  }
  const elements = root.nodeType === 1 ? [root, ...root.querySelectorAll("*")] : [...root.querySelectorAll("*")];
  for (const el of elements) {
    for (const name of ATTRS) {
      if (!el.hasAttribute(name)) continue;
      const stash = `data-en-${name}`;
      if (!el.hasAttribute(stash)) el.setAttribute(stash, el.getAttribute(name));
      const original = el.getAttribute(stash);
      el.setAttribute(name, (toId && SETTINGS_ID[original]) || original);
    }
  }
}

export function createSettings(deps) {
  const {
    api,
    getAccount,
    apiEnabled,
    showToast,
    getLang,
    setLang,
    goHome,
    openPasswordDialog,
    logoutEverywhere,
    exportHistory,
    deleteAllHistory,
    refreshHistory,
    actions,
    onPrefsChange,
    helpContact,
  } = deps;

  const $ = (id) => document.getElementById(id);
  const isId = () => getLang() === "id";
  /** Teks statis: Inggris dari desain, atau terjemahannya bila bahasa Indonesia dipilih. */
  const tl = (text) => (isId() ? SETTINGS_ID[text] ?? text : text);
  /** Pesan toast dan konfirmasi. */
  const t = (text) => (isId() ? SETTINGS_MESSAGES_ID[text] ?? SETTINGS_ID[text] ?? text : text);
  const fmt = () => (isId() ? SETTINGS_ID_FORMATS : SETTINGS_EN_FORMATS);
  const root = () => $("view-settings");
  const localizeAll = (node = root()) => localize(node, isId());
  const itemsEl = $("settings-items");
  const titleEl = $("settings-title");
  const subEl = $("settings-sub");
  const contentEl = $("settings-card");
  const searchEl = $("settings-search");
  const noneEl = $("settings-none");

  let prefs = loadPrefs(localStorage);
  // Pilihan lama dari tombol ID/EN di bilah atas: dihormati sampai pengguna memilih "Auto detect".
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (prefs.language === "auto" && (stored === "id" || stored === "en")) prefs.language = stored;
  } catch {
    // Tanpa penyimpanan: bahasa mengikuti browser.
  }
  let shortcuts = loadShortcuts(localStorage);
  let current = "general";
  let listening = null; // id pintasan yang sedang menunggu kombinasi baru

  const savePrefsNow = () => {
    savePrefs(localStorage, prefs);
    onPrefsChange?.(prefs);
  };

  /* ------------------------------------------------------------ bahan */

  function group(label, rows) {
    const wrap = make("section", "s-group");
    if (label) wrap.append(make("h2", "s-group-label", label));
    const card = make("div", "s-card");
    for (const row of rows) card.append(row);
    wrap.append(card);
    return wrap;
  }

  /** Satu baris: judul + keterangan di kiri, kontrol di kanan. `onClick` menjadikannya baris yang bisa diklik (panah). */
  function row({ title, text, control, onClick, caps = false }) {
    const el = make(onClick ? "button" : "div", `s-row${onClick ? " is-link" : ""}`);
    if (onClick) {
      el.type = "button";
      el.addEventListener("click", onClick);
    }
    const label = make("span", "s-label");
    label.append(make("strong", caps ? "s-caps" : "", title));
    if (text) label.append(make("small", "", text));
    el.append(label);
    if (control) el.append(control);
    else if (onClick) el.append(icon("chevron", "s-arrow"));
    return el;
  }

  function select(options, value, onChange, ariaLabel) {
    const wrap = make("span", "s-select");
    const el = document.createElement("select");
    el.setAttribute("aria-label", ariaLabel);
    for (const option of options) {
      const [optionValue, label] = Array.isArray(option) ? option : [option, option];
      const node = make("option", "", label);
      node.value = optionValue;
      node.selected = optionValue === value;
      el.append(node);
    }
    el.addEventListener("change", () => onChange(el.value));
    wrap.append(el, icon("down", "s-select-caret"));
    return wrap;
  }

  function toggle(on, onChange, ariaLabel) {
    const el = make("button", `switch${on ? " is-on" : ""}`);
    el.type = "button";
    el.setAttribute("role", "switch");
    el.setAttribute("aria-checked", String(on));
    el.setAttribute("aria-label", ariaLabel);
    el.append(document.createElement("i"));
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      const next = el.getAttribute("aria-checked") !== "true";
      el.classList.toggle("is-on", next);
      el.setAttribute("aria-checked", String(next));
      onChange(next);
    });
    return el;
  }

  function button(label, onClick, { danger = false, ariaLabel } = {}) {
    const el = make("button", `s-btn${danger ? " is-danger" : ""}`, label);
    el.type = "button";
    if (ariaLabel) el.setAttribute("aria-label", ariaLabel);
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      onClick(el);
    });
    return el;
  }

  const note = (text) => make("p", "s-note", text);

  /* ------------------------------------------------------------ dialog */

  function dialog(title, build, { wide = false } = {}) {
    const overlay = make("div", "modal");
    overlay.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    const scrim = make("div", "modal-scrim");
    const box = make("div", `modal-box s-dialog${wide ? " is-wide" : ""}`);
    overlay.append(scrim, box);

    const close = () => {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    };
    function onKey(event) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    scrim.addEventListener("click", close);

    const head = make("div", "modal-head");
    head.append(make("h2", "", title));
    box.append(head);
    const body = make("div", "s-dialog-body");
    box.append(body);
    build(body, close);

    const actionsRow = make("div", "modal-actions");
    const done = make("button", "btn", "Close");
    done.type = "button";
    done.addEventListener("click", close);
    actionsRow.append(done);
    box.append(actionsRow);

    document.body.append(overlay);
    localizeAll(overlay);
    done.focus();
    return close;
  }

  const emptyState = (iconName, title, text) => {
    const wrap = make("div", "s-empty");
    const badge = make("span", "s-empty-badge");
    badge.append(icon(iconName));
    wrap.append(badge, make("strong", "", title), make("small", "", text));
    return wrap;
  };

  /** Halaman Bantuan (desain aplikasi): kontak program studi. Ditulis Indonesia; i18n.js menerjemahkannya ke English. */
  function renderHelp() {
    const link = (href, text) => {
      const a = make("a", "", text);
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener";
      return a;
    };
    const plain = (label, text, value) => {
      const el = make("div", "s-row");
      const labelEl = make("span", "s-label");
      labelEl.append(make("strong", "", label));
      if (text) labelEl.append(make("small", "", text));
      el.append(labelEl);
      if (value instanceof Node) el.append(value);
      else if (value) el.append(make("span", "s-help-value", value));
      return el;
    };
    return [
      group("", [
        plain("Program Studi", "Pihak yang menerbitkan pedoman", helpContact.program),
        plain("Email", "", link(`mailto:${helpContact.email}`, helpContact.email)),
        plain("Telepon", "", helpContact.phone),
        plain("Alamat", "", helpContact.address),
        plain("Laman", "", link(helpContact.site, "kd-tasikmalaya.upi.edu")),
        plain("Tentang jawaban SAPA", "Jawaban diambil dari dokumen yang tersedia. Keputusan resmi tetap ada di program studi", ""),
      ]),
    ];
  }

  /* ------------------------------------------------------------ tab */

  const LANGUAGE_OPTIONS = [["auto", "Auto detect"], ["id", "Indonesia"], ["en", "English"]];

  function renderGeneral() {
    return [
      group("", [
        row({
          title: "Language",
          text: "Language for the app UI",
          control: select(LANGUAGE_OPTIONS, prefs.language, (value) => {
            prefs.language = value;
            savePrefsNow();
            if (value === "auto") {
              // Auto detect: ikuti bahasa browser dan jangan simpan pilihan tetap.
              try {
                localStorage.removeItem(LANG_KEY);
              } catch {
                // abaikan
              }
              setLang((navigator.language ?? "id").toLowerCase().startsWith("en") ? "en" : "id", { persist: false });
            } else {
              setLang(value);
            }
          }, "Language"),
        }),
      ]),
    ];
  }

  function renderNotifications() {
    const rows = NOTIFICATIONS.map((item) =>
      row({
        title: item.title,
        text: item.text,
        control: select(CHANNELS, prefs.notifications[item.id], (value) => {
          prefs.notifications[item.id] = value;
          savePrefsNow();
        }, item.title),
      }),
    );
    return [group("", rows)];
  }

  function renderProfile() {
    const account = getAccount();
    const lockedValue = (value) => {
      const wrap = make("span", "s-value-icon");
      wrap.append(icon("lock"));
      wrap.title = "Managed by your UPI account";
      return wrap;
    };
    const profileRow = (title, value) => {
      const el = make("div", "s-row s-row-profile");
      const label = make("span", "s-label");
      label.append(make("small", "s-caps", title), make("strong", "s-value", value || "—"));
      el.append(label, lockedValue(value));
      return el;
    };
    return [group("", [profileRow("FULL NAME", account.name), profileRow("EMAIL", account.email)])];
  }

  function fmtDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleString(getLang() === "en" ? "en-GB" : "id-ID", { dateStyle: "medium", timeStyle: "short" });
  }

  function openSessions() {
    dialog("Active Sessions", (body) => {
      const list = make("div", "s-sessions");
      body.append(make("p", "s-dialog-intro", "Devices currently signed in to your SAPA UPI account."), list);
      const load = async () => {
        list.replaceChildren(make("p", "s-dialog-intro", "Loading…"));
        try {
          const { sessions } = await api("/auth/sessions");
          list.replaceChildren();
          for (const session of sessions) {
            const item = make("div", "s-session");
            const text = make("span", "s-label");
            text.append(
              make("strong", "", `${session.method === "password" ? tl("Email and password") : "Google"}${session.current ? ` • ${fmt().thisDevice}` : ""}`),
              make("small", "", fmt().signedIn(fmtDate(session.createdAt), fmtDate(session.lastUsedAt))),
            );
            item.append(text);
            if (!session.current) {
              item.append(
                button("Sign out", async () => {
                  try {
                    await api(`/auth/sessions/${session.id}`, { method: "DELETE" });
                    showToast(t("Session signed out."));
                    load();
                  } catch {
                    showToast(t("Could not sign out this session."));
                  }
                }),
              );
            }
            list.append(item);
          }
          if (!sessions.length) list.append(make("p", "s-dialog-intro", "No active sessions."));
        } catch {
          list.replaceChildren(make("p", "s-dialog-intro", "Could not load sessions. Try again later."));
        }
        localizeAll(list);
      };
      load();
      body.append(button("Sign out of all devices", logoutEverywhere, { danger: true }));
    });
  }

  function renderSecurity() {
    const account = getAccount();
    return [
      group("SECURITY RECOMMENDATIONS", [
        row({ title: "Review where you've logged in", text: "Review devices and active login sessions.", onClick: openSessions }),
      ]),
      group("HOW YOU LOG IN", [
        row({
          title: "Password",
          text: account.hasPassword ? "Manage your account password." : "Set a password to sign in with your email, without Google.",
          control: button(account.hasPassword ? "Change" : "Set", openPasswordDialog),
        }),
      ]),
      group("SESSIONS", [
        row({
          title: "Active Sessions",
          text: "Review the devices currently signed in to your SAPA UPI account.",
          control: button("View Sessions", openSessions),
        }),
      ]),
    ];
  }

  /** Percakapan yang diarsipkan: daftar dengan tombol kembalikan dan hapus. */
  async function renderArchived(container) {
    const holder = make("div", "s-card s-card-pad");
    holder.append(emptyState("archiveBig", "Loading…", ""));
    container.append(holder);
    try {
      const { conversations } = await api("/conversations/archived");
      holder.replaceChildren();
      holder.className = "s-card";
      if (!conversations.length) {
        holder.className = "s-card s-card-pad";
        holder.append(emptyState("archiveBig", "No archived chats", "Chats you archive will appear here."));
        return;
      }
      for (const conversation of conversations) {
        holder.append(
          row({
            title: conversation.title,
            text: fmt().archivedAt(fmtDate(conversation.archived_at)),
            control: (() => {
              const wrap = make("span", "s-actions");
              wrap.append(
                button("Restore", async () => {
                  try {
                    await api(`/conversations/${conversation.id}/unarchive`, { method: "POST" });
                    showToast(t("Chat restored."));
                    refreshHistory();
                    render();
                  } catch {
                    showToast(t("Could not restore this chat."));
                  }
                }),
                button("Delete", async () => {
                  if (!window.confirm(t("Delete this chat permanently? This cannot be undone."))) return;
                  try {
                    await api(`/conversations/${conversation.id}`, { method: "DELETE" });
                    showToast(t("Chat deleted."));
                    render();
                  } catch {
                    showToast(t("Could not delete this chat."));
                  }
                }, { danger: true }),
              );
              return wrap;
            })(),
          }),
        );
      }
    } catch {
      holder.replaceChildren(emptyState("archiveBig", "Could not load archived chats", "Try again later."));
    }
    localizeAll(holder);
  }

  function renderVoice() {
    return [
      group("VOICE PREFERENCES", [
        row({
          title: "Voice",
          text: "Choose the voice used for SAPA UPI voice responses.",
          control: select(["Default"], prefs.voice.voice, (value) => {
            prefs.voice.voice = value;
            savePrefsNow();
          }, "Voice"),
        }),
        row({
          title: "Language",
          text: "Choose the language used for voice interaction.",
          control: select(LANGUAGE_OPTIONS, prefs.voice.language, (value) => {
            prefs.voice.language = value;
            savePrefsNow();
          }, "Voice language"),
        }),
      ]),
      group("DICTATION", [
        row({
          title: "Enable Dictation",
          text: "Use voice input to dictate academic questions.",
          control: toggle(prefs.dictation, (on) => {
            prefs.dictation = on;
            savePrefsNow();
          }, "Enable Dictation"),
        }),
        row({
          title: "Recent Recordings",
          text: "Review recent voice recordings.",
          onClick: () =>
            dialog("Recent Recordings", (body) => {
              body.append(emptyState("voice", "No recordings saved", "Voice input is transcribed and discarded. SAPA UPI does not keep recordings."));
            }),
        }),
      ]),
    ];
  }

  async function renderStorage(container) {
    const holder = make("div", "s-storage");
    container.append(holder);
    let bytes = 0;
    try {
      bytes = (await api("/conversations/usage")).bytes ?? 0;
    } catch {
      // Tanpa angka dari server, kartu tetap tampil dengan 0.
    }
    const summary = make("div", "s-card s-storage-card");
    const top = make("div", "s-storage-top");
    top.append(
      make("strong", "", fmt().used(formatBytes(bytes), formatBytes(STORAGE_LIMIT_BYTES))),
      make("span", "s-storage-capacity", fmt().capacity(capacityPercent(bytes))),
    );
    const bar = make("div", "s-bar");
    const fill = make("i");
    fill.style.width = `${Math.max(1.5, Math.min(100, (bytes / STORAGE_LIMIT_BYTES) * 100))}%`;
    bar.append(fill);
    summary.append(top, bar, make("small", "", "Manage files and images stored in your SAPA UPI account."));

    const manage = (kind, iconName, title, subtitle) =>
      row({
        title,
        text: subtitle,
        onClick: () => dialog(title, (body) => body.append(emptyState(iconName, `No ${kind} stored`, `You have not uploaded any ${kind} to your account.`))),
      });
    holder.append(
      summary,
      group("MANAGE STORAGE", [
        manage("files", "doc", "Files", "0 B • 0 files"),
        manage("images", "image", "Images", "0 B • 0 images"),
      ]),
    );
  }

  /* ------------------------------------------------------------ keyboard */

  function keyChips(id, item) {
    const wrap = make("button", `s-keys${listening === id ? " is-listening" : ""}`);
    wrap.type = "button";
    wrap.setAttribute("aria-label", `${tl("Change shortcut")}: ${item.keys.join(" + ")}`);
    if (listening === id) {
      wrap.append(make("span", "s-key-hint", "Type the new keys…"));
    } else {
      item.keys.forEach((key, index) => {
        if (index) wrap.append(make("span", "s-key-plus", "+"));
        wrap.append(make("kbd", "", key));
      });
    }
    wrap.addEventListener("click", (event) => {
      event.stopPropagation();
      listening = listening === id ? null : id;
      render();
    });
    return wrap;
  }

  function renderKeyboard() {
    const groups = SHORTCUT_GROUPS.map((section) =>
      group(
        section.label,
        section.items.map((definition) => {
          const item = shortcuts[definition.id];
          const el = make("div", "s-row s-row-key");
          el.append(
            toggle(item.on, (on) => {
              item.on = on;
              saveShortcuts(localStorage, shortcuts);
            }, definition.title),
            make("span", "s-key-title", definition.title),
            keyChips(definition.id, item),
          );
          return el;
        }),
      ),
    );
    const restore = make("div", "s-restore");
    restore.append(
      (() => {
        const el = button("Restore defaults", () => {
          shortcuts = structuredClone(DEFAULT_SHORTCUTS);
          listening = null;
          saveShortcuts(localStorage, shortcuts);
          render();
          showToast(t("Shortcuts restored."));
        });
        el.prepend(icon("restore"));
        return el;
      })(),
    );
    return [...groups, restore];
  }

  /* ------------------------------------------------------------ data controls */

  function openCookies() {
    dialog("Cookie Preferences", (body) => {
      body.append(make("p", "s-dialog-intro", "SAPA UPI stores a few small items on this device so the app works the way you left it."));
      body.append(
        group("", [
          row({ title: "Essential", text: "Language, theme, sidebar, and sign-in session. Always on.", control: (() => { const t = toggle(true, () => {}, "Essential"); t.disabled = true; return t; })() }),
        ]),
      );
    });
  }

  function openPrivacy() {
    dialog("Privacy Settings", (body) => {
      for (const line of [
        "Anyone can ask questions without signing in. Questions are answered from official documents.",
        "Signing in with a UPI account saves your chat history so you can continue later. Only you can read it.",
        "You can export, archive, or delete your history at any time from Data controls.",
        "Voice recordings are transcribed and discarded; they are never stored.",
      ]) {
        body.append(make("p", "s-dialog-intro", line));
      }
    });
  }

  function openSharedLinks() {
    dialog("Shared Links", (body) => {
      body.append(emptyState("data", "No shared links", "Links you share to conversations will appear here."));
    });
  }

  function renderData() {
    const archiveAll = async () => {
      if (!window.confirm(t("Archive all chats? They stay in Archived chats and can be restored."))) return;
      try {
        const { archived } = await api("/conversations/archive-all", { method: "POST" });
        showToast(fmt().archivedCount(archived));
        refreshHistory();
      } catch {
        showToast(t("Could not archive your chats."));
      }
    };
    return [
      group("", [
        row({ title: "Shared Links", text: "Manage links to conversations you have shared.", control: button("Manage", openSharedLinks) }),
        row({
          title: "Improve SAPA UPI",
          text: "Allow conversations to help improve the SAPA UPI academic assistant.",
          control: toggle(prefs.improve, (on) => {
            prefs.improve = on;
            savePrefsNow();
          }, "Improve SAPA UPI"),
        }),
        row({
          title: "Location",
          text: "Manage location permissions used for relevant campus information.",
          control: button(prefs.location ? "Turn off" : "Turn on", () => {
            prefs.location = !prefs.location;
            savePrefsNow();
            render();
          }),
        }),
        row({ title: "Archived Chats", text: "Manage archived conversations.", control: button("Manage", () => open("archived")) }),
        row({ title: "Archive All Chats", text: "Archive all conversations without deleting them.", control: button("Archive all", archiveAll) }),
        row({ title: "Delete All Chats", text: "Permanently delete your conversation history.", control: button("Delete all", deleteAllHistory, { danger: true }) }),
        row({ title: "Export Data", text: "Request a copy of your SAPA UPI conversation data.", control: button("Export", exportHistory) }),
        row({ title: "Cookie Preferences", text: "Manage optional cookies and website preferences.", control: button("Manage", openCookies) }),
        row({ title: "Privacy Settings", text: "Review data privacy and information handling preferences.", control: button("Manage", openPrivacy) }),
      ]),
    ];
  }

  /* ------------------------------------------------------------ halaman */

  const RENDERERS = {
    general: renderGeneral,
    notifications: renderNotifications,
    profile: renderProfile,
    security: renderSecurity,
    voice: renderVoice,
    keyboard: renderKeyboard,
    data: renderData,
    help: renderHelp,
  };

  const SUBTITLES = {
    keyboard: "To change a shortcut, select the key combination, and then type the new keys.",
  };

  function renderNav() {
    const term = (searchEl.value ?? "").trim().toLowerCase();
    itemsEl.replaceChildren();
    let shown = 0;
    for (const section of SECTIONS) {
      if (section.hidden) continue;
      const haystack = `${section.label} ${SEARCH_TERMS[section.id] ?? ""}`.toLowerCase();
      if (term && !haystack.includes(term)) continue;
      shown += 1;
      const el = make("button", `settings-item${current === section.id ? " is-active" : ""}`);
      el.type = "button";
      el.innerHTML = section.icon;
      el.append(make("span", "", section.label));
      el.addEventListener("click", () => open(section.id));
      itemsEl.append(el);
    }
    noneEl.hidden = shown > 0;
  }

  function render() {
    const section = SECTIONS.find((item) => item.id === current) ?? SECTIONS[0];
    titleEl.textContent = section.label;
    subEl.textContent = SUBTITLES[section.id] ?? "";
    subEl.hidden = !SUBTITLES[section.id];
    contentEl.replaceChildren();
    renderNav();

    if (section.needsAccount && !getAccount()) {
      contentEl.append(
        group("", [row({ title: "Sign in required", text: "Sign in with your UPI account to open this setting." })]),
      );
    } else if (section.id === "archived") {
      renderArchived(contentEl);
    } else if (section.id === "storage") {
      renderStorage(contentEl);
    } else {
      for (const node of RENDERERS[section.id]()) contentEl.append(node);
    }
    // "Bantuan" ditulis Indonesia di kodenya; selain itu teks desain (Inggris) diterjemahkan sesuai pilihan.
    if (section.id !== "help") localizeAll();
  }

  function open(section = "general") {
    current = SECTIONS.some((item) => item.id === section) ? section : "general";
    listening = null;
    render();
    deps.show?.();
  }

  /* ------------------------------------------------------------ pintasan di seluruh aplikasi */

  /** Menangkap kombinasi baru saat sebuah baris sedang menunggu; selain itu menjalankan pintasan yang cocok. */
  function onKeyDown(event) {
    if (listening) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "Escape" && !event.shiftKey) {
        listening = null;
        return render();
      }
      const keys = comboFromEvent(event);
      if (!keys) return;
      if (!isValidCombo(keys)) return showToast(t("Use at most one regular key, with optional Ctrl, Alt, or Shift."));
      const clash = conflictsWith(shortcuts, listening, keys);
      // Bentrok yang disengaja (Figma sendiri memakai Ctrl+Enter dua kali) hanya diperingatkan, tidak ditolak.
      if (clash.length) showToast(t("That combination is also used by another shortcut."));
      shortcuts[listening].keys = keys;
      saveShortcuts(localStorage, shortcuts);
      listening = null;
      return render();
    }

    // Jangan mencuri ketikan biasa di kolom isian, kecuali kombinasi dengan Ctrl.
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName ?? "") || event.target?.isContentEditable;
    const keys = comboFromEvent(event);
    if (!keys) return;
    const id = matchShortcut(shortcuts, keys);
    if (!id) return;
    if (typing && !keys.includes("Ctrl") && id !== "focus") return;
    // Enter biasa dikelola oleh kolom ketik sendiri.
    if (id === "send" || id === "sendBackground" || id === "annotation") {
      if (!typing) return;
      if (id === "send") return;
    }
    const run = actions[id];
    if (!run) return;
    event.preventDefault();
    run();
  }

  document.addEventListener("keydown", onKeyDown, true);

  searchEl.addEventListener("input", renderNav);
  // Bahasa diganti dari tab General (atau saat halaman dimuat): tampilkan ulang dalam bahasa yang dipilih.
  onLangChange(() => {
    if (!root().hidden) render();
    else localizeAll();
  });
  localizeAll();

  return {
    open,
    render,
    get prefs() {
      return prefs;
    },
    /** Bahasa yang dipilih di Setting, atau null bila "Auto detect". */
    chosenLanguage() {
      return prefs.language === "auto" ? null : prefs.language;
    },
    isShortcutOn(id) {
      return Boolean(shortcuts[id]?.on);
    },
    showShortcuts() {
      open("keyboard");
    },
    help: () => open("help"),
  };
}
