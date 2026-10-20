/**
 * Peristiwa interaksi dan ringkasannya untuk dashboard.
 *
 * Yang dicatat hanya hasil sebuah pertanyaan — bukan isinya dan bukan siapa
 * yang bertanya. Dashboard menjawab "seberapa sering sistem menjawab, menolak,
 * atau gagal", tidak menjawab "apa yang ditanyakan siapa".
 */

export const OUTCOMES = [
  "berbasis_sumber",
  "klarifikasi",
  "bukti_terbatas",
  "di_luar_cakupan",
  "gangguan_teknis",
];

export const OUTCOME_LABELS = {
  berbasis_sumber: "Berbasis Sumber",
  klarifikasi: "Klarifikasi Info",
  bukti_terbatas: "Bukti Terbatas",
  di_luar_cakupan: "Di Luar Cakupan",
  gangguan_teknis: "Gangguan Teknis",
};

/** Skor di bawah ini berarti rujukannya cocok tetapi tipis. */
export const LOW_EVIDENCE_SCORE = 45;

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Hasil sebuah pertanyaan, dari apa yang terjadi saat menjawabnya.
 *
 *  - model gagal                      -> gangguan_teknis
 *  - tidak ada rujukan sama sekali    -> di_luar_cakupan
 *  - beberapa topik sama kuat         -> klarifikasi
 *  - rujukan ada tetapi skornya tipis -> bukti_terbatas
 *  - selain itu                       -> berbasis_sumber
 */
export function classifyOutcome({ failed = false, entryCount = 0, status = "match", score = null, fromPassage = false }) {
  if (failed) return "gangguan_teknis";
  if (entryCount === 0) return "di_luar_cakupan";
  if (fromPassage) return "berbasis_sumber";
  if (status === "ambiguous") return "klarifikasi";
  if (typeof score === "number" && score < LOW_EVIDENCE_SCORE) return "bukti_terbatas";
  return "berbasis_sumber";
}

