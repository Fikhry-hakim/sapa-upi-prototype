import { glossaryContext } from "../../lib/glossary.js";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";

export const SYSTEM_INSTRUCTION = `Kamu adalah SAPA UPI, asisten akademik untuk mahasiswa dan dosen Universitas Pendidikan Indonesia.

ATURAN ISI YANG WAJIB DIPATUHI:
1. Jawab HANYA berdasarkan "KONTEKS PEDOMAN" yang diberikan. Jangan memakai pengetahuan di luar itu.
2. Kalau konteksnya tidak menjawab pertanyaan, katakan terus terang bahwa kamu belum menemukan informasinya di dokumen yang tersedia, lalu sarankan menghubungi tenaga administrasi program studi. Kalau ada informasi yang masih berkaitan, sebutkan itu lebih dulu. Jangan mengarang.
3. Jangan pernah mengarang angka, tanggal, nomor SK, nominal biaya, atau tenggat waktu. Kalau angkanya tidak ada di konteks, bilang belum tersedia.
4. Kalau mahasiswa menanyakan sesuatu yang terdengar seperti keputusan final (kelulusan, nilai, kelayakan sidang), ingatkan bahwa keputusan resmi tetap ada pada program studi dan sarankan memastikannya ke tenaga administrasi.
5. Jangan menyebut jawabanmu sebagai "data contoh". Konteks berasal dari dokumen resmi yang disebutkan pada sumbernya.
6. Kalau konteks memuat dua ketentuan yang berbeda untuk hal yang sama, sebutkan keduanya beserta dokumen asalnya, jangan memilih salah satu.
7. Kalau menjelaskan sebuah singkatan, pakai kepanjangan dari "GLOSARIUM ISTILAH" di bawah kalau ada. Kalau singkatannya tidak ada di glosarium maupun di KONTEKS PEDOMAN, bilang kamu tidak tahu kepanjangannya. Jangan pernah menebak kepanjangan singkatan.
8. Kalau pertanyaannya diawali "Jelaskan lebih detail poin" lalu mengutip sebuah kalimat, mulailah langsung dengan menjelaskan maksud kalimat itu memakai kata yang lebih sederhana dan isi konteks, tanpa diawali permintaan maaf. Beri contoh kalau konteksnya memuat contoh. Hanya kalau konteks sama sekali tidak punya tambahan, tutup dengan satu kalimat bahwa informasi di dokumen hanya sebatas itu dan sarankan menghubungi tenaga administrasi program studi. Jangan menjawab bahwa kamu "tidak punya rujukan" untuk kalimat itu.
9. Kalau pertanyaannya apakah sebuah dokumen ada atau tersedia, dan dokumen itu muncul pada "Sumber:" di konteks, jawab bahwa dokumennya ada dan bisa dibuka lewat kartu sumber di bawah jawaban, lalu sebut isinya secara singkat. Jangan mengatakan dokumen itu tidak ada kalau ia tercantum sebagai sumber.

GAYA BAHASA:
- Pakai Bahasa Indonesia sehari-hari yang sopan dan hangat, seperti staf prodi yang ramah. Panggil penanya "kamu" dan sebut dirimu "saya".
- Kalimat pendek, satu gagasan per kalimat. Jangan pakai heading, huruf tebal, atau tabel.
- Hindari istilah teknis atau birokratis. Jangan memakai kata "rujukan", "konteks", "terindeks", atau "basis data"; pakai "dokumen", "informasi", atau "sumber".
- Jangan menyapa ulang atau menulis pembuka basa-basi. Langsung ke jawabannya, dan sebut hal yang paling penting lebih dulu.
- Kalau menyebut dokumen, sebut judulnya satu kali saja.

KERANGKA JAWABAN (supaya enak dibaca):
Susun jawaban dalam tiga bagian, dipisah satu baris kosong. Setiap baris di luar daftar HANYA satu kalimat. Daftar ditulis satu butir per baris, diawali "- " (atau "1. ", "2. " kalau urutannya penting), maksimal 6 butir, tiap butir satu kalimat atau frasa pendek yang diawali huruf kapital.
  [Baris 1] Jawaban langsung untuk pertanyaannya, satu kalimat.
  [Daftar]  Rincian: syarat, langkah, atau angka penting dari dokumen. Lewati bagian ini kalau jawabannya cukup satu kalimat.
  [Baris akhir] Opsional, satu kalimat. Tulis HANYA kalau dokumen menyebut langkah berikutnya (mendaftar lewat mana, batas waktu) atau ada hal yang perlu dikonfirmasi (dua ketentuan berbeda, keputusan final, informasi tidak ada). Jangan menutup jawaban yang sudah jelas dengan saran umum "hubungi tenaga administrasi": kontak program studi sudah ditampilkan terpisah di bawah jawabanmu.
Sesuaikan menurut jenis pertanyaan:
- Syarat atau daftar: kalimat pembuka, lalu satu syarat per butir dengan angka persis seperti di dokumen, lalu penutup kalau ada langkah berikutnya.
- Cara atau prosedur: kalimat pembuka, lalu langkah bernomor berurutan, lalu penutup kalau dokumen menyebut tempat atau kontak untuk bertanya.
- Pertanyaan "apakah": cukup satu baris, dimulai dengan "Ya," atau "Tidak," atau "Belum ada informasinya," lalu alasannya dalam kalimat yang sama. Tanpa daftar. Kalau yang ditanyakan adalah ada tidaknya sebuah dokumen dan dokumen itu tercantum sebagai sumber, tulis "Ya, dokumennya ada dan bisa dibuka lewat kartu sumber di bawah jawaban," lalu sebut isinya dalam beberapa kata.
- Angka, tanggal, atau batas: baris 1 berisi angkanya dan dokumen asalnya, tanpa daftar. Daftar hanya kalau ada dua ketentuan berbeda: tulis masing-masing satu butir beserta dokumennya, lalu penutup untuk meminta konfirmasi.
- Arti istilah atau singkatan: artinya dalam satu kalimat sederhana, ditambah satu contoh atau kegunaannya dari dokumen kalau ada. Tanpa daftar dan tanpa penutup.
- Informasinya tidak ada: "Maaf, saya belum menemukan [hal yang ditanya] di dokumen yang tersedia." Kalau ada informasi yang berkaitan, sebut itu dulu, lalu sarankan menghubungi tenaga administrasi program studi.
Jangan mengulang isi baris 1 di dalam daftar. Daftar minimal 2 butir; kalau hanya ada satu rincian, gabungkan ke baris 1 atau tulis sebagai kalimat biasa. Kalau jawabannya cukup satu atau dua kalimat, tulis itu saja tanpa daftar. Jangan menambah butir hanya supaya terlihat lengkap.

${glossaryContext()}`;

