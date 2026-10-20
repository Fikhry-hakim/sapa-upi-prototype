/**
 * Halaman pengelola: Dashboard, Metrics, dan Knowledge Base (termasuk unggah).
 *
 * Semua angka berasal dari Worker. Halaman ini tidak punya data contoh:
 * kalau belum ada interaksi, yang tampil adalah nol dan keadaan kosong,
 * bukan angka yang terlihat meyakinkan tetapi tidak nyata.
 */

import { bold, buildXlsx } from "./lib/xlsx.js";
import { loadPdfJs } from "./viewer.js";

/* ============================================================
   PRIMITIF
============================================================ */

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const svgNs = "http://www.w3.org/2000/svg";

function svg(tag, attrs = {}) {
  const node = document.createElementNS(svgNs, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

const ICONS = {
  chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H8l-4 4Z"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/></svg>',
  question: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5M12 17h.01"/></svg>',
  doc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h7.5L19 8v12.5H7z"/><path d="M14 3.5V8h5M10 13h6M10 16.5h4"/></svg>',
  warn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 2.5 20h19Z"/><path d="M12 10v4.5M12 17.5h.01"/></svg>',
  docCheck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h7.5L19 8v12.5H7z"/><path d="m9.5 14 2 2 3.5-4"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>',
  export: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5-5 5 5M5 20h14"/></svg>',
  upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V5M7 10l5-5 5 5M5 20h14"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  trend: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 15 5-5 4 4 7-8M15 6h5v5"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
};

function icon(name) {
  const span = make("span", "icon");
  span.innerHTML = ICONS[name];
  return span;
}

const nf = new Intl.NumberFormat("id-ID");
const pf = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const formatPercent = (value) => `${pf.format(value)}%`;

/** Waktu WIB dari kolom `at` (UTC, 'YYYY-MM-DD HH:MM:SS'). */
function wibParts(value) {
  const date = new Date(`${String(value).replace(" ", "T")}Z`);
  const zone = { timeZone: "Asia/Jakarta" };
  const day = (d) => d.toLocaleDateString("en-CA", zone);
  const now = new Date();
  const yesterday = new Date(now.getTime() - 86_400_000);

  let label;
  if (day(date) === day(now)) label = "Hari ini";
  else if (day(date) === day(yesterday)) label = "Kemarin";
  else label = date.toLocaleDateString("id-ID", { ...zone, day: "numeric", month: "short" });

  const time = date.toLocaleTimeString("id-ID", { ...zone, hour: "2-digit", minute: "2-digit", hour12: false });
  return { time: `${time.replace(".", ":")} WIB`, label };
}

const OUTCOME = {
  berbasis_sumber: { label: "Berbasis Sumber", color: "#b91c2c", chip: "Berbasis Sumber" },
  klarifikasi: { label: "Klarifikasi Info", color: "#1f2a44", chip: "Klarifikasi" },
  bukti_terbatas: { label: "Bukti Terbatas", color: "#6b7a99", chip: "Bukti Terbatas" },
  di_luar_cakupan: { label: "Di Luar Cakupan", color: "#e08a2c", chip: "Di Luar Cakupan" },
  gangguan_teknis: { label: "Gangguan Teknis", color: "#e8788a", chip: "Gangguan" },
};

const SOURCE_STATE = [
  { key: "ready", label: "Siap Digunakan", color: "#2e9e6b", note: "Tervalidasi dan aktif untuk RAG" },
  { key: "validating", label: "Menunggu Validasi", color: "#e8a33a", note: "Menunggu persetujuan pengelola" },
  { key: "parse_failed", label: "Gagal Parsing", color: "#d6455a", note: "Teks tidak terbaca, mis. hasil pindai" },
  { key: "inactive", label: "Nonaktif", color: "#6b7a99", note: "Disimpan, tetapi tidak dipakai menjawab" },
  { key: "expired", label: "Tidak Berlaku", color: "#1f2a44", note: "Pedoman yang sudah diganti" },
];

/* ============================================================
   FABRIK
============================================================ */

export function createOwner({ api, getAccount, showToast, openViewer, authHeaders }) {
  const roleOf = () => getAccount()?.role ?? null;
  const canUpload = () => ["upload", "admin"].includes(roleOf());
  const canReview = () => ["review", "admin"].includes(roleOf());
  const isAdmin = () => roleOf() === "admin";

  function pageHeader(root, title, id) {
    const head = make("div", "owner-head");
    const heading = make("h1", "", title);
    heading.id = id;
    head.append(heading);
    root.append(head);
    return head;
  }

  function emptyState(message) {
    return make("p", "owner-empty", message);
  }

  async function guarded(root, task) {
    try {
      await task();
    } catch (error) {
      console.warn("Halaman pengelola gagal dimuat:", error);
      root.replaceChildren(
        emptyState(
          error.status === 403
            ? "Akun ini belum ditugaskan sebagai pengelola."
            : error.status === 401
              ? "Sesi berakhir. Masuk lagi untuk melanjutkan."
              : "Data belum bisa dimuat. Coba lagi sebentar lagi.",
        ),
      );
    }
  }

  /* ============================================================
     DASHBOARD
  ============================================================ */

  const dashboard = { range: "mingguan", from: "", to: "", outcome: null, page: 1, data: null };

  async function renderDashboard(root) {
    root.replaceChildren();
    await guarded(root, async () => {
      const query = new URLSearchParams({ range: dashboard.range });
      if (dashboard.range === "rentang" && dashboard.from && dashboard.to) {
        query.set("from", dashboard.from);
        query.set("to", dashboard.to);
      }
      const [overview, interactions] = await Promise.all([
        api(`/admin/overview?${query}`),
        api(`/admin/interactions?${new URLSearchParams({ page: dashboard.page, ...(dashboard.outcome ? { outcome: dashboard.outcome } : {}) })}`),
      ]);
      dashboard.data = overview;
      draw(root, overview, interactions);
    });
  }

  function draw(root, overview, interactions) {
    root.replaceChildren();
    const s = overview.summary;

    /* --- kepala + kontrol --- */
    const head = pageHeader(root, "Dashboard Overview", "dashboard-title");
    const controls = make("div", "owner-controls");

    const refresh = make("button", "icon-btn");
    refresh.type = "button";
    refresh.setAttribute("aria-label", "Muat ulang data");
    refresh.append(icon("refresh"));
    refresh.addEventListener("click", () => renderDashboard(root));

    const segmented = make("div", "segmented");
    segmented.setAttribute("role", "group");
    segmented.setAttribute("aria-label", "Rentang waktu");
    for (const [id, label] of [["harian", "Harian"], ["mingguan", "Mingguan"], ["bulanan", "Bulanan"], ["rentang", "Rentang"]]) {
      const button = make("button", id === dashboard.range ? "is-active" : "", label);
      button.type = "button";
      button.addEventListener("click", () => {
        dashboard.range = id;
        dashboard.page = 1;
        renderDashboard(root);
      });
      segmented.append(button);
    }

    const exportButton = make("button", "btn-primary");
    exportButton.type = "button";
    exportButton.append(icon("export"), "Export Laporan");
    exportButton.addEventListener("click", () => exportReport(s));

    controls.append(refresh, segmented, exportButton);
    head.append(controls);

    if (dashboard.range === "rentang") {
      const pick = make("div", "range-pick");
      const from = make("input");
      from.type = "date";
      from.value = dashboard.from;
      from.setAttribute("aria-label", "Dari tanggal");
      const to = make("input");
      to.type = "date";
      to.value = dashboard.to;
      to.setAttribute("aria-label", "Sampai tanggal");
      const apply = make("button", "btn", "Terapkan");
      apply.type = "button";
      apply.addEventListener("click", () => {
        if (!from.value || !to.value) return showToast("Pilih tanggal awal dan akhir.");
        dashboard.from = from.value;
        dashboard.to = to.value;
        renderDashboard(root);
      });
      pick.append(make("span", "", "Dari"), from, make("span", "", "sampai"), to, apply);
      root.append(pick);
    }

    /* --- kartu angka --- */
    const grid = make("div", "stat-grid");
    const card = (title, value, suffix, caption, iconName, tone, delta) => {
      const el = make("div", `stat-card tone-${tone}`);
      const top = make("div", "stat-top");
      top.append(make("span", "stat-label", title));
      const badge = make("span", "stat-badge");
      badge.innerHTML = ICONS[iconName];
      top.append(badge);

      const line = make("div", "stat-value");
      line.append(make("strong", "", value));
      if (suffix) line.append(make("small", "", suffix));
      if (delta) line.append(delta);

      el.append(top, line, make("p", "stat-caption", caption));
      return el;
    };

    let delta = null;
    if (s.change !== null) {
      delta = make("span", `delta ${s.change >= 0 ? "up" : "down"}`);
      delta.innerHTML = ICONS.trend;
      delta.append(`${s.change >= 0 ? "+" : ""}${pf.format(s.change)}% ${s.range === "harian" ? "d/d" : s.range === "bulanan" ? "m/m" : "w/w"}`);
    }

    grid.append(
      card("Total Interaksi", nf.format(s.total), "", "Total pertanyaan chatbot selama periode pengamatan di Prodi Bisnis Digital.", "chat", "blue", delta),
      card("Jawaban Berbasis Sumber", nf.format(s.counts.berbasis_sumber), `(${formatPercent(s.percents.berbasis_sumber)})`, "Respons substantif dengan rujukan dokumen resmi yang tercatat.", "check", "red"),
      card("Tingkat Klarifikasi", formatPercent(s.percents.klarifikasi), `(${nf.format(s.counts.klarifikasi)} interaksi)`, "Pertanyaan yang cocok dengan beberapa topik sama kuat.", "question", "blue"),
      card("Ketercukupan Bukti", formatPercent(s.percents.bukti_terbatas), `(${nf.format(s.counts.bukti_terbatas)} interaksi)`, "Rujukan cocok tetapi tipis; jawaban dibatasi pada rujukan itu.", "doc", "violet"),
      card("Kegagalan Teknis", formatPercent(s.percents.gangguan_teknis), `(${nf.format(s.counts.gangguan_teknis)} interaksi)`, "Model bahasa tidak terjangkau (kuota, beban, atau batas waktu); pembaca dilayani mode offline.", "warn", "red"),
      card("Kesiapan Sumber", formatPercent(overview.documents.readiness), `(${overview.documents.ready} dari ${overview.documents.total} dokumen)`, "Sumber akademik tervalidasi, berstatus aktif, dan siap dipakai menjawab.", "docCheck", "violet"),
    );
    root.append(grid);

    /* --- grafik --- */
    const charts = make("div", "chart-row");
    charts.append(trendCard(s), donutCard(s));
    root.append(charts);

    /* --- kondisi sumber --- */
    root.append(sourceCard(overview.documents));

    /* --- aktivitas --- */
    root.append(activityCard(root, overview, interactions));
  }

  function trendCard(s) {
    const wrap = make("section", "panel-card");
    const head = make("div", "panel-card-head");
    const text = make("div");
    text.append(
      make("h2", "", "Tren Penggunaan Chatbot"),
      make("p", "", `Interaksi mahasiswa Program Studi Bisnis Digital (Total: ${nf.format(s.total)})`),
    );
    head.append(text, make("span", "pill-soft", s.label));
    wrap.append(head, make("p", "chart-axis-title", "Volume Interaksi"));

    const W = 600;
    const H = 210;
    const pad = { l: 34, r: 34, t: 26, b: 28 };
    const peak = Math.max(1, ...s.series.map((p) => p.total));
    const max = Math.max(4, Math.ceil(peak / 4) * 4 + (peak % 4 === 0 ? 4 : 0));
    const x = (i) => pad.l + (s.series.length === 1 ? (W - pad.l - pad.r) / 2 : (i * (W - pad.l - pad.r)) / (s.series.length - 1));
    const y = (v) => H - pad.b - (v / max) * (H - pad.t - pad.b);

    const chart = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "trend", role: "img", "aria-label": `Tren interaksi: ${s.series.map((p) => `${p.label} ${p.total}`).join(", ")}` });
    const defs = svg("defs");
    const gradient = svg("linearGradient", { id: "trend-fill", x1: 0, y1: 0, x2: 0, y2: 1 });
    gradient.append(svg("stop", { offset: "0%", "stop-color": "#b91c2c", "stop-opacity": 0.28 }), svg("stop", { offset: "100%", "stop-color": "#b91c2c", "stop-opacity": 0.02 }));
    defs.append(gradient);
    chart.append(defs);

    for (let step = 0; step <= 4; step += 1) {
      const value = (max / 4) * step;
      chart.append(
        svg("line", { x1: pad.l, x2: W - pad.r, y1: y(value), y2: y(value), class: "grid-line" }),
        Object.assign(svg("text", { x: pad.l - 8, y: y(value) + 3, class: "axis-text", "text-anchor": "end" }), { textContent: Math.round(value) }),
      );
    }

    const points = s.series.map((p, i) => [x(i), y(p.total)]);
    if (points.length > 1) {
      const line = points.map(([px, py], i) => `${i ? "L" : "M"}${px},${py}`).join(" ");
      chart.append(
        svg("path", { d: `${line} L${points.at(-1)[0]},${H - pad.b} L${points[0][0]},${H - pad.b} Z`, fill: "url(#trend-fill)" }),
        svg("path", { d: line, class: "trend-line" }),
      );
    }

    s.series.forEach((p, i) => {
      const [px, py] = points[i];
      chart.append(svg("circle", { cx: px, cy: py, r: 3.6, class: "trend-dot" }));
      if (s.series.length <= 8 || p === s.peak) {
        const tag = svg("g", { class: `trend-tag${p === s.peak ? " is-peak" : ""}` });
        tag.append(
          svg("rect", { x: px - 22, y: py - 24, width: 44, height: 16, rx: 5 }),
          Object.assign(svg("text", { x: px, y: py - 13, "text-anchor": "middle" }), { textContent: `${p.total} req` }),
        );
        chart.append(tag);
      }
      const skip = s.series.length > 8 && i % Math.ceil(s.series.length / 8) !== 0;
      if (!skip) {
        chart.append(Object.assign(svg("text", { x: px, y: H - 8, class: "axis-text", "text-anchor": "middle" }), { textContent: p.label }));
      }
    });
    wrap.append(chart);

    const foot = make("div", "chart-foot");
    foot.append(
      make("span", "", s.total ? `Puncak: ${s.peak.label} (${nf.format(s.peak.total)} interaksi)` : "Belum ada interaksi pada periode ini."),
      make("span", "", `Rata-rata: ${pf.format(s.averagePerBucket)} interaksi/${s.range === "harian" || s.range === "rentang" ? "hari" : s.range === "bulanan" ? "bulan" : "minggu"}`),
    );
    wrap.append(foot);
    return wrap;
  }

  function donutCard(s) {
    const wrap = make("section", "panel-card");
    const text = make("div", "panel-card-head");
    const inner = make("div");
    inner.append(make("h2", "", "Distribusi Hasil Respons"), make("p", "", `Pengelompokan ${nf.format(s.total)} interaksi berdasarkan tipe respons mesin`));
    text.append(inner);
    wrap.append(text);

    const body = make("div", "donut-body");
    const R = 62;
    const C = 2 * Math.PI * R;
    const chart = svg("svg", { viewBox: "0 0 160 160", class: "donut", role: "img", "aria-label": "Distribusi hasil respons" });
    chart.append(svg("circle", { cx: 80, cy: 80, r: R, fill: "none", stroke: "#eef0f3", "stroke-width": 20 }));

    let offset = 0;
    for (const key of Object.keys(OUTCOME)) {
      const share = s.total ? s.counts[key] / s.total : 0;
      if (!share) continue;
      chart.append(
        svg("circle", {
          cx: 80, cy: 80, r: R, fill: "none", stroke: OUTCOME[key].color, "stroke-width": 20,
          "stroke-dasharray": `${Math.max(0, share * C - 1.5)} ${C}`,
          "stroke-dashoffset": -offset,
          transform: "rotate(-90 80 80)",
        }),
      );
      offset += share * C;
    }
    chart.append(
      Object.assign(svg("text", { x: 80, y: 82, "text-anchor": "middle", class: "donut-total" }), { textContent: nf.format(s.total) }),
      Object.assign(svg("text", { x: 80, y: 98, "text-anchor": "middle", class: "axis-text" }), { textContent: "Total Respons" }),
    );

    const legend = make("ul", "legend");
    for (const [key, meta] of Object.entries(OUTCOME)) {
      const item = make("li");
      const dot = make("i");
      dot.style.background = meta.color;
      item.append(dot, make("span", "", meta.label), make("strong", "", `${nf.format(s.counts[key])} (${formatPercent(s.percents[key])})`));
      legend.append(item);
    }
    body.append(chart, legend);
    wrap.append(body, make("p", "donut-note", `Akurasi grounded retrieval: ${formatPercent(s.groundedAccuracy)} (termasuk klarifikasi terarah)`));
    return wrap;
  }

  function sourceCard(stats) {
    const wrap = make("section", "panel-card");
    const head = make("div", "panel-card-head");
    const text = make("div");
    text.append(make("h2", "", "Kondisi Sumber Informasi Akademik"), make("p", "", `Status distribusi ${stats.total} dokumen pada basis pengetahuan RAG SAPA UPI.`));
    const link = make("button", "link-arrow");
    link.type = "button";
    link.append("Kelola Knowledge Base", icon("arrow"));
    link.addEventListener("click", () => document.getElementById("nav-kb").click());
    head.append(text, link);
    wrap.append(head);

    const bar = make("div", "stack-bar");
    bar.setAttribute("role", "img");
    for (const state of SOURCE_STATE) {
      const count = stats[state.key];
      if (!count) continue;
      const seg = make("span");
      seg.style.flex = String(count);
      seg.style.background = state.color;
      bar.append(seg);
    }
    wrap.append(bar);

    const row = make("div", "source-row");
    for (const state of SOURCE_STATE) {
      const count = stats[state.key];
      const cell = make("div", "source-cell");
      cell.style.setProperty("--tone", state.color);
      const title = make("div", "source-cell-title");
      title.append(make("i"), state.label);
      const value = make("div", "source-cell-value");
      value.append(make("strong", "", String(count)), make("small", "", `(${stats.total ? formatPercent((count / stats.total) * 100) : "0,0%"})`));
      cell.append(title, value, make("p", "", state.note));
      row.append(cell);
    }
    wrap.append(row);
    return wrap;
  }

  function activityCard(root, overview, interactions) {
    const wrap = make("section", "panel-card");
    const head = make("div", "panel-card-head");
    const text = make("div");
    text.append(make("h2", "", "Aktivitas Interaksi Terakhir"), make("p", "", "Log penanganan percakapan mahasiswa. Isi pertanyaan tidak disimpan."));
    head.append(text);

    const chips = make("div", "chips");
    const totals = overview.totals;
    for (const [value, label, count] of [
      [null, "Semua", totals.all],
      ["berbasis_sumber", "Berbasis Sumber", totals.berbasis_sumber],
      ["klarifikasi", "Klarifikasi", totals.klarifikasi],
      ["gangguan_teknis", "Gangguan", totals.gangguan_teknis],
    ]) {
      const chip = make("button", `chip${dashboard.outcome === value ? " is-active" : ""}`, `${label} (${nf.format(count)})`);
      chip.type = "button";
      chip.addEventListener("click", () => {
        dashboard.outcome = value;
        dashboard.page = 1;
        renderDashboard(root);
      });
      chips.append(chip);
    }
    head.append(chips);
    wrap.append(head);

    if (!interactions.rows.length) {
      wrap.append(emptyState(totals.all ? "Tidak ada interaksi untuk filter ini." : "Belum ada interaksi tercatat. Angka akan muncul setelah mahasiswa mulai bertanya."));
      return wrap;
    }

    const table = make("table", "owner-table");
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    for (const column of ["ID Interaksi", "Waktu", "Kategori Pertanyaan", "Hasil Respons", "Ketersediaan Referensi", "Durasi", "Status"]) {
      headRow.append(make("th", "", column));
    }
    thead.append(headRow);

    const tbody = document.createElement("tbody");
    for (const row of interactions.rows) {
      const tr = document.createElement("tr");
      const when = wibParts(row.at);
      const timeCell = make("td");
      timeCell.append(make("span", "", when.time), make("small", "", when.label));
      const outcomeCell = make("td");
      const pill = make("span", `outcome-pill outcome-${row.outcome}`, OUTCOME[row.outcome]?.label ?? row.outcome);
      outcomeCell.append(pill);

      const referenceCell = make("td", "reference-cell");
      referenceCell.textContent = row.documentId ? `${row.documentId.replaceAll("-", " ")}${row.page ? ` • hal. ${row.page}` : ""}` : "—";

      const statusCell = make("td");
      statusCell.append(make("span", `status-pill ${row.ok ? "ok" : "bad"}`, row.ok ? "Berhasil" : "Gagal RAG"));

      tr.append(
        make("td", "interaction-id", row.code),
        timeCell,
        make("td", "", row.category ?? "—"),
        outcomeCell,
        referenceCell,
        make("td", "", row.durationMs ? `${(row.durationMs / 1000).toFixed(1)}s` : "—"),
        statusCell,
      );
      tbody.append(tr);
    }
    table.append(thead, tbody);
    const scroll = make("div", "table-scroll");
    scroll.append(table);
    wrap.append(scroll);

    const pages = Math.max(1, Math.ceil(interactions.total / interactions.size));
    const foot = make("div", "table-foot");
    foot.append(make("span", "", `Menampilkan ${interactions.rows.length} dari ${nf.format(interactions.total)} interaksi`));
    const pager = make("div", "pager");
    const go = (label, page, disabled, active) => {
      const button = make("button", active ? "is-active" : "", label);
      button.type = "button";
      button.disabled = disabled;
      button.addEventListener("click", () => {
        dashboard.page = page;
        renderDashboard(root);
      });
      pager.append(button);
    };
    go("Sebelumnya", Math.max(1, interactions.page - 1), interactions.page <= 1);
    for (let p = Math.max(1, interactions.page - 1); p <= Math.min(pages, Math.max(3, interactions.page + 1)); p += 1) {
      go(String(p), p, false, p === interactions.page);
    }
    go("Selanjutnya", Math.min(pages, interactions.page + 1), interactions.page >= pages);
    foot.append(pager);
    wrap.append(foot);
    return wrap;
  }

  const EXPORT_PAGE = 50;
  const EXPORT_MAX_PAGES = 20; // 1.000 interaksi terbaru sudah cukup untuk satu laporan

  async function allInteractions() {
    const rows = [];
    for (let page = 1; page <= EXPORT_MAX_PAGES; page += 1) {
      const chunk = await api(`/admin/interactions?page=${page}&size=${EXPORT_PAGE}`);
      rows.push(...chunk.rows);
      if (rows.length >= chunk.total || !chunk.rows.length) break;
    }
    return rows;
  }

  async function exportReport(s) {
    showToast("Menyiapkan laporan Excel...");
    let rows = [];
    try {
      rows = await allInteractions();
    } catch (error) {
      showToast("Rincian aktivitas gagal diambil; laporan hanya memuat ringkasan.");
    }

    const summary = [
      bold(["Laporan SAPA UPI", s.label]),
      [],
      bold(["Metrik", "Jumlah", "Persen"]),
      ["Total interaksi", s.total, ""],
      ...Object.keys(OUTCOME).map((key) => [OUTCOME[key].label, s.counts[key], `${s.percents[key]}%`]),
      ["Akurasi grounded retrieval", "", `${s.groundedAccuracy}%`],
    ];
    const trend = [bold(["Periode", "Interaksi"]), ...s.series.map((p) => [p.label, p.total])];
    const activity = [
      bold(["ID Interaksi", "Waktu (WIB)", "Kategori Pertanyaan", "Hasil Respons", "Dokumen Rujukan", "Halaman", "Durasi (detik)", "Status"]),
      ...rows.map((row) => {
        const when = wibParts(row.at);
        return [
          row.code,
          `${when.label} ${when.time}`,
          row.category ?? "",
          OUTCOME[row.outcome]?.label ?? row.outcome,
          row.documentId ? row.documentId.replaceAll("-", " ") : "",
          row.page ?? "",
          row.durationMs ? Number((row.durationMs / 1000).toFixed(1)) : "",
          row.ok ? "Berhasil" : "Gagal RAG",
        ];
      }),
    ];

    const bytes = buildXlsx([
      { name: "Ringkasan", rows: summary, widths: [34, 14, 12] },
      { name: "Tren", rows: trend, widths: [24, 12] },
      { name: "Aktivitas", rows: activity, widths: [16, 22, 26, 24, 40, 10, 14, 12] },
    ]);

    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    );
    link.download = `laporan-sapa-upi-${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("Laporan Excel diunduh.");
  }

  /* ============================================================
     METRICS
  ============================================================ */

  async function renderMetrics(root) {
    root.replaceChildren();
    await guarded(root, async () => {
      const overview = await api("/admin/overview?range=bulanan");
      const s = overview.summary;
      pageHeader(root, "Metrics", "metrics-title");
      root.append(make("p", "owner-lede", `Definisi setiap angka di Dashboard beserta rumusnya, dihitung dari ${nf.format(s.total)} interaksi pada ${s.label.toLowerCase()}.`));

      const seconds = (ms) => (ms === null ? "—" : `${(ms / 1000).toFixed(1)} detik`);
      const rows = [
        ["Tingkat Jawaban Berbasis Sumber", formatPercent(s.percents.berbasis_sumber), "Rasio = (Interaksi berbasis sumber) / (Total interaksi) × 100%", "Seberapa sering jawaban punya rujukan dokumen yang kuat."],
        ["Tingkat Klarifikasi", formatPercent(s.percents.klarifikasi), "Rasio = (Interaksi dengan beberapa topik sama kuat) / (Total interaksi) × 100%", "Pertanyaan terlalu umum; sistem menyodorkan topik untuk dipilih."],
        ["Ketercukupan Bukti", formatPercent(s.percents.bukti_terbatas), "Rasio = (Interaksi dengan skor rujukan < 45) / (Total interaksi) × 100%", "Rujukan ada tetapi tipis. Angka tinggi menandakan topik yang perlu dilengkapi."],
        ["Di Luar Cakupan", formatPercent(s.percents.di_luar_cakupan), "Rasio = (Interaksi tanpa rujukan sama sekali) / (Total interaksi) × 100%", "Sistem menolak menjawab. Angka tinggi menandakan dokumen yang belum ada."],
        ["Kegagalan Teknis", formatPercent(s.percents.gangguan_teknis), "Rasio = (Interaksi saat model tidak terjangkau) / (Total interaksi) × 100%", "Pembaca tetap dilayani lewat mode offline."],
        ["Akurasi Grounded Retrieval", formatPercent(s.groundedAccuracy), "Akurasi = (Berbasis sumber + Klarifikasi) / (Total interaksi) × 100%", "Bagian jawaban yang tidak mengarang di luar dokumen."],
        ["Kesiapan Sumber", formatPercent(overview.documents.readiness), "Kesiapan = (Dokumen tervalidasi dan aktif) / (Total dokumen) × 100%", `${overview.documents.ready} dari ${overview.documents.total} dokumen siap dipakai menjawab.`],
        ["Durasi Respons (median)", seconds(s.durationMs.median), "Median dari lama pemrosesan tiap pertanyaan", `Rata-rata ${seconds(s.durationMs.average)}; persentil ke-95 ${seconds(s.durationMs.p95)}.`],
      ];

      const grid = make("div", "metric-grid");
      for (const [title, value, formula, note] of rows) {
        const card = make("article", "metric-card");
        const top = make("div", "metric-top");
        top.append(make("h2", "", title), make("strong", "", value));
        card.append(top, make("pre", "formula", formula), make("p", "", note));
        grid.append(card);
      }
      root.append(grid);
    });
  }

  /* ============================================================
     KNOWLEDGE BASE
  ============================================================ */

  const kb = { search: "", status: "all", page: 1 };
  const KB_PAGE_SIZE = 8;

  const STATUS_META = {
    ready: { label: "Tervalidasi", tone: "ok" },
    validating: { label: "Menunggu Validasi", tone: "wait" },
    parse_failed: { label: "Gagal Parsing", tone: "bad" },
    inactive: { label: "Nonaktif", tone: "muted" },
    expired: { label: "Tidak Berlaku", tone: "muted" },
  };

  const sizeLabel = (bytes) => (bytes >= 1048576 ? `${pf.format(bytes / 1048576)} MB` : `${nf.format(Math.max(1, Math.round(bytes / 1024)))} KB`);

  async function renderKnowledgeBase(root) {
    root.replaceChildren();
    await guarded(root, async () => {
      const [data, audit] = await Promise.all([api("/admin/documents"), api("/admin/audit")]);
      drawKnowledgeBase(root, data, audit.entries);
    });
  }

  function drawKnowledgeBase(root, data, auditEntries) {
    root.replaceChildren();
    pageHeader(root, "Knowledge Base", "kb-title");

    /* --- kartu repositori --- */
    const repo = make("section", "panel-card repo-card");
    const text = make("div");
    text.append(
      make("h2", "", "Dokumen Repositori AI & RAG"),
      make("p", "", "Penyimpanan terpusat berkas resmi: pedoman akademik, surat keputusan, dan pengumuman program studi yang dipakai chatbot SAPA UPI sebagai rujukan utama."),
    );
    repo.append(text);
    if (canUpload()) {
      const upload = make("button", "btn-primary");
      upload.type = "button";
      upload.append(icon("upload"), "Upload File");
      upload.addEventListener("click", () => openUpload(() => renderKnowledgeBase(root)));
      repo.append(upload);
    }
    root.append(repo);

    /* --- statistik --- */
    const stats = data.stats;
    const needs = stats.parse_failed + stats.expired + stats.inactive;
    const statRow = make("div", "kb-stats");
    for (const [label, value] of [
      ["TOTAL DOKUMEN RAG", stats.total],
      ["TERVALIDASI & AKTIF", stats.ready],
      ["REVIEW / MENUNGGU", stats.validating],
      ["PERLU PENANGANAN", needs],
    ]) {
      const cell = make("div", "kb-stat");
      cell.append(make("span", "", label), make("strong", "", `${nf.format(value)} Dokumen`));
      statRow.append(cell);
    }
    root.append(statRow);

    /* --- tabel --- */
    const panel = make("section", "panel-card table-card");
    const tools = make("div", "table-tools");
    const search = make("label", "field field-search");
    search.append(icon("search"));
    const input = make("input");
    input.type = "search";
    input.placeholder = "Cari dokumen repositori...";
    input.value = kb.search;
    input.autocomplete = "off";
    search.append(input);

    const select = make("select", "select");
    select.setAttribute("aria-label", "Filter status");
    for (const [value, label] of [["all", "Semua Status"], ...Object.entries(STATUS_META).map(([k, v]) => [k, v.label])]) {
      const option = make("option", "", label);
      option.value = value;
      option.selected = value === kb.status;
      select.append(option);
    }
    tools.append(search, select);
    panel.append(tools);

    const body = make("div");
    panel.append(body);
    root.append(panel);

    const redraw = () => {
      const term = kb.search.trim().toLowerCase();
      const list = data.documents.filter(
        (doc) =>
          (kb.status === "all" || doc.status === kb.status) &&
          (!term || `${doc.title} ${doc.reference} ${doc.owner}`.toLowerCase().includes(term)),
      );
      drawDocumentTable(body, root, data, list);
    };
    input.addEventListener("input", () => {
      kb.search = input.value;
      kb.page = 1;
      redraw();
    });
    select.addEventListener("change", () => {
      kb.status = select.value;
      kb.page = 1;
      redraw();
    });
    redraw();

    /* --- log audit --- */
    root.append(auditCard(auditEntries));
  }

  function drawDocumentTable(body, root, data, list) {
    body.replaceChildren();
    if (!list.length) {
      body.append(emptyState("Tidak ada dokumen yang cocok."));
      return;
    }

    const pages = Math.max(1, Math.ceil(list.length / KB_PAGE_SIZE));
    kb.page = Math.min(kb.page, pages);
    const visible = list.slice((kb.page - 1) * KB_PAGE_SIZE, kb.page * KB_PAGE_SIZE);

    const table = make("table", "owner-table kb-table");
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    for (const column of ["NAMA DOKUMEN & ID VERSI", "TIPE FILE", "STATUS VALIDASI", "MASA BERLAKU", "STATUS RAG", "AKSI"]) headRow.append(make("th", "", column));
    thead.append(headRow);

    const tbody = document.createElement("tbody");
    for (const doc of visible) {
      const tr = document.createElement("tr");

      const name = make("td", "doc-name");
      const icon = make("span", "doc-kind", doc.kind);
      const label = make("div");
      label.append(make("strong", "", doc.title), make("small", "", `${doc.reference} • ${sizeLabel(doc.sizeBytes)} • ${doc.pages} hlm`));
      name.append(icon, label);

      const meta = STATUS_META[doc.status] ?? { label: doc.status, tone: "muted" };
      const status = make("td");
      status.append(make("span", `status-tag tone-${meta.tone}`, meta.label));

      const rag = make("td");
      const toggle = make("button", `switch${doc.usable ? " is-on" : ""}`);
      toggle.type = "button";
      toggle.setAttribute("role", "switch");
      toggle.setAttribute("aria-checked", String(doc.usable));
      toggle.setAttribute("aria-label", `RAG untuk ${doc.title}`);
      toggle.disabled = !canReview() || (doc.status !== "ready");
      toggle.title = doc.status !== "ready" ? "Hanya dokumen tervalidasi yang bisa dinyalakan" : "";
      toggle.append(make("i"));
      toggle.addEventListener("click", () => act(root, `/admin/documents/${doc.id}/rag`, { active: !doc.ragActive }, doc.ragActive ? "RAG dimatikan." : "RAG dinyalakan."));
      rag.append(toggle);

      const actions = make("td", "doc-actions");
      const view = make("button", "link", "Detail");
      view.type = "button";
      view.addEventListener("click", () => {
        const absolute = doc.file?.startsWith("/") ? `${apiOrigin()}${doc.file}` : doc.file;
        if (!absolute) return showToast("Berkas belum diunggah.");
        const file = doc.bundled ? new URL(absolute, window.location.href).href : absolute;
        openViewer(
          { file, title: doc.title, owner: doc.owner, reference: doc.reference, period: doc.period, pages: doc.pages },
          { page: 1, headers: doc.status === "ready" || doc.status === "expired" || doc.bundled ? null : authHeaders() },
        );
      });
      actions.append(view);

      if (doc.status === "validating" && canReview()) {
        const validate = make("button", "link strong", "Validasi");
        validate.type = "button";
        validate.addEventListener("click", () => act(root, `/admin/documents/${doc.id}/validate`, {}, "Dokumen divalidasi dan aktif."));
        actions.append(validate);
      }
      if (!doc.bundled && (isAdmin() || (canUpload() && doc.uploadedBy === getAccount()?.email))) {
        const remove = make("button", "link danger", "Hapus");
        remove.type = "button";
        remove.addEventListener("click", () => {
          if (window.confirm(`Hapus "${doc.title}"? Teks dan berkasnya ikut terhapus.`)) act(root, `/admin/documents/${doc.id}`, null, "Dokumen dihapus.", "DELETE");
        });
        actions.append(remove);
      }
      if (isAdmin() && doc.status === "ready") {
        const expire = make("button", "link", "Tidak berlaku");
        expire.type = "button";
        expire.addEventListener("click", () => {
          if (window.confirm(`Tandai "${doc.title}" tidak berlaku? Dokumen berhenti dipakai menjawab.`)) act(root, `/admin/documents/${doc.id}/expire`, {}, "Ditandai tidak berlaku.");
        });
        actions.append(expire);
      }

      tr.append(name, make("td", "", doc.type ?? doc.kind), status, make("td", "", doc.period), rag, actions);
      tbody.append(tr);
    }
    table.append(thead, tbody);
    const scroll = make("div", "table-scroll");
    scroll.append(table);
    body.append(scroll);

    const foot = make("div", "table-foot");
    foot.append(make("span", "", `Menampilkan ${visible.length} dari ${list.length} dokumen repositori`));
    const pager = make("div", "pager");
    for (let p = 1; p <= pages; p += 1) {
      const button = make("button", p === kb.page ? "is-active" : "", String(p));
      button.type = "button";
      button.addEventListener("click", () => {
        kb.page = p;
        drawDocumentTable(body, root, data, list);
      });
      pager.append(button);
    }
    if (pages > 1) foot.append(pager);
    body.append(foot);
  }

  let apiBase = "";
  const apiOrigin = () => apiBase;

  async function act(root, path, payload, success, method = "POST") {
    try {
      await api(path, { method, body: payload === null ? undefined : JSON.stringify(payload) });
      showToast(success);
      renderKnowledgeBase(root);
    } catch (error) {
      console.warn("Aksi dokumen gagal:", error);
      showToast(error.status === 403 ? "Peranmu tidak berwenang melakukan ini." : error.status === 409 ? "Status dokumen sudah berubah. Muat ulang." : "Aksi gagal. Coba lagi.");
    }
  }

  const ACTION_LABELS = {
    unggah: "mengunggah",
    "unggah-berkas": "menyimpan berkas",
    validasi: "memvalidasi",
    "rag-aktif": "menyalakan RAG",
    "rag-nonaktif": "mematikan RAG",
    "tidak-berlaku": "menandai tidak berlaku",
    hapus: "menghapus",
  };

  function auditCard(entries) {
    const wrap = make("section", "panel-card");
    const head = make("div", "panel-card-head");
    const text = make("div");
    text.append(make("h2", "", "Aktivitas Terbaru Knowledge Base"), make("p", "", "Setiap perubahan tercatat beserta siapa yang melakukannya."));
    head.append(text);
    wrap.append(head);

    if (!entries.length) {
      wrap.append(emptyState("Belum ada perubahan tercatat."));
      return wrap;
    }

    const list = make("ul", "audit-list");
    for (const entry of entries) {
      const item = make("li");
      const when = wibParts(entry.at);
      const line = make("div");
      line.append(make("strong", "", entry.actor), ` ${ACTION_LABELS[entry.action] ?? entry.action}`);
      if (entry.detail) line.append(make("small", "", entry.detail));
      item.append(line, make("span", "", `${when.label}, ${when.time}`));
      list.append(item);
    }
    wrap.append(list);
    return wrap;
  }

  /* ============================================================
     UNGGAH
  ============================================================ */

  const STEPS = ["Membaca berkas", "Mengekstrak teks per halaman", "Mengunggah dokumen", "Menunggu validasi"];

  function openUpload(onDone) {
    const dialog = make("div", "modal");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "upload-title");
    const scrim = make("div", "modal-scrim");
    const box = make("div", "modal-box");
    dialog.append(scrim, box);

    const close = () => dialog.remove();
    scrim.addEventListener("click", close);
    document.addEventListener(
      "keydown",
      function onKey(event) {
        if (event.key === "Escape") {
          close();
          document.removeEventListener("keydown", onKey);
        }
      },
    );

    const head = make("div", "modal-head");
    const title = make("h2", "", "Upload File");
    title.id = "upload-title";
    const closeButton = make("button", "icon-btn");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Tutup");
    closeButton.append(icon("close"));
    closeButton.addEventListener("click", close);
    head.append(title, closeButton);

    const intro = make("p", "modal-intro", "Berkas PDF dibaca di browsermu, lalu teksnya dikirim untuk dicari. Dokumen baru berstatus Menunggu Validasi dan belum dipakai menjawab sampai divalidasi.");

    const drop = make("label", "dropzone");
    drop.append(icon("upload"), make("strong", "", "Pilih berkas PDF"), make("small", "", "Maksimum 24 MB"));
    const picker = make("input");
    picker.type = "file";
    picker.accept = "application/pdf,.pdf";
    picker.className = "sr-only";
    drop.append(picker);

    const form = make("form", "upload-form");
    form.hidden = true;
    const field = (label, name, placeholder, required = false) => {
      const wrap = make("label", "form-field");
      wrap.append(make("span", "", label));
      const input = make("input");
      input.name = name;
      input.placeholder = placeholder;
      input.required = required;
      input.maxLength = 160;
      wrap.append(input);
      form.append(wrap);
      return input;
    };
    const titleInput = field("Judul dokumen", "title", "Mis. Pedoman Akademik 2027", true);
    const referenceInput = field("Nomor atau edisi", "reference", "Mis. Nomor SK atau Edisi 2027");
    const ownerInput = field("Pemilik dokumen", "owner", "Mis. Program Studi Bisnis Digital");
    const periodInput = field("Masa berlaku", "period", "Mis. Tahun Akademik 2026/2027");

    const progress = make("ol", "steps-progress");
    progress.hidden = true;
    for (const step of STEPS) progress.append(make("li", "", step));

    const message = make("p", "modal-message");
    message.setAttribute("role", "status");

    const submit = make("button", "btn-primary");
    submit.type = "submit";
    submit.append(icon("upload"), "Unggah & Ekstrak");
    form.append(submit);

    box.append(head, intro, drop, form, progress, message);
    document.body.append(dialog);

    let chosen = null;

    picker.addEventListener("change", () => {
      const file = picker.files?.[0];
      if (!file) return;
      if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
        message.textContent = "Hanya berkas PDF yang diterima.";
        return;
      }
      if (file.size > 24 * 1024 * 1024) {
        message.textContent = "Berkas melebihi 24 MB.";
        return;
      }
      chosen = file;
      message.textContent = "";
      drop.hidden = true;
      form.hidden = false;
      titleInput.value = file.name.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ").trim();
      titleInput.focus();
    });

    const mark = (index) => {
      [...progress.children].forEach((li, i) => {
        li.className = i < index ? "is-done" : i === index ? "is-current" : "";
      });
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!chosen) return;
      form.hidden = true;
      progress.hidden = false;
      message.textContent = "";

      try {
        mark(0);
        const bytes = await chosen.arrayBuffer();

        mark(1);
        const pdfjs = await loadPdfJs();
        const pdf = await pdfjs.getDocument({ data: bytes.slice(0) }).promise;
        const passages = [];
        for (let number = 1; number <= pdf.numPages; number += 1) {
          const page = await pdf.getPage(number);
          const content = await page.getTextContent();
          passages.push({ page: number, text: content.items.map((item) => item.str).join(" ") });
          progress.children[1].textContent = `Mengekstrak teks per halaman (${number}/${pdf.numPages})`;
        }

        mark(2);
        const created = await api("/admin/documents", {
          method: "POST",
          body: JSON.stringify({
            title: titleInput.value,
            reference: referenceInput.value,
            owner: ownerInput.value,
            period: periodInput.value,
            sizeBytes: chosen.size,
            passages,
          }),
        });
        await api(`/admin/documents/${created.id}/file`, {
          method: "PUT",
          headers: { "content-type": "application/pdf" },
          body: bytes,
        });

        mark(4);
        message.textContent = created.warnings?.length
          ? `Diunggah, tetapi: ${created.warnings.join(" ")}`
          : "Dokumen diunggah dan menunggu validasi.";
        showToast("Dokumen diunggah.");
        onDone?.();
        setTimeout(close, created.warnings?.length ? 4000 : 1400);
      } catch (error) {
        console.warn("Unggah gagal:", error);
        message.textContent =
          error.status === 403 ? "Peranmu tidak berwenang mengunggah." : error.status === 413 ? "Berkas terlalu besar." : "Unggah gagal. Periksa berkasnya, lalu coba lagi.";
        progress.hidden = true;
        form.hidden = false;
      }
    });
  }

  return {
    setApiBase(base) {
      apiBase = base;
    },
    renderDashboard,
    renderMetrics,
    renderKnowledgeBase,
  };
}
