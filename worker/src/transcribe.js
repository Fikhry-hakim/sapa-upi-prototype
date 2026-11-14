/**
 * Dikte suara lewat server: audio WAV dari browser -> teks (Whisper di Workers AI).
 *
 * Dipakai ketika dikte bawaan browser tidak bisa (browser berbasis Electron, Firefox,
 * Safari, atau layanan suara Google tidak terjangkau). Audio hanya diteruskan ke model
 * dan langsung dibuang: tidak disimpan, tidak dicatat, tidak dikaitkan dengan akun.
 */

import { clientKey, hit } from "./rate-limit.js";

export const WHISPER_MODEL = "@cf/openai/whisper-large-v3-turbo";
/** ~45 detik WAV mono 16 kHz 16-bit = 1,4 MB. */
export const MAX_AUDIO_BYTES = 1_600_000;
/** Di bawah ini praktis hanya senyap atau klik. */
export const MIN_AUDIO_BYTES = 6_000;
export const MAX_TEXT_LENGTH = 300;
const PER_MINUTE = 10;

/** Base64 per potongan: String.fromCharCode(...besar) melebihi batas argumen. */
export function toBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Bahasa yang diizinkan; selain "en" selalu Indonesia. */
export function whisperLanguage(lang) {
  return lang === "en" ? "en" : "id";
}

/** Berkas WAV yang sah: header RIFF/WAVE dan ukuran dalam batas. Mengembalikan pesan salah atau null. */
export function audioProblem(bytes) {
  if (bytes.length < MIN_AUDIO_BYTES) return "Rekaman terlalu pendek.";
  if (bytes.length > MAX_AUDIO_BYTES) return "Rekaman terlalu panjang.";
  const tag = (offset) => String.fromCharCode(...bytes.subarray(offset, offset + 4));
  if (tag(0) !== "RIFF" || tag(8) !== "WAVE") return "Format rekaman tidak dikenali.";
  return null;
}

export async function handleTranscribe(request, env, cors, json) {
  if (!env.AI?.run) return json({ error: "Transkripsi belum tersedia" }, { status: 503, headers: cors });

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_AUDIO_BYTES) return json({ error: "Rekaman terlalu panjang." }, { status: 413, headers: cors });

  const limited = await hit(env.sapa_upi_kb, `stt:${await clientKey(request)}`, { limit: PER_MINUTE, windowMs: 60_000 });
  if (!limited.allowed) {
    return json(
      { error: "Terlalu banyak rekaman. Coba lagi sebentar." },
      { status: 429, headers: { ...cors, "Retry-After": String(limited.retryAfter) } },
    );
  }

  const bytes = new Uint8Array(await request.arrayBuffer());
  const problem = audioProblem(bytes);
  if (problem) return json({ error: problem }, { status: 400, headers: cors });

  const language = whisperLanguage(new URL(request.url).searchParams.get("lang"));
  try {
    const result = await env.AI.run(WHISPER_MODEL, { audio: toBase64(bytes), language });
    const text = String(result?.text ?? "").trim().slice(0, MAX_TEXT_LENGTH);
    return json({ text }, { headers: cors });
  } catch (error) {
    console.warn("transcribe:", String(error).slice(0, 200));
    return json({ error: "Transkripsi gagal. Coba lagi." }, { status: 503, headers: cors });
  }
}
