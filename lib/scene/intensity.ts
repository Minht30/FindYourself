import { clampLevel, type Levels } from "@/lib/audio/state";
import { MAX_STREAKS } from "./streaks";

// How the mixer's levels change the scene. The scene does not know about audio;
// it only gets these numbers (as CSS variables), so a different scene can read
// the same ones.
export type SceneVars = {
  rain: number; // 0..1, how much rain is on the glass
  glow: number; // 0..1, warmth of the interior light
  streaksShown: number; // how many streaks are visible at this level
};

// The room is never dark: a candle and a lamp are always on. The fire layer
// makes it warmer.
const BASE_GLOW = 0.4;

export function sceneVars(levels: Pick<Levels, "rain" | "fire">): SceneVars {
  const rain = clampLevel(levels.rain);
  const fire = clampLevel(levels.fire);
  return {
    rain,
    glow: Math.round((BASE_GLOW + (1 - BASE_GLOW) * fire) * 1000) / 1000,
    streaksShown: Math.min(MAX_STREAKS, Math.round(rain * MAX_STREAKS)),
  };
}
