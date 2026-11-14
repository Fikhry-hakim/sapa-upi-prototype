import test from "node:test";
import assert from "node:assert/strict";

import { downsample, encodeWav, TARGET_RATE } from "../lib/recorder.js";
import { audioProblem, MAX_AUDIO_BYTES, MIN_AUDIO_BYTES, toBase64, whisperLanguage } from "../worker/src/transcribe.js";

test("downsampling keeps the duration and averages neighbouring samples", () => {
  const out = downsample(new Float32Array([0, 1, 0, 1, 0, 1]), 48_000, 16_000);
  assert.equal(out.length, 2);
  assert.ok(out.every((v) => Math.abs(v - 1 / 3) < 0.4));
  const same = new Float32Array([0.1, 0.2]);
  assert.equal(downsample(same, 16_000, 16_000), same, "nothing to do at the target rate");
});

test("encodeWav writes a valid 16-bit mono PCM header and clamps overloud samples", () => {
  const wav = encodeWav(new Float32Array([0, 0.5, -0.5, 2, -2]), TARGET_RATE);
  const view = new DataView(wav.buffer);
  const tag = (o) => String.fromCharCode(...wav.subarray(o, o + 4));
  assert.equal(tag(0), "RIFF");
  assert.equal(tag(8), "WAVE");
  assert.equal(tag(12), "fmt ");
  assert.equal(view.getUint16(20, true), 1, "PCM");
  assert.equal(view.getUint16(22, true), 1, "mono");
  assert.equal(view.getUint32(24, true), TARGET_RATE);
  assert.equal(view.getUint16(34, true), 16);
  assert.equal(tag(36), "data");
  assert.equal(view.getUint32(40, true), 10);
  assert.equal(wav.length, 44 + 10);
  assert.equal(view.getInt16(44 + 6, true), 32767, "clamped high");
  assert.equal(view.getInt16(44 + 8, true), -32768, "clamped low");
});

test("the server refuses recordings that are not a sensible WAV", () => {
  const wavOf = (size) => {
    const bytes = new Uint8Array(size);
    bytes.set([...("RIFF")].map((c) => c.charCodeAt(0)), 0);
    bytes.set([...("WAVE")].map((c) => c.charCodeAt(0)), 8);
    return bytes;
  };
  assert.equal(audioProblem(wavOf(MIN_AUDIO_BYTES + 100)), null);
  assert.match(audioProblem(wavOf(100)), /pendek/);
  assert.match(audioProblem(wavOf(MAX_AUDIO_BYTES + 1)), /panjang/);
  assert.match(audioProblem(new Uint8Array(MIN_AUDIO_BYTES + 100)), /Format/);
});

test("base64 of a large buffer matches the platform encoder, and only English switches the language", () => {
  const big = new Uint8Array(200_000).map((_, i) => i % 251);
  assert.equal(toBase64(big), Buffer.from(big).toString("base64"));
  assert.equal(whisperLanguage("en"), "en");
  for (const other of ["id", "fr", undefined, "EN"]) assert.equal(whisperLanguage(other), "id");
});
