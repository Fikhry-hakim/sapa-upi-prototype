/**
 * Pilihan bahasa antarmuka (Indonesia / English).
 *
 * Teks aplikasi ditulis dalam bahasa Indonesia di kodenya. Saat pembaca memilih
 * English, setiap teks yang tampil di halaman dicocokkan dengan kamus di bawah
 * dan diganti, termasuk teks yang baru muncul belakangan (jawaban, toast, daftar).
 * Memilih Indonesia mengembalikan teks aslinya, jadi kode tidak perlu tahu bahasa.
 *
 * Yang TIDAK diterjemahkan di sini: isi dokumen resmi dan isi jawaban kurasi
 * (tetap seperti aslinya). Jawaban dari AI mengikuti bahasa pilihan, karena
 * pilihannya dikirim ke Worker.
 */

import { OWNER_EXACT } from "./i18n-owner.js";

export const LANG_KEY = "sapa-lang";
export const LANGS = ["id", "en"];

/* ------------------------------------------------------------ kamus */

const EXACT = {
  ...OWNER_EXACT,
  // Sidebar dan umum
  // Sidebar dan menu
  "Chat Baru": "New Chat",
  "Cari Chat": "Search Chats",
  "Metrik": "Metrics",
  "Basis Pengetahuan": "Knowledge Base",
  "Berkas": "Files",
  "Terbaru": "Recent",
  "Profil": "Profile",
  "Pengaturan": "Settings",
  "Bantuan": "Help",
  "Keluar": "Log out",
  "Bagikan": "Share",
  "Semua": "All",
  "Chat": "Chats",
  "Dokumen": "Documents",
  "Disarankan": "Suggested",
  "Favorit": "Favorites",
  "Keamanan dan login": "Security and login",
  "Kontrol data": "Data controls",
  "Cari di pustaka...": "Search library...",
  "Ringkasan Dashboard": "Dashboard Overview",
  "Kelola Basis Pengetahuan": "Manage Knowledge Base",
  "Masuk dengan akun UPI": "Sign in with UPI account",
  "Masuk untuk menyimpan riwayat percakapan.": "Sign in to save your chat history.",
  "Navigasi SAPA UPI": "SAPA UPI navigation",
  "Menu utama": "Main menu",
  "Tutup navigasi": "Close navigation",
  "Buka navigasi": "Open navigation",
  "Riwayat percakapan": "Chat history",
  "Menu lainnya": "More options",
  "Maskot SAPA mengenakan toga wisuda": "SAPA mascot in a graduation gown",
  "Belum ada percakapan.": "No chats yet.",
  "Belum ada percakapan di sesi ini.": "No chats in this session yet.",
  "Bahasa": "Language",
  "Ya": "Yes",
  "Tidak": "No",
  // Beranda
  "Halo": "Hello",
  "Ada yang bisa saya bantu terkait perkuliahan dan administrasi akademik hari ini?":
    "How can I help with your studies and academic administration today?",
  "Tulis pertanyaan akademik": "Type your academic question",
  "Tanyakan informasi KRS, Jadwal, atau Pedoman Akademik...": "Ask about course registration, schedules, or academic guidelines...",
  "Tanyakan seputar pedoman...": "Ask about the guidelines...",
  "Tanyakan dokumen ini...": "Ask about this document...",
  "Tanyakan sesuatu tentang dokumen ini...": "Ask something about this document...",
  "Tanya tentang dokumen": "Ask about a document",
  "Jawaban hanya diambil dari dokumen yang kamu pilih. Tidak ada berkas yang diunggah atau disimpan.":
    "Answers come only from the document you choose. No file is uploaded or stored.",
  // Chat
  "Mencari di dokumen...": "Searching the documents...",
  "Membaca pertanyaan": "Reading your question",
  "Mencari di dokumen resmi": "Searching official documents",
  "Menyusun jawaban": "Writing the answer",
  "SUMBER DOKUMEN RESMI": "OFFICIAL SOURCE DOCUMENTS",
  "Dokumen ini belum bisa dibuka di SAPA.": "This document can't be opened in SAPA yet.",
  "Bagaimana jawaban SAPA ini?": "How was this SAPA answer?",
  "Penilaian jawaban": "Answer rating",
  "Tutup penilaian": "Dismiss rating",
  "Kurang": "Poor",
  "Cukup": "Fair",
  "Baik": "Good",
  "Terima kasih atas masukanmu.": "Thanks for your feedback.",
  "Dijawab AI • berdasarkan dokumen resmi": "Answered by AI • based on official documents",
  "Jawaban cadangan • AI sedang tidak tersedia": "Backup answer • AI is currently unavailable",
  "Belum ada di dokumen": "Not in the documents",
  "Mau penjelasan lebih lanjut? Klik angka di ujung kalimat.": "Want more detail? Click the number at the end of a sentence.",
  "BUTUH BANTUAN? HUBUNGI:": "NEED HELP? CONTACT:",
  "Siapa yang harus saya hubungi?": "Who should I contact?",
  "Salin": "Copy",
  "Salin transkrip percakapan": "Copy chat transcript",
  "Mulai percakapan baru": "Start a new chat",
  "Hapus percakapan ini": "Delete this chat",
  "Transkrip disalin.": "Transcript copied.",
  "Belum ada percakapan untuk disalin.": "No chat to copy yet.",
  "Percakapan tidak ditemukan.": "Chat not found.",
  "Gagal membuka percakapan.": "Couldn't open the chat.",
  "Percakapan ini belum tersimpan.": "This chat isn't saved yet.",
  "Gagal menghapus percakapan.": "Couldn't delete the chat.",
  "Percakapan dihapus.": "Chat deleted.",
  "Tautan disalin.": "Link copied.",
  "Browser menolak menyalin tautan.": "The browser blocked copying the link.",
  "Browser menolak menyimpan favorit.": "The browser blocked saving favorites.",
  "Salin tautan": "Copy link",
  "Buka dokumen": "Open document",
  // Pencarian dan Files
  "Cari percakapan atau dokumen...": "Search chats or documents...",
  "Hapus pencarian": "Clear search",
  "Filter hasil": "Filter results",
  "Filter dokumen": "Filter documents",
  "Tampilan daftar": "List view",
  "Tampilan kisi": "Grid view",
  "Search library...": "Search library...",
  "Masuk untuk mencari di riwayat percakapanmu. Percakapan sebelum masuk tidak disimpan.":
    "Sign in to search your chat history. Chats from before you signed in aren't saved.",
  "Tidak ada hasil yang cocok.": "No matching results.",
  "Belum ada dokumen.": "No documents yet.",
  "Belum ada percakapan tersimpan.": "No saved chats yet.",
  "Belum ada favorit. Tandai dokumen dengan bintang.": "No favorites yet. Star a document to add it.",
  "Tidak ada dokumen yang cocok.": "No matching documents.",
  // Pengaturan dan akun
  "Belum masuk": "Not signed in",
  "Masuk dengan akun UPI untuk membuka pengaturan ini.": "Sign in with your UPI account to open these settings.",
  "Nama": "Name",
  "Sesuai akun Google UPI": "From your UPI Google account",
  "Email": "Email",
  "Dipakai untuk masuk": "Used to sign in",
  "Peran": "Role",
  "Hak akses pada SAPA UPI": "Your access level in SAPA UPI",
  "Pengguna": "User",
  "Akun masuk": "Sign-in account",
  "Email UPI terbukti lewat Google": "UPI email verified through Google",
  "Kata sandi": "Password",
  "Dipakai untuk masuk dengan email. Untuk menggantinya, kamu perlu kata sandi yang sekarang":
    "Used to sign in with email. To change it, you need your current password",
  "Pasang kata sandi untuk masuk dengan email, tanpa Google": "Set a password to sign in with email instead of Google",
  "Keluar dari semua perangkat": "Sign out of all devices",
  "Keluar dari semua perangkat, termasuk yang sedang kamu pakai sekarang": "Sign out everywhere, including the device you're using now",
  "Keluar semua": "Sign out all",
  "Unduh riwayat percakapan": "Download chat history",
  "Seluruh percakapanmu dalam satu berkas JSON": "All your chats in a single JSON file",
  "Hapus semua riwayat": "Delete all history",
  "Menghapus seluruh percakapan tersimpan. Tidak bisa dibatalkan": "Deletes every saved chat. This can't be undone",
  "Hapus semua": "Delete all",
  "Program Studi": "Study Program",
  "Pihak yang menerbitkan pedoman": "Issuer of the guidelines",
  "Telepon": "Phone",
  "Tentang jawaban SAPA": "About SAPA answers",
  "Jawaban diambil dari dokumen yang tersedia. Keputusan resmi tetap ada di program studi":
    "Answers are drawn from the available documents. Official decisions remain with the study program",
  "Ganti kata sandi": "Change password",
  "Atur kata sandi": "Set password",
  "Kata sandi saat ini": "Current password",
  "Kata sandi baru": "New password",
  "Ulangi kata sandi baru": "Repeat new password",
  "Kata sandi disimpan.": "Password saved.",
  "Gagal menyimpan kata sandi.": "Couldn't save the password.",
  "Kata sandi baru dan pengulangannya tidak sama.": "The new password and its repeat don't match.",
  "Kosongkan kata sandi saat ini hanya jika kamu baru saja masuk dengan Google (dalam 10 menit terakhir).":
    "Leave the current password empty only if you just signed in with Google (within the last 10 minutes).",
  "Dengan kata sandi, kamu bisa masuk memakai email UPI tanpa Google. Minimal 10 karakter. Kamu harus baru saja masuk dengan Google (dalam 10 menit terakhir); kalau belum, keluar lalu masuk lagi.":
    "With a password you can sign in with your UPI email without Google. At least 10 characters. You must have signed in with Google within the last 10 minutes; if not, sign out and sign in again.",
  "Gagal mengunduh riwayat.": "Couldn't download the history.",
  "Semua riwayat dihapus.": "All history deleted.",
  "Gagal menghapus riwayat.": "Couldn't delete the history.",
  "Gagal keluar dari semua perangkat.": "Couldn't sign out of all devices.",
  "Kamu sudah keluar.": "You've signed out.",
  "Keluar dari semua perangkat.": "Signed out of all devices.",
  "Sesi berakhir. Masuk lagi untuk melanjutkan.": "Your session ended. Sign in again to continue.",
  "Berhasil masuk.": "Signed in.",
  "Isi email dan kata sandi.": "Enter your email and password.",
  "Tidak bisa masuk sekarang. Coba lagi.": "Can't sign in right now. Please try again.",
  "Tidak bisa terhubung ke server. Coba lagi.": "Can't reach the server. Please try again.",
  "Sembunyikan kata sandi": "Hide password",
  "Tampilkan kata sandi": "Show password",
  // Layar masuk
  "Selamat Datang Kembali!": "Welcome back!",
  "Masuk dengan akun UPI kamu untuk menyimpan riwayat percakapan.": "Sign in with your UPI account to save your chat history.",
  "Hanya akun dengan domain upi.edu yang dapat masuk. Kata sandi dipasang dari Pengaturan setelah masuk dengan Google. Tanpa masuk, kamu tetap bisa bertanya dan membuka dokumen.":
    "Only upi.edu accounts can sign in. Set a password from Settings after signing in with Google. Without signing in, you can still ask questions and open documents.",
  "Akun Tidak Diizinkan": "Account Not Allowed",
  "SAPA UPI hanya bisa dimasuki dengan akun Google UPI (@upi.edu atau subdomainnya).":
    "SAPA UPI can only be accessed with a UPI Google account (@upi.edu or its subdomains).",
  "Akun yang kamu pilih bukan akun UPI, jadi tidak dibuatkan sesi masuk.": "The account you chose isn't a UPI account, so no session was created.",
  "Coba dengan akun upi.edu": "Try with a upi.edu account",
  "Kamu tetap bisa bertanya dan membuka dokumen tanpa masuk. Masuk hanya diperlukan untuk menyimpan riwayat.":
    "You can still ask questions and open documents without signing in. Signing in is only needed to save history.",
  "Gagal Masuk": "Sign-in Failed",
  "Proses masuk dengan Google tidak selesai.": "Signing in with Google didn't complete.",
  "Coba lagi sebentar lagi. Kalau terus gagal, kamu tetap bisa memakai SAPA tanpa masuk.":
    "Try again in a moment. If it keeps failing, you can still use SAPA without signing in.",
  "Coba lagi": "Try again",
  "Masuk dengan Google di bawah, lalu atur ulang kata sandi di Pengaturan > Keamanan dan login (dalam 10 menit setelah masuk).":
    "Sign in with Google below, then reset your password in Settings > Security and login (within 10 minutes of signing in).",
  // Suara
  "Akses mikrofon ditolak. Izinkan mikrofon untuk situs ini di pengaturan browser.": "Microphone access was denied. Allow the microphone for this site in your browser settings.",
  "Browser menolak dikte suara. Izinkan mikrofon, atau coba Chrome.": "The browser blocked voice dictation. Allow the microphone, or try Chrome.",
  "Mikrofon tidak terdeteksi. Periksa apakah mikrofon terpasang dan tidak dipakai aplikasi lain.": "No microphone detected. Check that it's connected and not used by another app.",
  "Suara tidak terdengar. Tekan mikrofon lagi dan bicara lebih dekat.": "No speech heard. Press the microphone again and speak closer.",
  "Dikte suara butuh koneksi internet ke layanan Google. Periksa koneksimu.": "Voice dictation needs an internet connection to Google. Check your connection.",
  "Bahasa Indonesia tidak didukung dikte di browser ini.": "This browser doesn't support dictation in Indonesian.",
  "Browser ini belum mendukung dikte suara. Pakai Chrome atau Edge (versi desktop).": "This browser doesn't support voice dictation. Use Chrome or Edge (desktop).",
  "Dikte suara hanya jalan di halaman HTTPS.": "Voice dictation only works on HTTPS pages.",
  "Mikrofon belum bisa dipakai. Coba lagi sebentar.": "The microphone isn't available yet. Try again shortly.",
  "Mendengarkan... bicara sekarang.": "Listening... speak now.",
  // Pembaca dokumen
  "SUMBER RESMI": "OFFICIAL SOURCE",
  "Tutup pembaca dokumen": "Close document viewer",
  "Perbesaran": "Zoom",
  "Perkecil": "Zoom out",
  "Perbesar": "Zoom in",
  "Cara membaca": "Reading mode",
  "Gulir": "Scroll",
  "Halaman": "Page",
  "dari": "of",
  "Gulir terus ke bawah": "Keep scrolling down",
  "Satu halaman per layar": "One page per screen",
  "Halaman sebelumnya": "Previous page",
  "Halaman berikutnya": "Next page",
  "Unduh dokumen": "Download document",
  "Memuat dokumen…": "Loading document…",
  "Sumber Resmi Jawaban SAPA": "Official source of this SAPA answer",
  "Dokumen tidak bisa ditampilkan di sini.": "The document can't be displayed here.",
  "Buka berkas langsung": "Open the file directly",
  "Kutipan disalin.": "Quote copied.",
  "Sumber disalin.": "Source copied.",
  "Browser menolak akses papan klip.": "The browser blocked clipboard access.",
};

