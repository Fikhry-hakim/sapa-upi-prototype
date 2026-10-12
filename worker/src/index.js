import { knowledgeBase } from "../../data/knowledge-base.js";
import { searchKnowledgeBase } from "../../lib/search.js";
import { askGemini } from "./gemini.js";

const MAX_QUESTION_LENGTH = 300;
const MAX_CONTEXT_ENTRIES = 3;

function corsHeaders(request, env) {
  const allowed = (env.ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean);
  const origin = request.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0] ?? "",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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
function retrieve(question) {
  const result = searchKnowledgeBase(question, knowledgeBase);
  if (result.status === "empty" || result.status === "none") return [];
  const ranked = [result.best, ...result.alternatives].filter(Boolean);
  const seen = new Set();
  return ranked
    .filter(({ entry }) => (seen.has(entry.id) ? false : seen.add(entry.id)))
    .slice(0, MAX_CONTEXT_ENTRIES)
    .map(({ entry }) => entry);
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") {
      return json({ error: "Gunakan POST" }, { status: 405, headers: cors });
    }

    let question = "";
    try {
      ({ question = "" } = await request.json());
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

    const entries = retrieve(question);

    try {
      const answer = await askGemini({
        question,
        entries,
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_MODEL ?? "gemini-3.5-flash-lite",
      });

      const top = entries[0] ?? null;
      return json(
        {
          source: "llm",
          answer,
          // Facts stay from the knowledge base so they can't be hallucinated.
          entry: top,
          followUps: top?.followUps ?? [],
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
  },
};