export function buildContextBlock(entries) {
  if (!entries.length) return "KONTEKS PEDOMAN: (tidak ada rujukan yang cocok)";

  const blocks = entries.map((entry, index) => {
    const points = entry.points?.length ? `\nRincian: ${entry.points.join(" ")}` : "";
    return [
      `[${index + 1}] ${entry.title} (kategori: ${entry.category})`,
      `Isi: ${entry.answer}${points}`,
      `Sumber: ${entry.sourceTitle} — ${entry.sourceOwner}, berlaku ${entry.validPeriod}, diperbarui ${entry.updatedAt}`,
      `Eskalasi: ${entry.escalation}`,
    ].join("\n");
  });

  return `KONTEKS PEDOMAN:\n${blocks.join("\n\n")}`;
}

export function buildInput(question, entries) {
  return `${buildContextBlock(entries)}\n\nPERTANYAAN MAHASISWA: ${question}`;
}

/**
 * The Interactions API returns a `steps` timeline; model text lives in
 * `model_output` steps as `content[].text`. Thought/tool steps are skipped.
 */
export function extractText(payload) {
  const steps = Array.isArray(payload?.steps) ? payload.steps : [];
  const outputs = steps.filter((step) => step?.type === "model_output");
  const last = outputs[outputs.length - 1];
  if (!last) return "";

  return (Array.isArray(last.content) ? last.content : [])
    .filter((block) => block?.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("")
    .trim();
}

/** Fixed so the same question decodes the same way for every reader. */
export const ANSWER_SEED = 20261014;

export const MAX_ATTEMPTS = 3;
export const RETRY_DELAY_MS = 250;

/** Cap on one call to Gemini. A throttled model can otherwise stall for minutes. */
export const ATTEMPT_TIMEOUT_MS = 12_000;

/** Cap on all attempts together, so retrying never costs more than answering. */
export const TOTAL_BUDGET_MS = 15_000;

/** Percobaan yang tersisa waktunya kurang dari ini tidak layak dimulai. */
export const MIN_ATTEMPT_MS = 3_000;

/**
 * Whether another attempt could plausibly succeed.
 *
 * A Worker has no fixed egress location, so some requests leave from a region
 * Gemini does not serve and come back 400 "User location is not supported"
 * while the next one succeeds. That is worth retrying; a bad request or an
 * exhausted quota is not, and retrying those would only burn quota.
 */
export function isRetryable(status, detail = "") {
  if (status >= 500) return true;
  if (status === 400 && /location is not supported/i.test(detail)) return true;
  return false;
}

/**
 * Pengaturan decoding per model. Tingkat berpikir hanya dikenal model keluarga 3;
 * model lain bisa menolaknya, jadi tidak dikirimkan ke mereka.
 */
export function generationConfigFor(model) {
  const config = { seed: ANSWER_SEED };
  if (/^gemini-3/i.test(String(model))) config.thinking_level = "low";
  return config;
}

export async function askGemini({
  question,
  entries,
  apiKey,
  model,
  fetchImpl = fetch,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = Date.now,
  budgetMs = TOTAL_BUDGET_MS,
}) {
  const startedAt = now();
  const body = JSON.stringify({
    model,
    system_instruction: SYSTEM_INSTRUCTION,
    input: buildInput(question, entries),
    // The same question must not get a differently worded answer depending on
    // who asked it. Nothing about the reader reaches the prompt, and a fixed
    // seed keeps the decoding reproducible too. The provider does not promise
    // this across model updates, so treat it as stability, not a guarantee.
    // Jawaban disusun dari kutipan yang sudah diberikan, jadi tidak perlu berpikir
    // panjang; thinking rendah memangkas waktu tunggu dari belasan detik.
    generation_config: generationConfigFor(model),
  });

  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    // Anggaran total adalah batas keras: percobaan terakhir dipotong ke sisa
    // waktu, dan tidak dimulai sama sekali kalau sisanya terlalu sedikit.
    const remaining = budgetMs - (now() - startedAt);
    if (attempt > 1 && remaining < MIN_ATTEMPT_MS) throw lastError;
    const attemptTimeout = Math.min(ATTEMPT_TIMEOUT_MS, Math.max(remaining, MIN_ATTEMPT_MS));

    let response;
    try {
      response = await fetchImpl(GEMINI_URL, {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "content-type": "application/json",
        },
        body,
        signal: AbortSignal.timeout(attemptTimeout),
      });
    } catch (error) {
      // A timed-out or aborted attempt is worth another go, within the budget.
      lastError = new Error(`Gemini request failed: ${error.message}`);
      if (attempt === MAX_ATTEMPTS || now() - startedAt >= budgetMs) throw lastError;
      await sleep(RETRY_DELAY_MS * attempt);
      continue;
    }

    if (response.ok) {
      const payload = await response.json();
      const text = extractText(payload);
      if (!text) throw new Error("Gemini returned no text");
      return text;
    }

    const detail = await response.text().catch(() => "");
    lastError = new Error(`Gemini ${response.status}: ${detail.slice(0, 300)}`);

    if (
      attempt === MAX_ATTEMPTS ||
      !isRetryable(response.status, detail) ||
      now() - startedAt >= budgetMs
    ) {
      throw lastError;
    }
    await sleep(RETRY_DELAY_MS * attempt);
  }

  throw lastError;
}

