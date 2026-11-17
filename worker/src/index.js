import { knowledgeBase as bundledKnowledgeBase } from "../../data/knowledge-base.js";
import { searchByContent, searchKnowledgeBase } from "../../lib/search.js";
import { clarifiedSentence, prioritizeTopic } from "../../lib/clarify.js";
import { toIndonesianQuery } from "../../lib/en-terms.js";
import { askWithFallback, askWorkersAI, PRIMARY_BUDGET_MS, WORKERS_AI_MODEL } from "./gemini.js";
import { loadKnowledgeBase } from "./knowledge-store.js";
import { handleAdmin, handleFile, handlePublicDocuments } from "./admin.js";
import { classifyOutcome, recordEvent } from "./events.js";
import { passageEntryFor, publicEntry, searchPassages, unusableFiles } from "./documents.js";
import { citationFor } from "../../data/sources.js";
import { sourceSet } from "../../lib/source-set.js";
import { fileRequestMessage, findRequestedDocuments } from "../../lib/doc-request.js";
import { cleanHistory, contextQuery, mergeContext, needsContext, lastEntries, soundsLikeFollowUp, withAnchor } from "../../lib/followup.js";
import {
  authenticate,
  createSession,
  destroyAllSessions,
  destroyOtherSessions,
  destroySession,
  isFreshGoogleSession,
  listSessions,
  revokeSession,
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
import { createShare, listShares, readShare, revokeShare } from "./shares.js";
import { handleTranscribe } from "./transcribe.js";
import { clientKey, hit } from "./rate-limit.js";
import { allowedDomains, consumeState, exchangeCode, isAllowedEmail, startLogin } from "./google-oidc.js";
import {
  archiveAllConversations,
  deleteAllConversations,
  deleteConversation,
  exportConversations,
  listArchived,
  listConversations,
  readConversation,
  recordExchange,
  searchConversations,
  setArchived,
} from "./history.js";

const MAX_QUESTION_LENGTH = 300;
const ASK_PER_MINUTE = 20;
const LOGIN_PER_TEN_MINUTES = 30;
const FEEDBACK_PER_TEN_MINUTES = 60;
// Per pengguna, bukan per IP: banyak mahasiswa berbagi satu alamat di WiFi kampus.
const RECORD_PER_MINUTE = 30;
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
    // Cegah browser menebak-nebak tipe isi (mis. menjalankan PDF/JSON sebagai HTML).
    "X-Content-Type-Options": "nosniff",
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
function retrieve(question, knowledgeBase, { scope = null, excluded = new Set(), byContent = false } = {}) {
  // A reader can ask about one document only. The scope narrows what may be
  // retrieved; it never adds to it, and nothing about the reader is involved.
  // Documents a manager switched off are excluded for everyone, the same way.
  let pool = knowledgeBase.filter((entry) => !entry.sourceUrl || !excluded.has(entry.sourceUrl));
  if (scope) pool = pool.filter((entry) => entry.sourceUrl === scope);

  // Kalimat jawaban yang diklik dicari lewat isi entri lebih dulu; pencarian pertanyaan
  // biasa hanya cadangan kalau tidak ada isi yang cukup cocok.
  if (byContent) {
    const hits = searchByContent(question, pool);
    if (hits.length) return { entries: hits.slice(0, MAX_CONTEXT_ENTRIES), status: "match", score: null };
  }

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
  let topic = null;
  let lang = "id";
  let history = [];
  // "Improve SAPA UPI" dimatikan pembaca: pertanyaannya tidak ikut dihitung di statistik Dashboard.
  let improve = true;
  try {
    const body = await request.json();
    improve = body.improve !== false;
    ({ question = "", conversationId = null, scope = null, topic = null, lang = "id" } = body);
    // Giliran sebelumnya di chat yang sama; `previous` dari browser lama tetap dimengerti.
    history = cleanHistory(body.history, body.previous);
    lang = lang === "en" ? "en" : "id";
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
  // Pertanyaan klik-angka dicari lewat kalimatnya saja, dan topik dari jawaban yang sedang
  // dibaca didahulukan supaya penjelasannya bersumber dari dokumen yang sama.
  const clicked = clarifiedSentence(question);
  // Pertanyaan berbahasa Inggris dicari lewat padanan kata Indonesianya; model tetap menerima aslinya.
  const searchText = lang === "en" ? toIndonesianQuery(question) : question;

  // Orang yang meminta berkasnya ("ada file kalender akademik ga") diberi berkasnya, dibuka dari
  // halaman pertama, bukan kutipan di dalamnya. Tidak perlu model: katalog dokumenlah yang menjawab.
  if (!clicked && typeof scope !== "string") {
    const asked = findRequestedDocuments(searchText).filter(({ doc }) => !excluded.has(doc.file));
    if (asked.length) {
      const answer = fileRequestMessage(asked, lang);
      const task = (improve ? recordEvent : async () => {})(db, {
        outcome: "berbasis_sumber",
        entryId: null,
        category: "Berkas",
        documentId: asked[0].id,
        page: 1,
        durationMs: Date.now() - startedAt,
        source: "berkas",
        signedIn: Boolean(user),
      }).catch((error) => console.warn("events: gagal mencatat —", error.message));
      ctx?.waitUntil?.(task);
      const savedTo = await recordExchange(db, user, { conversationId, question, answer, entryId: null, source: "berkas" }).catch(() => null);
      return json(
        { source: "berkas", answer, entry: null, files: asked.map(({ id }) => id), followUps: [], conversationId: savedTo, citations: [], citation: null },
        { headers: cors },
      );
    }
  }

  const found = retrieve(clicked ?? searchText, knowledgeBase, {
    scope: typeof scope === "string" ? scope : null,
    excluded,
    byContent: Boolean(clicked),
  });
  let { entries } = found;
  let evidence = { status: found.status, score: found.score };
  // Percakapan yang nyambung: pertanyaan lanjutan ("berarti aku ikut yang mana?") tidak memuat
  // topiknya sendiri, jadi dicari bersama giliran sebelumnya. Pertanyaan yang jelas topiknya
  // sendiri tetap dicari sendiri, supaya ganti topik tidak terseret topik sebelumnya.
  let askedBefore = null;
  if (!clicked && history.length && needsContext(searchText, found, history)) {
    const translate = (text) => (lang === "en" ? toIndonesianQuery(text) : text);
    const again = retrieve(contextQuery(searchText, history, translate), knowledgeBase, {
      scope: typeof scope === "string" ? scope : null,
      excluded,
    });
    const merged = mergeContext(found, again, lastEntries(history, knowledgeBase, excluded, 1)[0] ?? null);
    if (merged.length) {
      entries = merged;
      evidence = { status: again.entries.length ? again.status : "match", score: again.score };
      askedBefore = history;
    }
  }
  // Model tetap diberi riwayatnya untuk pertanyaan yang terdengar seperti lanjutan.
  if (!askedBefore && history.length && !clicked && soundsLikeFollowUp(question)) {
    askedBefore = history;
    entries = withAnchor(entries, lastEntries(history, knowledgeBase, excluded));
  }
  if (clicked && typeof topic === "string") {
    const prioritized = prioritizeTopic(entries, knowledgeBase, topic.slice(0, 80), {
      scope: typeof scope === "string" ? scope : null,
      excluded,
      limit: MAX_CONTEXT_ENTRIES,
    });
    if (prioritized !== entries) {
      entries = prioritized;
      // Buktinya milik jawaban induk, bukan hasil mencari kalimat pendek tadi.
      evidence = { status: "match", score: null };
    }
  }

  // Nothing in the curated topics: look through the pages of documents a
  // manager uploaded and validated. Curated topics always take precedence.
  let fromPassage = false;
  // Klik-angka pada jawaban dari dokumen unggahan: kembali ke halaman yang sama.
  if (clicked && typeof topic === "string" && topic.startsWith("p:")) {
    const pinned = await passageEntryFor(db, topic.slice(0, 80), { origin: new URL(request.url).origin });
    if (pinned) {
      entries = [pinned, ...entries].slice(0, MAX_CONTEXT_ENTRIES);
      fromPassage = true;
      evidence = { status: "match", score: null };
    }
  }
  if (!entries.length && !scope) {
    entries = await searchPassages(db, searchText, { limit: MAX_CONTEXT_ENTRIES, origin: new URL(request.url).origin });
    fromPassage = entries.length > 0;
  }

  const top = entries[0] ?? null;
  const citation = fromPassage ? top.passage : null;

  /** Catat hasilnya di latar belakang, tanpa menunda jawaban. */
  const note = (failed) => {
    const outcome = classifyOutcome({
      failed,
      entryCount: entries.length,
      status: evidence.status,
      score: evidence.score,
      fromPassage,
    });
    const cited = top ? (fromPassage ? { documentId: citation.documentId, page: citation.page } : citationFor(top)) : null;
    const task = (improve ? recordEvent : async () => {})(db, {
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
    let answer;
    try {
      // Gemini diberi sebagian anggaran waktu; sisanya untuk cadangan di Workers AI.
      const geminiResult = await askWithFallback({
        question,
        entries,
        lang,
        history: askedBefore ?? [],
        apiKey: env.GEMINI_API_KEY,
        models: [env.GEMINI_MODEL ?? "gemini-3.5-flash-lite", env.GEMINI_FALLBACK_MODEL],
        totalMs: env.AI ? PRIMARY_BUDGET_MS : undefined,
      });
      answer = geminiResult.text;
      if (geminiResult.fellBack) console.warn(`gemini: model utama gagal, dijawab oleh ${geminiResult.model}`);
    } catch (geminiError) {
      if (!env.AI) throw geminiError;
      console.warn("gemini gagal, beralih ke Workers AI:", String(geminiError).slice(0, 200));
      const backupModel = env.AI_FALLBACK_MODEL || WORKERS_AI_MODEL;
      answer = await askWorkersAI({ question, entries, lang, history: askedBefore ?? [], ai: env.AI, model: backupModel });
      console.warn(`dijawab oleh cadangan ${backupModel}`);
    }
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
        entry: publicEntry(top),
        followUps: top?.followUps ?? [],
        conversationId: savedTo,
        // Semua dokumen yang dipakai jawaban, yang terbaru lebih dulu dan bertanda `newest`.
        citations: fromPassage ? [] : sourceSet(entries, answer, `${(askedBefore ?? []).map((turn) => turn.q).join(" ")} ${searchText}`).map(publicCitation),
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

/** Bentuk rujukan yang dikirim ke browser untuk satu dokumen sumber. */
function publicCitation({ citation, updatedAt, newest }) {
  const { document } = citation;
  return {
    documentId: citation.documentId,
    page: citation.page,
    highlight: citation.highlight,
    updatedAt,
    newest,
    document: {
      id: document.id,
      title: document.title,
      owner: document.owner,
      reference: document.reference,
      period: document.period,
      kind: document.kind,
      pages: document.pages,
      file: document.file,
    },
  };
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
    // Memasang kata sandi untuk pertama kali juga menuntut Google yang baru: sesi
    // yang sudah lama (atau dicuri) tidak boleh dipakai menanam jalan masuk
    // permanen yang tetap hidup setelah semua sesi dicabut.
    if (!existing && !fresh) {
      return json(
        { error: "Untuk memasang kata sandi, keluar lalu masuk lagi dengan Google (maksimal 10 menit lalu), kemudian coba lagi." },
        { status: 403, headers: cors },
      );
    }
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

  // Sesi aktif: lihat dan cabut. Hanya milik pengguna yang sedang masuk.
  if (path === "/auth/sessions" || path.startsWith("/auth/sessions/")) {
    const user = await authenticate(db, request);
    if (!user) return json({ error: "Perlu masuk" }, { status: 401, headers: cors });
    if (path === "/auth/sessions" && request.method === "GET") {
      return json({ sessions: await listSessions(db, user, request) }, { headers: cors });
    }
    if (request.method === "DELETE") {
      const revoked = await revokeSession(db, user, request, path.slice("/auth/sessions/".length));
      return json({ ok: revoked }, { status: revoked ? 200 : 404, headers: cors });
    }
    return json({ error: "Metode tidak didukung" }, { status: 405, headers: cors });
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

/** Membaca chat yang dibagikan: terbuka untuk siapa pun yang punya tautannya, hanya-baca. */
async function handlePublicShare(request, env, cors, path) {
  const db = env.sapa_upi_kb;
  if (request.method !== "GET") return json({ error: "Metode tidak didukung" }, { status: 405, headers: cors });

  const limited = await hit(db, `share:${await clientKey(request)}`, { limit: 60, windowMs: 60_000 });
  if (!limited.allowed) {
    return json({ error: "Terlalu banyak permintaan." }, { status: 429, headers: { ...cors, "Retry-After": String(limited.retryAfter) } });
  }

  const shared = await readShare(db, path.slice("/share/".length));
  if (!shared) return json({ error: "Tautan tidak ditemukan atau sudah dicabut" }, { status: 404, headers: cors });
  // Tautan bisa dicabut kapan saja, jadi jangan disimpan di cache bersama.
  return json({ share: shared }, { headers: { ...cors, "Cache-Control": "no-store" } });
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
    // Tanpa batas, satu akun bisa memenuhi basis data dengan tulisan tanpa henti.
    const limited = await hit(db, `record:${user.id}`, { limit: RECORD_PER_MINUTE, windowMs: 60_000 });
    if (!limited.allowed) {
      return json(
        { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
        { status: 429, headers: { ...cors, "Retry-After": String(limited.retryAfter) } },
      );
    }

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

  // Tautan bagikan: buat, daftar, cabut. Membaca tautan (tanpa masuk) ada di handlePublicShare.
  if (path === "/conversations/shares" && request.method === "GET") {
    return json({ shares: await listShares(db, user) }, { headers: cors });
  }
  const revokeMatch = /^\/conversations\/shares\/([\w-]+)$/.exec(path);
  if (revokeMatch && request.method === "DELETE") {
    const removed = await revokeShare(db, user, revokeMatch[1]);
    return json({ ok: removed }, { status: removed ? 200 : 404, headers: cors });
  }
  const shareMatch = /^\/conversations\/([\w-]+)\/share$/.exec(path);
  if (shareMatch && request.method === "POST") {
    const conversation = await readConversation(db, user, shareMatch[1]);
    if (!conversation) return json({ error: "Tidak ditemukan" }, { status: 404, headers: cors });
    const share = await createShare(db, user, conversation);
    if (!share) return json({ error: "Percakapan masih kosong" }, { status: 400, headers: cors });
    if (share.error === "limit") return json({ error: "Terlalu banyak tautan. Cabut beberapa dulu." }, { status: 429, headers: cors });
    return json({ share }, { headers: cors });
  }

  // Arsip: daftar, arsipkan semua, dan arsipkan atau kembalikan satu percakapan.
  if (path === "/conversations/archived" && request.method === "GET") {
    return json({ conversations: await listArchived(db, user) }, { headers: cors });
  }
  if (path === "/conversations/archive-all" && request.method === "POST") {
    return json({ ok: true, archived: await archiveAllConversations(db, user) }, { headers: cors });
  }
  const archiveMatch = /^\/conversations\/([\w-]+)\/(archive|unarchive)$/.exec(path);
  if (archiveMatch && request.method === "POST") {
    const changed = await setArchived(db, user, archiveMatch[1], archiveMatch[2] === "archive");
    return json({ ok: changed }, { status: changed ? 200 : 404, headers: cors });
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

    // Sesi, riwayat percakapan, dan data pengelola tidak boleh tersimpan di cache
    // bersama (proxy, perangkat umum). Rute berkas mengatur cache-nya sendiri.
    if (/^\/(auth|conversations|admin)(\/|$)/.test(path)) cors["Cache-Control"] = "no-store";

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    // Banjir permintaan ditolak di sini, sebelum ada tulisan ke D1. Kalau gerbangnya
    // tidak terpasang atau error, layanan jalan terus (fail-open), seperti rate-limit.js.
    if (env.FLOOD_GATE?.limit) {
      try {
        const { success } = await env.FLOOD_GATE.limit({ key: await clientKey(request) });
        if (!success) {
          return json(
            { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
            { status: 429, headers: { ...cors, "Retry-After": "60" } },
          );
        }
      } catch (error) {
        console.warn("flood-gate:", String(error).slice(0, 120));
      }
    }

    if (path.startsWith("/auth/")) return handleAuth(request, env, cors, path);
    if (path.startsWith("/conversations")) return handleConversations(request, env, cors, path);
    if (path.startsWith("/share/")) return handlePublicShare(request, env, cors, path);
    if (path.startsWith("/admin/")) return handleAdmin(request, env, cors, path);
    if (path === "/documents" && request.method === "GET") return handlePublicDocuments(request, env, cors);

    const file = /^\/files\/([\w-]+)$/.exec(path);
    if (file && request.method === "GET") return handleFile(request, env, cors, file[1]);

    if (request.method !== "POST") {
      return json({ error: "Gunakan POST" }, { status: 405, headers: cors });
    }
    if (path === "/feedback") return handleFeedback(request, env, cors);
    if (path === "/transcribe") return handleTranscribe(request, env, cors, json);
    return handleAsk(request, env, cors, ctx);
  },
};
