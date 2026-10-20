/**
 * Katalog dokumen sumber, unggahan pengelola, dan pencarian teks halaman.
 *
 * Aturan yang dijaga di sini:
 *  - Dokumen yang baru diunggah berstatus "validating" dan TIDAK dipakai
 *    menjawab sampai ada yang berwenang memvalidasinya.
 *  - Mematikan RAG sebuah dokumen langsung menghentikan pemakaiannya, tanpa
 *    menghapus apa pun.
 *  - Setiap perubahan tercatat di log audit beserta siapa yang melakukannya.
 */

import { queryTokens } from "../../lib/search.js";

export const STATUSES = ["ready", "validating", "parse_failed", "inactive", "expired"];

export const STATUS_LABELS = {
  ready: "Tervalidasi",
  validating: "Menunggu Validasi",
  parse_failed: "Gagal Parsing",
  inactive: "Nonaktif",
  expired: "Tidak Berlaku",
};

export const CATEGORIES = [
  "Pedoman Akademik",
  "Tugas Akhir & Skripsi",
  "Surat Keputusan",
  "Pengumuman",
  "Kalender Akademik",
  "Lainnya",
];

/** Cara dokumen unggahan diperlakukan terhadap dokumen yang sudah ada. */
export const STORAGE_METHODS = ["baru", "gabung", "versi"];

export const MAX_FILE_BYTES = 24 * 1024 * 1024; // batas nilai KV 25 MB
export const MAX_PAGES = 600;
export const MAX_PAGE_CHARS = 20_000;

const CACHE_TTL_MS = 30_000;
let activeCache = null;

export function clearDocumentCache() {
  activeCache = null;
}

/* ------------------------------------------------------------ pembacaan */

export async function listDocuments(db) {
  const { results } = await db
    .prepare(
      `SELECT id, title, owner, reference, period, kind, pages, size_bytes, file, bundled,
              status, rag_active, uploaded_by, validated_by, created_at, updated_at,
              category, effective_date, description, related_to, supersedes
         FROM documents ORDER BY bundled DESC, created_at DESC`,
    )
    .all();
  return (results ?? []).map(toDocument);
}

export async function getDocument(db, id) {
  const row = await db.prepare("SELECT * FROM documents WHERE id = ?").bind(id).first();
  return row ? toDocument(row) : null;
}

function toDocument(row) {
  return {
    id: row.id,
    title: row.title,
    owner: row.owner,
    reference: row.reference,
    period: row.period,
    kind: row.kind,
    pages: row.pages,
    sizeBytes: row.size_bytes,
    file: row.file,
    bundled: Boolean(row.bundled),
    status: row.status,
    statusLabel: STATUS_LABELS[row.status] ?? row.status,
    ragActive: Boolean(row.rag_active),
    uploadedBy: row.uploaded_by ?? null,
    validatedBy: row.validated_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: row.category ?? null,
    effectiveDate: row.effective_date ?? null,
    description: row.description ?? null,
    relatedTo: row.related_to ?? null,
    supersedes: row.supersedes ?? null,
  };
}

/** Dokumen yang boleh dipakai menjawab: tervalidasi dan RAG-nya menyala. */
export function isUsable(doc) {
  return doc.status === "ready" && doc.ragActive;
}

/** Ringkasan untuk kartu dan bar kondisi sumber. */
export function documentStats(docs) {
  const stats = { total: docs.length, ready: 0, validating: 0, parse_failed: 0, inactive: 0, expired: 0 };
  for (const doc of docs) {
    if (isUsable(doc)) stats.ready += 1;
    else if (doc.status === "validating") stats.validating += 1;
    else if (doc.status === "parse_failed") stats.parse_failed += 1;
    else if (doc.status === "expired") stats.expired += 1;
    else stats.inactive += 1; // tervalidasi tetapi RAG dimatikan, atau nonaktif
  }
  stats.readiness = stats.total ? Math.round((stats.ready / stats.total) * 1000) / 10 : 0;
  return stats;
}

/**
 * Berkas dokumen bawaan yang tidak boleh dipakai menjawab saat ini (RAG
 * dimatikan, kedaluwarsa, atau belum divalidasi). Disimpan sebentar supaya
 * setiap pertanyaan tidak membaca tabel.
 */
