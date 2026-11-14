/**
 * Merekam mikrofon sebagai WAV mono 16 kHz untuk dikte lewat server.
 *
 * WAV dipilih karena formatnya tidak bergantung pada codec browser (MediaRecorder
 * menghasilkan webm di Chrome tapi mp4 di Safari) dan bisa dibaca model apa adanya.
 * 30 detik di 16 kHz 16-bit mono = sekitar 0,96 MB.
 */

export const TARGET_RATE = 16_000;
export const MAX_RECORD_MS = 30_000;

/** Turunkan laju sampel dengan merata-ratakan sampel yang jatuh pada satu langkah keluaran. */
export function downsample(samples, fromRate, toRate = TARGET_RATE) {
  if (toRate >= fromRate) return samples;
  const ratio = fromRate / toRate;
  const length = Math.floor(samples.length / ratio);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(samples.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j += 1) sum += samples[j];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

/** Bungkus sampel Float32 (-1..1) menjadi berkas WAV PCM 16-bit mono. */
export function encodeWav(samples, sampleRate = TARGET_RATE) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const text = (offset, value) => [...value].forEach((ch, i) => view.setUint8(offset + i, ch.charCodeAt(0)));
  text(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }
  return new Uint8Array(buffer);
}

/**
 * Mulai merekam. `stop()` mengembalikan WAV (Uint8Array), `cancel()` membuang rekaman.
 * Menolak dengan galat bernama NotAllowedError / NotFoundError kalau mikrofon tidak bisa dipakai.
 */
export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
  });
  const Context = window.AudioContext || window.webkitAudioContext;
  const context = new Context();
  const source = context.createMediaStreamSource(stream);
  const processor = context.createScriptProcessor(4096, 1, 1);
  const mute = context.createGain();
  mute.gain.value = 0; // prosesor hanya berjalan kalau tersambung ke keluaran; jangan diputar ke speaker
  const chunks = [];
  let peak = 0;
  processor.onaudioprocess = (event) => {
    const data = new Float32Array(event.inputBuffer.getChannelData(0));
    for (const value of data) peak = Math.max(peak, Math.abs(value));
    chunks.push(data);
  };
  source.connect(processor);
  processor.connect(mute);
  mute.connect(context.destination);

  const release = () => {
    processor.disconnect();
    source.disconnect();
    for (const track of stream.getTracks()) track.stop();
    return context.close().catch(() => {});
  };

  return {
    /** Puncak amplitudo sejauh ini (0..1); hampir nol berarti mikrofon senyap. */
    level: () => peak,
    async stop() {
      const rate = context.sampleRate;
      await release();
      const total = chunks.reduce((n, c) => n + c.length, 0);
      const merged = new Float32Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      return { wav: encodeWav(downsample(merged, rate)), peak };
    },
    cancel: release,
  };
}
