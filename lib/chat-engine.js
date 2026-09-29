import { searchKnowledgeBase } from "./search.js";

const escalationOptions = [
  "Tenaga Administrasi Program Studi",
  "Dosen atau pihak yang berwenang",
  "Sumber informasi resmi terkait",
];

function toSuggestion({ entry, score }) {
  return {
    id: entry.id,
    title: entry.title,
    category: entry.category,
    sampleQuestion: entry.questions[0],
    score,
  };
}

export function createChatResponse(query, entries) {
  const result = searchKnowledgeBase(query, entries);

  if (result.status === "empty") {
    return {
      type: "empty",
      message: "Tuliskan pertanyaan terlebih dahulu.",
    };
  }

  if (result.status === "match") {
    return {
      type: "answer",
      message: result.best.entry.answer,
      entry: result.best.entry,
      followUpQuestions: result.best.entry.followUps,
      verificationLabel: "Berdasarkan sumber informasi contoh",
      confidenceLabel:
        result.best.score >= 80 ? "Kecocokan tinggi" : "Kecocokan relevan",
    };
  }

  if (result.status === "ambiguous") {
    return {
      type: "suggestions",
      message:
        "Pertanyaanmu berkaitan dengan beberapa topik. Pilih topik yang paling sesuai agar jawaban lebih tepat.",
      suggestions: result.alternatives.map(toSuggestion),
    };
  }

  return {
    type: "fallback",
    message:
      "Maaf, SAPA UPI belum menemukan jawaban yang didukung oleh sumber informasi contoh. Silakan gunakan arahan resmi berikut.",
    reason: "Informasi tidak tersedia pada knowledge base contoh.",
    escalationOptions,
  };
}