export async function unusableFiles(db, now = Date.now) {
  if (!db) return new Set();
  if (activeCache && now() - activeCache.at < CACHE_TTL_MS) return activeCache.files;

  let files = new Set();
  try {
    const docs = await listDocuments(db);
    files = new Set(docs.filter((doc) => doc.file && !isUsable(doc)).map((doc) => doc.file));
  } catch (error) {
    // Tabel belum ada atau tidak terbaca: jangan menghentikan jawaban.
    console.warn("documents: gagal membaca katalog —", error.message);
  }
  activeCache = { at: now(), files };
  return files;
}

/* ------------------------------------------------------------ audit */

export async function audit(db, actor, action, documentId = null, detail = null) {
  await db
    .prepare("INSERT INTO audit_log (actor, action, document_id, detail) VALUES (?, ?, ?, ?)")
    .bind(actor, action, documentId, detail)
    .run();
}

export async function listAudit(db, limit = 12) {
  const { results } = await db
    .prepare("SELECT id, at, actor, action, document_id, detail FROM audit_log ORDER BY id DESC LIMIT ?")
    .bind(Math.min(Math.max(1, limit), 50))
    .all();
  return results ?? [];
}

/* ------------------------------------------------------------ unggahan */

const slug = (text) =>
  String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

/** Id dokumen baru dari judulnya, dibuat unik dengan akhiran acak. */
export function newDocumentId(title, random = () => crypto.randomUUID().slice(0, 6)) {
  return `${slug(title) || "dokumen"}-${random()}`;
}

/**
 * Validasi isian unggahan sebelum menyentuh basis data. Halaman tanpa teks
 * (hasil pindai) diterima, tetapi tidak bisa dicari — dicatat sebagai peringatan.
 */
export function checkUpload(body) {
  const errors = [];
  const title = String(body?.title ?? "").trim();
  if (title.length < 3) errors.push("Judul dokumen wajib diisi.");
  if (title.length > 160) errors.push("Judul terlalu panjang.");

  const category = String(body?.category ?? "").trim();
  if (!CATEGORIES.includes(category)) errors.push("Kategori dokumen wajib dipilih.");

  const owner = String(body?.owner ?? "").trim();
  if (owner.length < 2) errors.push("Penerbit atau unit kerja wajib diisi.");

  const effectiveDate = String(body?.effectiveDate ?? "").trim();
  if (effectiveDate && (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate) || Number.isNaN(Date.parse(effectiveDate)))) {
    errors.push("Tanggal berlaku tidak sah.");
  }

  const method = STORAGE_METHODS.includes(body?.method) ? body.method : "baru";
  const targetId = String(body?.targetId ?? "").trim();
  if (method !== "baru" && !targetId) errors.push("Pilih dokumen yang dihubungkan atau diperbarui.");

  const pages = Array.isArray(body?.passages) ? body.passages : [];
  if (!pages.length) errors.push("Teks dokumen belum terbaca.");
  if (pages.length > MAX_PAGES) errors.push(`Dokumen melebihi ${MAX_PAGES} halaman.`);

  const cleaned = [];
  for (const item of pages) {
    const page = Number(item?.page);
    if (!Number.isInteger(page) || page < 1) {
      errors.push("Nomor halaman tidak sah.");
      break;
    }
    cleaned.push({ page, text: String(item?.text ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_PAGE_CHARS) });
  }

  const withText = cleaned.filter((item) => item.text.length >= 20).length;
  const warnings = [];
  if (cleaned.length && withText === 0) warnings.push("Tidak ada teks yang bisa dibaca; dokumen kemungkinan hasil pindai.");
  else if (withText < cleaned.length / 2) warnings.push("Sebagian besar halaman tidak memuat teks.");

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    value: {
      title,
      reference: String(body?.reference ?? "").trim().slice(0, 120) || "Belum dicantumkan",
      owner: owner.slice(0, 120),
      category,
      effectiveDate: effectiveDate || null,
      description: String(body?.description ?? "").trim().slice(0, 500) || null,
      method,
      targetId: method === "baru" ? null : targetId,
      period: String(body?.period ?? "").trim().slice(0, 120) || "Belum dicantumkan",
      pages: cleaned.length,
      sizeBytes: Math.max(0, Number(body?.sizeBytes) || 0),
      passages: cleaned,
      parsed: withText > 0,
    },
  };
}