/** Potongan teks yang ikut diganti di dalam kalimat lebih panjang (berurutan). */
const MONTHS = { Mei: "May", Agu: "Aug", Okt: "Oct", Des: "Dec" };

const RANGE_EN = { harian: "daily", mingguan: "weekly", bulanan: "monthly", "periode ini": "this period" };

const OWNER_RULES = [
  [/^Tren (harian|mingguan|bulanan|periode ini) interaksi mahasiswa Program Studi Bisnis Digital \(Total: ([\d.,]+)\)$/, (_m, range, total) => `${RANGE_EN[range]} trend of Digital Business Study Program student interactions (Total: ${total})`],
  [/^Pengelompokan ([\d.,]+) interaksi berdasarkan tipe respons mesin$/, "Grouping of $1 interactions by machine response type"],
  [/^Akurasi grounded retrieval: (.+) \(termasuk klarifikasi terarah\)$/, "Grounded retrieval accuracy: $1 (including guided clarification)"],
  [/^Status distribusi (\d+) versi dokumen terdaftar pada basis pengetahuan RAG SAPA UPI\.$/, "Status distribution of the $1 document versions registered in the SAPA UPI RAG knowledge base."],
  [/^Menampilkan (\d+) dari ([\d.,]+) interaksi$/, "Showing $1 of $2 interactions"],
  [/^Menampilkan (\d+) dari (\d+) dokumen repositori$/, "Showing $1 of $2 repository documents"],
  [/^Versi (\d+) dari (\d+)$/, "Version $1 of $2"],
  [/^Median (.+?) detik; persentil ke-95 (.+?) detik\.$/, "Median $1 seconds; 95th percentile $2 seconds."],
  [/^(\d+) dari (\d+) versi dokumen siap dipakai menjawab\.$/, "$1 of $2 document versions are ready to answer."],
  [/^Rancangan KPI Dashboard Admin beserta definisi dan rumusnya \(Lampiran A, Tabel A\.6\)\. Nilai dihitung dari ([\d.,]+) interaksi pada (.+)\.$/, "Admin dashboard KPI design with definitions and formulas (Appendix A, Table A.6). Values are calculated from $1 interactions in $2."],
  [/^Peranmu: (.+)$/, "Your role: $1"],
  [/(\d+(?:[.,]\d+)?) detik\b/g, "$1 seconds"],
];

