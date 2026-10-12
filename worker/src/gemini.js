const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";

export const SYSTEM_INSTRUCTION = `Kamu adalah SAPA UPI, asisten akademik untuk mahasiswa Universitas Pendidikan Indonesia.

ATURAN YANG WAJIB DIPATUHI:
1. Jawab HANYA berdasarkan "KONTEKS PEDOMAN" yang diberikan. Jangan memakai pengetahuan di luar itu.
2. Kalau konteksnya tidak menjawab pertanyaan, katakan terus terang kamu belum punya rujukannya, lalu arahkan mahasiswa untuk menghubungi tenaga administrasi program studi. Jangan mengarang.
3. Jangan pernah mengarang angka, tanggal, nomor SK, nominal biaya, atau tenggat waktu. Kalau angkanya tidak ada di konteks, bilang belum tersedia.
4. Jawab dalam Bahasa Indonesia yang ringkas dan sopan, maksimal 4 kalimat. Jangan pakai bullet, heading, atau markdown.
5. Jangan menyapa ulang atau menulis pembuka basa-basi. Langsung ke isi jawaban.
6. Ingatkan bahwa ini data contoh kalau mahasiswa menanyakan sesuatu yang terdengar seperti keputusan final (kelulusan, nilai, kelayakan sidang).`;

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

export async function askGemini({ question, entries, apiKey, model, fetchImpl = fetch }) {
  const response = await fetchImpl(GEMINI_URL, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      system_instruction: SYSTEM_INSTRUCTION,
      input: buildInput(question, entries),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini ${response.status}: ${detail.slice(0, 300)}`);
  }

  const payload = await response.json();
  const text = extractText(payload);
  if (!text) throw new Error("Gemini returned no text");
  return text;
}
