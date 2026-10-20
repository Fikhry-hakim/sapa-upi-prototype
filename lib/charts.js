/**
 * Grafik tambahan Dashboard Admin (Lampiran A, Tabel A.7, grafik 3 sampai 8).
 *
 * Setiap fungsi mengembalikan satu kartu. Grafik hanya menampilkan apa yang
 * benar-benar tercatat: tahap kegagalan selain pemanggilan model dan hasil
 * evaluasi jawaban belum dicatat, jadi keduanya tampil apa adanya sebagai
 * "belum tersedia", bukan sebagai nol yang menyesatkan.
 */

const svgNs = "http://www.w3.org/2000/svg";
const nf = new Intl.NumberFormat("id-ID");
const secondsFormat = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function svg(tag, attrs = {}) {
  const node = document.createElementNS(svgNs, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

function card(title, subtitle) {
  const wrap = make("section", "panel-card chart-card");
  const head = make("div", "panel-card-head");
  const text = make("div");
  text.append(make("h2", "", title), make("p", "", subtitle));
  head.append(text);
  wrap.append(head);
  return wrap;
}

function empty(message) {
  return make("p", "owner-empty", message);
}

function legend(items) {
  const list = make("ul", "mini-legend");
  for (const { label, color } of items) {
    const item = make("li");
    const dot = make("i");
    dot.style.background = color;
    item.append(dot, label);
    list.append(item);
  }
  return list;
}

/** Skala sumbu Y: kelipatan 4 supaya empat garis bantu rapi. */
function niceMax(peak) {
  return Math.max(4, Math.ceil(peak / 4) * 4 + (peak % 4 === 0 && peak > 0 ? 4 : 0));
}

function axes(chart, { W, H, pad, max, format = (v) => String(Math.round(v)) }) {
  const y = (v) => H - pad.b - (v / max) * (H - pad.t - pad.b);
  for (let step = 0; step <= 4; step += 1) {
    const value = (max / 4) * step;
    chart.append(
      svg("line", { x1: pad.l, x2: W - pad.r, y1: y(value), y2: y(value), class: "grid-line" }),
      Object.assign(svg("text", { x: pad.l - 8, y: y(value) + 3, class: "axis-text", "text-anchor": "end" }), { textContent: format(value) }),
    );
  }
  return y;
}

/** 3. Perkembangan Jenis Respons: batang bertumpuk per periode. */
export function stackedOutcomeCard(s, outcomes) {
  const keys = Object.keys(outcomes);
  const wrap = card("Perkembangan Jenis Respons", "Perubahan kategori hasil interaksi antarperiode");
  const rows = s.seriesByOutcome ?? [];
  if (!s.total) {
    wrap.append(empty("Belum ada interaksi pada periode ini."));
    return wrap;
  }

  const W = 600;
  const H = 210;
  const pad = { l: 34, r: 14, t: 14, b: 28 };
  const peak = Math.max(1, ...rows.map((row) => keys.reduce((sum, key) => sum + row.counts[key], 0)));
  const max = niceMax(peak);
  const chart = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "trend", role: "img", "aria-label": "Jenis respons per periode" });
  const y = axes(chart, { W, H, pad, max });

  const slot = (W - pad.l - pad.r) / rows.length;
  const barWidth = Math.min(46, slot * 0.6);
  rows.forEach((row, i) => {
    const cx = pad.l + slot * i + slot / 2;
    let base = 0;
    for (const key of keys) {
      const count = row.counts[key];
      if (!count) continue;
      const top = y(base + count);
      const bottom = y(base);
      chart.append(svg("rect", { x: cx - barWidth / 2, y: top, width: barWidth, height: bottom - top, fill: outcomes[key].color, rx: 2 }));
      base += count;
    }
    const skip = rows.length > 8 && i % Math.ceil(rows.length / 8) !== 0;
    if (!skip) chart.append(Object.assign(svg("text", { x: cx, y: H - 8, class: "axis-text", "text-anchor": "middle" }), { textContent: row.label }));
  });
  wrap.append(chart, legend(keys.map((key) => ({ label: outcomes[key].label, color: outcomes[key].color }))));
  return wrap;
}

