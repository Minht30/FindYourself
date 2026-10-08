// The wind that moves the scenes: one number that eases between a calm value and a
// gust, and the pure maths that turns it into the sway of a flower, the spin of a fan
// flower's head, the drift of a snowflake and the fall of a raindrop. Nothing here
// touches the page; the scene's loop calls these once a frame. Randomness is passed
// in (`rng`), so every function can be tested exactly.

export type Rng = () => number;
export const between = (rng: Rng, a: number, b: number): number => a + rng() * (b - a);

// ── The wind ────────────────────────────────────────────────────────────────
export type WindState = { value: number; target: number; gusting: boolean };

export const NIGHT_CALM = 1; // a still, cold night
export const DAY_CALM = 1.6; // a breezy meadow
export const GUST_MS = 5400;

export const calmWind = (calm: number): WindState => ({ value: calm, target: calm, gusting: false });

// The strength slider (0..1) sets how hard a gust blows.
export function gustPeak(strength: number): number {
  const g = Math.min(1, Math.max(0, strength));
  return 2.4 + 3 * g;
}

export const startGust = (s: WindState, strength: number): WindState => ({ ...s, target: gustPeak(strength), gusting: true });
export const endGust = (s: WindState, calm: number): WindState => ({ ...s, target: calm, gusting: false });

// Eases the wind toward its target; never overshoots, whatever the frame time.
export function stepWind(s: WindState, dt: number, rate = 1.1): WindState {
  const k = Math.min(1, Math.max(0, dt) * rate);
  return { ...s, value: s.value + (s.target - s.value) * k };
}

// How long until the next gust, in ms.
export function gustDelay(rng: Rng, night: boolean): number {
  return night ? between(rng, 9000, 15000) : between(rng, 8000, 14000);
}

// ── Plants ──────────────────────────────────────────────────────────────────
// 0 -> 1 -> 0 over `period` seconds, smooth at both ends (an ease-in-out loop).
export function breathe(tSec: number, period: number, phase = 0): number {
  return (1 - Math.cos(((tSec + phase) / period) * Math.PI * 2)) / 2;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// A frost flower (night): the whole plant sways, and leans away in a gust.
export function frostSway(tSec: number, p: { phase: number; amp: number; dir: number }, wind: number): number {
  return Math.sin(tSec * 0.9 + p.phase) * p.amp * (0.6 + wind * 0.5) + p.dir * -1 * (wind - 1) * 1.6;
}

// A fan flower (day): a stem in two parts that bend with the wind, the upper part
// whipping more. `a` is the plant's lean in degrees; clamped so a gust never snaps it.
export function fanBend(tSec: number, a: number, wind: number): { lower: number; upper: number } {
  const lowerU = breathe(tSec, 4.8);
  const upperU = breathe(tSec, 4.8, 0.55);
  const lerp = (x: number, y: number, u: number) => x + (y - x) * u;
  const lowerA = clamp(a * wind * -0.3, -7, 7);
  const lowerB = clamp(a * wind * 0.55, -7, 8);
  const upperA = clamp(a * wind * -0.6, -14, 14);
  const upperB = clamp(a * wind * 1.0, -14, 17);
  return { lower: lerp(lowerA, lowerB, lowerU), upper: lerp(upperA, upperB, upperU) };
}

// A leaf flutters between `base - 4 * wind` and `base + 6 * wind` degrees.
export function leafFlutter(tSec: number, base: number, wind: number, phase: number): number {
  const u = breathe(tSec, 5.2, phase);
  return base - 4 * wind + (10 * wind) * u;
}

// The head of a fan flower spins like a pinwheel: a base speed in degrees a second,
// much faster in a gust, eased so a gust never makes it jump. Reduced motion: still.
export function spinTarget(gusting: boolean, strength: number, k: number, reduced: boolean): number {
  if (reduced) return 0;
  return gusting ? (260 + 360 * Math.min(1, Math.max(0, strength))) * k : 70 * k;
}
export const easeSpeed = (speed: number, target: number, dt: number): number => speed + (target - speed) * Math.min(1, Math.max(0, dt) * 1.3);
export const stepAngle = (angle: number, speed: number, dir: number, dt: number): number => (angle + dir * speed * dt) % 360;

// ── Snow ────────────────────────────────────────────────────────────────────
export type Flake = { x: number; y: number; r: number; vy: number; ph: number; sw: number; a: number };
export const MAX_FLAKES = 40;

export function makeFlakes(rng: Rng, n = MAX_FLAKES): Flake[] {
  return Array.from({ length: n }, () => ({ x: rng(), y: rng(), r: between(rng, 1.4, 3.8), vy: between(rng, 26, 62), ph: between(rng, 0, 6.28), sw: between(rng, 8, 26), a: between(rng, 0.6, 0.95) }));
}

// x and y are fractions of the screen (0..1); the wind bends the fall sideways.
export function stepFlake(f: Flake, wind: number, dt: number, W: number, H: number, rng: Rng): Flake {
  const ph = f.ph + dt * 0.8;
  const vx = wind * 22 + Math.sin(ph) * f.sw * 0.6;
  const vy = f.vy * (1 + (wind - 1) * 0.15);
  let x = f.x + (vx * dt) / Math.max(1, W);
  let y = f.y + (vy * dt) / Math.max(1, H);
  if (y > 1.02) {
    y = -0.02;
    x = between(rng, -0.1, 1);
  }
  if (x > 1.05) x = -0.05;
  if (x < -0.1) x = 1.02;
  return { ...f, ph, x, y };
}

// ── Rain (follows the mixer's rain level) ──────────────────────────────────
export type Drop = { x: number; y: number; len: number; speed: number };
export const MAX_DROPS = 60;
const PHI = 0.6180339887498949;

// In an order where any prefix is evenly spread across the screen (a golden-ratio
// sequence), so the rain slider can show the first N and thicken the whole sky evenly.
export function makeDrops(rng: Rng, n = MAX_DROPS): Drop[] {
  return Array.from({ length: n }, (_, i) => ({ x: (i * PHI + 0.07) % 1, y: rng(), len: 12 + Math.round(rng() * 20), speed: 420 + Math.round(rng() * 220) }));
}

export const dropsShown = (level: number, max = MAX_DROPS): number => Math.min(max, Math.max(0, Math.round((Number.isFinite(level) ? level : 0) * max)));

export function stepDrop(d: Drop, dt: number, H: number): Drop {
  const y = d.y + (d.speed * dt) / Math.max(1, H);
  return y > 1.05 ? { ...d, y: -0.05 } : { ...d, y };
}
