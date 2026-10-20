const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";

export const SYSTEM_INSTRUCTION = `Kamu adalah SAPA UPI, asisten akademik untuk mahasiswa Universitas Pendidikan Indonesia.

ATURAN YANG WAJIB DIPATUHI:
1. Jawab HANYA berdasarkan "KONTEKS PEDOMAN" yang diberikan. Jangan memakai pengetahuan di luar itu.
2. Kalau konteksnya tidak menjawab pertanyaan, katakan terus terang kamu belum punya rujukannya, lalu arahkan mahasiswa untuk menghubungi tenaga administrasi program studi. Jangan mengarang.
3. Jangan pernah mengarang angka, tanggal, nomor SK, nominal biaya, atau tenggat waktu. Kalau angkanya tidak ada di konteks, bilang belum tersedia.
4. Jawab dalam Bahasa Indonesia yang ringkas dan sopan, maksimal 4 kalimat. Jangan pakai bullet, heading, atau markdown.
5. Jangan menyapa ulang atau menulis pembuka basa-basi. Langsung ke isi jawaban.
6. Kalau mahasiswa menanyakan sesuatu yang terdengar seperti keputusan final (kelulusan, nilai, kelayakan sidang), ingatkan bahwa keputusan resmi tetap ada pada program studi dan sarankan memastikannya ke tenaga administrasi.
7. Jangan menyebut jawabanmu sebagai "data contoh". Konteks berasal dari dokumen resmi yang disebutkan pada rujukan.
8. Kalau konteks memuat dua ketentuan yang berbeda untuk hal yang sama, sebutkan keduanya beserta dokumen asalnya, jangan memilih salah satu.`;

export function buildContextBlock(entries) {
  if (!entries.length) return "KONTEKS PEDOMAN: (tidak ada rujukan yang cocok)";

  const blocks = entries.map((entry, index) => {
    const points = entry.points?.length ? `\nRincian: ${entry.points.join(" ")}` : "";
    return [
      `[${index + 1}] ${entry.title} (kategori: ${entry.category})`,
      `Isi: ${entry.answer}${points}`,
      `Sumber: ${entry.sourceTitle} — ${entry.sourceOwner}, berlaku ${entry.validPeriod}, diperbarui ${entry.updatedAt}`,
      `Eskalasi: ${entry.escalation}`,
    ].join("\n");
  });

  return `KONTEKS PEDOMAN:\n${blocks.join("\n\n")}`;
}

export function buildInput(question, entries) {
  return `${buildContextBlock(entries)}\n\nPERTANYAAN MAHASISWA: ${question}`;
}

/**
 * The Interactions API returns a `steps` timeline; model text lives in
 * `model_output` steps as `content[].text`. Thought/tool steps are skipped.
 */
export function extractText(payload) {
  const steps = Array.isArray(payload?.steps) ? payload.steps : [];
  const outputs = steps.filter((step) => step?.type === "model_output");
  const last = outputs[outputs.length - 1];
  if (!last) return "";

  return (Array.isArray(last.content) ? last.content : [])
    .filter((block) => block?.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("")
    .trim();
}

/** Fixed so the same question decodes the same way for every reader. */
export const ANSWER_SEED = 20261014;

export const MAX_ATTEMPTS = 3;
export const RETRY_DELAY_MS = 250;

/** Cap on one call to Gemini. A throttled model can otherwise stall for minutes. */
export const ATTEMPT_TIMEOUT_MS = 12_000;

/** Cap on all attempts together, so retrying never costs more than answering. */
export const TOTAL_BUDGET_MS = 15_000;

/** Percobaan yang tersisa waktunya kurang dari ini tidak layak dimulai. */
export const MIN_ATTEMPT_MS = 3_000;

/**
 * Whether another attempt could plausibly succeed.
 *
 * A Worker has no fixed egress location, so some requests leave from a region
 * Gemini does not serve and come back 400 "User location is not supported"
 * while the next one succeeds. That is worth retrying; a bad request or an
 * exhausted quota is not, and retrying those would only burn quota.
 */
export function isRetryable(status, detail = "") {
  if (status >= 500) return true;
  if (status === 400 && /location is not supported/i.test(detail)) return true;
  return false;
}

/**
 * Pengaturan decoding per model. Tingkat berpikir hanya dikenal model keluarga 3;
 * model lain bisa menolaknya, jadi tidak dikirimkan ke mereka.
 */
export function generationConfigFor(model) {
  const config = { seed: ANSWER_SEED };
  if (/^gemini-3/i.test(String(model))) config.thinking_level = "low";
  return config;
}

export async function askGemini({
  question,
  entries,
  apiKey,
  model,
  fetchImpl = fetch,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = Date.now,
  budgetMs = TOTAL_BUDGET_MS,
}) {
  const startedAt = now();
  const body = JSON.stringify({
    model,
    system_instruction: SYSTEM_INSTRUCTION,
    input: buildInput(question, entries),
    // The same question must not get a differently worded answer depending on
    // who asked it. Nothing about the reader reaches the prompt, and a fixed
    // seed keeps the decoding reproducible too. The provider does not promise
    // this across model updates, so treat it as stability, not a guarantee.
    // Jawaban disusun dari kutipan yang sudah diberikan, jadi tidak perlu berpikir
    // panjang; thinking rendah memangkas waktu tunggu dari belasan detik.
    generation_config: generationConfigFor(model),
  });

  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    // Anggaran total adalah batas keras: percobaan terakhir dipotong ke sisa
    // waktu, dan tidak dimulai sama sekali kalau sisanya terlalu sedikit.
    const remaining = budgetMs - (now() - startedAt);
    if (attempt > 1 && remaining < MIN_ATTEMPT_MS) throw lastError;
    const attemptTimeout = Math.min(ATTEMPT_TIMEOUT_MS, Math.max(remaining, MIN_ATTEMPT_MS));

    let response;
    try {
      response = await fetchImpl(GEMINI_URL, {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "content-type": "application/json",
        },
        body,
        signal: AbortSignal.timeout(attemptTimeout),
      });
    } catch (error) {
      // A timed-out or aborted attempt is worth another go, within the budget.
      lastError = new Error(`Gemini request failed: ${error.message}`);
      if (attempt === MAX_ATTEMPTS || now() - startedAt >= budgetMs) throw lastError;
      await sleep(RETRY_DELAY_MS * attempt);
      continue;
    }

    if (response.ok) {
      const payload = await response.json();
      const text = extractText(payload);
      if (!text) throw new Error("Gemini returned no text");
      return text;
    }

    const detail = await response.text().catch(() => "");
    lastError = new Error(`Gemini ${response.status}: ${detail.slice(0, 300)}`);

    if (
      attempt === MAX_ATTEMPTS ||
      !isRetryable(response.status, detail) ||
      now() - startedAt >= budgetMs
    ) {
      throw lastError;
    }
    await sleep(RETRY_DELAY_MS * attempt);
  }

  throw lastError;
}

