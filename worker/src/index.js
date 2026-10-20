import { knowledgeBase as bundledKnowledgeBase } from "../../data/knowledge-base.js";
import { searchKnowledgeBase } from "../../lib/search.js";
import { askGemini } from "./gemini.js";
import { loadKnowledgeBase } from "./knowledge-store.js";
import { handleAdmin, handleFile, handlePublicDocuments } from "./admin.js";
import { classifyOutcome, recordEvent } from "./events.js";
import { searchPassages, unusableFiles } from "./documents.js";
import { citationFor } from "../../data/sources.js";
import {
  authenticate,
  createSession,
  destroyAllSessions,
  destroyOtherSessions,
  destroySession,
  isFreshGoogleSession,
  roleOf,
  upsertUser,
} from "./auth.js";
import {
  attemptLogin,
  clearFailures,
  hasPassword,
  isLockedOut,
  passwordProblem,
  recordFailure,
  setPassword,
  storedHashFor,
  verifyPassword,
} from "./password.js";
import { checkFeedback, recordFeedback } from "./feedback.js";
import { clientKey, hit } from "./rate-limit.js";
import { allowedDomains, consumeState, exchangeCode, isAllowedEmail, startLogin } from "./google-oidc.js";
import {
  deleteAllConversations,
  deleteConversation,
  exportConversations,
  listConversations,
  readConversation,
  recordExchange,
  searchConversations,
} from "./history.js";

const MAX_QUESTION_LENGTH = 300;
const ASK_PER_MINUTE = 20;
const LOGIN_PER_TEN_MINUTES = 30;
const FEEDBACK_PER_TEN_MINUTES = 60;
const MAX_ANSWER_LENGTH = 4000;
const MAX_CONTEXT_ENTRIES = 3;

function corsHeaders(request, env) {
  const allowed = (env.ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean);
  const origin = request.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0] ?? "",
    // The session travels in Authorization, so the preflight must allow it or
    // the browser blocks every signed-in request before it is sent.
    "Access-Control-Allow-Headers": "content-type, authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    Vary: "Origin",
  };
}

function json(body, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

/**
 * Topik yang benar-benar berkaitan dengan pertanyaan, dipakai sebagai konteks.
 *
 * Mengembalikan juga status dan skor pencocokan, karena dashboard perlu tahu
 * apakah rujukannya kuat, tipis, atau berimbang antara beberapa topik.
 */
function retrieve(question, knowledgeBase, { scope = null, excluded = new Set() } = {}) {
  // A reader can ask about one document only. The scope narrows what may be
  // retrieved; it never adds to it, and nothing about the reader is involved.
  // Documents a manager switched off are excluded for everyone, the same way.
  let pool = knowledgeBase.filter((entry) => !entry.sourceUrl || !excluded.has(entry.sourceUrl));
  if (scope) pool = pool.filter((entry) => entry.sourceUrl === scope);

  const result = searchKnowledgeBase(question, pool);
  if (result.status === "empty" || result.status === "none") {
    return { entries: [], status: "none", score: null };
  }
  const ranked = [result.best, ...result.alternatives].filter(Boolean);
  const seen = new Set();
  const entries = ranked
    .filter(({ entry }) => (seen.has(entry.id) ? false : seen.add(entry.id)))
    .slice(0, MAX_CONTEXT_ENTRIES)
    .map(({ entry }) => entry);
  return { entries, status: result.status, score: result.best?.score ?? null };
}

/** Apakah login sudah dikonfigurasi pada deployment ini. */
function loginConfigured(env) {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.OAUTH_REDIRECT_URI);
}