const RULES = [
  ...OWNER_RULES,
  [/^Jelaskan lebih lanjut poin (\d+)$/, "Explain point $1 further"],
  [/^Buka (.+)$/, "Open $1"],
  [/^Favoritkan (.+)$/, "Favorite $1"],
  [/^Menu (.+)$/, "Options for $1"],
  [/^Butuh bantuan umum\? Hubungi (.+?) di$/, "Need general help? Contact $1 at"],
  [/^Butuh bantuan umum\? Hubungi (.+?)\.$/, "Need general help? Contact $1."],
  [/\(Unit Layanan Terpadu\)/g, "(Integrated Service Unit)"],
  [/^Mengekstrak teks per halaman(.*)$/, "Extracting text per page$1"],
  [/\b1 halaman/g, "1 page"],
  [/(\d+) halaman/g, "$1 pages"],
  [/(\d),(\d) (MB|KB)/g, "$1.$2 $3"],
  // Hanya tanggal ringkas pada kartu berkas ("PDF • 305 KB • 2 halaman • 5 Okt 2026"), bukan isi jawaban.
  [/^(PDF • .*)$/, (all) => all.replace(/\b(Mei|Agu|Okt|Des)\b/g, (m) => MONTHS[m])],
  [/, hal\. (\d+)/g, ", page $1"],
  [/ · hal\. (\d+)/g, " · page $1"],
];

