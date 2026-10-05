import { between, type Rng } from "../rng";
import { filter, gain, pluckEnvelope } from "./nodes";
import { midiToHz, planPiano, type PianoCursor } from "./plans";
import type { LayerSource } from "./types";

// Partials of a soft felt-piano / electric-piano tone: a strong fundamental and
// a few quickly fading overtones, very slightly stretched like a real string.
const PARTIALS = [
  { ratio: 1, amp: 1, decay: 1 },
  { ratio: 2.003, amp: 0.38, decay: 0.7 },
  { ratio: 3.007, amp: 0.14, decay: 0.45 },
  { ratio: 4.013, amp: 0.06, decay: 0.3 },
] as const;

// Sparse, wandering notes from a pentatonic scale through a small echoing room.
// Always consonant, never in a hurry, safe to leave running for hours.
export function createPiano(ctx: BaseAudioContext, rng: Rng = Math.random): LayerSource {
  const out = gain(ctx, 1);

  // Dry path plus two quiet, dark echoes (a cheap room): the room is what
  // keeps a few sine partials from sounding like a test tone.
  const bus = gain(ctx, 1);
  const tone = filter(ctx, "lowpass", 2600, 0.5);
  bus.connect(tone).connect(out);
  const wet = gain(ctx, 0.4);
  for (const [time, feedback] of [
    [0.29, 0.32],
    [0.43, 0.28],
  ] as const) {
    const delay = ctx.createDelay(1);
    delay.delayTime.value = time;
    const fb = gain(ctx, feedback);
    const damp = filter(ctx, "lowpass", 1700, 0.5);
    tone.connect(delay);
    delay.connect(damp).connect(fb).connect(delay);
    damp.connect(wet);
  }
  wet.connect(out);

  const cursor: PianoCursor = { t: 0, degree: 3 };
  let live = false;
  const nodes: AudioScheduledSourceNode[] = [];

  function note(at: number, midi: number, vel: number, dur: number) {
    const hz = midiToHz(midi);
    // Lower notes ring longer.
    const ring = dur * (1.25 - (midi - 48) / 80);
    const env = gain(ctx, 0);
    pluckEnvelope(env.gain, at, vel * 0.5, ring, 0.006);
    env.connect(bus);
    for (const p of PARTIALS) {
      if (hz * p.ratio > 9000) continue;
      const osc = ctx.createOscillator();
      const g = gain(ctx, p.amp);
      osc.type = "sine";
      osc.frequency.value = hz * p.ratio;
      // Overtones die faster than the fundamental: shape each one separately.
      g.gain.setValueAtTime(p.amp, at);
      g.gain.exponentialRampToValueAtTime(0.0001, at + ring * p.decay);
      osc.connect(g).connect(env);
      osc.start(at);
      osc.stop(at + ring + 0.05);
      nodes.push(osc);
    }
  }

  return {
    output: out,
    start(at = ctx.currentTime) {
      // The first note arrives within a second of switching the layer on.
      cursor.t = at + between(rng, 0.25, 0.8);
      cursor.degree = 3;
      live = true;
    },
    schedule(until) {
      if (!live) return;
      for (const n of planPiano(cursor, ctx.currentTime, until, rng)) note(n.at, n.midi, n.vel, n.dur);
      // Drop references to oscillators that have finished.
      if (nodes.length > 64) nodes.splice(0, nodes.length - 64);
    },
    stop() {
      live = false;
      for (const n of nodes) {
        try {
          n.stop();
        } catch {}
      }
      nodes.length = 0;
      out.disconnect();
    },
  };
}
