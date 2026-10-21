import assert from "node:assert/strict";
import test from "node:test";

import { expandAbbreviations, GLOSSARY, glossaryContext } from "../lib/glossary.js";

test("the abbreviation is added when only the long form is present, and vice versa", () => {
  assert.equal(expandAbbreviations("dospem saya siapa"), "dospem saya siapa dosen pembimbing");
  assert.equal(expandAbbreviations("surat keputusan pembimbing"), "surat keputusan pembimbing sk");
  assert.equal(expandAbbreviations("sk pembimbing"), "sk pembimbing surat keputusan");
});

test("nothing is added when neither form is present, or when both already are", () => {
  assert.equal(expandAbbreviations("jadwal ujian sidang"), "jadwal ujian sidang");
  assert.equal(expandAbbreviations("sk surat keputusan pembimbing"), "sk surat keputusan pembimbing");
});

test("matching is whole-word: a word that merely contains an abbreviation does not trigger it", () => {
  // "pada" contains "pa", but is not the abbreviation "pa" (pembimbing akademik).
  assert.equal(expandAbbreviations("nilai pada transkrip"), "nilai pada transkrip");
});

test("an abbreviation marked expandSearch: false is never expanded, even though it has no full form to add", () => {
  const sias = GLOSSARY.find((item) => item.abbr === "sias");
  assert.equal(sias.expandSearch, false);
  assert.equal(sias.full, undefined, "its expansion is not confirmed by any document, so none is guessed");
  assert.equal(expandAbbreviations("cara akses sias"), "cara akses sias", "unchanged: not a search-expansion entry");
});

test("every entry states where its expansion comes from, and none is left unconfirmed under a guessed full form", () => {
  for (const item of GLOSSARY) {
    assert.ok(["dokumen", "umum"].includes(item.source), `${item.abbr} must declare its source`);
    assert.ok(item.note, `${item.abbr} needs a note for the Gemini glossary context`);
  }
});

test("the Gemini glossary context lists every noted term, and omits terms the search expansion skips", () => {
  const context = glossaryContext();
  assert.match(context, /GLOSARIUM ISTILAH/);
  assert.match(context, /LOA = letter of acceptance/i);
  assert.match(context, /TTG = teknologi tepat guna/i);
  // SIAS has no confirmed full form: listed by itself, not expanded into a guess.
  assert.match(context, /- SIAS: /);
  assert.ok(!/SIAS = /.test(context), "no invented expansion for an unconfirmed acronym");
});
