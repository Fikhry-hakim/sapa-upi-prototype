/**
 * Rute pengelola: dashboard, daftar dokumen, unggah, validasi, dan log audit.
 *
 * Semua rute di bawah /admin memeriksa penugasan pengelola dari tabel
 * staff_roles pada setiap permintaan. Peran tidak pernah datang dari browser.
 * Rute publik (daftar dokumen dan isi berkas) ada di bagian bawah berkas ini.
 */

import { authenticate, can, roleOf } from "./auth.js";
import {
  audit,
  CATEGORIES,
  checkUpload,
  createDocument,
  deleteDocument,
  documentStats,
  expireDocument,
  getDocument,
  isUsable,
  listAudit,
  listDocuments,
  MAX_FILE_BYTES,
  setFile,
  setRag,
  validateDocument,
} from "./documents.js";
import { INTERACTION_PAGE_SIZE, listInteractions, outcomeTotals, summarize, windowFor } from "./events.js";

function json(body, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

/** Pengguna beserta penugasannya, atau null kalau bukan pengelola. */
export async function staffFrom(db, request) {
  const user = await authenticate(db, request);
  if (!user) return null;
  const assignment = await roleOf(db, user.email);
  return assignment ? { user, assignment } : null;
}

const fileKey = (id) => `doc:${id}`;

/** Dokumen yang boleh dibaca siapa pun: sudah tervalidasi atau sudah tidak berlaku. */
const PUBLIC_STATUSES = new Set(["ready", "expired"]);

/* ------------------------------------------------------------ /admin/* */

export async function handleAdmin(request, env, cors, path) {
  const db = env.sapa_upi_kb;
  const staff = await staffFrom(db, request);
  const headers = cors;

  if (!staff) {
    const signedIn = await authenticate(db, request);
    return json(
      { error: signedIn ? "Akun ini bukan pengelola" : "Perlu masuk" },
      { status: signedIn ? 403 : 401, headers },
    );
  }

  const { user, assignment } = staff;
  const url = new URL(request.url);
  const method = request.method;

  if (path === "/admin/overview" && method === "GET") {
    const window = windowFor(
      url.searchParams.get("range") ?? "mingguan",
      Date.now(),
      url.searchParams.get("from"),
      url.searchParams.get("to"),
    );
    const [summary, docs, totals] = await Promise.all([summarize(db, window), listDocuments(db), outcomeTotals(db)]);
    return json({ summary, documents: documentStats(docs), totals, role: assignment }, { headers });
  }

  if (path === "/admin/interactions" && method === "GET") {
    const page = Number(url.searchParams.get("page")) || 1;
    const outcome = url.searchParams.get("outcome");
    // Halaman Dashboard memakai ukuran bawaan; ekspor laporan meminta halaman lebih besar.
    const size = Number(url.searchParams.get("size")) || INTERACTION_PAGE_SIZE;
    return json(await listInteractions(db, { outcome, page, size }), { headers });
  }

  if (path === "/admin/documents" && method === "GET") {
    const docs = await listDocuments(db);
    return json(
      {
        documents: docs.map((doc) => ({ ...doc, usable: isUsable(doc) })),
        stats: documentStats(docs),
        role: assignment,
        limits: { maxFileBytes: MAX_FILE_BYTES },
        categories: CATEGORIES,
      },
      { headers },
    );
  }

  if (path === "/admin/audit" && method === "GET") {
    return json({ entries: await listAudit(db) }, { headers });
  }

  if (path === "/admin/documents" && method === "POST") {
    if (!can(assignment, "upload")) return json({ error: "Tidak berwenang mengunggah" }, { status: 403, headers });
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Body harus JSON" }, { status: 400, headers });
    }
    const check = checkUpload(body);
    if (!check.ok) return json({ error: check.errors.join(" ") }, { status: 400, headers });

    if (check.value.targetId) {
      const target = await getDocument(db, check.value.targetId);
      if (!target) return json({ error: "Dokumen yang dituju tidak ditemukan." }, { status: 400, headers });
    }

    const created = await createDocument(db, user.email, check.value);
    return json({ ...created, warnings: check.warnings }, { status: 201, headers });
  }

  const match = /^\/admin\/documents\/([\w-]+)(?:\/(file|validate|rag|expire))?$/.exec(path);
  if (!match) return json({ error: "Rute tidak dikenal" }, { status: 404, headers });
  const [, id, action] = match;

  const doc = await getDocument(db, id);
  if (!doc) return json({ error: "Dokumen tidak ditemukan" }, { status: 404, headers });

  if (action === "file" && method === "PUT") {
    if (!can(assignment, "upload")) return json({ error: "Tidak berwenang mengunggah" }, { status: 403, headers });
    if (doc.bundled) return json({ error: "Dokumen bawaan tidak bisa diganti" }, { status: 400, headers });
    if (!env.sapa_upi_files) return json({ error: "Penyimpanan berkas belum dikonfigurasi" }, { status: 503, headers });

    const declared = Number(request.headers.get("content-length")) || 0;
    if (declared > MAX_FILE_BYTES) return json({ error: "Berkas terlalu besar" }, { status: 413, headers });

    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > MAX_FILE_BYTES) return json({ error: "Berkas terlalu besar" }, { status: 413, headers });
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") {
      return json({ error: "Berkas bukan PDF" }, { status: 400, headers });
    }

    await env.sapa_upi_files.put(fileKey(id), bytes);
    await setFile(db, id, `/files/${id}`);
    await audit(db, user.email, "unggah-berkas", id, `${bytes.byteLength} byte`);
    return json({ ok: true, file: `/files/${id}` }, { headers });
  }

  if (action === "validate" && method === "POST") {
    if (!can(assignment, "review")) return json({ error: "Tidak berwenang memvalidasi" }, { status: 403, headers });
    if (!doc.file) return json({ error: "Berkas belum diunggah" }, { status: 400, headers });
    const ok = await validateDocument(db, user.email, id);
    return json({ ok }, { status: ok ? 200 : 409, headers });
  }

  if (action === "rag" && method === "POST") {
    if (!can(assignment, "review")) return json({ error: "Tidak berwenang mengubah RAG" }, { status: 403, headers });
    let body = {};
    try {
      body = await request.json();
    } catch {
      /* dianggap kosong */
    }
    const ok = await setRag(db, user.email, id, Boolean(body.active));
    return json({ ok }, { status: ok ? 200 : 409, headers });
  }

  if (action === "expire" && method === "POST") {
    if (!can(assignment, "manage")) return json({ error: "Hanya admin" }, { status: 403, headers });
    const ok = await expireDocument(db, user.email, id);
    return json({ ok }, { status: ok ? 200 : 404, headers });
  }

  if (!action && method === "DELETE") {
    const mine = doc.uploadedBy === user.email;
    if (!can(assignment, "manage") && !(can(assignment, "upload") && mine)) {
      return json({ error: "Tidak berwenang menghapus" }, { status: 403, headers });
    }
    const result = await deleteDocument(db, user.email, id);
    if (!result.ok) {
      return json(
        { error: result.reason === "bawaan" ? "Dokumen bawaan tidak bisa dihapus" : "Tidak ditemukan" },
        { status: result.reason === "bawaan" ? 400 : 404, headers },
      );
    }
    await env.sapa_upi_files?.delete(fileKey(id));
    return json({ ok: true }, { headers });
  }

  return json({ error: "Metode tidak didukung" }, { status: 405, headers });
}

