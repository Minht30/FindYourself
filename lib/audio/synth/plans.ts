import { between, expGap, pick, type Rng } from "../rng";
import { catchUp, type Cursor } from "./types";

// Pure planners: they decide *when* and *how hard* each discrete event happens
// and know nothing about Web Audio. Every planner advances its cursor past
// `until` and returns the events that fall before it, in time order.

// ── Rain droplets ──────────────────────────────────────────────────────────
export type Droplet = { at: number; freq: number; q: number; amp: number; decay: number };

export function planDroplets(cursor: Cursor, now: number, until: number, rng: Rng): Droplet[] {
  catchUp(cursor, now);
  const out: Droplet[] = [];
  while (cursor.t < until) {
    out.push({
      at: cursor.t,
      freq: between(rng, 1800, 6500),
      q: between(rng, 2, 7),
      // Mostly tiny, now and then a fat drop on the window sill.
      amp: 0.05 + 0.5 * Math.pow(rng(), 3),
      decay: between(rng, 0.008, 0.03),
    });
    cursor.t += expGap(rng, 0.035);
  }
  return out;
}

// Slow swells of the rain bed, so it breathes like real weather.
export type Gust = { at: number; level: number };

export function planGusts(cursor: Cursor, now: number, until: number, rng: Rng): Gust[] {
  catchUp(cursor, now);
  const out: Gust[] = [];
  while (cursor.t < until) {
    out.push({ at: cursor.t, level: between(rng, 0.65, 1) });
    cursor.t += between(rng, 2.5, 6);
  }
  return out;
}

// ── Fire crackles ──────────────────────────────────────────────────────────
export type Crackle = { at: number; kind: "snap" | "pop"; freq: number; amp: number; decay: number };

// Crackles come in clusters (a log shifting) separated by calmer stretches.
export type CrackleCursor = Cursor & { cluster: number };

export function planCrackles(cursor: CrackleCursor, now: number, until: number, rng: Rng): Crackle[] {
  catchUp(cursor, now);
  const out: Crackle[] = [];
  while (cursor.t < until) {
    const pop = rng() < 0.12;
    out.push({
      at: cursor.t,
      kind: pop ? "pop" : "snap",
      freq: pop ? between(rng, 180, 420) : between(rng, 1200, 5000),
      amp: (pop ? 0.7 : 0.15) + 0.6 * Math.pow(rng(), 3),
      decay: pop ? between(rng, 0.03, 0.09) : between(rng, 0.004, 0.018),
    });
    if (cursor.cluster > 0) {
      cursor.cluster -= 1;
      cursor.t += between(rng, 0.015, 0.11);
    } else {
      cursor.cluster = Math.floor(between(rng, 1, 7));
      cursor.t += expGap(rng, 0.7) + 0.08;
    }
  }
  return out;
}

// ── Keyboard ───────────────────────────────────────────────────────────────
export type Key = { at: number; amp: number; bright: number; space: boolean };

// Typing in bursts of a few keys with human gaps, then a pause to think.
export type TypingCursor = Cursor & { left: number };

export function planKeys(cursor: TypingCursor, now: number, until: number, rng: Rng): Key[] {
  catchUp(cursor, now);
  const out: Key[] = [];
  while (cursor.t < until) {
    if (cursor.left <= 0) cursor.left = Math.floor(between(rng, 3, 13));
    const last = cursor.left === 1;
    out.push({
      at: cursor.t,
      amp: between(rng, 0.45, 1),
      bright: between(rng, 1800, 3400),
      space: last && rng() < 0.6,
    });
    cursor.left -= 1;
    cursor.t += cursor.left <= 0 ? between(rng, 1.4, 5.5) : between(rng, 0.075, 0.24);
  }
  return out;
}

// ── Piano ──────────────────────────────────────────────────────────────────
// C major pentatonic across two octaves: any notes in any order sound
// consonant, which is what makes a generative piano safe to leave running.
export const PENTATONIC = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81] as const;

export type Note = { at: number; midi: number; vel: number; dur: number };

export type PianoCursor = Cursor & { degree: number };

export const midiToHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

export function planPiano(cursor: PianoCursor, now: number, until: number, rng: Rng): Note[] {
  catchUp(cursor, now);
  const out: Note[] = [];
  while (cursor.t < until) {
    // A wandering melody: small steps, rarely a leap.
    const step = pick(rng, [-2, -1, -1, 0, 1, 1, 2, rng() < 0.15 ? 4 : 1]);
    cursor.degree = Math.min(PENTATONIC.length - 1, Math.max(0, cursor.degree + step));
    const midi = PENTATONIC[cursor.degree];
    const vel = between(rng, 0.35, 0.8);
    out.push({ at: cursor.t, midi, vel, dur: between(rng, 2.2, 4) });
    // Now and then a low note underneath it, like a left hand.
    if (rng() < 0.22) out.push({ at: cursor.t + 0.01, midi: midi - 12, vel: vel * 0.7, dur: 3.5 });
    // Mostly a gentle pulse, sometimes a long breath.
    cursor.t += rng() < 0.2 ? between(rng, 3.5, 7) : between(rng, 0.7, 2.2);
  }
  return out;
}

// ── Cafe ───────────────────────────────────────────────────────────────────
// A voice alternates between talking and listening; while talking, its
// loudness and vowel colour change every syllable.
export type Syllable = { at: number; level: number; f1: number; f2: number };

export type VoiceCursor = Cursor & { speakingUntil: number };

export function planVoice(cursor: VoiceCursor, now: number, until: number, rng: Rng): Syllable[] {
  catchUp(cursor, now);
  const out: Syllable[] = [];
  while (cursor.t < until) {
    if (cursor.t >= cursor.speakingUntil) {
      // Listening: close the gate, then wait for the next sentence.
      out.push({ at: cursor.t, level: 0, f1: 500, f2: 1500 });
      cursor.t += between(rng, 0.8, 4.5);
      cursor.speakingUntil = cursor.t + between(rng, 1.2, 3.8);
      continue;
    }
    out.push({
      at: cursor.t,
      level: between(rng, 0.25, 1),
      f1: between(rng, 300, 780),
      f2: between(rng, 900, 2300),
    });
    cursor.t += between(rng, 0.11, 0.3);
  }
  return out;
}

export type Clink = { at: number; freq: number; amp: number };

export function planClinks(cursor: Cursor, now: number, until: number, rng: Rng): Clink[] {
  catchUp(cursor, now);
  const out: Clink[] = [];
  while (cursor.t < until) {
    out.push({ at: cursor.t, freq: between(rng, 2600, 4300), amp: between(rng, 0.25, 0.7) });
    cursor.t += between(rng, 4, 13);
  }
  return out;
}