/** 4. Tren Waktu Respons: rata-rata durasi per periode. */
export function responseTimeCard(s) {
  const wrap = card("Tren Waktu Respons", "Rata-rata waktu penyelesaian per periode (detik)");
  const rows = s.durationSeries ?? [];
  const known = rows.filter((row) => row.averageMs !== null);
  if (!known.length) {
    wrap.append(empty("Belum ada interaksi dengan data waktu pada periode ini."));
    return wrap;
  }

  const W = 600;
  const H = 210;
  const pad = { l: 34, r: 24, t: 20, b: 28 };
  const peak = Math.max(...known.map((row) => row.averageMs / 1000));
  const max = Math.max(4, Math.ceil(peak / 4) * 4 + (peak % 4 === 0 ? 4 : 0));
  const chart = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "trend", role: "img", "aria-label": "Waktu respons rata-rata per periode" });
  const y = axes(chart, { W, H, pad, max });
  const x = (i) => pad.l + (rows.length === 1 ? (W - pad.l - pad.r) / 2 : (i * (W - pad.l - pad.r)) / (rows.length - 1));

  // Periode tanpa data memutus garis, bukan menariknya ke nol.
  const segments = [];
  let current = [];
  rows.forEach((row, i) => {
    if (row.averageMs === null) {
      if (current.length) segments.push(current);
      current = [];
    } else {
      current.push([x(i), y(row.averageMs / 1000)]);
    }
  });
  if (current.length) segments.push(current);
  for (const segment of segments) {
    if (segment.length > 1) {
      chart.append(svg("path", { d: segment.map(([px, py], i) => `${i ? "L" : "M"}${px},${py}`).join(" "), class: "trend-line" }));
    }
  }
  rows.forEach((row, i) => {
    if (row.averageMs !== null) chart.append(svg("circle", { cx: x(i), cy: y(row.averageMs / 1000), r: 3.6, class: "trend-dot" }));
    const skip = rows.length > 8 && i % Math.ceil(rows.length / 8) !== 0;
    if (!skip) chart.append(Object.assign(svg("text", { x: x(i), y: H - 8, class: "axis-text", "text-anchor": "middle" }), { textContent: row.label }));
  });
  wrap.append(chart);

  const foot = make("div", "chart-foot");
  foot.append(
    make("span", "", `Median ${secondsFormat.format((s.durationMs.median ?? 0) / 1000)} detik`),
    make("span", "", "Respons pertama sama dengan penyelesaian (jawaban tidak dikirim bertahap)"),
  );
  wrap.append(foot);
  return wrap;
}

function horizontalBars(items, { color, max }) {
  const list = make("div", "hbar-list");
  const top = max ?? Math.max(1, ...items.map((item) => item.value));
  for (const item of items) {
    const row = make("div", "hbar-row");
    const track = make("div", "hbar-track");
    const fill = make("i");
    fill.style.width = `${Math.max(item.value ? 3 : 0, (item.value / top) * 100)}%`;
    fill.style.background = item.color ?? color;
    track.append(fill);
    row.append(make("span", "hbar-label", item.label), track, make("strong", "", nf.format(item.value)));
    list.append(row);
  }
  return list;
}

/** 5. Status Dokumen. */
export function documentStatusCard(documents, sources) {
  const wrap = card("Status Dokumen", `Jumlah versi dokumen berdasarkan status (total ${nf.format(documents.total)})`);
  if (!documents.total) {
    wrap.append(empty("Belum ada dokumen."));
    return wrap;
  }
  wrap.append(
    horizontalBars(
      sources.map((source) => ({ label: source.label, value: documents[source.key] ?? 0, color: source.color })),
      {},
    ),
  );
  return wrap;
}

/** 6. Distribusi Topik Pertanyaan. */
export function topicsCard(s) {
  const wrap = card("Distribusi Topik Pertanyaan", "Jumlah pertanyaan menurut topik dalam cakupan pilot");
  if (!s.topics?.length) {
    wrap.append(empty("Belum ada pertanyaan yang cocok dengan sebuah topik pada periode ini."));
    return wrap;
  }
  wrap.append(horizontalBars(s.topics.map((topic) => ({ label: topic.category, value: topic.count })), { color: "#b91c2c" }));
  return wrap;
}

/** 7. Gangguan Teknis menurut tahap pemrosesan. */
export function failureStageCard(s) {
  const wrap = card("Gangguan Teknis", "Jumlah kegagalan berdasarkan tahap pemrosesan");
  wrap.append(horizontalBars([{ label: "Pemanggilan model", value: s.counts.gangguan_teknis }], { color: "#e8788a", max: Math.max(1, s.counts.gangguan_teknis) }));
  wrap.append(
    make(
      "p",
      "chart-note",
      "Hanya tahap pemanggilan model yang dicatat saat ini. Kegagalan ekstraksi, pengindeksan, dan retrieval belum tercatat per tahap, sehingga tidak ditampilkan sebagai nol.",
    ),
  );
  return wrap;
}

/** 8. Hasil Evaluasi Jawaban: belum ada data penilaian. */
export function evaluationCard() {
  const wrap = card("Hasil Evaluasi Jawaban", "Hasil pemeriksaan kualitas jawaban dan referensi");
  wrap.append(
    empty(
      "Belum dievaluasi. Kesesuaian jawaban dan ketepatan referensi memerlukan penilaian manusia atas sampel pengujian, sehingga baru tampil setelah pengujian dilaksanakan.",
    ),
  );
  return wrap;
}
