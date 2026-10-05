import { makeNoiseBuffer } from "../noise";
import { between, type Rng } from "../rng";
import { filter, gain, loopSource, noiseBurst, pluckEnvelope } from "./nodes";
import { planCrackles, type CrackleCursor } from "./plans";
import type { Cursor, LayerSource } from "./types";

// A fireplace: a low, soft roar (brown noise, rolled off) that flickers in
// loudness, with crackles on top: sharp snaps (high band-passed ticks) and the
// occasional dull pop (a low thump).
export function createFire(ctx: BaseAudioContext, rng: Rng = Math.random): LayerSource {
  const out = gain(ctx, 1);

  const brown = makeNoiseBuffer(ctx, "brown", 5, rng);
  const white = makeNoiseBuffer(ctx, "white", 5, rng);

  const roarGain = gain(ctx, 0.8);
  const roar = loopSource(ctx, brown);
  roar.connect(filter(ctx, "lowpass", 520)).connect(filter(ctx, "highpass", 45)).connect(roarGain).connect(out);

  // A faint, airy hiss: the sound of the flame itself.
  const hiss = loopSource(ctx, white);
  hiss.connect(filter(ctx, "bandpass", 1900, 0.7)).connect(gain(ctx, 0.05)).connect(out);

  const flicker: Cursor = { t: 0 };
  const crackleCursor: CrackleCursor = { t: 0, cluster: 0 };
  let live = false;

  return {
    output: out,
    start(at = ctx.currentTime) {
      flicker.t = at;
      crackleCursor.t = at + 0.1;
      roar.start(at);
      hiss.start(at);
      live = true;
    },
    schedule(until) {
      if (!live) return;
      const now = ctx.currentTime;
      if (flicker.t < now) flicker.t = now;
      while (flicker.t < until) {
        roarGain.gain.setTargetAtTime(between(rng, 0.45, 0.8), flicker.t, 0.35);
        flicker.t += between(rng, 0.4, 1.4);
      }
      for (const c of planCrackles(crackleCursor, now, until, rng)) {
        const tone = filter(ctx, c.kind === "pop" ? "bandpass" : "highpass", c.freq, c.kind === "pop" ? 1.2 : 0.8);
        const env = gain(ctx, 0);
        pluckEnvelope(env.gain, c.at, c.amp * (c.kind === "snap" ? 3.2 : 1.4), c.decay);
        tone.connect(env).connect(out);
        noiseBurst(ctx, white, tone, c.at, c.decay + 0.02, rng);
      }
    },
    stop() {
      live = false;
      try {
        roar.stop();
        hiss.stop();
      } catch {}
      out.disconnect();
    },
  };
}
