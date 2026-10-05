import { makeNoiseBuffer } from "../noise";
import type { Rng } from "../rng";
import { filter, gain, loopSource, noiseBurst, pluckEnvelope } from "./nodes";
import { planDroplets, planGusts } from "./plans";
import type { Cursor, LayerSource } from "./types";

// Rain on a window: a wide, steady hiss (pink noise, rolled off at both ends),
// a brighter patter, and individual droplets (tiny band-passed noise ticks).
// The bed swells slowly so it never sounds like a tape loop.
export function createRain(ctx: BaseAudioContext, rng: Rng = Math.random): LayerSource {
  const out = gain(ctx, 1);

  const pink = makeNoiseBuffer(ctx, "pink", 5, rng);
  const white = makeNoiseBuffer(ctx, "white", 5, rng);

  const bedGain = gain(ctx, 0.85);
  const bed = loopSource(ctx, pink);
  bed.connect(filter(ctx, "highpass", 380)).connect(filter(ctx, "lowpass", 8200)).connect(bedGain).connect(out);

  const patter = loopSource(ctx, white);
  patter.connect(filter(ctx, "bandpass", 3400, 0.5)).connect(gain(ctx, 0.2)).connect(out);

  const drops = gain(ctx, 1);
  drops.connect(out);

  const gusts: Cursor = { t: 0 };
  const dropCursor: Cursor = { t: 0 };
  let live = false;

  return {
    output: out,
    start(at = ctx.currentTime) {
      gusts.t = at;
      dropCursor.t = at;
      bed.start(at);
      patter.start(at);
      live = true;
    },
    schedule(until) {
      if (!live) return;
      const now = ctx.currentTime;
      for (const g of planGusts(gusts, now, until, rng)) bedGain.gain.setTargetAtTime(g.level, g.at, 1.4);
      for (const d of planDroplets(dropCursor, now, until, rng)) {
        const tone = filter(ctx, "bandpass", d.freq, d.q);
        const env = gain(ctx, 0);
        pluckEnvelope(env.gain, d.at, d.amp, d.decay);
        tone.connect(env).connect(drops);
        noiseBurst(ctx, white, tone, d.at, d.decay + 0.02, rng);
      }
    },
    stop() {
      live = false;
      try {
        bed.stop();
        patter.stop();
      } catch {}
      out.disconnect();
    },
  };
}