/** Satu-satunya tempat identitas pengguna diterjemahkan jadi jawaban: tidak ada. */
async function handleAsk(request, env, cors, ctx) {
  let question = "";
  let conversationId = null;
  let scope = null;
  try {
    ({ question = "", conversationId = null, scope = null } = await request.json());
  } catch {
    return json({ error: "Body harus JSON" }, { status: 400, headers: cors });
  }

  question = String(question).trim();
  if (!question) return json({ error: "Pertanyaan kosong" }, { status: 400, headers: cors });
  if (question.length > MAX_QUESTION_LENGTH) {
    return json({ error: "Pertanyaan terlalu panjang" }, { status: 413, headers: cors });
  }
  if (!env.GEMINI_API_KEY) {
    return json({ error: "GEMINI_API_KEY belum diset" }, { status: 503, headers: cors });
  }

  const db = env.sapa_upi_kb;

  // Setiap pertanyaan memakai kuota model; tanpa batas, satu klien bisa menghabiskannya.
  const limited = await hit(db, `ask:${await clientKey(request)}`, { limit: ASK_PER_MINUTE, windowMs: 60_000 });
  if (!limited.allowed) {
    return json(
      { error: "Terlalu banyak pertanyaan. Coba lagi sebentar." },
      { status: 429, headers: { ...cors, "Retry-After": String(limited.retryAfter) } },
    );
  }

  const startedAt = Date.now();
  const user = await authenticate(db, request);

  const knowledgeBase = await loadKnowledgeBase(db, bundledKnowledgeBase);
  const excluded = await unusableFiles(db);

  // Only the question reaches retrieval. Nothing about the reader does, so two
  // people asking the same thing are answered from the same sources.
  const found = retrieve(question, knowledgeBase, {
    scope: typeof scope === "string" ? scope : null,
    excluded,
  });
  let { entries } = found;

  // Nothing in the curated topics: look through the pages of documents a
  // manager uploaded and validated. Curated topics always take precedence.
  let fromPassage = false;
  if (!entries.length && !scope) {
    entries = await searchPassages(db, question, { limit: MAX_CONTEXT_ENTRIES, origin: new URL(request.url).origin });
    fromPassage = entries.length > 0;
  }

  const top = entries[0] ?? null;
  const citation = fromPassage ? top.passage : null;

  /** Catat hasilnya di latar belakang, tanpa menunda jawaban. */
  const note = (failed) => {
    const outcome = classifyOutcome({
      failed,
      entryCount: entries.length,
      status: found.status,
      score: found.score,
      fromPassage,
    });
    const cited = top ? (fromPassage ? { documentId: citation.documentId, page: citation.page } : citationFor(top)) : null;
    const task = recordEvent(db, {
      outcome,
      entryId: top?.id ?? null,
      category: top ? (fromPassage ? top.title : top.title) : null,
      documentId: cited?.documentId ?? null,
      page: cited?.page ?? null,
      durationMs: Date.now() - startedAt,
      source: failed ? "gagal" : "llm",
      signedIn: Boolean(user),
    }).catch((error) => console.warn("events: gagal mencatat —", error.message));
    ctx?.waitUntil?.(task);
  };

  try {
    const answer = await askGemini({
      question,
      entries,
      apiKey: env.GEMINI_API_KEY,
      model: env.GEMINI_MODEL ?? "gemini-3.5-flash-lite",
    });
    note(false);

    const savedTo = await recordExchange(db, user, {
      conversationId,
      question,
      answer,
      entryId: top?.id ?? null,
      source: "llm",
    }).catch((error) => {
      // Riwayat gagal disimpan tidak boleh menggagalkan jawabannya.
      console.warn("history: gagal menyimpan percakapan —", error.message);
      return null;
    });

    return json(
      {
        source: "llm",
        answer,
        // Facts stay from the knowledge base so they can't be hallucinated.
        entry: top,
        followUps: top?.followUps ?? [],
        conversationId: savedTo,
        citation: citation
          ? {
              documentId: citation.documentId,
              page: citation.page,
              highlight: citation.highlight,
              document: {
                id: citation.document.id,
                title: citation.document.title,
                owner: citation.document.owner,
                reference: citation.document.reference,
                period: citation.document.period,
                kind: citation.document.kind,
                pages: citation.document.pages,
                file: top.sourceUrl,
              },
            }
          : null,
      },
      { headers: cors },
    );
  } catch (error) {
    console.warn("gemini:", String(error).slice(0, 300));
    note(true);
    // Quota, outage, bad model name — let the browser fall back to local matching.
    return json(
      { error: "LLM tidak tersedia" },
      { status: 502, headers: cors },
    );
  }
}