/** Bagian anggaran waktu untuk model utama; sisanya untuk model cadangan. */
export const PRIMARY_BUDGET_MS = 9_000;

/**
 * Tanya model utama, dan kalau gagal (timeout, kuota, gangguan), model cadangan.
 *
 * Seluruhnya tetap berada di bawah TOTAL_BUDGET_MS: model utama tidak boleh
 * menghabiskan waktu yang dibutuhkan cadangannya. Mengembalikan teks jawaban
 * beserta model yang menjawab, supaya pergantian model bisa dicatat.
 * Galat 400 selain pembatasan lokasi tidak berpindah model, karena itu berarti
 * permintaannya sendiri yang salah, bukan modelnya yang sedang bermasalah.
 */
export async function askWithFallback({ models, now = Date.now, totalMs = TOTAL_BUDGET_MS, ...options }) {
  const list = [...new Set(models.filter(Boolean))];
  const startedAt = now();
  let lastError;

  for (let i = 0; i < list.length; i += 1) {
    const isLast = i === list.length - 1;
    const elapsed = now() - startedAt;
    const remaining = totalMs - elapsed;
    if (i > 0 && remaining < MIN_ATTEMPT_MS) break;

    // Model utama dibatasi supaya cadangan masih kebagian waktu.
    const budgetMs = isLast ? remaining : Math.min(PRIMARY_BUDGET_MS, remaining);
    try {
      const text = await askGemini({ ...options, model: list[i], now, budgetMs });
      return { text, model: list[i], fellBack: i > 0 };
    } catch (error) {
      lastError = error;
      if (/^Gemini 400:/.test(error.message) && !/location is not supported/i.test(error.message)) throw error;
    }
  }
  throw lastError;
}

/* ------------------------------------------------------------ cadangan: Workers AI */

/** Model cadangan di Workers AI; ringan supaya tetap muat di kuota harian gratis. */
export const WORKERS_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";

/** Waktu untuk cadangan Workers AI setelah Gemini gagal (total tetap 15 detik). */
export const WORKERS_AI_BUDGET_MS = TOTAL_BUDGET_MS - PRIMARY_BUDGET_MS;

/**
 * Jawab lewat Cloudflare Workers AI, yang tidak bergantung pada Google sama
 * sekali: kalau Gemini lambat, kehabisan kuota, atau diblokir per wilayah,
 * cadangan ini tetap bisa menjawab. Instruksi dan konteks yang diberikan sama,
 * jadi aturan "hanya dari kutipan pedoman" berlaku persis seperti pada Gemini.
 */
export async function askWorkersAI({
  question,
  entries,
  ai,
  model = WORKERS_AI_MODEL,
  timeoutMs = WORKERS_AI_BUDGET_MS,
}) {
  if (!ai?.run) throw new Error("Workers AI tidak tersedia");

  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Workers AI timeout")), timeoutMs);
  });

  try {
    const result = await Promise.race([
      ai.run(model, {
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          { role: "user", content: buildInput(question, entries) },
        ],
        max_tokens: 700,
        temperature: 0,
        seed: ANSWER_SEED % 1_000_000, // rentang seed Workers AI lebih sempit dari Gemini
      }),
      timeout,
    ]);
    const text = String(result?.response ?? "").trim();
    if (!text) throw new Error("Workers AI tidak mengembalikan teks");
    return text;
  } finally {
    clearTimeout(timer);
  }
}
