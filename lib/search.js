import { expandAbbreviations } from "./glossary.js";

// Below this, the best entry is a coincidence rather than an answer. Tuned
// against the current knowledge base: real questions score 35 and up, while
// questions these documents do not cover peak around 27.
export const MATCH_THRESHOLD = 30;

/**
 * A runner-up scoring at least this share of the winner means the question did
 * not actually pick a side, so the answer offers the topics instead of guessing.
 * Relative, not a fixed gap: IDF makes a score depend on how rare the matched
 * words are, so the same gap means different things at different scores.
 */
export const AMBIGUITY_RATIO = 0.8;

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

/** How much each field counts when a query token appears in it. */
const FIELD_WEIGHTS = {
  title: 4,
  questions: 3,
  category: 3,
  keywords: 2,
};

/**
 * Terms that name one concept in several words. Scoring counts tokens, so left
 * split up, "tugas akhir" would earn twice what "sidang" earns for a question
 * that mentions each once — and a student typing "skripsi" expands into both.
 * Joining them makes one concept score as one unit.
 */
const compoundTerms = ["surat keterangan mahasiswa aktif", "tugas akhir"];

export function normalizeText(text) {
  let normalized = String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const [pattern, replacement] of synonymReplacements) {
    normalized = normalized.replace(pattern, replacement);
  }

  // Glosarium: tambahkan bentuk yang hilang (singkatan atau kepanjangannya),
  // supaya "letter of acceptance" dan "LoA" menemukan entri yang sama.
  normalized = expandAbbreviations(normalized);

  return normalized.replace(/\s+/g, " ").trim();
}

/** normalizeText, with multi-word concepts fused so they tokenize as one term. */
function normalizeForTokens(text) {
  let normalized = normalizeText(text);
  for (const term of compoundTerms) {
    normalized = normalized.split(term).join(term.replace(/ /g, "_"));
  }
  return normalized;
}

const prefixes = ["memper", "meng", "meny", "mem", "men", "peng", "peny", "pem", "pen", "ber", "ter", "per", "me", "pe", "ke", "di", "se"];
const suffixes = ["kan", "an", "nya", "i"];
const MIN_STEM_LENGTH = 4;

/**
 * Strips common Indonesian affixes so a question and a document can meet in the
 * middle: official wording ("persyaratan pendaftaran") and how students
 * actually type ("syarat daftar") reduce to the same stem. Applied to both
 * sides, so an imperfect stem still matches as long as it is consistent.
 */
export function stem(token) {
  let stemmed = token;

  for (const suffix of suffixes) {
    if (stemmed.endsWith(suffix) && stemmed.length - suffix.length >= MIN_STEM_LENGTH) {
      stemmed = stemmed.slice(0, -suffix.length);
      break;
    }
  }

  for (const prefix of prefixes) {
    if (stemmed.startsWith(prefix) && stemmed.length - prefix.length >= MIN_STEM_LENGTH) {
      stemmed = stemmed.slice(prefix.length);
      break;
    }
  }

  return stemmed;
}

/** Kata bermakna dari sebuah teks, sudah dinormalkan dan di-stem. */
export function queryTokens(text) {
  return meaningfulTokens(text);
}

function meaningfulTokens(text) {
  return normalizeForTokens(text)
    .split(" ")
    .filter((token) => token.length > 1 && !stopWords.has(token))
    .map(stem);
}

/**
 * One token set per field. Tokens are deduplicated inside a field so an entry
 * cannot climb the ranking just by repeating the same word across its sample
 * questions — only by matching in more places, or on rarer words.
 */
function fieldTokens(entry) {
  return {
    title: new Set(meaningfulTokens(entry.title)),
    questions: new Set(entry.questions.flatMap((q) => meaningfulTokens(q))),
    category: new Set(meaningfulTokens(entry.category)),
    keywords: new Set(entry.keywords.flatMap((k) => meaningfulTokens(k))),
    keywordPhrases: new Set(entry.keywords.map((k) => normalizeText(k)).filter(Boolean)),
  };
}