export async function recordEvent(db, event) {
  if (!db) return;
  await db
    .prepare(
      `INSERT INTO events (outcome, entry_id, category, document_id, page, duration_ms, source, signed_in)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      event.outcome,
      event.entryId ?? null,
      event.category ?? null,
      event.documentId ?? null,
      event.page ?? null,
      event.durationMs ?? null,
      event.source ?? null,
      event.signedIn ? 1 : 0,
    )
    .run();
}

/* ------------------------------------------------------------ rentang waktu */

const pad = (n) => String(n).padStart(2, "0");

/** 'YYYY-MM-DD HH:MM:SS' dalam UTC, format yang sama dengan kolom `at`. */
export function sqlTime(ms) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

export function parseSqlTime(value) {
  return Date.parse(`${String(value).replace(" ", "T")}Z`);
}

/** Tanggal hari WIB dari sebuah waktu UTC, 'YYYY-MM-DD'. */
function wibDate(ms) {
  const d = new Date(ms + WIB_OFFSET_MS);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/**
 * Jendela waktu untuk sebuah rentang.
 *
 *  harian   : 7 hari terakhir, per hari
 *  mingguan : 4 minggu terakhir, per minggu
 *  bulanan  : 6 bulan terakhir, per bulan
 *  rentang  : dari-sampai yang dipilih (maksimum 90 hari), per hari
 *
 * Jendela pembanding adalah rentang yang sama panjangnya tepat sebelumnya.
 */
export function windowFor(range, now = Date.now(), from = null, to = null) {
  const buckets = [];

  if (range === "rentang" && from && to) {
    const start = Date.parse(`${from}T00:00:00+07:00`);
    const end = Date.parse(`${to}T00:00:00+07:00`) + DAY_MS;
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return windowFor("mingguan", now);
    const days = Math.min(90, Math.round((end - start) / DAY_MS));
    for (let i = 0; i < days; i += 1) {
      const at = start + i * DAY_MS;
      const d = new Date(at + WIB_OFFSET_MS);
      buckets.push({ start: at, end: at + DAY_MS, label: `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}` });
    }
    return finalize("rentang", "Rentang Dipilih", buckets);
  }

  if (range === "harian") {
    const todayStart = Date.parse(`${wibDate(now)}T00:00:00+07:00`);
    for (let i = 6; i >= 0; i -= 1) {
      const at = todayStart - i * DAY_MS;
      const d = new Date(at + WIB_OFFSET_MS);
      buckets.push({ start: at, end: at + DAY_MS, label: `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}` });
    }
    return finalize("harian", "7 Hari Terakhir", buckets);
  }

  if (range === "bulanan") {
    const d = new Date(now + WIB_OFFSET_MS);
    for (let i = 5; i >= 0; i -= 1) {
      const first = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1) - WIB_OFFSET_MS;
      const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i + 1, 1) - WIB_OFFSET_MS;
      const month = new Date(first + WIB_OFFSET_MS);
      buckets.push({ start: first, end: next, label: MONTHS[month.getUTCMonth()] });
    }
    return finalize("bulanan", "6 Bulan Terakhir", buckets);
  }

  // mingguan (bawaan): minggu terakhir berakhir pada akhir hari ini
  const end = Date.parse(`${wibDate(now)}T00:00:00+07:00`) + DAY_MS;
  for (let i = 3; i >= 0; i -= 1) {
    buckets.push({ start: end - (i + 1) * 7 * DAY_MS, end: end - i * 7 * DAY_MS, label: `Minggu ${4 - i}` });
  }
  return finalize("mingguan", "4 Minggu Terakhir", buckets);

  function finalize(name, label, list) {
    const start = list[0].start;
    const stop = list[list.length - 1].end;
    return { range: name, label, start, end: stop, prevStart: start - (stop - start), prevEnd: start, buckets: list };
  }
}

/* ------------------------------------------------------------ ringkasan */

const pct = (part, total) => (total ? Math.round((part / total) * 1000) / 10 : 0);

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

export async function summarize(db, window) {
  const { results } = await db
    .prepare("SELECT at, outcome, duration_ms, category FROM events WHERE at >= ? AND at < ? ORDER BY at LIMIT 20000")
    .bind(sqlTime(window.start), sqlTime(window.end))
    .all();
  const rows = results ?? [];

  const previous = await db
    .prepare("SELECT COUNT(*) AS n FROM events WHERE at >= ? AND at < ?")
    .bind(sqlTime(window.prevStart), sqlTime(window.prevEnd))
    .first();

  const counts = Object.fromEntries(OUTCOMES.map((o) => [o, 0]));
  const series = window.buckets.map((bucket) => ({ label: bucket.label, total: 0 }));
  // Per periode: rincian jenis hasil dan jumlah+total durasi, untuk grafik tambahan.
  const byOutcome = window.buckets.map(() => Object.fromEntries(OUTCOMES.map((o) => [o, 0])));
  const timing = window.buckets.map(() => ({ sum: 0, n: 0 }));
  const topics = new Map();
  const durations = [];

  for (const row of rows) {
    if (row.outcome in counts) counts[row.outcome] += 1;
    if (typeof row.duration_ms === "number") durations.push(row.duration_ms);
    const at = parseSqlTime(row.at);
    const index = window.buckets.findIndex((bucket) => at >= bucket.start && at < bucket.end);
    if (index >= 0) {
      series[index].total += 1;
      if (row.outcome in byOutcome[index]) byOutcome[index][row.outcome] += 1;
      if (typeof row.duration_ms === "number") {
        timing[index].sum += row.duration_ms;
        timing[index].n += 1;
      }
    }
    if (row.category) topics.set(row.category, (topics.get(row.category) ?? 0) + 1);
  }

  const total = rows.length;
  const before = previous?.n ?? 0;
  durations.sort((a, b) => a - b);

  return {
    range: window.range,
    label: window.label,
    total,
    previousTotal: before,
    change: before ? Math.round(((total - before) / before) * 1000) / 10 : null,
    counts,
    percents: Object.fromEntries(OUTCOMES.map((o) => [o, pct(counts[o], total)])),
    groundedAccuracy: pct(counts.berbasis_sumber + counts.klarifikasi, total),
    series,
    seriesByOutcome: series.map((item, i) => ({ label: item.label, counts: byOutcome[i] })),
    durationSeries: series.map((item, i) => ({
      label: item.label,
      averageMs: timing[i].n ? Math.round(timing[i].sum / timing[i].n) : null,
    })),
    topics: [...topics.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([category, count]) => ({ category, count })),
    peak: series.reduce((best, item) => (item.total > (best?.total ?? -1) ? item : best), null),
    averagePerBucket: Math.round((total / window.buckets.length) * 10) / 10,
    durationMs: {
      average: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null,
      median: percentile(durations, 50),
      p95: percentile(durations, 95),
    },
  };
}

/** Kode interaksi yang terbaca manusia, mis. INT-2026-0089. */
export function interactionCode(row) {
  const year = String(row.at).slice(0, 4);
  return `INT-${year}-${String(row.id).padStart(4, "0")}`;
}

export const INTERACTION_PAGE_SIZE = 5;

export async function listInteractions(db, { outcome = null, category = null, page = 1, size = INTERACTION_PAGE_SIZE } = {}) {
  const limit = Math.min(Math.max(1, size), 50);
  const offset = (Math.max(1, page) - 1) * limit;
  const filter = outcome && OUTCOMES.includes(outcome) ? outcome : null;

  const clauses = [];
  const bindings = [];
  if (filter) {
    clauses.push("outcome = ?");
    bindings.push(filter);
  }
  if (category) {
    clauses.push("category = ?");
    bindings.push(String(category).slice(0, 160));
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const totalRow = await db.prepare(`SELECT COUNT(*) AS n FROM events ${where}`).bind(...bindings).first();
  const { results } = await db
    .prepare(
      `SELECT id, at, outcome, category, document_id, page, duration_ms, source
         FROM events ${where}
        ORDER BY id DESC LIMIT ? OFFSET ?`,
    )
    .bind(...bindings, limit, offset)
    .all();

  return {
    total: totalRow?.n ?? 0,
    page: Math.max(1, page),
    size: limit,
    rows: (results ?? []).map((row) => ({
      code: interactionCode(row),
      at: row.at,
      outcome: row.outcome,
      category: row.category,
      documentId: row.document_id,
      page: row.page,
      durationMs: row.duration_ms,
      ok: row.outcome !== "gangguan_teknis",
    })),
  };
}

/** Jumlah per hasil untuk seluruh waktu, untuk angka pada chip filter. */
export async function outcomeTotals(db) {
  const { results } = await db.prepare("SELECT outcome, COUNT(*) AS n FROM events GROUP BY outcome").all();
  const totals = Object.fromEntries(OUTCOMES.map((o) => [o, 0]));
  let all = 0;
  for (const row of results ?? []) {
    if (row.outcome in totals) totals[row.outcome] = row.n;
    all += row.n;
  }
  return { all, ...totals };
}
