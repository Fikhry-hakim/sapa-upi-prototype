/**
 * Pembaca dokumen sumber.
 *
 * Membuka PDF asli di panel samping, langsung di halaman yang dikutip, dengan
 * kalimat rujukan disorot. Siapa pun bisa membukanya, masuk atau tidak: dokumen
 * yang disajikan memang ditujukan ke mahasiswa.
 *
 * PDF.js dimuat hanya saat pembaca pertama kali dibuka, supaya halaman utama
 * tidak menanggung ratusan kilobita yang belum tentu dipakai. Kalau gagal
 * dimuat, panel tetap menyediakan tautan untuk membuka berkasnya langsung.
 */

const PDFJS_VERSION = "3.11.174";
const PDFJS_BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

/**
 * Hash SHA-384 kedua berkas PDF.js. Kalau CDN menyajikan isi yang lain dari yang
 * kita periksa, browser menolak menjalankannya, jadi CDN yang dibobol tidak bisa
 * menyisipkan kode ke halaman. Ubah hash ini bersamaan dengan PDFJS_VERSION.
 */
const PDFJS_INTEGRITY = {
  main: "sha384-/1qUCSGwTur9vjf/z9lmu/eCUYbpOTgSjmpbMQZ1/CtX2v/WcAIKqRv+U1DUCG6e",
  worker: "sha384-SnzOobpRMLXZ52iJvZm/C0fYw0OQemTXzTjIsdsfMcrCtCEe9qgzxTd3RSklO5x2",
};

export const ZOOM_STEPS = [0.6, 0.75, 0.9, 1, 1.15, 1.3, 1.5, 1.75, 2];

