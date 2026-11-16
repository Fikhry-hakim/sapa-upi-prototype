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
  const history = [{ q: "pengajuan cuti sampai kapan", a: "Batasnya 16 November 2026." }];
  const input = buildInput("berarti aku ikut yang mana?", [se48, se68], "id", history);
  assert.match(input, /RIWAYAT PERCAKAPAN/);
  assert.match(input, /Mahasiswa: pengajuan cuti sampai kapan\nSAPA: Batasnya 16 November 2026\./);
  assert.ok(input.indexOf("RIWAYAT PERCAKAPAN") < input.indexOf("PERTANYAAN MAHASISWA"));
  assert.ok(!/RIWAYAT PERCAKAPAN/.test(buildInput("x", [se48], "id")));
});

test("the older document on the same matter is listed even when the answer never cites its number", () => {
  const set = sourceSet([se68, byId("ttg-pengajuan"), se48], "Batasnya 16 November 2026.", "pengajuan cuti sem ganjil sampai kapan");
  assert.deepEqual(set.map((item) => item.entry.id), ["cuti-akademik-batas", "ukt-pembayaran-ganjil"]);
  assert.equal(set[0].newest, true);
});

test("an unrelated context entry is not pulled in just because it was retrieved", () => {
  const set = sourceSet([se68, byId("ttg-pengajuan")], "Batasnya 16 November 2026.", "pengajuan cuti sem ganjil sampai kapan");
  assert.equal(set.length, 1);
});

test("the calendar, the earlier circular and the newer circular all show for a cuti question, newest in force", () => {
  const calendar = byId("kalender-cuti-akademik");
  const set = sourceSet([calendar, se68, se48], "Kalender menyebut 27 Juli–21 Agustus.", "pengajuan cuti sem ganjil di kalender akademik kok berbeda");
  assert.deepEqual(set.map((item) => item.entry.id), ["cuti-akademik-batas", "ukt-pembayaran-ganjil", "kalender-cuti-akademik"]);
  assert.equal(set[0].newest, true);
  assert.equal(set[2].citation.page, 5);
});

test("one generic shared word is not enough to count as the same matter", () => {
  const calendar = byId("kalender-cuti-akademik");
  const set = sourceSet([calendar, se68, byId("ttg-pengajuan")], "Batasnya 16 November 2026.", "pengajuan cuti sem ganjil sampai kapan untuk tahun ini");
  assert.ok(!set.some((item) => item.entry.id === "ttg-pengajuan"), "a TTG page is not a source for a cuti question");
  assert.ok(set.some((item) => item.entry.id === "cuti-akademik-batas"));
});

test("a payment question is not turned into a cuti comparison just because both topics mention UKT", () => {
  const set = sourceSet([se48, se68], "Pembayaran 9 Juni sampai 17 Juli 2026.", "kapan batas pembayaran ukt");
  assert.deepEqual(set.map((item) => item.entry.id), ["ukt-pembayaran-ganjil"]);
});

test("an answer that names a document by its title instead of its number still lists it", () => {
  const answer = "Menurut Surat Edaran Batas Akhir Pengajuan Cuti Akademik Semester Ganjil 2026/2027, batasnya 16 November.";
  assert.ok(mentions(answer, se68));
});
