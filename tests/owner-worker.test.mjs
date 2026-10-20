import test from "node:test";
import assert from "node:assert/strict";

import {
  classifyOutcome,
  windowFor,
  summarize,
  SUMMARY_ROW_LIMIT,
  sqlTime,
  interactionCode,
  LOW_EVIDENCE_SCORE,
  OUTCOMES,
} from "../worker/src/events.js";
import {
  checkUpload,
  replacePassages,
  validateDocument,
  documentStats,
  ftsQuery,
  highlightFor,
  isUsable,
  newDocumentId,
} from "../worker/src/documents.js";
import { can } from "../worker/src/auth.js";
import { handleAdmin } from "../worker/src/admin.js";

/* ---------- hasil sebuah pertanyaan ---------- */

test("an outcome is derived from what happened, in a fixed order of precedence", () => {
  assert.equal(classifyOutcome({ failed: true, entryCount: 3 }), "gangguan_teknis");
  assert.equal(classifyOutcome({ entryCount: 0 }), "di_luar_cakupan");
  assert.equal(classifyOutcome({ entryCount: 2, status: "ambiguous", score: 90 }), "klarifikasi");
  assert.equal(classifyOutcome({ entryCount: 1, status: "match", score: LOW_EVIDENCE_SCORE - 1 }), "bukti_terbatas");
  assert.equal(classifyOutcome({ entryCount: 1, status: "match", score: 120 }), "berbasis_sumber");
  assert.equal(classifyOutcome({ entryCount: 1, fromPassage: true }), "berbasis_sumber");
});

test("every outcome the classifier can return is one the table accepts", () => {
  const seen = new Set([
    classifyOutcome({ failed: true }),
    classifyOutcome({ entryCount: 0 }),
    classifyOutcome({ entryCount: 2, status: "ambiguous" }),
    classifyOutcome({ entryCount: 1, status: "match", score: 1 }),
    classifyOutcome({ entryCount: 1, status: "match", score: 999 }),
  ]);
  for (const outcome of seen) assert.ok(OUTCOMES.includes(outcome), outcome);
});

/* ---------- jendela waktu ---------- */

const NOW = Date.parse("2026-10-14T05:00:00Z"); // 12.00 WIB

test("each range yields contiguous buckets and a comparison window of equal length", () => {
  for (const range of ["harian", "mingguan", "bulanan"]) {
    const w = windowFor(range, NOW);
    for (let i = 1; i < w.buckets.length; i += 1) {
      assert.equal(w.buckets[i].start, w.buckets[i - 1].end, `${range}: gap between buckets`);
    }
    assert.equal(w.start, w.buckets[0].start);
    assert.equal(w.end, w.buckets.at(-1).end);
    assert.equal(w.end - w.start, w.prevEnd - w.prevStart, `${range}: comparison window length`);
    assert.equal(w.prevEnd, w.start);
  }
  assert.equal(windowFor("harian", NOW).buckets.length, 7);
  assert.equal(windowFor("mingguan", NOW).buckets.length, 4);
  assert.equal(windowFor("bulanan", NOW).buckets.length, 6);
});

test("a custom range is capped, and an inverted one falls back instead of failing", () => {
  assert.equal(windowFor("rentang", NOW, "2026-01-01", "2026-12-31").buckets.length, 90);
  assert.equal(windowFor("rentang", NOW, "2026-10-10", "2026-10-12").buckets.length, 3);
  assert.equal(windowFor("rentang", NOW, "2026-10-12", "2026-10-10").range, "mingguan");
  assert.equal(windowFor("rentang", NOW, "bukan", "tanggal").range, "mingguan");
});

test("days are WIB days: 23.30 UTC already belongs to tomorrow", () => {
  const lateUtc = Date.parse("2026-10-14T18:00:00Z"); // 01.00 WIB on the 15th
  const w = windowFor("harian", lateUtc);
  assert.equal(w.buckets.at(-1).label, "15 Okt");
});

/* ---------- ringkasan ---------- */

function fakeEventsDb(rows, previous = 0) {
  return {
    prepare(sql) {
      const stmt = {
        bind: () => stmt,
        all: async () => ({ results: rows }),
        first: async () => ({ n: previous }),
      };
      return stmt;
    },
  };
}