async function handleAuth(request, env, cors, path) {
  const db = env.sapa_upi_kb;

  if (path === "/auth/me") {
    const user = await authenticate(db, request);
    if (!user) return json({ user: null, loginEnabled: loginConfigured(env) }, { headers: cors });
    const assignment = await roleOf(db, user.email);
    return json(
      { user: { ...user, ...(assignment ?? {}), hasPassword: await hasPassword(db, user.id) }, loginEnabled: true },
      { headers: cors },
    );
  }

  if (path === "/auth/password/login" && request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Body harus JSON" }, { status: 400, headers: cors });
    }
    const ip = await clientKey(request);
    const throttled = await hit(db, `login:${ip}`, { limit: LOGIN_PER_TEN_MINUTES, windowMs: 600_000 });
    if (!throttled.allowed) {
      return json(
        { error: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." },
        { status: 429, headers: { ...cors, "Retry-After": String(throttled.retryAfter) } },
      );
    }
    const result = await attemptLogin(db, body ?? {}, { domainOk: (email) => isAllowedEmail(email, allowedDomains(env)), ip });
    if (!result.user) return json({ error: result.error }, { status: result.status, headers: cors });

    await upsertUser(db, result.user);
    const token = await createSession(db, result.user.id, "password");
    return json({ token }, { headers: cors });
  }

  if (path === "/auth/password/set" && request.method === "POST") {
    const user = await authenticate(db, request);
    if (!user) return json({ error: "Perlu masuk" }, { status: 401, headers: cors });

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Body harus JSON" }, { status: 400, headers: cors });
    }

    const problem = passwordProblem(body?.password, user.email);
    if (problem) return json({ error: problem }, { status: 400, headers: cors });

    // Mengganti kata sandi yang sudah ada menuntut kata sandi lama, kecuali sesi
    // ini baru saja dibuka lewat Google (jalan keluar kalau kata sandi lupa).
    // Sesi yang tertinggal di perangkat lain tidak cukup untuk mengambil alih.
    const existing = await storedHashFor(db, user.id);
    const fresh = await isFreshGoogleSession(db, request);
    if (existing && !fresh) {
      const ip = await clientKey(request);
      if (await isLockedOut(db, user.email, ip)) {
        return json({ error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." }, { status: 429, headers: cors });
      }
      if (typeof body.current !== "string" || !(await verifyPassword(body.current, existing))) {
        await recordFailure(db, user.email, ip);
        return json({ error: "Kata sandi saat ini salah." }, { status: 403, headers: cors });
      }
      await clearFailures(db, user.email, ip);
    }

    await setPassword(db, user.id, body.password);
    // Sesi di perangkat lain dicabut: kalau salah satunya dicuri, mengganti
    // kata sandi harus benar-benar menutup aksesnya.
    await destroyOtherSessions(db, user, request);
    return json({ ok: true }, { headers: cors });
  }

  if (path === "/auth/logout") {
    await destroySession(db, request);
    return json({ ok: true }, { headers: cors });
  }

  if (path === "/auth/logout-all") {
    const user = await authenticate(db, request);
    if (!user) return json({ error: "Perlu masuk" }, { status: 401, headers: cors });
    await destroyAllSessions(db, user);
    return json({ ok: true }, { headers: cors });
  }

  if (!loginConfigured(env)) {
    return json({ error: "Login belum dikonfigurasi" }, { status: 503, headers: cors });
  }

  if (path === "/auth/start") {
    const redirectTo = new URL(request.url).searchParams.get("redirect_to");
    return Response.redirect(await startLogin(db, env, redirectTo), 302);
  }

  if (path === "/auth/callback") {
    const url = new URL(request.url);
    const stored = await consumeState(db, url.searchParams.get("state"));
    if (!stored) {
      return json({ error: "State login tidak sah atau kedaluwarsa" }, { status: 400, headers: cors });
    }

    const code = url.searchParams.get("code");
    if (!code) return json({ error: "Kode otorisasi tidak ada" }, { status: 400, headers: cors });

    let identity;
    try {
      identity = await exchangeCode({ code, codeVerifier: stored.codeVerifier, env });
    } catch (error) {
      return json({ error: String(error.message).slice(0, 200) }, { status: 502, headers: cors });
    }

    if (!isAllowedEmail(identity.email, allowedDomains(env))) {
      // Kembali ke aplikasi supaya pengguna melihat halaman galat, bukan JSON mentah.
      // Tidak ada email atau nama yang ikut di URL.
      const back = new URL(stored.redirectTo || env.APP_URL || "/");
      back.hash = "login_error=domain";
      return Response.redirect(back.toString(), 302);
    }

    await upsertUser(db, identity);
    const token = await createSession(db, identity.id);

    // Token diserahkan lewat fragment supaya tidak masuk log server atau Referer.
    const target = new URL(stored.redirectTo || env.APP_URL || "/");
    target.hash = `token=${encodeURIComponent(token)}`;
    return Response.redirect(target.toString(), 302);
  }

  return json({ error: "Rute auth tidak dikenal" }, { status: 404, headers: cors });
}

async function handleConversations(request, env, cors, path) {
  const db = env.sapa_upi_kb;
  const user = await authenticate(db, request);
  if (!user) return json({ error: "Perlu masuk" }, { status: 401, headers: cors });

  // An answer the browser produced locally, because the model was unreachable.
  // Without this the history would quietly lose every exchange that happened
  // while Gemini was down. The reader is recording what they were shown, into
  // their own history and nobody else's; answer_source marks it as offline so
  // it is never mistaken for something the model wrote.
  if (path === "/conversations/record" && request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Body harus JSON" }, { status: 400, headers: cors });
    }

    const question = String(body.question ?? "").trim();
    const answer = String(body.answer ?? "").trim();
    if (!question || !answer) {
      return json({ error: "Pertanyaan dan jawaban wajib diisi" }, { status: 400, headers: cors });
    }
    if (question.length > MAX_QUESTION_LENGTH || answer.length > MAX_ANSWER_LENGTH) {
      return json({ error: "Isi terlalu panjang" }, { status: 413, headers: cors });
    }

    const conversationId = await recordExchange(db, user, {
      conversationId: body.conversationId ?? null,
      question,
      answer,
      entryId: body.entryId ?? null,
      source: "offline",
    });
    return json({ conversationId }, { headers: cors });
  }

  const id = path.slice("/conversations/".length);

  if (path === "/conversations") {
    if (request.method === "DELETE") {
      const removed = await deleteAllConversations(db, user);
      return json({ ok: true, removed }, { headers: cors });
    }
    const term = new URL(request.url).searchParams.get("q")?.trim();
    const conversations = term
      ? await searchConversations(db, user, term.slice(0, 80))
      : await listConversations(db, user);
    return json({ conversations }, { headers: cors });
  }

  if (path === "/conversations/export") {
    return json(await exportConversations(db, user), { headers: cors });
  }

  if (request.method === "DELETE") {
    const removed = await deleteConversation(db, user, id);
    return json({ ok: removed }, { status: removed ? 200 : 404, headers: cors });
  }

  const conversation = await readConversation(db, user, id);
  if (!conversation) return json({ error: "Tidak ditemukan" }, { status: 404, headers: cors });
  return json({ conversation }, { headers: cors });
}

