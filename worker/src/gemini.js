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

export const MAX_ATTEMPTS = 3;
export const RETRY_DELAY_MS = 250;

/** Cap on one call to Gemini. A throttled model can otherwise stall for minutes. */
export const ATTEMPT_TIMEOUT_MS = 9_000;

/** Cap on all attempts together, so retrying never costs more than answering. */
export const TOTAL_BUDGET_MS = 24_000;

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

export async function askGemini({
  question,
  entries,
  apiKey,
  model,
  fetchImpl = fetch,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = Date.now,
}) {
  const startedAt = now();
  const body = JSON.stringify({
    model,
    system_instruction: SYSTEM_INSTRUCTION,
    input: buildInput(question, entries),
  });

  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let response;
    try {
      response = await fetchImpl(GEMINI_URL, {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "content-type": "application/json",
        },
        body,
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      });
    } catch (error) {
      // A timed-out or aborted attempt is worth another go, within the budget.
      lastError = new Error(`Gemini request failed: ${error.message}`);
      if (attempt === MAX_ATTEMPTS || now() - startedAt >= TOTAL_BUDGET_MS) throw lastError;
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
      now() - startedAt >= TOTAL_BUDGET_MS
    ) {
      throw lastError;
    }
    await sleep(RETRY_DELAY_MS * attempt);
  }

  throw lastError;
}
