export const MATCH_THRESHOLD = 10;
export const AMBIGUITY_MARGIN = 6;

const stopWords = new Set([
  "apa",
  "bagaimana",
  "cara",
  "di",
  "dimana",
  "mana",
  "dan",
  "yang",
  "untuk",
  "saya",
  "informasi",
  "mengenai",
  "tentang",
]);

const synonymReplacements = [
  [/\bgimana\b/g, "bagaimana"],
  [/\bta\b/g, "tugas akhir"],
  [/\bskripsi\b/g, "tugas akhir"],
  [/\bdeadline\b/g, "batas"],
  [/\babsen\b/g, "presensi"],
  [/\bsurat aktif kuliah\b/g, "surat keterangan mahasiswa aktif"],
];

export function normalizeText(text) {
  let normalized = String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const [pattern, replacement] of synonymReplacements) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized.replace(/\s+/g, " ").trim();
}

function meaningfulTokens(text) {
  return normalizeText(text)
    .split(" ")
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

function overlapScore(queryTokens, candidate, weight) {
  const candidateTokens = new Set(meaningfulTokens(candidate));
  return queryTokens.reduce(
    (score, token) => score + (candidateTokens.has(token) ? weight : 0),
    0,
  );
}

function scoreEntry(query, entry) {
  const normalizedQuery = normalizeText(query);
  const queryTokens = meaningfulTokens(normalizedQuery);
  let score = 0;

  for (const question of entry.questions) {
    const normalizedQuestion = normalizeText(question);
    if (normalizedQuestion === normalizedQuery) score += 100;
    if (
      normalizedQuery.length >= 6 &&
      (normalizedQuestion.includes(normalizedQuery) ||
        normalizedQuery.includes(normalizedQuestion))
    ) {
      score += 20;
    }
    score += overlapScore(queryTokens, question, 3);
  }

  score += overlapScore(queryTokens, entry.title, 4);
  score += overlapScore(queryTokens, entry.category, 3);

  for (const keyword of entry.keywords) {
    const normalizedKeyword = normalizeText(keyword);
    if (normalizedQuery.includes(normalizedKeyword)) score += 8;
    score += overlapScore(queryTokens, keyword, 2);
  }

  return score;
}

export function searchKnowledgeBase(query, entries) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return { status: "empty", best: null, alternatives: [] };
  }

  const ranked = entries
    .map((entry) => ({ entry, score: scoreEntry(normalizedQuery, entry) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));

  if (!ranked.length || ranked[0].score < MATCH_THRESHOLD) {
    return { status: "none", best: null, alternatives: [] };
  }

  const best = ranked[0];
  const closeResults = ranked.filter(
    ({ score }) => score >= MATCH_THRESHOLD && best.score - score <= AMBIGUITY_MARGIN,
  );

  if (closeResults.length > 1) {
    return {
      status: "ambiguous",
      best,
      alternatives: closeResults.slice(0, 3),
    };
  }

  return {
    status: "match",
    best,
    alternatives: ranked.slice(1, 3),
  };
}
