/**
 * Preferensi Setting yang tersimpan di perangkat (bukan di server): bahasa,
 * notifikasi, suara, dikte, pintasan keyboard, dan beberapa saklar privasi.
 *
 * Penyimpanan diberikan dari luar (localStorage atau tiruannya), supaya modul ini
 * bisa diuji dan tidak pecah saat penyimpanan diblokir.
 */

export const PREFS_KEY = "sapa-prefs";
export const SHORTCUTS_KEY = "sapa-shortcuts";

/** Pilihan kanal notifikasi, persis seperti di desain. */
export const CHANNELS = ["Off", "Push", "Email", "Push, Email"];

export const NOTIFICATIONS = [
  { id: "announcements", title: "Academic Announcements", text: "Receive important academic announcements and updates from UPI.", value: "Push" },
  { id: "calendar", title: "Academic Calendar", text: "Get reminders about important academic dates and deadlines.", value: "Push" },
  { id: "krs", title: "Course Registration (KRS)", text: "Receive reminders about KRS registration and revision periods.", value: "Push, Email" },
  { id: "thesis", title: "Thesis & Final Examination", text: "Get notifications related to thesis requirements, supervision, and examination schedules.", value: "Push" },
  { id: "documents", title: "Document Updates", text: "Be notified when official academic documents are updated.", value: "Email" },
  { id: "assistant", title: "Chat & Assistant Updates", text: "Receive notifications about SAPA UPI features and service updates.", value: "Push" },
];

export const DEFAULT_PREFS = {
  language: "id", // id | en; bawaan Indonesia
  notifications: Object.fromEntries(NOTIFICATIONS.map((item) => [item.id, item.value])),
  voice: { language: "auto" }, // bahasa pengenalan suara; "auto" mengikuti bahasa tampilan
  dictation: true,
  improve: true,
  cookies: { analytics: false },
};

/** Pintasan bawaan, dikelompokkan seperti di desain. `keys` memakai nama tombol yang tampil. */
export const SHORTCUT_GROUPS = [
  {
    label: "COMPOSER",
    items: [
      { id: "focus", title: "Focus main chat", keys: ["Shift", "Esc"] },
      { id: "send", title: "Send message", keys: ["Enter"] },
      { id: "sendBackground", title: "Send message in background", keys: ["Ctrl", "Enter"] },
      { id: "selectText", title: "Select text", keys: ["Ctrl", "Shift", "M"] },
      { id: "attach", title: "Attach files and folders", keys: ["Ctrl", "U"] },
    ],
  },
  { label: "CHAT", items: [{ id: "deleteChat", title: "Delete chat", keys: ["Ctrl", "Shift", "Delete"] }] },
  {
    label: "APP",
    items: [
      { id: "newChat", title: "New chat", keys: ["Ctrl", "Shift", "O"] },
      { id: "showShortcuts", title: "Show keyboard shortcuts", keys: ["Ctrl", "/"] },
      { id: "annotation", title: "Send annotation", keys: ["Ctrl", "Enter"] },
      { id: "switchChat", title: "Switch chat", keys: ["Ctrl", "K"] },
      { id: "toggleSidebar", title: "Toggle sidebar", keys: ["Ctrl", "Shift", "S"] },
    ],
  },
];

export const DEFAULT_SHORTCUTS = Object.fromEntries(
  SHORTCUT_GROUPS.flatMap((group) => group.items).map((item) => [item.id, { on: true, keys: [...item.keys] }]),
);

function read(storage, key) {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(storage, key, value) {
  try {
    storage?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // mode privat atau penyimpanan penuh: preferensi hanya berlaku selama halaman terbuka
  }
}

const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);

/** Preferensi tersimpan digabung ke bawaan, dan nilai yang tidak dikenal dibuang. */
export function loadPrefs(storage) {
  const saved = read(storage, PREFS_KEY);
  const prefs = structuredClone(DEFAULT_PREFS);
  if (!isObject(saved)) return prefs;

  if (["id", "en"].includes(saved.language)) prefs.language = saved.language; // "auto" lama kembali ke Indonesia
  if (isObject(saved.notifications)) {
    for (const item of NOTIFICATIONS) {
      if (CHANNELS.includes(saved.notifications[item.id])) prefs.notifications[item.id] = saved.notifications[item.id];
    }
  }
  if (isObject(saved.voice)) {
    if (["auto", "id", "en"].includes(saved.voice.language)) prefs.voice.language = saved.voice.language;
  }
  for (const key of ["dictation", "improve"]) {
    if (typeof saved[key] === "boolean") prefs[key] = saved[key];
  }
  if (isObject(saved.cookies) && typeof saved.cookies.analytics === "boolean") prefs.cookies.analytics = saved.cookies.analytics;
  return prefs;
}

export const savePrefs = (storage, prefs) => write(storage, PREFS_KEY, prefs);

export function loadShortcuts(storage) {
  const saved = read(storage, SHORTCUTS_KEY);
  const shortcuts = structuredClone(DEFAULT_SHORTCUTS);
  if (!isObject(saved)) return shortcuts;
  for (const id of Object.keys(shortcuts)) {
    const item = saved[id];
    if (!isObject(item)) continue;
    if (typeof item.on === "boolean") shortcuts[id].on = item.on;
    if (Array.isArray(item.keys) && item.keys.length >= 1 && item.keys.length <= 4 && item.keys.every((key) => typeof key === "string" && key.length <= 12)) {
      shortcuts[id].keys = item.keys;
    }
  }
  return shortcuts;
}

export const saveShortcuts = (storage, shortcuts) => write(storage, SHORTCUTS_KEY, shortcuts);

/* ------------------------------------------------------------ pintasan */

const MODIFIERS = new Set(["Ctrl", "Shift", "Alt"]);

/** Nama tombol seperti di desain: "Esc", "Delete", dan huruf kapital. */
export function keyName(key) {
  if (key === "Escape") return "Esc";
  if (key === " ") return "Space";
  return key.length === 1 ? key.toUpperCase() : key;
}

/**
 * Kombinasi dari sebuah peristiwa keyboard, atau null bila hanya tombol pengubah
 * (Ctrl, Shift, Alt) yang ditekan. Cmd di Mac dihitung sebagai Ctrl.
 */
export function comboFromEvent(event) {
  if (["Control", "Shift", "Alt", "Meta"].includes(event.key)) return null;
  const keys = [];
  if (event.ctrlKey || event.metaKey) keys.push("Ctrl");
  if (event.altKey) keys.push("Alt");
  if (event.shiftKey) keys.push("Shift");
  keys.push(keyName(event.key));
  return keys;
}

export const sameCombo = (a, b) => a.length === b.length && a.every((key, index) => key === b[index]);

/** Kombinasi harus punya satu tombol biasa; tombol Enter, Esc, dan sejenisnya sendirian boleh. */
export function isValidCombo(keys) {
  return keys.length >= 1 && keys.length <= 4 && keys.filter((key) => !MODIFIERS.has(key)).length === 1;
}

/** Id pintasan yang menyala dan cocok dengan kombinasi ini, atau null. */
export function matchShortcut(shortcuts, keys) {
  for (const [id, item] of Object.entries(shortcuts)) {
    if (item.on && sameCombo(item.keys, keys)) return id;
  }
  return null;
}

/** Id pintasan lain yang memakai kombinasi yang sama (untuk memperingatkan bentrok). */
export function conflictsWith(shortcuts, id, keys) {
  return Object.entries(shortcuts)
    .filter(([otherId, item]) => otherId !== id && item.on && sameCombo(item.keys, keys))
    .map(([otherId]) => otherId);
}