test("the summary counts outcomes, percentages, the trend and the change against the previous window", async () => {
  const w = windowFor("harian", NOW);
  const day = (offset, hour = 3) => sqlTime(w.buckets[offset].start + hour * 3_600_000);
  const rows = [
    { at: day(6), outcome: "berbasis_sumber", duration_ms: 1000 },
    { at: day(6, 4), outcome: "berbasis_sumber", duration_ms: 2000 },
    { at: day(5), outcome: "klarifikasi", duration_ms: 3000 },
    { at: day(5, 5), outcome: "gangguan_teknis", duration_ms: null },
  ];

  const s = await summarize(fakeEventsDb(rows, 2), w);

  assert.equal(s.total, 4);
  assert.equal(s.counts.berbasis_sumber, 2);
  assert.equal(s.percents.berbasis_sumber, 50);
  assert.equal(s.groundedAccuracy, 75, "answers plus guided clarification");
  assert.equal(s.series[6].total, 2);
  assert.equal(s.series[5].total, 2);
  assert.equal(s.change, 100, "4 now against 2 before");
  assert.equal(s.durationMs.average, 2000);
});

test("the summary also breaks each period down by outcome, by timing, and by topic", async () => {
  const w = windowFor("harian", NOW);
  const day = (offset, hour = 3) => sqlTime(w.buckets[offset].start + hour * 3_600_000);
  const rows = [
    { at: day(6), outcome: "berbasis_sumber", duration_ms: 1000, category: "Sidang" },
    { at: day(6, 4), outcome: "klarifikasi", duration_ms: 3000, category: "Sidang" },
    { at: day(5), outcome: "gangguan_teknis", duration_ms: null, category: "Skripsi" },
  ];
  const s = await summarize(fakeEventsDb(rows, 0), w);

  assert.equal(s.seriesByOutcome[6].counts.berbasis_sumber, 1);
  assert.equal(s.seriesByOutcome[6].counts.klarifikasi, 1);
  assert.equal(s.seriesByOutcome[5].counts.gangguan_teknis, 1);
  assert.equal(s.durationSeries[6].averageMs, 2000);
  assert.equal(s.durationSeries[5].averageMs, null, "no timing, no average");
  assert.deepEqual(s.topics, [{ category: "Sidang", count: 2 }, { category: "Skripsi", count: 1 }]);
});

test("an empty window does not divide by zero and has no change to report", async () => {
  const s = await summarize(fakeEventsDb([], 0), windowFor("mingguan", NOW));
  assert.equal(s.total, 0);
  assert.equal(s.change, null);
  assert.equal(s.percents.berbasis_sumber, 0);
  assert.equal(s.durationMs.average, null);
});

test("interaction codes are readable and stable", () => {
  assert.equal(interactionCode({ id: 89, at: "2026-10-14 03:00:00" }), "INT-2026-0089");
});

/* ---------- dokumen ---------- */

