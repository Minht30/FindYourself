import { makeNoiseBuffer } from "../noise";
import { between, type Rng } from "../rng";
import { filter, gain, loopSource, pluckEnvelope } from "./nodes";
import { planClinks, planVoice, type VoiceCursor } from "./plans";
import type { Cursor, LayerSource } from "./types";

const VOICES = 4;

// Cafe chatter: a handful of unintelligible voices (formant-filtered noise
// plus a faint buzzy pitch, opening and closing in syllable-sized steps and
// talking in turns), a soft room tone underneath, and now and then a cup
// meeting a saucer. Deliberately not words: it should read as "people nearby".
export function createCafe(ctx: BaseAudioContext, rng: Rng = Math.random): LayerSource {
  const out = gain(ctx, 1);
  const pink = makeNoiseBuffer(ctx, "pink", 6, rng);

  const room = loopSource(ctx, pink);
  room.connect(filter(ctx, "lowpass", 650)).connect(gain(ctx, 0.35)).connect(out);

  type Voice = {
    level: GainNode;
    f1: BiquadFilterNode;
    f2: BiquadFilterNode;
    noise: AudioBufferSourceNode;
    buzz: OscillatorNode;
    cursor: VoiceCursor;
  };

  const voices: Voice[] = Array.from({ length: VOICES }, (_, i) => {
    const level = gain(ctx, 0);
    const mix = gain(ctx, 1);
    const noise = loopSource(ctx, pink);
    const buzz = ctx.createOscillator();
    buzz.type = "sawtooth";
    // Each voice has its own pitch (low to high), so they do not blur into one.
    buzz.frequency.value = 95 + i * 38 + between(rng, 0, 20);
    const buzzGain = gain(ctx, 0.5);
    const f1 = filter(ctx, "bandpass", 500, 4);
    const f2 = filter(ctx, "bandpass", 1500, 5);
    noise.connect(mix);
    buzz.connect(buzzGain).connect(mix);
    mix.connect(f1).connect(level);
    mix.connect(f2).connect(gain(ctx, 0.7)).connect(level);
    level.connect(out);
    return { level, f1, f2, noise, buzz, cursor: { t: 0, speakingUntil: 0 } };
  });

  const clinkCursor: Cursor = { t: 0 };
  let live = false;

  function clink(at: number, freq: number, amp: number) {
    for (const [ratio, a] of [
      [1, 1],
      [1.59, 0.55],
    ] as const) {
      const osc = ctx.createOscillator();
      const env = gain(ctx, 0);
      osc.type = "sine";
      osc.frequency.value = freq * ratio;
      pluckEnvelope(env.gain, at, amp * a * 0.5, 0.22, 0.001);
      osc.connect(env).connect(out);
      osc.start(at);
      osc.stop(at + 0.3);
    }
  }

  return {
    output: out,
    start(at = ctx.currentTime) {
      room.start(at);
      voices.forEach((v, i) => {
        v.noise.start(at, between(rng, 0, 4));
        v.buzz.start(at);
        // Stagger the conversations so they do not all begin together.
        v.cursor.t = at + 0.1 + i * between(rng, 0.3, 1.1);
        v.cursor.speakingUntil = v.cursor.t + between(rng, 1, 3);
      });
      clinkCursor.t = at + between(rng, 3, 8);
      live = true;
    },
    schedule(until) {
      if (!live) return;
      const now = ctx.currentTime;
      for (const v of voices) {
        for (const s of planVoice(v.cursor, now, until, rng)) {
          v.level.gain.setTargetAtTime(s.level, s.at, 0.035);
          v.f1.frequency.setTargetAtTime(s.f1, s.at, 0.04);
          v.f2.frequency.setTargetAtTime(s.f2, s.at, 0.04);
        }
      }
      for (const c of planClinks(clinkCursor, now, until, rng)) clink(c.at, c.freq, c.amp);
    },
    stop() {
      live = false;
      try {
        room.stop();
        for (const v of voices) {
          v.noise.stop();
          v.buzz.stop();
        }
      } catch {}
      out.disconnect();
    },
  };
}