export async function createDocument(db, actor, value, id = newDocumentId(value.title)) {
  const status = value.parsed ? "validating" : "parse_failed";
  await db
    .prepare(
      `INSERT INTO documents (id, title, owner, reference, period, kind, pages, size_bytes, bundled, status, rag_active, uploaded_by,
                              category, effective_date, description, related_to, supersedes)
       VALUES (?, ?, ?, ?, ?, 'PDF', ?, ?, 0, ?, 0, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id, value.title, value.owner, value.reference, value.period, value.pages, value.sizeBytes, status, actor,
      value.category ?? null, value.effectiveDate ?? null, value.description ?? null,
      value.method === "gabung" ? value.targetId : null,
      value.method === "versi" ? value.targetId : null,
    )
    .run();

  const statements = value.passages
    .filter((item) => item.text.length >= 20)
    .map((item) =>
      db.prepare("INSERT INTO passages (body, document_id, page) VALUES (?, ?, ?)").bind(item.text, id, item.page),
    );
  // D1 membatasi ukuran satu batch; dipotong supaya dokumen tebal tetap masuk.
  for (let i = 0; i < statements.length; i += 40) await db.batch(statements.slice(i, i + 40));

  const how =
    value.method === "versi" ? `, memperbarui ${value.targetId}` : value.method === "gabung" ? `, terkait ${value.targetId}` : "";
  await audit(db, actor, "unggah", id, `${value.title} (${value.pages} halaman${how})`);
  clearDocumentCache();
  return { id, status };
}

/**
 * Proses ulang: ganti teks halaman sebuah dokumen unggahan (mis. setelah
 * ekstraksi pertama gagal). Status kembali ke "menunggu validasi" kalau teks
 * kini terbaca, dan tidak pernah langsung aktif untuk RAG.
 */
export async function replacePassages(db, actor, id, passages) {
  const check = checkUpload({ title: "proses ulang", category: CATEGORIES[0], owner: "proses ulang", passages });
  if (!check.ok) return { ok: false, errors: check.errors };

  await db.prepare("DELETE FROM passages WHERE document_id = ?").bind(id).run();
  const statements = check.value.passages
    .filter((item) => item.text.length >= 20)
    .map((item) => db.prepare("INSERT INTO passages (body, document_id, page) VALUES (?, ?, ?)").bind(item.text, id, item.page));
  for (let i = 0; i < statements.length; i += 40) await db.batch(statements.slice(i, i + 40));

  const status = check.value.parsed ? "validating" : "parse_failed";
  await db
    .prepare("UPDATE documents SET status = ?, rag_active = 0, pages = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(status, check.value.pages, id)
    .run();
  await audit(db, actor, "proses-ulang", id, check.value.parsed ? "Teks dibaca ulang" : "Teks masih tidak terbaca");
  clearDocumentCache();
  return { ok: true, status, warnings: check.warnings };
}

export async function setFile(db, id, fileUrl) {
  await db.prepare("UPDATE documents SET file = ?, updated_at = datetime('now') WHERE id = ?").bind(fileUrl, id).run();
}

export async function validateDocument(db, actor, id) {
  const doc = await getDocument(db, id);
  const { meta } = await db
    .prepare(
      `UPDATE documents SET status = 'ready', rag_active = 1, validated_by = ?, updated_at = datetime('now')
        WHERE id = ? AND status = 'validating'`,
    )
    .bind(actor, id)
    .run();
  if (!(meta?.changes > 0)) return false;
  await audit(db, actor, "validasi", id, "Dokumen divalidasi dan diaktifkan untuk RAG");

  // "Perbarui Versi": revisi lama berhenti dipakai tepat saat yang baru disahkan,
  // jadi tidak pernah ada saat jawaban bisa memakai dua versi yang bertentangan.
  if (doc?.supersedes) {
    const { meta: old } = await db
      .prepare(
        `UPDATE documents SET status = 'expired', rag_active = 0, updated_at = datetime('now')
          WHERE id = ? AND status != 'expired'`,
      )
      .bind(doc.supersedes)
      .run();
    if (old?.changes > 0) await audit(db, actor, "digantikan", doc.supersedes, `Digantikan oleh ${id}`);
  }
  clearDocumentCache();
  return true;
}

export async function setRag(db, actor, id, active) {
  // Hanya dokumen yang sudah tervalidasi yang bisa dinyalakan; mematikan selalu boleh.
  const sql = active
    ? "UPDATE documents SET rag_active = 1, updated_at = datetime('now') WHERE id = ? AND status = 'ready'"
    : "UPDATE documents SET rag_active = 0, updated_at = datetime('now') WHERE id = ?";
  const { meta } = await db.prepare(sql).bind(id).run();
  if (!(meta?.changes > 0)) return false;
  await audit(db, actor, active ? "rag-aktif" : "rag-nonaktif", id, null);
  clearDocumentCache();
  return true;
}

export async function expireDocument(db, actor, id) {
  const { meta } = await db
    .prepare("UPDATE documents SET status = 'expired', rag_active = 0, updated_at = datetime('now') WHERE id = ?")
    .bind(id)
    .run();
  if (!(meta?.changes > 0)) return false;
  await audit(db, actor, "tidak-berlaku", id, "Ditandai tidak berlaku");
  clearDocumentCache();
  return true;
}

/** Hapus dokumen unggahan beserta teksnya. Dokumen bawaan tidak bisa dihapus dari sini. */
export async function deleteDocument(db, actor, id) {
  const doc = await getDocument(db, id);
  if (!doc) return { ok: false, reason: "tidak-ada" };
  if (doc.bundled) return { ok: false, reason: "bawaan" };

  await db.batch([
    db.prepare("DELETE FROM passages WHERE document_id = ?").bind(id),
    db.prepare("DELETE FROM documents WHERE id = ? AND bundled = 0").bind(id),
  ]);
  await audit(db, actor, "hapus", id, doc.title);
  clearDocumentCache();
  return { ok: true };
}

/* ------------------------------------------------------------ pencarian halaman */

/**
 * Ubah pertanyaan menjadi kueri FTS5. Setiap kata dipakai sebagai awalan dan
 * digabung dengan OR; kata di-stem sama seperti pada pencarian topik, jadi
 * "persyaratan" dan "syarat" bertemu.
 */
export function ftsQuery(question) {
  const tokens = [...new Set(queryTokens(question))].filter((t) => t.length >= 3 && /^[a-z0-9_]+$/.test(t));
  if (!tokens.length) return null;
  return tokens.slice(0, 8).map((t) => `"${t}"*`).join(" OR ");
}

/** Potongan kalimat pembuka dari sebuah halaman, untuk disorot di pembaca. */
export function highlightFor(text) {
  const clean = String(text).replace(/\s+/g, " ").trim();
  const sentence = clean.split(/(?<=[.;:])\s+/).find((s) => s.length >= 40) ?? clean;
  return sentence.slice(0, 160);
}

/**
 * Halaman dokumen unggahan yang paling cocok dengan pertanyaan, dalam bentuk
 * topik sementara yang bisa dipakai pembangun prompt seperti topik biasa.
 */
export async function searchPassages(db, question, { limit = 3, origin = "" } = {}) {
  const match = ftsQuery(question);
  if (!db || !match) return [];

  let rows;
  try {
    const result = await db
      .prepare(
        `SELECT document_id, page, body FROM passages
          WHERE passages MATCH ? ORDER BY rank LIMIT ?`,
      )
      .bind(match, limit * 4)
      .all();
    rows = result.results ?? [];
  } catch (error) {
    console.warn("passages: pencarian gagal —", error.message);
    return [];
  }
  if (!rows.length) return [];

  const docs = new Map((await listDocuments(db)).filter(isUsable).map((doc) => [doc.id, doc]));
  const entries = [];
  const seen = new Set();

  for (const row of rows) {
    const doc = docs.get(row.document_id);
    const key = `${row.document_id}:${row.page}`;
    if (!doc || seen.has(key)) continue;
    seen.add(key);

    entries.push({
      id: `p:${key}`,
      category: "Dokumen",
      title: `${doc.title}, hal. ${row.page}`,
      questions: [],
      keywords: [],
      followUps: [],
      points: [],
      lead: "",
      closing: "",
      answer: row.body.slice(0, 1800),
      sourceTitle: doc.title,
      sourceOwner: doc.owner,
      validPeriod: doc.period,
      updatedAt: doc.updatedAt,
      sourceRef: doc.reference,
      sourceUrl: doc.file?.startsWith("/") ? `${origin}${doc.file}` : doc.file,
      escalation: "Hubungi pengelola dokumen untuk memastikan isi dan masa berlakunya.",
      passage: { documentId: doc.id, page: row.page, highlight: highlightFor(row.body), document: doc },
    });
    if (entries.length >= limit) break;
  }
  return entries;
}
