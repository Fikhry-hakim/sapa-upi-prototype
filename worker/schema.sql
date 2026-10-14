-- Knowledge base for SAPA UPI.
--
-- Topics live here rather than in data/knowledge-base.js so the people
-- responsible for the pedoman can add one without a code deploy. The bundled
-- JS file stays as the browser's offline snapshot and as the seed for this
-- table; D1 is the source of truth.

CREATE TABLE IF NOT EXISTS entries (
  id            TEXT PRIMARY KEY,
  category      TEXT NOT NULL,
  title         TEXT NOT NULL,

  -- the answer the model is grounded on, plus the phrasing shown verbatim
  answer        TEXT NOT NULL,
  lead          TEXT NOT NULL,
  closing       TEXT NOT NULL,

  -- provenance; rendered from here, never generated, so a citation stays real.
  -- source_ref carries the real document number or edition, not a guessed URL.
  source_title  TEXT NOT NULL,
  source_owner  TEXT NOT NULL,
  valid_period  TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  source_ref    TEXT NOT NULL,
  escalation    TEXT NOT NULL,

  -- optional rendered table (e.g. sidang requirements), as JSON
  table_json    TEXT,

  -- a superseded pedoman must stop answering without being deleted
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  revised_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- questions, keywords, points and follow-ups are ordered lists on an entry.
-- One table with a kind column keeps the shape in one place; position
-- preserves the order the author wrote them in.
CREATE TABLE IF NOT EXISTS entry_lists (
  entry_id  TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  kind      TEXT NOT NULL CHECK (kind IN ('question', 'keyword', 'point', 'follow_up')),
  position  INTEGER NOT NULL,
  value     TEXT NOT NULL,
  PRIMARY KEY (entry_id, kind, position)
);

CREATE INDEX IF NOT EXISTS entries_active ON entries(active);
CREATE INDEX IF NOT EXISTS entry_lists_entry ON entry_lists(entry_id, kind, position);