test("an upload is validated before it reaches the database", () => {
  assert.equal(checkUpload({}).ok, false);
  assert.equal(checkUpload({ title: "ab", passages: [{ page: 1, text: "x".repeat(40) }] }).ok, false);
  assert.equal(checkUpload({ title: "Pedoman Baru", passages: [] }).ok, false);
  assert.equal(checkUpload({ title: "Pedoman Baru", passages: [{ page: 0, text: "x" }] }).ok, false, "page 0");

  const ok = checkUpload({
    title: "  Pedoman Baru  ",
    category: "Pedoman Akademik",
    owner: "Program Studi Bisnis Digital",
    passages: [
      { page: 1, text: "Mahasiswa wajib   menyelesaikan   administrasi pendaftaran." },
      { page: 2, text: "Halaman kedua memuat ketentuan lanjutan yang cukup panjang." },
    ],
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.value.title, "Pedoman Baru");
  assert.equal(ok.value.pages, 2);
  assert.equal(ok.value.passages[0].text, "Mahasiswa wajib menyelesaikan administrasi pendaftaran.", "whitespace is collapsed");
  assert.equal(ok.value.parsed, true);
  assert.equal(ok.value.reference, "Belum dicantumkan", "missing metadata is said plainly, not invented");
});

test("a scanned document is accepted but flagged, because it cannot be searched", () => {
  const scanned = checkUpload({ title: "Hasil Pindai", category: "Lainnya", owner: "Prodi", passages: [{ page: 1, text: "" }, { page: 2, text: "  " }] });
  assert.equal(scanned.ok, true);
  assert.equal(scanned.value.parsed, false);
  assert.ok(scanned.warnings.length > 0);
});

test("a freshly uploaded document is not used until someone validates it", () => {
  const base = { ragActive: true };
  assert.equal(isUsable({ ...base, status: "ready" }), true);
  for (const status of ["validating", "parse_failed", "inactive", "expired"]) {
    assert.equal(isUsable({ ...base, status }), false, status);
  }
  assert.equal(isUsable({ status: "ready", ragActive: false }), false, "RAG switched off");
});

test("document statistics add up to the total", () => {
  const stats = documentStats([
    { status: "ready", ragActive: true },
    { status: "ready", ragActive: true },
    { status: "ready", ragActive: false },
    { status: "validating", ragActive: false },
    { status: "parse_failed", ragActive: false },
    { status: "expired", ragActive: false },
  ]);
  assert.equal(stats.total, 6);
  assert.equal(stats.ready + stats.validating + stats.parse_failed + stats.inactive + stats.expired, 6);
  assert.equal(stats.ready, 2);
  assert.equal(stats.inactive, 1);
  assert.equal(stats.readiness, 33.3);
});

test("document ids come from the title and cannot collide", () => {
  assert.match(newDocumentId("Pedoman Penulisan Skripsi 2027!", () => "abc123"), /^pedoman-penulisan-skripsi-2027-abc123$/);
  assert.match(newDocumentId("???", () => "x1"), /^dokumen-x1$/);
  assert.notEqual(newDocumentId("Sama"), newDocumentId("Sama"));
});

test("the search query uses the same stems as topic search and never injects syntax", () => {
  // Operators and punctuation in the question must end up as quoted literals,
  // never as FTS5 syntax: NEAR(...) and "--" become plain words or vanish.
  const q = ftsQuery('Apa syarat "sidang" OR NEAR(skripsi) -- DROP TABLE?');
  assert.ok(q, "a question with real words yields a query");
  for (const part of q.split(" OR ")) assert.match(part, /^"[a-z0-9_]+"\*$/, `unsafe term: ${part}`);
  assert.ok(!q.includes("--") && !q.includes("("), "no raw punctuation survives");
  assert.equal(ftsQuery("apa di ke"), null, "only stop words");
  assert.equal(ftsQuery(""), null);
});

test("the highlighted sentence is a real sentence from the page", () => {
  const text = "Pendahuluan. Setiap mahasiswa berhak mendaftarkan ujian sidang apabila seluruh syarat terpenuhi. Penutup.";
  assert.equal(highlightFor(text), "Setiap mahasiswa berhak mendaftarkan ujian sidang apabila seluruh syarat terpenuhi.");
  assert.ok(highlightFor("x".repeat(500)).length <= 160);
});

/* ---------- penjagaan peran ---------- */

test("viewing the owner pages needs any assignment; uploading and validating need the right one", () => {
  assert.equal(can(null, "view"), false);
  for (const role of ["upload", "review", "admin"]) assert.equal(can({ role }, "view"), true, role);
  assert.equal(can({ role: "review" }, "upload"), false, "reviewing is not uploading");
  assert.equal(can({ role: "upload" }, "review"), false, "uploading is not validating");
  assert.equal(can({ role: "upload" }, "manage"), false);
  assert.equal(can({ role: "admin" }, "manage"), true);
});

test("every admin route refuses anonymous callers and signed-in non-staff alike", async () => {
  const db = {
    prepare: () => {
      const stmt = { bind: () => stmt, first: async () => null, all: async () => ({ results: [] }) };
      return stmt;
    },
  };
  const env = { sapa_upi_kb: db };
  const routes = [
    ["GET", "/admin/overview"],
    ["GET", "/admin/interactions"],
    ["GET", "/admin/documents"],
    ["GET", "/admin/audit"],
    ["POST", "/admin/documents"],
    ["POST", "/admin/documents/x/validate"],
    ["DELETE", "/admin/documents/x"],
  ];

  for (const [method, path] of routes) {
    const request = new Request(`https://example.test${path}`, { method });
    const response = await handleAdmin(request, env, {}, path);
    assert.equal(response.status, 401, `${method} ${path} must need a session`);
  }
});

/* ---------- isian unggah dan metode penyimpanan ---------- */

const PAGES = [{ page: 1, text: "Ketentuan pelaksanaan yang cukup panjang untuk dibaca." }];

test("an upload needs a category and a publisher, and rejects a malformed date", () => {
  const base = { title: "Pedoman Baru", passages: PAGES };
  assert.match(checkUpload({ ...base, owner: "Prodi" }).errors.join(" "), /Kategori/);
  assert.match(checkUpload({ ...base, category: "Lainnya" }).errors.join(" "), /Penerbit/);
  assert.match(
    checkUpload({ ...base, category: "Lainnya", owner: "Prodi", effectiveDate: "31/12/2026" }).errors.join(" "),
    /Tanggal/,
  );
  assert.equal(
    checkUpload({ ...base, category: "Lainnya", owner: "Prodi", effectiveDate: "2026-12-31" }).ok,
    true,
  );
});

test("linking or replacing needs a target document; a new document needs none", () => {
  const base = { title: "Pedoman Baru", passages: PAGES, category: "Lainnya", owner: "Prodi" };
  assert.equal(checkUpload({ ...base, method: "baru" }).ok, true);
  assert.equal(checkUpload({ ...base, method: "versi" }).ok, false);
  assert.equal(checkUpload({ ...base, method: "gabung" }).ok, false);
  const replace = checkUpload({ ...base, method: "versi", targetId: "buku-panduan" });
  assert.equal(replace.ok, true);
  assert.equal(replace.value.targetId, "buku-panduan");
  assert.equal(checkUpload({ ...base, method: "baru", targetId: "buku-panduan" }).value.targetId, null);
});

test("validating a new version retires the old one in the same step", async () => {
  const statements = [];
  const db = {
    prepare: (sql) => ({
      bind: (...args) => ({
        first: async () =>
          /FROM documents WHERE id/.test(sql)
            ? { id: args[0], title: "Baru", status: "validating", supersedes: "lama", rag_active: 0, bundled: 0 }
            : null,
        run: async () => {
          statements.push({ sql, args });
          return { meta: { changes: 1 } };
        },
      }),
    }),
  };
  assert.equal(await validateDocument(db, "admin@upi.edu", "baru"), true);
  const expire = statements.find((s) => /SET status = 'expired'/.test(s.sql));
  assert.ok(expire, "the old version must be expired");
  assert.equal(expire.args[0], "lama");
  assert.ok(statements.some((s) => s.args.includes("digantikan")), "and the audit log says so");
});

test("reprocessing swaps the page text and never switches RAG on by itself", async () => {
  const sql = [];
  const db = {
    prepare: (text) => ({
      bind: (...args) => ({
        run: async () => {
          sql.push({ text, args });
          return { meta: { changes: 1 } };
        },
      }),
    }),
    batch: async (statements) => statements,
  };
  const ok = await replacePassages(db, "a@upi.edu", "doc-1", [{ page: 1, text: "Ketentuan yang kini terbaca dengan jelas oleh sistem." }]);
  assert.equal(ok.status, "validating");
  assert.ok(sql[0].text.startsWith("DELETE FROM passages"), "old text goes first");
  const update = sql.find((s) => s.text.startsWith("UPDATE documents SET status"));
  assert.match(update.text, /rag_active = 0/);

  const scanned = await replacePassages(db, "a@upi.edu", "doc-1", [{ page: 1, text: "  " }]);
  assert.equal(scanned.status, "parse_failed");
  assert.equal((await replacePassages(db, "a@upi.edu", "doc-1", [])).ok, false);
});

test("a window with more rows than the limit says so instead of silently under-counting", async () => {
  const w = windowFor("harian", NOW);
  const row = { at: sqlTime(w.buckets[6].start + 3_600_000), outcome: "berbasis_sumber", duration_ms: 1000 };
  const rows = Array.from({ length: SUMMARY_ROW_LIMIT + 1 }, () => row);
  const s = await summarize(fakeEventsDb(rows, 0), w);
  assert.equal(s.truncated, true);
  assert.equal(s.total, SUMMARY_ROW_LIMIT);
  assert.equal((await summarize(fakeEventsDb([row], 0), w)).truncated, false);
});