/* ------------------------------------------------------------ rute publik */

/** Dokumen unggahan yang sudah tervalidasi, untuk halaman Files. */
export async function handlePublicDocuments(request, env, cors) {
  const docs = (await listDocuments(env.sapa_upi_kb)).filter((doc) => !doc.bundled && PUBLIC_STATUSES.has(doc.status));
  const origin = new URL(request.url).origin;

  return json(
    {
      documents: docs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        owner: doc.owner,
        reference: doc.reference,
        period: doc.period,
        kind: doc.kind,
        pages: doc.pages,
        sizeBytes: doc.sizeBytes,
        updatedAt: doc.updatedAt,
        expired: doc.status === "expired",
        file: `${origin}/files/${doc.id}`,
      })),
    },
    { headers: cors },
  );
}

/**
 * Isi sebuah berkas unggahan. Dokumen yang sudah tervalidasi terbuka untuk
 * siapa pun; draf yang belum divalidasi hanya terbuka bagi pengelola.
 */
export async function handleFile(request, env, cors, id) {
  const db = env.sapa_upi_kb;
  const doc = await getDocument(db, id);
  if (!doc || doc.bundled) return json({ error: "Tidak ditemukan" }, { status: 404, headers: cors });

  if (!PUBLIC_STATUSES.has(doc.status)) {
    const staff = await staffFrom(db, request);
    if (!staff) return json({ error: "Tidak ditemukan" }, { status: 404, headers: cors });
  }

  const bytes = await env.sapa_upi_files?.get(fileKey(id), "arrayBuffer");
  if (!bytes) return json({ error: "Berkas belum diunggah" }, { status: 404, headers: cors });

  return new Response(bytes, {
    headers: {
      ...cors,
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${id}.pdf"`,
      "cache-control": PUBLIC_STATUSES.has(doc.status) ? "public, max-age=300" : "private, no-store",
    },
  });
}