/** Penilaian singkat setelah jawaban. Terbuka untuk siapa pun, seperti bertanya itu sendiri. */
async function handleFeedback(request, env, cors) {
  const db = env.sapa_upi_kb;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Body harus JSON" }, { status: 400, headers: cors });
  }

  const value = checkFeedback(body);
  if (!value) return json({ error: "Penilaian tidak sah" }, { status: 400, headers: cors });

  const limited = await hit(db, `feedback:${await clientKey(request)}`, { limit: FEEDBACK_PER_TEN_MINUTES, windowMs: 600_000 });
  if (!limited.allowed) {
    return json(
      { error: "Terlalu banyak penilaian. Coba lagi nanti." },
      { status: 429, headers: { ...cors, "Retry-After": String(limited.retryAfter) } },
    );
  }

  try {
    await recordFeedback(db, value);
  } catch (error) {
    console.warn("feedback:", String(error).slice(0, 200));
    return json({ error: "Gagal menyimpan" }, { status: 503, headers: cors });
  }
  return json({ ok: true }, { headers: cors });
}

export default {
  async fetch(request, env, ctx) {
    const cors = corsHeaders(request, env);
    const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    if (path.startsWith("/auth/")) return handleAuth(request, env, cors, path);
    if (path.startsWith("/conversations")) return handleConversations(request, env, cors, path);
    if (path.startsWith("/admin/")) return handleAdmin(request, env, cors, path);
    if (path === "/documents" && request.method === "GET") return handlePublicDocuments(request, env, cors);

    const file = /^\/files\/([\w-]+)$/.exec(path);
    if (file && request.method === "GET") return handleFile(request, env, cors, file[1]);

    if (request.method !== "POST") {
      return json({ error: "Gunakan POST" }, { status: 405, headers: cors });
    }
    if (path === "/feedback") return handleFeedback(request, env, cors);
    return handleAsk(request, env, cors, ctx);
  },
};
