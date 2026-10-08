import { mulberry32 } from "@/lib/audio/rng";
import { between, type Rng } from "./wind";

// Where everything in the two scenes sits. Generated from fixed seeds, so the server's
// HTML and the browser's agree and a test can check it; only timing (gusts, shooting
// stars, birds) is random at run time. Positions in "painting px" belong to the stage
// (the painting's own coordinate space); "vw" / "vh" ones belong to the screen.

const r1 = (n: number) => Math.round(n * 10) / 10;
const r0 = (n: number) => Math.round(n);

// ── Nod-Krai night (painting 1673 x 940) ────────────────────────────────────
export const NIGHT_PICTURE = { w: 1673, h: 940 };

export type Star = { x: number; y: number; size: number; dur: number; delay: number };
export type ShoreLight = { x: number; y: number; dur: number; delay: number };
export type Glint = { x: number; y: number; w: number; dur: number; delay: number; warm: boolean };

export function makeStars(rng: Rng, n = 70): Star[] {
  return Array.from({ length: n }, () => ({ x: r0(between(rng, 0, NIGHT_PICTURE.w)), y: r0(between(rng, 0, 430)), size: r1(between(rng, 1, 2.6)), dur: r1(between(rng, 1.8, 5)), delay: -r1(between(rng, 0, 5)) }));
}

// lit windows along the far shore of the bay
export function makeShoreLights(rng: Rng, n = 24): ShoreLight[] {
  return Array.from({ length: n }, () => ({ x: r0(between(rng, 760, 1500)), y: r0(between(rng, 640, 668)), dur: r1(between(rng, 3, 8)), delay: -r1(between(rng, 0, 8)) }));
}

// shimmer on the water; every fourth one is warm (the lamp's reflection)
export function makeGlints(rng: Rng, n = 16): Glint[] {
  return Array.from({ length: n }, (_, i) => {
    const warm = i % 4 === 0;
    return { x: r0(warm ? between(rng, 1200, 1260) : between(rng, 700, 1480)), y: r0(between(rng, 690, 840)), w: r0(between(rng, 40, 120)), dur: r1(between(rng, 3, 6.5)), delay: -r1(between(rng, 0, 6)), warm };
  });
}

// the painted lights the scene animates, in painting px
export const NIGHT_FIXTURES = {
  moon: { x: 1325, y: 92 },
  beacon: { x: 1197, y: 334 },
  lamp: { x: 1384, y: 744 },
  auroraA: { x: 90, y: -70, w: 1320, h: 688 },
  auroraB: { x: 560, y: -10, w: 900, h: 469 },
} as const;

// [top in vh, file, width px, width / height of the picture, seconds per crossing, opacity]
export const NIGHT_CLOUDS = [
  { top: 3, file: "nodkrai-cloud-2.webp", w: 760, ratio: 6.8, dur: 140, opacity: 0.6 },
  { top: 11, file: "nodkrai-cloud-4.webp", w: 520, ratio: 4.37, dur: 110, opacity: 0.5 },
  { top: 1, file: "nodkrai-cloud-3.webp", w: 460, ratio: 2.09, dur: 170, opacity: 0.45 },
] as const;

// frost flowers along the bottom: x in vw, height in vh, which way it leans away from a gust
export const NIGHT_PLANTS = [
  { x: 3, h: 36, dir: 1 },
  { x: 89, h: 30, dir: -1 },
  { x: 19, h: 17, dir: 1 },
  { x: 78, h: 15, dir: -1 },
] as const;
export const FROST_FLOWER_RATIO = 976 / 1124;

export type NightPlantMotion = { phase: number; amp: number };
export function makeNightPlantMotion(rng: Rng): NightPlantMotion[] {
  return NIGHT_PLANTS.map(() => ({ phase: r1(between(rng, 0, 6.28)), amp: r1(between(rng, 1.6, 2.6)) }));
}

// ── Monstadt day (painting 1623 x 640) ──────────────────────────────────────
export const DAY_PICTURE = { w: 1623, h: 640 };

export const DAY_CLOUDS = [
  { top: 2, w: 330, dur: 70 },
  { top: 8, w: 250, dur: 95 },
  { top: 1, w: 400, dur: 120 },
  { top: 12, w: 220, dur: 60 },
] as const;
export const CLOUD_RATIO = 700 / 478;

export type Seed = { y0: number; dur: number; delay: number; opacity: number; size: number; bobDur: number; bobDelay: number };
export function makeSeeds(rng: Rng, n = 11): Seed[] {
  return Array.from({ length: n }, () => ({
    y0: r0(between(rng, 30, 85)),
    dur: r1(between(rng, 14, 28)),
    delay: -r1(between(rng, 0, 28)),
    opacity: Math.round(between(rng, 0.45, 0.85) * 100) / 100,
    size: r0(between(rng, 18, 42)),
    bobDur: r1(between(rng, 2.2, 4)),
    bobDelay: -r1(between(rng, 0, 4)),
  }));
}

// fan flowers: x in vw, height in vh, head size in px, lean in degrees, spin direction
export const DAY_PLANTS = [
  { x: 7, h: 40, s: 150, a: 7, dir: 1 },
  { x: 91, h: 34, s: 124, a: 6, dir: -1 },
  { x: 19, h: 24, s: 84, a: 5, dir: 1.2 },
  { x: 82, h: 20, s: 70, a: 5, dir: -1.2 },
  { x: 97, h: 28, s: 96, a: 6, dir: 1.1 },
] as const;

export type DayPlantMotion = { angle: number; k: number; leafPhase: [number, number, number, number] };
export function makeDayPlantMotion(rng: Rng): DayPlantMotion[] {
  return DAY_PLANTS.map(() => ({ angle: r0(between(rng, 0, 360)), k: Math.round(between(rng, 0.85, 1.2) * 100) / 100, leafPhase: [r1(between(rng, 0, 2.6)), r1(between(rng, 0, 2.6)), r1(between(rng, 0, 2.6)), r1(between(rng, 0, 2.6))] }));
}

export const LEAF_COLOURS = ["#8DBB6F", "#A9C95F", "#D1B65A", "#7CAE5E"] as const;

// ── One call per scene ──────────────────────────────────────────────────────
export function nightLayout(seed = 7) {
  const rng = mulberry32(seed);
  return { stars: makeStars(rng), shore: makeShoreLights(rng), glints: makeGlints(rng), plants: makeNightPlantMotion(rng) };
}
export function dayLayout(seed = 5) {
  const rng = mulberry32(seed);
  return { seeds: makeSeeds(rng), plants: makeDayPlantMotion(rng) };
}
