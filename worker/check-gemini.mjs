/**
 * Diagnostik koneksi Gemini, dijalankan di komputermu dengan kuncimu sendiri:
 *
 *   GEMINI_API_KEY=xxxx node worker/check-gemini.mjs
 *   GEMINI_API_KEY=xxxx GEMINI_MODEL=gemini-3.5-flash-lite node worker/check-gemini.mjs
 *
 * Kunci hanya dikirim ke generativelanguage.googleapis.com dan tidak dicetak.
 * Yang diperiksa: apakah kunci sah, model apa saja yang tersedia untuknya, dan
 * berapa lama sebuah permintaan kecil dijawab lewat Interactions API (yang dipakai
 * SAPA) dibandingkan generateContent biasa. Hasilnya menunjukkan apakah masalahnya
 * kunci, kuota, nama model, atau memang lambat di sisi Google.
 *
 * Catatan: ini berjalan dari jaringanmu, bukan dari Cloudflare. Kalau di sini cepat
 * tetapi di Worker lambat, penyebabnya ada di jalur Cloudflare ke Google.
 */

const key = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const base = "https://generativelanguage.googleapis.com/v1beta";

if (!key) {
  console.error("Isi GEMINI_API_KEY dulu, mis.: GEMINI_API_KEY=xxxx node worker/check-gemini.mjs");
  process.exit(1);
}

const headers = { "x-goog-api-key": key, "content-type": "application/json" };
const short = (text, n = 260) => String(text).replace(/\s+/g, " ").slice(0, n);

async function timed(label, run) {
  const started = Date.now();
  try {
    const response = await run();
    const body = await response.text();
    const ms = Date.now() - started;
    console.log(`\n[${response.ok ? "OK " : "GAGAL"}] ${label}`);
    console.log(`  status ${response.status} • ${ms} ms`);
    const retry = response.headers.get("retry-after");
    if (retry) console.log(`  retry-after: ${retry}`);
    return { response, body, ms };
  } catch (error) {
    console.log(`\n[GAGAL] ${label}`);
    console.log(`  ${short(error.message)} • ${Date.now() - started} ms`);
    return null;
  }
}

const post = (url, payload, ms = 60_000) =>
  fetch(url, { method: "POST", headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(ms) });

console.log(`Model yang diuji: ${model}`);

// 1. Kunci sah? Model apa yang ada?
const list = await timed("Daftar model (menguji kunci)", () => fetch(`${base}/models?pageSize=200`, { headers, signal: AbortSignal.timeout(20_000) }));
if (list?.response.ok) {
  const names = (JSON.parse(list.body).models ?? []).map((m) => m.name.replace("models/", ""));
  const flash = names.filter((n) => /flash|lite/i.test(n));
  console.log(`  ${names.length} model tersedia. Yang bertipe flash/lite:`);
  for (const name of flash) console.log(`    - ${name}${name === model ? "   <-- model SAPA" : ""}`);
  if (!names.includes(model)) console.log(`  ! "${model}" TIDAK ada di daftar ini: ganti GEMINI_MODEL di worker/wrangler.toml.`);
} else if (list) {
  console.log(`  ${short(list.body)}`);
  console.log("  Kunci kemungkinan salah, dicabut, atau dibatasi. Periksa di Google AI Studio.");
}

// 2. Permintaan kecil lewat Interactions API, seperti yang dipakai SAPA.
const input = "Jawab satu kata saja: halo";
for (const [label, config] of [
  ["Interactions API, tanpa thinking", { seed: 1 }],
  ["Interactions API, thinking_level=low", { seed: 1, thinking_level: "low" }],
]) {
  const result = await timed(label, () => post(`${base}/interactions`, { model, input, generation_config: config }));
  if (result && !result.response.ok) console.log(`  ${short(result.body)}`);
}

// 3. Pembanding: endpoint generateContent biasa.
const classic = await timed("generateContent biasa (pembanding)", () =>
  post(`${base}/models/${model}:generateContent`, { contents: [{ parts: [{ text: input }] }] }),
);
if (classic && !classic.response.ok) console.log(`  ${short(classic.body)}`);

// 4. Beberapa permintaan beruntun: kuota per menit atau lonjakan latensi?
console.log("\n--- 5 permintaan beruntun (Interactions API) ---");
const times = [];
for (let i = 1; i <= 5; i += 1) {
  const started = Date.now();
  try {
    const response = await post(`${base}/interactions`, { model, input, generation_config: { seed: 1 } }, 30_000);
    times.push(`${response.status}/${Date.now() - started}ms`);
  } catch (error) {
    times.push(`timeout/${Date.now() - started}ms`);
  }
}
console.log(`  ${times.join("  ")}`);

console.log(`
Cara membaca hasilnya:
  - Daftar model gagal (401/403)       -> kunci bermasalah, bukan modelnya.
  - Model SAPA tidak ada di daftar      -> ganti nama model.
  - 429 atau retry-after                -> kuota/rate limit; cek penagihan di AI Studio.
  - Interactions lambat, generateContent cepat -> masalah di endpoint Interactions (beta).
  - Semua cepat di sini tapi timeout di Worker -> masalah jalur Cloudflare ke Google.
  - Semua lambat (belasan detik)        -> model sedang padat; pertimbangkan model lain/berbayar.`);
