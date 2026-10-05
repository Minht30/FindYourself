import { makeNoiseBuffer } from "../noise";
import { between, type Rng } from "../rng";
import { filter, gain, noiseBurst, pluckEnvelope } from "./nodes";
import { planKeys, type TypingCursor } from "./plans";
import type { LayerSource } from "./types";

// A mechanical keyboard heard from a desk away: each key is a short band-passed
// noise click (the plastic) plus a low "thock" (the body of the board), with a
// quieter click on release. Typing comes in bursts with human gaps and
// pauses; the space bar is deeper.
export function createKeyboard(ctx: BaseAudioContext, rng: Rng = Math.random): LayerSource {
  const out = gain(ctx, 1);
  const white = makeNoiseBuffer(ctx, "white", 3, rng);
  const cursor: TypingCursor = { t: 0, left: 0 };
  let live = false;

  function click(at: number, freq: number, amp: number, length: number, q: number) {
    const tone = filter(ctx, "bandpass", freq, q);
    const env = gain(ctx, 0);
    pluckEnvelope(env.gain, at, amp, length, 0.0005);
    tone.connect(env).connect(out);
    noiseBurst(ctx, white, tone, at, length + 0.01, rng);
  }

  function thock(at: number, freq: number, amp: number) {
    const osc = ctx.createOscillator();
    const env = gain(ctx, 0);
    osc.type = "triangle";
    // The pitch falls quickly, like a soft knock on a hollow case.
    osc.frequency.setValueAtTime(freq * 1.5, at);
    osc.frequency.exponentialRampToValueAtTime(freq, at + 0.03);
    pluckEnvelope(env.gain, at, amp, 0.07, 0.002);
    osc.connect(env).connect(out);
    osc.start(at);
    osc.stop(at + 0.1);
  }

  return {
    output: out,
    start(at = ctx.currentTime) {
      // The first keys come soon after the layer is switched on, so a click on
      // "Start" is answered quickly.
      cursor.t = at + 0.25;
      cursor.left = 0;
      live = true;
    },
    schedule(until) {
      if (!live) return;
      for (const k of planKeys(cursor, ctx.currentTime, until, rng)) {
        click(k.at, k.bright, k.amp * 3.2, 0.012, 1.4);
        thock(k.at, k.space ? 95 : between(rng, 140, 190), k.amp * (k.space ? 0.6 : 0.3));
        // Release: quieter, a touch higher, 60-110 ms later.
        click(k.at + between(rng, 0.06, 0.11), k.bright * 1.15, k.amp * 1.1, 0.008, 1.6);
      }
    },
    stop() {
      live = false;
      out.disconnect();
    },
  };
}