const ATTRS = ["placeholder", "aria-label", "title", "alt"];

/** Terjemahan satu string; mengembalikan string yang sama kalau tidak ada padanannya. */
export function translate(text) {
  if (typeof text !== "string") return text;
  const lead = text.match(/^\s*/)[0];
  const tail = text.match(/\s*$/)[0];
  const core = text.trim();
  if (!core) return text;
  const exact = EXACT[core];
  if (exact !== undefined) return lead + exact + tail;
  let out = core;
  for (const [pattern, replacement] of RULES) out = out.replace(pattern, replacement);
  return out === core ? text : lead + out + tail;
}

/* ------------------------------------------------------------ keadaan */

let lang = "id";
let observer = null;
const originals = new WeakMap(); // simpul -> teks asli (Indonesia)
const attrOriginals = new WeakMap(); // elemen -> { atribut: teks asli }
const listeners = new Set();

export function getLang() {
  return lang;
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const SKIP = "[data-no-i18n], script, style, code, pre, .viewer-sheet, .viewer-pages, .textLayer";

function skip(node) {
  const el = node.nodeType === 1 ? node : node.parentElement;
  // Isi kolom ketikan milik pembaca tidak disentuh; atribut seperti placeholder boleh.
  if (node.nodeType !== 1 && el?.closest("textarea")) return true;
  return !el || Boolean(el.closest(SKIP));
}

function applyText(node) {
  if (skip(node)) return;
  const current = node.nodeValue;
  const known = originals.get(node);
  // Teks yang kita tulis sendiri: biarkan. Teks baru dari aplikasi: jadikan asli.
  if (known && known.translated === current) return;
  const translated = lang === "en" ? translate(current) : current;
  if (translated === current && !known) return;
  originals.set(node, { original: current, translated });
  if (translated !== current) node.nodeValue = translated;
}

function applyAttrs(el) {
  if (skip(el)) return;
  let saved = attrOriginals.get(el);
  for (const name of ATTRS) {
    if (!el.hasAttribute(name)) continue;
    const current = el.getAttribute(name);
    const known = saved?.[name];
    if (known && known.translated === current) continue;
    const translated = lang === "en" ? translate(current) : current;
    if (translated === current && !known) continue;
    saved ??= {};
    saved[name] = { original: current, translated };
    attrOriginals.set(el, saved);
    if (translated !== current) el.setAttribute(name, translated);
  }
}

function walk(root) {
  if (root.nodeType === 3) return applyText(root);
  if (root.nodeType !== 1) return;
  applyAttrs(root);
  const tree = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  for (let node = tree.nextNode(); node; node = tree.nextNode()) {
    if (node.nodeType === 3) applyText(node);
    else applyAttrs(node);
  }
}

function restoreAll(root) {
  const tree = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  for (let node = tree.nextNode(); node; node = tree.nextNode()) {
    if (node.nodeType === 3) {
      const saved = originals.get(node);
      if (saved && node.nodeValue === saved.translated) node.nodeValue = saved.original;
      originals.delete(node);
    } else {
      const saved = attrOriginals.get(node);
      if (saved) {
        for (const [name, value] of Object.entries(saved)) {
          if (node.getAttribute(name) === value.translated) node.setAttribute(name, value.original);
        }
        attrOriginals.delete(node);
      }
    }
  }
}

function observe() {
  if (observer) return;
  observer = new MutationObserver((records) => {
    if (lang !== "en") return;
    observer.disconnect();
    for (const record of records) {
      if (record.type === "characterData") applyText(record.target);
      else if (record.type === "attributes") applyAttrs(record.target);
      else for (const added of record.addedNodes) walk(added);
    }
    attach();
  });
  attach();
}

function attach() {
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATTRS,
  });
}

/** Ganti bahasa; `persist` false dipakai saat membaca pilihan tersimpan. */
export function setLang(next, { persist = true } = {}) {
  next = LANGS.includes(next) ? next : "id";
  lang = next;
  document.documentElement.lang = next;
  if (persist) {
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* penyimpanan diblokir: pilihan berlaku sampai halaman ditutup */
    }
  }
  if (observer) observer.disconnect();
  if (next === "en") walk(document.body);
  else restoreAll(document.body);
  if (!observer) observe();
  else attach();
  for (const fn of listeners) fn(next);
}

/** Baca pilihan tersimpan lalu mulai mengamati halaman. */
export function initLang() {
  let saved = "en";
  try {
    saved = localStorage.getItem(LANG_KEY) || "en";
  } catch {
    /* abaikan */
  }
  observe();
  setLang(saved, { persist: false });
}