/** Huruf dan angka saja, huruf kecil — tahan terhadap spasi dan tanda baca yang berbeda. */
export function squash(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Rentang span teks yang memuat sebuah kalimat.
 *
 * Teks halaman PDF terpotong per span dengan spasi yang tidak bisa dipercaya
 * ("n askah"), jadi pencocokan dilakukan pada teks yang dirapatkan, lalu
 * dikembalikan ke span asalnya lewat peta offset.
 */
export function findSpanRange(spanTexts, phrase) {
  const target = squash(phrase);
  if (target.length < 8) return null;

  let joined = "";
  const starts = [];
  for (const text of spanTexts) {
    starts.push(joined.length);
    joined += squash(text);
  }

  // Cukup awal kalimat: akhirnya sering terpotong beda baris.
  const probe = target.slice(0, Math.min(target.length, 40));
  const at = joined.indexOf(probe);
  if (at < 0) return null;

  const end = at + target.length;
  let first = -1;
  let last = -1;
  for (let i = 0; i < spanTexts.length; i += 1) {
    const spanStart = starts[i];
    const spanEnd = spanStart + squash(spanTexts[i]).length;
    if (spanEnd > at && spanStart < end) {
      if (first < 0) first = i;
      last = i;
    }
  }
  return first < 0 ? null : { first, last };
}

let pdfjsPromise = null;

export function loadPdfJs() {
  if (pdfjsPromise) return pdfjsPromise;

  pdfjsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${PDFJS_BASE}/pdf.min.js`;
    script.integrity = PDFJS_INTEGRITY.main;
    script.crossOrigin = "anonymous";
    script.onload = async () => {
      try {
        // Worker lintas origin ditolak browser, jadi diambil lalu dibungkus blob.
        // fetch memeriksa hash yang sama sebelum isinya dijadikan worker.
        const response = await fetch(`${PDFJS_BASE}/pdf.worker.min.js`, { integrity: PDFJS_INTEGRITY.worker });
        const code = await response.text();
        const blob = new Blob([code], { type: "text/javascript" });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
        resolve(window.pdfjsLib);
      } catch (error) {
        reject(error);
      }
    };
    script.onerror = () => reject(new Error("PDF.js gagal dimuat"));
    document.head.append(script);
  }).catch((error) => {
    pdfjsPromise = null; // izinkan percobaan ulang
    throw error;
  });

  return pdfjsPromise;
}

const ICONS = {
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v16M9 7.5h6"/></svg>',
  minus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
  download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
};

export function createViewer({ onCopy = () => {}, onError = () => {} } = {}) {
  const root = document.createElement("div");
  root.className = "viewer";
  root.hidden = true;
  root.innerHTML = `
    <div class="viewer-backdrop" data-viewer-close></div>
    <aside class="viewer-drawer" role="dialog" aria-modal="true" aria-labelledby="viewer-title">
      <header class="viewer-head">
        <span class="viewer-head-icon">${ICONS.book}</span>
        <div class="viewer-head-text">
          <div class="viewer-head-meta">
            <span class="viewer-badge">SUMBER RESMI</span>
            <span class="viewer-reference" id="viewer-reference"></span>
          </div>
          <h2 class="viewer-title" id="viewer-title"></h2>
          <p class="viewer-sub" id="viewer-sub"></p>
        </div>
        <button type="button" class="viewer-esc" data-viewer-close aria-label="Tutup pembaca dokumen">
          <i aria-hidden="true"></i>ESC
        </button>
      </header>
      <div class="viewer-toolbar">
        <div class="viewer-zoom" role="group" aria-label="Perbesaran">
          <button type="button" id="viewer-zoom-out" aria-label="Perkecil">${ICONS.minus}</button>
          <span id="viewer-zoom-label">100%</span>
          <button type="button" id="viewer-zoom-in" aria-label="Perbesar">${ICONS.plus}</button>
        </div>
        <div class="viewer-mode" role="group" aria-label="Cara membaca">
          <button type="button" id="viewer-mode-scroll" aria-pressed="true" title="Gulir terus ke bawah">Gulir</button>
          <button type="button" id="viewer-mode-page" aria-pressed="false" title="Satu halaman per layar">Halaman</button>
        </div>
        <div class="viewer-pager" role="group" aria-label="Halaman">
          <button type="button" id="viewer-prev" aria-label="Halaman sebelumnya">${ICONS.prev}</button>
          <span>Halaman <strong id="viewer-page-now">1</strong> dari <span id="viewer-page-total">1</span></span>
          <button type="button" id="viewer-next" aria-label="Halaman berikutnya">${ICONS.next}</button>
        </div>
        <div class="viewer-actions">
          <button type="button" class="viewer-action" id="viewer-copy">${ICONS.copy}<span>Salin</span></button>
          <a class="viewer-action viewer-action-icon" id="viewer-download" download aria-label="Unduh dokumen">${ICONS.download}</a>
        </div>
      </div>
      <div class="viewer-stage" id="viewer-stage" tabindex="0">
        <p class="viewer-status" id="viewer-status" role="status">Memuat dokumen…</p>
        <div class="viewer-sheet" id="viewer-sheet" hidden>
          <canvas id="viewer-canvas"></canvas>
          <div class="textLayer" id="viewer-text"></div>
        </div>
        <div class="viewer-pages" id="viewer-pages" hidden></div>
      </div>
      <footer class="viewer-foot" id="viewer-foot" hidden>
        <span class="viewer-foot-mark">${ICONS.check}Sumber Resmi Jawaban SAPA</span>
        <span class="viewer-foot-where" id="viewer-foot-where"></span>
      </footer>
    </aside>
  `;
  document.body.append(root);

  const $ = (id) => root.querySelector(`#${id}`);
  const ui = {
    reference: $("viewer-reference"),
    title: $("viewer-title"),
    sub: $("viewer-sub"),
    zoomLabel: $("viewer-zoom-label"),
    zoomOut: $("viewer-zoom-out"),
    zoomIn: $("viewer-zoom-in"),
    prev: $("viewer-prev"),
    next: $("viewer-next"),
    pageNow: $("viewer-page-now"),
    pageTotal: $("viewer-page-total"),
    copy: $("viewer-copy"),
    download: $("viewer-download"),
    stage: $("viewer-stage"),
    status: $("viewer-status"),
    sheet: $("viewer-sheet"),
    pages: $("viewer-pages"),
    modeScroll: $("viewer-mode-scroll"),
    modePage: $("viewer-mode-page"),
    canvas: $("viewer-canvas"),
    text: $("viewer-text"),
    foot: $("viewer-foot"),
    footWhere: $("viewer-foot-where"),
  };

  const MODE_KEY = "sapa-upi:viewer-mode";
  // Halaman yang digambar: yang berada di dalam jarak ini dari layar. Yang lebih jauh
  // dilepas supaya dokumen puluhan halaman tidak menghabiskan memori (satu kanvas bisa >10 MB).
  const RENDER_MARGIN = 1200;
  const KEEP_MARGIN = 2800;

  function readMode() {
    try {
      return localStorage.getItem(MODE_KEY) === "page" ? "page" : "scroll";
    } catch {
      return "scroll";
    }
  }

  const state = {
    doc: null,
    pdf: null,
    page: 1,
    zoomIndex: ZOOM_STEPS.indexOf(1),
    highlight: "",
    citedPage: 1,
    cited: null, // { page, text }
    citationFocused: false,
    token: 0,
    opener: null,
    mode: readMode(),
    scrollGen: 0,
  };

  /** Mode gulir: nomor halaman -> { el, canvas, rendered, rendering }. */
  const scrollPages = new Map();
  let frame = 0;

  /** Lebar halaman 100% = selebar panel, dengan sedikit ruang di kiri-kanan. */
  function scaleFor(naturalWidth) {
    const available = Math.max(280, ui.stage.clientWidth - 40);
    return (available / naturalWidth) * ZOOM_STEPS[state.zoomIndex];
  }

  function updateControls() {
    ui.pageNow.textContent = String(state.page);
    ui.prev.disabled = state.page <= 1;
    ui.next.disabled = !state.pdf || state.page >= state.pdf.numPages;
    ui.zoomLabel.textContent = `${Math.round(ZOOM_STEPS[state.zoomIndex] * 100)}%`;
    ui.zoomOut.disabled = state.zoomIndex === 0;
    ui.zoomIn.disabled = state.zoomIndex === ZOOM_STEPS.length - 1;
    ui.modeScroll.setAttribute("aria-pressed", String(state.mode === "scroll"));
    ui.modePage.setAttribute("aria-pressed", String(state.mode === "page"));
  }

  function setStatus(message) {
    ui.status.textContent = message ?? "";
    ui.status.hidden = !message;
    ui.sheet.hidden = Boolean(message) || state.mode !== "page";
    ui.pages.hidden = Boolean(message) || state.mode !== "scroll";
  }

  /** Gambar satu halaman beserta lapisan teksnya; null kalau sudah tidak relevan (isStale). */
  async function paintPage(page, viewport, canvas, textEl, isStale) {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * ratio);
    canvas.height = Math.floor(viewport.height * ratio);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const context = canvas.getContext("2d");
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    await page.render({ canvasContext: context, viewport }).promise;
    if (isStale()) return null;

    // Lapisan teks: dasar untuk memilih/menyalin teks dan untuk sorotan.
    textEl.replaceChildren();
    textEl.style.width = `${Math.floor(viewport.width)}px`;
    textEl.style.height = `${Math.floor(viewport.height)}px`;
    // PDF.js menghitung ukuran teks dari variabel ini; tanpanya ia mengeluh di konsol setiap halaman.
    textEl.style.setProperty("--scale-factor", String(viewport.scale));
    const content = await page.getTextContent();
    if (isStale()) return null;

    const spans = [];
    await window.pdfjsLib.renderTextLayer({
      textContentSource: content,
      container: textEl,
      viewport,
      textDivs: spans,
    }).promise;
    return isStale() ? null : spans;
  }

  /* ------------------------------------------------------------ mode halaman */

  async function render() {
    if (!state.pdf) return;
    const token = ++state.token;
    const stale = () => token !== state.token;

    updateControls();
    ui.foot.hidden = true;
    state.cited = null;

    const page = await state.pdf.getPage(state.page);
    if (stale()) return;

    const viewport = page.getViewport({ scale: scaleFor(page.getViewport({ scale: 1 }).width) });
    ui.sheet.style.width = `${Math.floor(viewport.width)}px`;
    ui.sheet.style.height = `${Math.floor(viewport.height)}px`;

    const spans = await paintPage(page, viewport, ui.canvas, ui.text, stale);
    if (!spans) return;

    markCitation(spans, state.page);
    setStatus("");
  }

  /** Sorot kalimat rujukan kalau halaman ini yang dirujuk, dan bawa ke tengah layar sekali. */
  function markCitation(spans, pageNumber) {
    if (!state.highlight || pageNumber !== state.citedPage) return;

    const range = findSpanRange(
      spans.map((span) => span.textContent),
      state.highlight,
    );
    if (!range) return;

    for (let i = range.first; i <= range.last; i += 1) spans[i].classList.add("is-cited");
    state.cited = {
      page: pageNumber,
      text: spans
        .slice(range.first, range.last + 1)
        .map((span) => span.textContent)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    };
    ui.footWhere.textContent = `${state.doc.reference} · hal. ${pageNumber}`;
    ui.foot.hidden = false;

    // Bawa kalimat yang disorot ke tengah layar, bukan dibiarkan di bawah lipatan.
    if (state.mode === "page" || !state.citationFocused) {
      state.citationFocused = true;
      const stage = ui.stage.getBoundingClientRect();
      const at = spans[range.first].getBoundingClientRect();
      ui.stage.scrollTo({ top: Math.max(0, ui.stage.scrollTop + (at.top - stage.top) - ui.stage.clientHeight / 3) });
    }
  }

  /* ------------------------------------------------------------ mode gulir */

  function teardownScroll() {
    state.scrollGen += 1;
    cancelAnimationFrame(frame);
    frame = 0;
    scrollPages.clear();
    ui.pages.replaceChildren();
  }

  /** Susun penampung semua halaman; isinya digambar belakangan, hanya yang mendekati layar. */
  async function buildScroll() {
    teardownScroll();
    if (!state.pdf) return;
    const gen = state.scrollGen;

    const first = await state.pdf.getPage(1);
    if (gen !== state.scrollGen) return;
    const guide = first.getViewport({ scale: scaleFor(first.getViewport({ scale: 1 }).width) });

    for (let n = 1; n <= state.pdf.numPages; n += 1) {
      const el = document.createElement("div");
      el.className = "viewer-sheet viewer-page";
      el.dataset.page = String(n);
      el.style.width = `${Math.floor(guide.width)}px`;
      el.style.height = `${Math.floor(guide.height)}px`;
      ui.pages.append(el);
      scrollPages.set(n, { el, canvas: null, rendered: false, rendering: false });
    }

    setStatus("");
    updateControls();
    scrollToPage(state.page);
  }

  async function ensureRendered(n) {
    const entry = scrollPages.get(n);
    if (!entry || entry.rendered || entry.rendering) return;
    entry.rendering = true;
    const gen = state.scrollGen;
    const stale = () => gen !== state.scrollGen;
    try {
      const page = await state.pdf.getPage(n);
      if (stale()) return;

      // Halaman yang ukurannya beda dari halaman pertama menyesuaikan diri di sini.
      const viewport = page.getViewport({ scale: scaleFor(page.getViewport({ scale: 1 }).width) });
      entry.el.style.width = `${Math.floor(viewport.width)}px`;
      entry.el.style.height = `${Math.floor(viewport.height)}px`;

      const canvas = document.createElement("canvas");
      const text = document.createElement("div");
      text.className = "textLayer";
      entry.el.replaceChildren(canvas, text);

      const spans = await paintPage(page, viewport, canvas, text, stale);
      if (!spans) return;
      entry.canvas = canvas;
      entry.rendered = true;
      markCitation(spans, n);
    } catch (error) {
      if (!stale()) console.warn(`Halaman ${n} gagal digambar:`, error);
    } finally {
      entry.rendering = false;
    }
  }

  function release(entry) {
    if (entry.canvas) entry.canvas.width = 0;
    entry.el.replaceChildren();
    entry.canvas = null;
    entry.rendered = false;
  }

  /** Gambar halaman yang dekat layar, lepas yang jauh, dan perbarui nomor halaman yang sedang dibaca. */
  function syncScroll() {
    frame = 0;
    if (state.mode !== "scroll" || !scrollPages.size) return;

    const top = ui.stage.scrollTop;
    const bottom = top + ui.stage.clientHeight;
    const reading = top + ui.stage.clientHeight / 3;
    let current = state.page;

    for (const [n, entry] of scrollPages) {
      const from = entry.el.offsetTop;
      const to = from + entry.el.offsetHeight;
      if (from <= reading && reading < to) current = n;
      if (to >= top - RENDER_MARGIN && from <= bottom + RENDER_MARGIN) ensureRendered(n);
      else if (entry.rendered && (to < top - KEEP_MARGIN || from > bottom + KEEP_MARGIN)) release(entry);
    }

    if (current !== state.page) {
      state.page = current;
      updateControls();
    }
  }

  function scrollToPage(n) {
    const entry = scrollPages.get(n);
    if (!entry) return;
    ui.stage.scrollTop = Math.max(0, entry.el.offsetTop - 12);
    syncScroll();
  }

  ui.stage.addEventListener("scroll", () => {
    if (state.mode === "scroll" && !frame) frame = requestAnimationFrame(syncScroll);
  });

  /* ------------------------------------------------------------ buka, tutup, navigasi */

  async function showCurrentMode() {
    if (!state.pdf) return;
    if (state.mode === "scroll") {
      state.token += 1; // batalkan gambar mode halaman yang masih berjalan
      await buildScroll();
    } else {
      teardownScroll();
      await render();
    }
  }

  async function setMode(mode) {
    if (state.mode === mode) return;
    state.mode = mode;
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* pilihan tidak tersimpan; tetap berlaku untuk pembaca ini */
    }
    updateControls();
    await showCurrentMode();
  }

  async function open(doc, { page = 1, highlight = "", headers = null } = {}) {
    state.opener = document.activeElement;
    state.doc = doc;
    state.page = page;
    state.citedPage = page;
    state.highlight = highlight;
    state.citationFocused = false;
    state.cited = null;
    state.mode = readMode();
    state.zoomIndex = ZOOM_STEPS.indexOf(1);

    ui.reference.textContent = doc.reference;
    ui.title.textContent = doc.title;
    ui.sub.textContent = `${doc.period} • ${doc.owner}`;
    ui.pageTotal.textContent = String(doc.pages);
    ui.download.href = doc.file;
    ui.download.hidden = Boolean(headers);
    ui.download.setAttribute("download", doc.file.split("/").pop());
    ui.foot.hidden = true;
    teardownScroll();
    updateControls();
    setStatus("Memuat dokumen…");

    root.hidden = false;
    document.body.classList.add("viewer-open");
    requestAnimationFrame(() => root.classList.add("is-open"));
    root.querySelector(".viewer-esc").focus({ preventScroll: true });

    try {
      const pdfjs = await loadPdfJs();
      // Draf yang belum divalidasi hanya terbuka bagi pengelola, lewat header sesi.
      state.pdf = await pdfjs.getDocument(headers ? { url: doc.file, httpHeaders: headers } : doc.file).promise;
      ui.pageTotal.textContent = String(state.pdf.numPages);
      state.page = Math.min(Math.max(1, page), state.pdf.numPages);
      state.citedPage = state.page;
      await showCurrentMode();
    } catch (error) {
      console.warn("Pembaca dokumen gagal:", error);
      ui.status.innerHTML = "";
      const message = document.createElement("span");
      message.textContent = "Dokumen tidak bisa ditampilkan di sini. ";
      const link = document.createElement("a");
      link.href = doc.file;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Buka berkas langsung";
      ui.status.append(message, link);
      ui.status.hidden = false;
      ui.sheet.hidden = true;
      ui.pages.hidden = true;
      onError(error);
    }
  }

  function close() {
    if (root.hidden) return;
    root.classList.remove("is-open");
    document.body.classList.remove("viewer-open");
    state.token += 1;
    teardownScroll();
    setTimeout(() => {
      root.hidden = true;
      state.pdf?.destroy?.();
      state.pdf = null;
    }, 180);
    state.opener?.focus?.({ preventScroll: true });
  }

  function go(delta) {
    if (!state.pdf) return;
    const next = Math.min(Math.max(1, state.page + delta), state.pdf.numPages);
    if (next === state.page) return;
    state.page = next;
    if (state.mode === "scroll") {
      updateControls();
      scrollToPage(next);
    } else {
      render();
    }
  }

  function zoom(delta) {
    const next = Math.min(Math.max(0, state.zoomIndex + delta), ZOOM_STEPS.length - 1);
    if (next === state.zoomIndex) return;
    state.zoomIndex = next;
    if (state.mode === "scroll") {
      updateControls();
      buildScroll();
    } else {
      render();
    }
  }

  ui.prev.addEventListener("click", () => go(-1));
  ui.next.addEventListener("click", () => go(1));
  ui.zoomIn.addEventListener("click", () => zoom(1));
  ui.zoomOut.addEventListener("click", () => zoom(-1));
  ui.modeScroll.addEventListener("click", () => setMode("scroll"));
  ui.modePage.addEventListener("click", () => setMode("page"));

  ui.copy.addEventListener("click", async () => {
    const quote = state.cited?.text;
    const where = `${state.doc.title}, ${state.doc.reference}, hal. ${quote ? state.cited.page : state.page}`;
    const text = quote ? `"${quote}"\n— ${where}` : where;
    try {
      await navigator.clipboard.writeText(text);
      onCopy(quote ? "Kutipan disalin." : "Sumber disalin.");
    } catch {
      onCopy("Browser menolak akses papan klip.");
    }
  });

  root.addEventListener("click", (event) => {
    if (event.target.closest("[data-viewer-close]")) close();
  });

  document.addEventListener("keydown", (event) => {
    if (root.hidden) return;
    if (event.key === "Escape") close();
    else if (state.mode === "page" && event.key === "ArrowLeft" && event.target === ui.stage) go(-1);
    else if (state.mode === "page" && event.key === "ArrowRight" && event.target === ui.stage) go(1);
  });

  return { open, close, isOpen: () => !root.hidden };
}
