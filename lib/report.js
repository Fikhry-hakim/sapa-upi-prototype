/**
 * Susunan laporan Excel Dashboard SAPA UPI.
 *
 * Lembar pertama meniru Dashboard di aplikasi: judul, enam kartu angka, grafik
 * tren dan donat distribusi hasil, kondisi sumber informasi, serta aktivitas
 * terbaru. Lembar "Data" memuat tabel yang menjadi sumber grafik, dan
 * "Aktivitas" memuat seluruh interaksi yang diambil.
 *
 * Fungsi ini murni: data masuk, bytes .xlsx keluar, supaya bisa diuji tanpa browser.
 */

import { buildXlsx } from "./xlsx.js";

const INK = "111827";
const MUTED = "6B7280";
const RED = "B91C2C";
const LINE = "E5E7EB";
const PAGE = "F6F7F9";
const WHITE = "FFFFFF";

const COLS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"];
const WIDTHS = [2, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 2];

const pct = (value) => `${new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}%`;
const num = (value) => new Intl.NumberFormat("id-ID").format(value);

/**
 * input: {
 *   summary, documents, interactions, outcomes, sources, exportedAt, wib(at) -> { label, time }
 * }
 */
export function buildDashboardWorkbook({ summary: s, documents: docs, interactions, outcomes, sources, exportedAt, wib }) {
  const outcomeKeys = Object.keys(outcomes);
  const rows = [];
  const merges = [];
  const rowHeights = { 1: 8, 4: 8, 8: 8, 12: 8 };

  const cellAt = (r, c, v, s) => {
    while (rows.length <= r) rows.push([]);
    rows[r][c] = { v, s };
  };

  /* --- judul --- */
  cellAt(1, 1, "Dashboard Overview", { bold: true, size: 20, color: INK, fill: PAGE });
  merges.push("B2:M2");
  rowHeights[2] = 30;
  cellAt(2, 1, `Laporan SAPA UPI • ${s.label} • diekspor ${exportedAt}`, { size: 10, color: MUTED, fill: PAGE });
  merges.push("B3:M3");

  /* --- kartu angka: 3 per baris, masing-masing 4 kolom --- */
  const cards = [
    ["TOTAL INTERAKSI", num(s.total), "Total pertanyaan chatbot selama periode pengamatan di Prodi Bisnis Digital.", "1D4ED8"],
    ["JAWABAN BERBASIS SUMBER", num(s.counts.berbasis_sumber), `${pct(s.percents.berbasis_sumber)} dari seluruh interaksi. Respons dengan rujukan dokumen resmi.`, RED],
    ["TINGKAT KLARIFIKASI", pct(s.percents.klarifikasi), `${num(s.counts.klarifikasi)} interaksi. Pertanyaan cocok dengan beberapa topik sama kuat.`, "1D4ED8"],
    ["KETERCUKUPAN BUKTI", pct(s.percents.bukti_terbatas), `${num(s.counts.bukti_terbatas)} interaksi. Rujukan cocok tetapi tipis.`, "7C3AED"],
    ["KEGAGALAN TEKNIS", pct(s.percents.gangguan_teknis), `${num(s.counts.gangguan_teknis)} interaksi. Model tidak terjangkau; pembaca dilayani mode offline.`, RED],
    ["KESIAPAN SUMBER", pct(docs.readiness), `${docs.ready} dari ${docs.total} dokumen tervalidasi, aktif, dan siap dipakai menjawab.`, "7C3AED"],
  ];
  cards.forEach(([label, value, caption, tone], i) => {
    const top = 4 + Math.floor(i / 3) * 4; // baris berbasis 0: 4 dan 8
    const col = 1 + (i % 3) * 4;
    const from = COLS[col];
    const to = COLS[col + 3];
    const box = { fill: WHITE, border: LINE };
    cellAt(top, col, label, { ...box, bold: true, size: 9, color: MUTED });
    cellAt(top + 1, col, value, { ...box, bold: true, size: 22, color: tone });
    cellAt(top + 2, col, caption, { ...box, size: 9, color: MUTED, wrap: true, valign: "top" });
    merges.push(`${from}${top + 1}:${to}${top + 1}`, `${from}${top + 2}:${to}${top + 2}`, `${from}${top + 3}:${to}${top + 3}`);
    rowHeights[top + 1] = 20;
    rowHeights[top + 2] = 34;
    rowHeights[top + 3] = 34;
  });
  // Baris-baris kartu: label (r5/r9), nilai (r6/r10), keterangan (r7/r11).
  // Catatan: top adalah indeks 0-based baris label, jadi nomor barisnya top + 1.

  /* --- grafik: ruang baris 13..30 --- */
  cellAt(12, 1, "", { fill: PAGE });

  /* --- kondisi sumber (baris 32+) --- */
  let r = 31;
  cellAt(r, 1, "Kondisi Sumber Informasi Akademik", { bold: true, size: 13, color: INK, fill: PAGE });
  merges.push(`B${r + 1}:H${r + 1}`);
  r += 1;
  cellAt(r, 1, `Status distribusi ${docs.total} dokumen pada basis pengetahuan RAG SAPA UPI.`, { size: 10, color: MUTED, fill: PAGE });
  merges.push(`B${r + 1}:H${r + 1}`);
  r += 1;
  for (const source of sources) {
    const count = source.key === "ready" ? docs.ready : docs[source.key] ?? 0;
    cellAt(r, 1, "", { fill: source.color, border: WHITE });
    cellAt(r, 2, source.label, { bold: true, size: 10, color: INK, fill: WHITE, border: LINE });
    merges.push(`C${r + 1}:E${r + 1}`);
    cellAt(r, 5, count, { bold: true, size: 11, color: INK, fill: WHITE, border: LINE, align: "center" });
    cellAt(r, 6, source.note, { size: 9, color: MUTED, fill: WHITE, border: LINE });
    merges.push(`G${r + 1}:M${r + 1}`);
    rowHeights[r + 1] = 20;
    r += 1;
  }

  /* --- aktivitas terbaru --- */
  r += 1;
  cellAt(r, 1, "Aktivitas Interaksi Terakhir", { bold: true, size: 13, color: INK, fill: PAGE });
  merges.push(`B${r + 1}:H${r + 1}`);
  r += 1;
  const head = ["ID Interaksi", "Waktu", "Kategori Pertanyaan", "Hasil Respons", "Referensi", "Status"];
  const spans = [[1, 2], [3, 4], [5, 7], [8, 9], [10, 11], [12, 12]];
  head.forEach((label, i) => {
    const [a, b] = spans[i];
    cellAt(r, a, label, { bold: true, size: 9, color: WHITE, fill: RED, border: RED });
    if (b > a) merges.push(`${COLS[a]}${r + 1}:${COLS[b]}${r + 1}`);
  });
  r += 1;
  for (const row of interactions.slice(0, 10)) {
    const when = wib(row.at);
    const values = [
      row.code,
      `${when.label} ${when.time}`,
      row.category ?? "—",
      outcomes[row.outcome]?.label ?? row.outcome,
      row.documentId ? `${row.documentId.replaceAll("-", " ")}${row.page ? ` • hal. ${row.page}` : ""}` : "—",
      row.ok ? "Berhasil" : "Gagal RAG",
    ];
    values.forEach((value, i) => {
      const [a, b] = spans[i];
      const tint = i === 3 ? outcomes[row.outcome]?.color : i === 5 ? (row.ok ? "2E9E6B" : "D6455A") : INK;
      cellAt(r, a, value, { size: 9, color: tint, bold: i === 3 || i === 5, fill: WHITE, border: LINE, wrap: true });
      if (b > a) merges.push(`${COLS[a]}${r + 1}:${COLS[b]}${r + 1}`);
    });
    rowHeights[r + 1] = 22;
    r += 1;
  }
  if (!interactions.length) {
    cellAt(r, 1, "Belum ada interaksi tercatat pada periode ini.", { size: 10, color: MUTED, fill: WHITE, border: LINE });
    merges.push(`B${r + 1}:M${r + 1}`);
  }

  const dashboard = {
    name: "Dashboard",
    rows,
    merges,
    rowHeights,
    widths: WIDTHS,
    background: PAGE,
    gridlines: false,
    tabColor: RED,
    charts: [],
  };

  /* --- lembar Data: sumber grafik --- */
  const dataRows = [
    [{ v: "Periode", s: { bold: true, color: WHITE, fill: RED } }, { v: "Interaksi", s: { bold: true, color: WHITE, fill: RED } }],
    ...s.series.map((p) => [p.label, p.total]),
    [],
    [{ v: "Hasil Respons", s: { bold: true, color: WHITE, fill: RED } }, { v: "Jumlah", s: { bold: true, color: WHITE, fill: RED } }, { v: "Persen", s: { bold: true, color: WHITE, fill: RED } }],
    ...outcomeKeys.map((key) => [outcomes[key].label, s.counts[key], pct(s.percents[key])]),
    ["Total interaksi", s.total, ""],
    ["Akurasi grounded retrieval", "", pct(s.groundedAccuracy)],
  ];
  const trendFirst = 2; // baris data pertama tren (berbasis 1)
  const trendLast = trendFirst + s.series.length - 1;
  const outcomeFirst = trendLast + 4; // setelah baris kosong dan judul tabel
  const outcomeLast = outcomeFirst + outcomeKeys.length - 1;

  dashboard.charts.push(
    {
      type: "line",
      title: "Tren Penggunaan Chatbot",
      seriesName: "Interaksi",
      from: { col: 1, row: 12 },
      to: { col: 8, row: 30 },
      categories: `Data!$A$${trendFirst}:$A$${trendLast}`,
      values: `Data!$B$${trendFirst}:$B$${trendLast}`,
      categoryValues: s.series.map((p) => p.label),
      valueNumbers: s.series.map((p) => p.total),
    },
    {
      type: "doughnut",
      title: "Distribusi Hasil Respons",
      seriesName: "Interaksi",
      from: { col: 8, row: 12 },
      to: { col: 13, row: 30 },
      categories: `Data!$A$${outcomeFirst}:$A$${outcomeLast}`,
      values: `Data!$B$${outcomeFirst}:$B$${outcomeLast}`,
      categoryValues: outcomeKeys.map((key) => outcomes[key].label),
      valueNumbers: outcomeKeys.map((key) => s.counts[key]),
      colors: outcomeKeys.map((key) => outcomes[key].color),
    },
  );

  /* --- lembar Aktivitas --- */
  const headStyle = { bold: true, color: WHITE, fill: RED };
  const activity = [
    ["ID Interaksi", "Waktu (WIB)", "Kategori Pertanyaan", "Hasil Respons", "Dokumen Rujukan", "Halaman", "Durasi (detik)", "Status"].map((v) => ({ v, s: headStyle })),
    ...interactions.map((row) => {
      const when = wib(row.at);
      return [
        row.code,
        `${when.label} ${when.time}`,
        row.category ?? "",
        outcomes[row.outcome]?.label ?? row.outcome,
        row.documentId ? row.documentId.replaceAll("-", " ") : "",
        row.page ?? "",
        row.durationMs ? Number((row.durationMs / 1000).toFixed(1)) : "",
        row.ok ? "Berhasil" : "Gagal RAG",
      ];
    }),
  ];

  return buildXlsx([
    dashboard,
    { name: "Data", rows: dataRows, widths: [30, 14, 12], freeze: 1 },
    { name: "Aktivitas", rows: activity, widths: [16, 22, 26, 24, 40, 10, 14, 12], freeze: 1 },
  ]);
}