/** Bagian anggaran waktu untuk model utama; sisanya untuk model cadangan. */
export const PRIMARY_BUDGET_MS = 9_000;

/**
 * Tanya model utama, dan kalau gagal (timeout, kuota, gangguan), model cadangan.
 *
 * Seluruhnya tetap berada di bawah TOTAL_BUDGET_MS: model utama tidak boleh
 * menghabiskan waktu yang dibutuhkan cadangannya. Mengembalikan teks jawaban
 * beserta model yang menjawab, supaya pergantian model bisa dicatat.
 * Galat 400 selain pembatasan lokasi tidak berpindah model, karena itu berarti
 * permintaannya sendiri yang salah, bukan modelnya yang sedang bermasalah.
 */
export async function askWithFallback({ models, now = Date.now, totalMs = TOTAL_BUDGET_MS, ...options }) {
  const list = [...new Set(models.filter(Boolean))];
  const startedAt = now();
  let lastError;

  for (let i = 0; i < list.length; i += 1) {
    const isLast = i === list.length - 1;
    const elapsed = now() - startedAt;
    const remaining = totalMs - elapsed;
    if (i > 0 && remaining < MIN_ATTEMPT_MS) break;

    // Model utama dibatasi supaya cadangan masih kebagian waktu.
    const budgetMs = isLast ? remaining : Math.min(PRIMARY_BUDGET_MS, remaining);
    try {
      const text = await askGemini({ ...options, model: list[i], now, budgetMs });
      return { text, model: list[i], fellBack: i > 0 };
    } catch (error) {
      lastError = error;
      if (/^Gemini 400:/.test(error.message) && !/location is not supported/i.test(error.message)) throw error;
    }
  }
  throw lastError;
}

