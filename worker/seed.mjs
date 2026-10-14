/**
 * Generates the SQL that loads data/knowledge-base.js into D1.
 *
 *   node worker/seed.mjs > worker/seed.sql
 *
 * The bundled file stays the seed and the browser's offline snapshot; D1 is
 * what the Worker answers from. Re-running replaces every seeded row, so
 * editing the JS file and re-seeding is safe — but it also overwrites topics
 * added directly in D1, so only do that while D1 has no hand-added entries.
 */

import { knowledgeBase } from "../data/knowledge-base.js";

const quote = (value) =>
  value === null || value === undefined ? "NULL" : `'${String(value).replace(/'/g, "''")}'`;

const listKinds = [
  ["question", "questions"],
  ["keyword", "keywords"],
  ["point", "points"],
  ["follow_up", "followUps"],
];

// D1 runs a --file batch atomically itself and rejects explicit BEGIN/COMMIT.
const lines = [];

for (const entry of knowledgeBase) {
  lines.push(
    "",
    `DELETE FROM entry_lists WHERE entry_id = ${quote(entry.id)};`,
    `DELETE FROM entries WHERE id = ${quote(entry.id)};`,
    "INSERT INTO entries (id, category, title, answer, lead, closing, source_title, source_owner, valid_period, updated_at, source_ref, escalation, table_json) VALUES (",
    "  " +
      [
        entry.id,
        entry.category,
        entry.title,
        entry.answer,
        entry.lead,
        entry.closing,
        entry.sourceTitle,
        entry.sourceOwner,
        entry.validPeriod,
        entry.updatedAt,
        entry.sourceRef,
        entry.escalation,
      ]
        .map(quote)
        .join(", ") +
      ", " +
      (entry.table ? quote(JSON.stringify(entry.table)) : "NULL"),
    ");",
  );

  for (const [kind, field] of listKinds) {
    (entry[field] ?? []).forEach((value, index) => {
      lines.push(
        `INSERT INTO entry_lists (entry_id, kind, position, value) VALUES (${quote(entry.id)}, '${kind}', ${index}, ${quote(value)});`,
      );
    });
  }
}

console.log(lines.join("\n"));
