import { mulberry32 } from "@/lib/audio/rng";

// Rain streaks for the window. They are generated once, in an order where *any
// prefix is evenly spread* across the glass (a golden-ratio sequence), so the
// rain slider can simply show the first N: more rain thickens the whole window
// evenly instead of filling it from the left.

export type Streak = {
  i: number; // order: streak i shows once the rain level reaches i / MAX_STREAKS
  x: number; // 0..1 across the window
  len: number; // px in the 960x540 scene
  fall: number; // seconds for one fall at light rain
  delay: number; // seconds, negative: the animation starts mid-fall
  rest: number; // 0..1 where it sits when motion is off (static first frame)
};

export const MAX_STREAKS = 48;

const PHI = 0.6180339887498949;

export function makeStreaks(seed = 11, count = MAX_STREAKS): Streak[] {
  const rng = mulberry32(seed);
  const out: Streak[] = [];
  for (let i = 0; i < count; i++) {
    const fall = 1.1 + rng() * 1.1;
    out.push({
      i,
      x: (i * PHI + 0.07) % 1,
      len: 14 + Math.round(rng() * 22),
      fall: Math.round(fall * 100) / 100,
      delay: -Math.round(rng() * fall * 100) / 100,
      rest: rng(),
    });
  }
  return out;
}
