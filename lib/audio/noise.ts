import type { Rng } from "./rng";

export type NoiseKind = "white" | "pink" | "brown";

const TARGET_RMS = 0.25;
const LOOP_FADE_SECONDS = 0.25;

// Raw noise samples. Pink uses Paul Kellet's economy filter, brown is a leaky
// integrator of white noise. Every kind is normalised to the same RMS, so the
// filter chains downstream behave predictably whichever noise they get.
export function generateNoise(kind: NoiseKind, length: number, rng: Rng): Float32Array {
  const out = new Float32Array(length);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = rng() * 2 - 1;
    if (kind === "white") {
      out[i] = white;
    } else if (kind === "pink") {
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      out[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
    } else {
      last = (last + 0.02 * white) / 1.02;
      out[i] = last;
    }
  }
  return normalise(out, TARGET_RMS);
}

export function normalise(data: Float32Array, targetRms: number): Float32Array {
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
  const rms = Math.sqrt(sum / Math.max(1, data.length));
  if (rms === 0) return data;
  const k = targetRms / rms;
  for (let i = 0; i < data.length; i++) data[i] *= k;
  return data;
}

// A buffer that loops without a click. `raw` carries `fade` extra samples past
// the loop end; the start of the loop is cross-faded (equal power) with that
// tail, so the last sample flows into the first as if the noise never ended.
export function makeLoopable(raw: Float32Array, fade: number): Float32Array {
  const n = raw.length - fade;
  if (n <= fade || fade <= 0) return raw;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = raw[i];
  for (let i = 0; i < fade; i++) {
    const w = (i / fade) * (Math.PI / 2);
    out[i] = raw[i] * Math.sin(w) + raw[n + i] * Math.cos(w);
  }
  return out;
}

export function makeNoiseBuffer(ctx: BaseAudioContext, kind: NoiseKind, seconds: number, rng: Rng): AudioBuffer {
  const fade = Math.floor(ctx.sampleRate * LOOP_FADE_SECONDS);
  const n = Math.floor(ctx.sampleRate * seconds);
  const data = makeLoopable(generateNoise(kind, n + fade, rng), fade);
  const buffer = ctx.createBuffer(1, data.length, ctx.sampleRate);
  buffer.getChannelData(0).set(data);
  return buffer;
}
