import type { Rng } from "../rng";

// Small helpers shared by the generators.

export function loopSource(ctx: BaseAudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const s = ctx.createBufferSource();
  s.buffer = buffer;
  s.loop = true;
  return s;
}

export function filter(
  ctx: BaseAudioContext,
  type: BiquadFilterType,
  frequency: number,
  q = 0.707,
): BiquadFilterNode {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = frequency;
  f.Q.value = q;
  return f;
}

export function gain(ctx: BaseAudioContext, value: number): GainNode {
  const g = ctx.createGain();
  g.gain.value = value;
  return g;
}

// A fast attack and an exponential decay: the shape of every click, drop and
// pluck. Starts from a hair above zero because exponential ramps cannot start
// or end at exactly 0.
export function pluckEnvelope(param: AudioParam, at: number, peak: number, decay: number, attack = 0.001) {
  param.setValueAtTime(0.0001, at);
  param.linearRampToValueAtTime(Math.max(0.0001, peak), at + attack);
  param.exponentialRampToValueAtTime(0.0001, at + attack + decay);
}

// Plays a short slice of a noise buffer from a random spot, through `dest`.
export function noiseBurst(
  ctx: BaseAudioContext,
  buffer: AudioBuffer,
  dest: AudioNode,
  at: number,
  length: number,
  rng: Rng,
): AudioBufferSourceNode {
  const s = ctx.createBufferSource();
  s.buffer = buffer;
  const offset = rng() * Math.max(0, buffer.duration - length - 0.02);
  s.connect(dest);
  s.start(at, offset, length);
  return s;
}
