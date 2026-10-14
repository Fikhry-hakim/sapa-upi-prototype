/**
 * Reads the knowledge base out of D1 and rebuilds the exact entry shape the
 * retrieval and answer code already expects, so moving the content out of the
 * repo changed where topics live without changing how they are used.
 */

const LIST_FIELDS = {
  question: "questions",
  keyword: "keywords",
  point: "points",
  follow_up: "followUps",
};

/** How long a loaded knowledge base is reused before D1 is read again. */
export const CACHE_TTL_MS = 60_000;

let cache = null;

/** Drops the cached knowledge base. Exported for tests. */
export function clearCache() {
  cache = null;
}

function parseTable(json, entryId) {
  if (!json) return undefined;
  try {
    return JSON.parse(json);
  } catch {
    // A malformed table must not take the whole topic down: the answer text is
    // still correct and useful without it.
    console.warn(`knowledge-store: ignoring unparseable table_json on "${entryId}"`);
    return undefined;
  }
}

/** Joins the entry rows and their ordered list rows into knowledge base entries. */
export function assembleEntries(entryRows, listRows) {
  const byId = new Map();

  for (const row of entryRows) {
    const entry = {
      id: row.id,
      category: row.category,
      title: row.title,
      questions: [],
      followUps: [],
      keywords: [],
      lead: row.lead,
      points: [],
      closing: row.closing,
      answer: row.answer,
      sourceTitle: row.source_title,
      sourceOwner: row.source_owner,
      validPeriod: row.valid_period,
      updatedAt: row.updated_at,
      sourceRef: row.source_ref,
      escalation: row.escalation,
    };

    const table = parseTable(row.table_json, row.id);
    if (table) entry.table = table;

    byId.set(row.id, entry);
  }

  // Rows arrive ordered by position, so pushing preserves the authored order.
  for (const row of listRows) {
    const field = LIST_FIELDS[row.kind];
    const entry = byId.get(row.entry_id);
    if (field && entry) entry[field].push(row.value);
  }

  return [...byId.values()];
}

async function readFromD1(db) {
  const [entryRows, listRows] = await Promise.all([
    db.prepare("SELECT * FROM entries WHERE active = 1 ORDER BY id").all(),
    db
      .prepare(
        `SELECT l.entry_id, l.kind, l.value
           FROM entry_lists l
           JOIN entries e ON e.id = l.entry_id
          WHERE e.active = 1
          ORDER BY l.entry_id, l.kind, l.position`,
      )
      .all(),
  ]);

  return assembleEntries(entryRows.results ?? [], listRows.results ?? []);
}

/**
 * The knowledge base to answer from.
 *
 * D1 is the source of truth, but a database that is missing, empty or
 * unreachable must not take the assistant down: it falls back to the copy
 * bundled with the Worker, which is the same content as of the last deploy.
 */
export async function loadKnowledgeBase(db, bundled, now = Date.now) {
  if (cache && now() - cache.loadedAt < CACHE_TTL_MS) return cache.value;

  let entries = null;

  if (db) {
    try {
      const fromD1 = await readFromD1(db);
      if (fromD1.length) entries = fromD1;
      else console.warn("knowledge-store: D1 holds no active entries, using the bundled copy");
    } catch (error) {
      console.warn("knowledge-store: D1 read failed, using the bundled copy —", error.message);
    }
  }

  const value = entries ?? bundled;
  cache = { value, loadedAt: now() };
  return value;
}
