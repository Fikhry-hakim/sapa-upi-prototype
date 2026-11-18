import test from "node:test";
import assert from "node:assert/strict";
import { SUGGEST_CHARS_PER_PAGE, SUGGEST_PAGES, buildSuggestInput, parseSuggestion, suggestDocumentFields } from "../worker/src/document-suggest.js";
import { CATEGORIES } from "../worker/src/documents.js";

const good = {
  title: "Surat Edaran Laporan MSIB Mandiri",
  category: CATEGORIES[1],
  owner: "Ketua Program Studi Bisnis Digital",
  reference: "Nomor 092 Tahun 2025",
  effectiveDate: "2025-10-20",
  period: "",
  description: "Ketentuan laporan akhir MSIB untuk angkatan 2022.",
};

test("a model answer becomes form fields, even when wrapped in a code fence", () => {
  const result = parseSuggestion("```json\n" + JSON.stringify(good) + "\n```");
  assert.deepEqual(result, good);
});

test("values that are not valid are blanked instead of trusted", () => {
  const result = parseSuggestion(JSON.stringify({ ...good, category: "Kategori Karangan", effectiveDate: "kemarin" }));
  assert.equal(result.category, "");
  assert.equal(result.effectiveDate, "");
  assert.equal(result.title, good.title);
  assert.equal(parseSuggestion("bukan json"), null);
  assert.equal(parseSuggestion(""), null);
});

test("fields are clipped to the lengths the upload form accepts", () => {
  const result = parseSuggestion(JSON.stringify({ ...good, title: "x".repeat(500), description: "y".repeat(2000) }));
  assert.equal(result.title.length, 160);
  assert.equal(result.description.length, 500);
});

test("only the first pages are sent, trimmed, with the category list", () => {
  const passages = Array.from({ length: 10 }, (_, i) => ({ page: i + 1, text: "kata ".repeat(2000) }));
  const input = buildSuggestInput({ fileName: "edaran.pdf", passages });
  assert.ok(input.includes(`"${CATEGORIES[0]}"`));
  assert.ok(input.includes("Nama berkas: edaran.pdf"));
  assert.equal((input.match(/--- Halaman/g) ?? []).length, SUGGEST_PAGES);
  assert.ok(input.length < SUGGEST_PAGES * (SUGGEST_CHARS_PER_PAGE + 40) + 800);
});

test("the model is called with the key and text only, and a failure is reported, not hidden", async () => {
  let seen;
  const ok = async (url, options) => {
    seen = { url, options };
    return new Response(JSON.stringify({ steps: [{ type: "model_output", content: [{ type: "text", text: JSON.stringify(good) }] }] }));
  };
  const passages = [{ page: 1, text: "SURAT EDARAN NOMOR 092 TAHUN 2025 tentang laporan MSIB mandiri." }];
  const result = await suggestDocumentFields({ fileName: "a.pdf", passages, apiKey: "k", model: "gemini-3.5-flash-lite", fetchImpl: ok });
  assert.equal(result.title, good.title);
  assert.equal(seen.options.headers["x-goog-api-key"], "k");

  await assert.rejects(
    suggestDocumentFields({ fileName: "a.pdf", passages, apiKey: "k", model: "m", fetchImpl: async () => new Response("x", { status: 500 }) }),
    /Gemini 500/,
  );
  // Berkas pindai tanpa teks tidak memanggil model sama sekali.
  let called = false;
  const none = await suggestDocumentFields({ fileName: "a.pdf", passages: [{ page: 1, text: "  " }], apiKey: "k", model: "m", fetchImpl: async () => ((called = true), new Response("{}")) });
  assert.equal(none, null);
  assert.equal(called, false);
});