/**
 * CSV "Data Rekapitulasi" (Lampiran A, Tabel A.9): data agregat per periode,
 * tanpa identitas pengguna dan tanpa isi pertanyaan. Diawali BOM supaya Excel
 * membaca UTF-8, dan sel yang berawalan = + - @ diberi tanda kutip tunggal agar
 * tidak dijalankan sebagai rumus.
 */
export function buildRecapCsv({ summary: s, documents: docs, outcomes, exportedAt }) {
  const keys = Object.keys(outcomes);
  const cell = (value) => {
    let text = String(value ?? "");
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const line = (...cells) => cells.map(cell).join(",");

  const rows = [
    line("Laporan SAPA UPI", s.label, `diekspor ${exportedAt}`),
    "",
    line("Periode", "Total Pertanyaan", ...keys.map((key) => outcomes[key].label)),
    ...s.seriesByOutcome.map((row) => line(row.label, keys.reduce((sum, key) => sum + row.counts[key], 0), ...keys.map((key) => row.counts[key]))),
    line("Total", s.total, ...keys.map((key) => s.counts[key])),
    "",
    line("Indikator", "Nilai"),
    line("Proporsi Jawaban Berbasis Sumber (%)", s.percents.berbasis_sumber),
    line("Tingkat Keterbatasan Bukti (%)", s.percents.bukti_terbatas),
    line("Tingkat Klarifikasi (%)", s.percents.klarifikasi),
    line("Tingkat Kegagalan Teknis (%)", s.percents.gangguan_teknis),
    line("Rata-Rata Waktu Penyelesaian (detik)", s.durationMs.average === null ? "" : (s.durationMs.average / 1000).toFixed(1)),
    line("Tingkat Kesiapan Sumber (%)", docs.readiness),
  ];
  return `\uFEFF${rows.join("\r\n")}\r\n`;
}
