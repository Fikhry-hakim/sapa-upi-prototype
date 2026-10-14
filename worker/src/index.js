import { knowledgeBase as bundledKnowledgeBase } from "../../data/knowledge-base.js";
import { searchKnowledgeBase } from "../../lib/search.js";
import { askGemini } from "./gemini.js";
import { loadKnowledgeBase } from "./knowledge-store.js";
import { authenticate, createSession, destroySession, roleOf, upsertUser } from "./auth.js";
import { allowedDomains, consumeState, exchangeCode, isAllowedEmail, startLogin } from "./google-oidc.js";
import {
  deleteConversation,
  listConversations,
  readConversation,
  recordExchange,
} from "./history.js";

const MAX_QUESTION_LENGTH = 300;
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
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    Vary: "Origin",
  };
}

function json(body, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

/** Top entries the question actually relates to, used as grounding context. */
function retrieve(question, knowledgeBase) {
  const result = searchKnowledgeBase(question, knowledgeBase);
  if (result.status === "empty" || result.status === "none") return [];
  const ranked = [result.best, ...result.alternatives].filter(Boolean);
  const seen = new Set();
  return ranked
    .filter(({ entry }) => (seen.has(entry.id) ? false : seen.add(entry.id)))
    .slice(0, MAX_CONTEXT_ENTRIES)
    .map(({ entry }) => entry);
}

/** Apakah login sudah dikonfigurasi pada deployment ini. */
function loginConfigured(env) {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.OAUTH_REDIRECT_URI);
}

/** Satu-satunya tempat identitas pengguna diterjemahkan jadi jawaban: tidak ada. */
async function handleAsk(request, env, cors) {
  let question = "";
  let conversationId = null;
  try {
    ({ question = "", conversationId = null } = await request.json());
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

  const user = await authenticate(env.sapa_upi_kb, request);

  const knowledgeBase = await loadKnowledgeBase(env.sapa_upi_kb, bundledKnowledgeBase);
  // Only the question reaches retrieval. Nothing about the reader does, so two
  // people asking the same thing are answered from the same sources.
  const entries = retrieve(question, knowledgeBase);

  try {
    const answer = await askGemini({
      question,
      entries,
      apiKey: env.GEMINI_API_KEY,
      model: env.GEMINI_MODEL ?? "gemini-3.5-flash-lite",
    });

    const top = entries[0] ?? null;
    const savedTo = await recordExchange(env.sapa_upi_kb, user, {
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
      },
      { headers: cors },
    );
  } catch (error) {
    // Quota, outage, bad model name — let the browser fall back to local matching.
    return json(
      { error: "LLM tidak tersedia", detail: String(error).slice(0, 200) },
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
    return json({ user: { ...user, ...(assignment ?? {}) }, loginEnabled: true }, { headers: cors });
  }

  if (path === "/auth/logout") {
    await destroySession(db, request);
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
      return json({ error: "Gunakan akun email UPI untuk masuk" }, { status: 403, headers: cors });
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
    return json({ conversations: await listConversations(db, user) }, { headers: cors });
  }

  if (request.method === "DELETE") {
    const removed = await deleteConversation(db, user, id);
    return json({ ok: removed }, { status: removed ? 200 : 404, headers: cors });
  }

  const conversation = await readConversation(db, user, id);
  if (!conversation) return json({ error: "Tidak ditemukan" }, { status: 404, headers: cors });
  return json({ conversation }, { headers: cors });
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    if (path.startsWith("/auth/")) return handleAuth(request, env, cors, path);
    if (path.startsWith("/conversations")) return handleConversations(request, env, cors, path);

    if (request.method !== "POST") {
      return json({ error: "Gunakan POST" }, { status: 405, headers: cors });
    }
    return handleAsk(request, env, cors);
  },
};
