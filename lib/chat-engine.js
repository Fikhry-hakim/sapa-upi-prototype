import { clarifiedSentence, prioritizeTopic } from "./clarify.js";
import { searchByContent, searchKnowledgeBase } from "./search.js";

const escalationOptions = [
  "Tenaga Administrasi Program Studi",
  "Dosen pembimbing atau Ketua Program Studi",
  "Situs atau pengumuman resmi UPI",
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

function toAnswer(entry, score) {
  return {
    type: "answer",
    message: entry.answer,
    entry,
    followUpQuestions: entry.followUps,
    verificationLabel: "Berdasarkan pedoman akademik",
    confidenceLabel: score >= 80 ? "Kecocokan tinggi" : "Kecocokan relevan",
  };
}

/**
 * `topic` adalah topik jawaban yang sedang dibaca; hanya dipakai untuk pertanyaan klik-angka
 * ("Jelaskan lebih detail poin N: ..."), supaya penjelasannya tetap dari topik yang sama.
 */
export function createChatResponse(query, entries, { topic = null } = {}) {
  const clicked = clarifiedSentence(query);
  if (clicked) {
    const [best] = prioritizeTopic(searchByContent(clicked, entries), entries, topic);
    if (best) return toAnswer(best, 0);
  }

  const result = searchKnowledgeBase(clicked ?? query, entries);

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
      verificationLabel: "Berdasarkan pedoman akademik",
      confidenceLabel:
        result.best.score >= 80 ? "Kecocokan tinggi" : "Kecocokan relevan",
    };
  }

  if (result.status === "ambiguous") {
    return {
      type: "suggestions",
      message:
        "Pertanyaanmu cocok dengan beberapa topik. Pilih yang paling kamu maksud:",
      suggestions: result.alternatives.map(toSuggestion),
    };
  }

  return {
    type: "fallback",
    message:
      "Maaf, saya belum menemukan jawabannya di dokumen yang tersedia. Kamu bisa menghubungi:",
    reason: "Informasi ini belum ada di dokumen yang tersedia.",
    escalationOptions,
  };
}