/**
 * Inverse document frequency: a word spread across most of the knowledge base
 * ("tugas", "akhir") says little about which entry is meant, while a word
 * confined to one ("sidang", "yudisium") is what actually distinguishes it.
 * Without this, a long query drowns its own discriminating term.
 */
function inverseDocumentFrequency(indexed) {
  const documentCount = new Map();

  for (const { fields } of indexed) {
    const seen = new Set();
    for (const field of Object.keys(FIELD_WEIGHTS)) {
      for (const token of fields[field]) seen.add(token);
    }
    for (const token of seen) {
      documentCount.set(token, (documentCount.get(token) ?? 0) + 1);
    }
  }

  const total = indexed.length;
  return (token) => Math.log((total + 1) / ((documentCount.get(token) ?? 0) + 1)) + 1;
}

/** Field token sets and IDF are per knowledge base, so build them once. */
const indexCache = new WeakMap();

function indexOf(entries) {
  const cached = indexCache.get(entries);
  if (cached) return cached;

  const indexed = entries.map((entry) => ({ entry, fields: fieldTokens(entry) }));
  const index = { indexed, idf: inverseDocumentFrequency(indexed) };
  indexCache.set(entries, index);
  return index;
}

function scoreEntry(normalizedQuery, queryTokens, { entry, fields }, idf) {
  let relevance = 0;
  let matchedTokens = 0;

  for (const token of queryTokens) {
    const rarity = idf(token);
    let matched = false;
    for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
      if (fields[field].has(token)) {
        relevance += weight * rarity;
        matched = true;
      }
    }
    if (matched) matchedTokens += 1;
  }

  // A whole keyword phrase appearing verbatim in the question is a strong signal.
  // Synonyms collapse onto each other once normalized ("ta", "skripsi" and
  // "tugas akhir" are all one phrase), so count each distinct phrase once
  // rather than paying an entry for listing the same concept several ways.
  for (const normalizedKeyword of fields.keywordPhrases) {
    if (normalizedQuery.includes(normalizedKeyword)) {
      relevance += 8 * idf(normalizedKeyword.split(" ")[0]);
    }
  }

  // Favour an entry that speaks to the whole question over one that matches a
  // single word very strongly: for "sidang skripsi", the entry covering both
  // words beats the one that only knows about the thesis.
  if (queryTokens.length) {
    relevance *= 0.5 + 0.5 * (matchedTokens / queryTokens.length);
  }

  // Matching a sample question outright is decisive, and is not subject to the
  // coverage discount: the whole question was recognised, not part of it.
  let exactness = 0;
  for (const question of entry.questions) {
    const normalizedQuestion = normalizeText(question);
    if (normalizedQuestion === normalizedQuery) exactness += 100;
    if (
      normalizedQuery.length >= 6 &&
      (normalizedQuestion.includes(normalizedQuery) ||
        normalizedQuery.includes(normalizedQuestion))
    ) {
      exactness += 20;
    }
  }

  return relevance + exactness;
}

export function searchKnowledgeBase(query, entries) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return { status: "empty", best: null, alternatives: [] };
  }

  const { indexed, idf } = indexOf(entries);
  const queryTokens = [...new Set(meaningfulTokens(normalizedQuery))];

  const ranked = indexed
    .map((candidate) => ({
      entry: candidate.entry,
      score: scoreEntry(normalizedQuery, queryTokens, candidate, idf),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));

  if (!ranked.length || ranked[0].score < MATCH_THRESHOLD) {
    return { status: "none", best: null, alternatives: [] };
  }

  const best = ranked[0];
  const closeResults = ranked.filter(
    ({ score }) => score >= MATCH_THRESHOLD && score >= best.score * AMBIGUITY_RATIO,
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