/* ------------------------------------------------------------ cadangan: Workers AI */

/** Model cadangan di Workers AI; ringan supaya tetap muat di kuota harian gratis. */
export const WORKERS_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";

/** Waktu untuk cadangan Workers AI setelah Gemini gagal (total tetap 15 detik). */
export const WORKERS_AI_BUDGET_MS = TOTAL_BUDGET_MS - PRIMARY_BUDGET_MS;

/**
 * Jawab lewat Cloudflare Workers AI, yang tidak bergantung pada Google sama
 * sekali: kalau Gemini lambat, kehabisan kuota, atau diblokir per wilayah,
 * cadangan ini tetap bisa menjawab. Instruksi dan konteks yang diberikan sama,
 * jadi aturan "hanya dari kutipan pedoman" berlaku persis seperti pada Gemini.
 */
export async function askWorkersAI({
  question,
  entries,
  ai,
  model = WORKERS_AI_MODEL,
  timeoutMs = WORKERS_AI_BUDGET_MS,
}) {
  if (!ai?.run) throw new Error("Workers AI tidak tersedia");

  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Workers AI timeout")), timeoutMs);
  });

  try {
    const result = await Promise.race([
      ai.run(model, {
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          { role: "user", content: buildInput(question, entries) },
        ],
        max_tokens: 700,
        temperature: 0,
        seed: ANSWER_SEED % 1_000_000, // rentang seed Workers AI lebih sempit dari Gemini
      }),
      timeout,
    ]);
    const text = String(result?.response ?? "").trim();
    if (!text) throw new Error("Workers AI tidak mengembalikan teks");
    return text;
  } finally {
    clearTimeout(timer);
  }
}
