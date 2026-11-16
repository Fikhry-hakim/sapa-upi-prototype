import assert from "node:assert/strict";
import test from "node:test";
import { knowledgeBase } from "../data/knowledge-base.js";
import { mentions, parseIdDate, sourceSet } from "../lib/source-set.js";
import { buildInput } from "../worker/src/gemini.js";

const byId = (id) => knowledgeBase.find((entry) => entry.id === id);
const se48 = byId("ukt-pembayaran-ganjil");
const se68 = byId("cuti-akademik-batas");

test("Indonesian dates are parsed, partial ones too, and junk is not guessed", () => {
  assert.ok(parseIdDate("26 Agustus 2026") > parseIdDate("21 Mei 2026"));
  assert.ok(parseIdDate("Oktober 2026") > parseIdDate("2026"));
  assert.equal(parseIdDate("Tanggal terbit tidak tercantum pada pengumuman"), null);
});

test("a document is recognised by the number the answer cites", () => {
  assert.ok(mentions("Berdasarkan Surat Edaran Nomor 48 Tahun 2026, cuti dibuka.", se48));
  assert.ok(!mentions("Berdasarkan Surat Edaran Nomor 48 Tahun 2026, cuti dibuka.", se68));
  assert.ok(mentions("Menurut Surat Edaran Nomor 68 Tahun 2026 ...", se68));
});

test("two documents on the same matter are both shown, newest first and marked as the one in force", () => {
  const answer = "Menurut Surat Edaran Nomor 48 Tahun 2026 ... sedangkan Surat Edaran Nomor 68 Tahun 2026 ...";
  const set = sourceSet([se48, se68], answer);
  assert.deepEqual(set.map((item) => item.entry.id), ["cuti-akademik-batas", "ukt-pembayaran-ganjil"]);
  assert.deepEqual(set.map((item) => item.newest), [true, false]);
});

test("a context entry the answer never cites is not listed as a source", () => {
  const set = sourceSet([se68, se48], "Menurut Surat Edaran Nomor 68 Tahun 2026 batasnya 16 November 2026.");
  assert.equal(set.length, 1);
  assert.equal(set[0].newest, false, "nothing to compare against, so nothing is flagged as newer");
});

test("the top entry is always a source, even when the answer does not quote its number", () => {
  assert.equal(sourceSet([se48], "Pembayaran dibuka sampai 17 Juli.").length, 1);
});

test("a follow-up carries the earlier question to the model", () => {
  const input = buildInput("berarti aku ikut yang mana?", [se48, se68], "id", "pengajuan cuti sampai kapan");
  assert.match(input, /PERTANYAAN SEBELUMNYA[^\n]*: pengajuan cuti sampai kapan/);
  assert.ok(input.indexOf("PERTANYAAN SEBELUMNYA") < input.indexOf("PERTANYAAN MAHASISWA"));
  assert.ok(!/PERTANYAAN SEBELUMNYA/.test(buildInput("x", [se48], "id")));
});
