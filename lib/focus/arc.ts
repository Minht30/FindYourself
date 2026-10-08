import type { Phase, Status } from "@/lib/focus/timer";

// Geometry and states of the round timer. Pure, so it can be tested: the ring is a
// circle that fills clockwise from the top as the phase progresses, and a spirit
// rides the end of the filled part.

export const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

// Degrees clockwise from 12 o'clock for a progress of 0..1.
export function angleDeg(progress: number): number {
  return clamp01(progress) * 360;
}

export function circumference(radius: number): number {
  return 2 * Math.PI * radius;
}

// `stroke-dashoffset` that leaves `progress` of a circle drawn (the arc starts
// at the top: the circle is rotated -90 degrees in the SVG).
export function arcOffset(progress: number, radius: number): number {
  return circumference(radius) * (1 - clamp01(progress));
}

// Where the end of the arc is, relative to the ring's centre (y grows downward).
export function arcEnd(progress: number, radius: number): { x: number; y: number } {
  const a = (angleDeg(progress) * Math.PI) / 180;
  return { x: radius * Math.sin(a), y: -radius * Math.cos(a) };
}

// A glide between two ticks is a short linear transition. A big move in either
// direction (a reset or a new phase going back to the start, a page opened part-way
// through a session) must jump, not sweep round the ring: a real tick is a fraction
// of a percent.
export function shouldSnap(previous: number, next: number): boolean {
  return Math.abs(clamp01(next) - clamp01(previous)) > 0.02;
}

export type SpiritState = "idle" | "run" | "pause" | "sleep" | "cheer";

// What the spirit is doing:
//   just finished a focus session        cheer (a little sparkle)
//   any break                            sleep (settled at the top, dim, breathing)
//   focus running                        run (drifts along the arc)
//   focus paused                         pause (hovers where it stopped)
//   focus idle                           idle (waits at the top)
export function spiritState(phase: Phase, status: Status, cheer: boolean): SpiritState {
  if (cheer) return "cheer";
  if (phase !== "focus") return "sleep";
  if (status === "running") return "run";
  if (status === "paused") return "pause";
  return "idle";
}

// Where the spirit sits on the ring: it follows the arc only while a focus session
// is under way; otherwise it waits at the top.
export function spiritProgress(state: SpiritState, progress: number): number {
  return state === "run" || state === "pause" ? clamp01(progress) : 0;
}

// The words for a screen reader (the picture itself is decorative).
export function ringLabel(phase: Phase, progress: number): string {
  return `${phase === "focus" ? "Focus" : "Break"} progress, ${Math.round(clamp01(progress) * 100)} percent`;
}

// Session flowers: how many have bloomed out of the round, and the sentence for it.
export function flowerStates(done: number, total: number): ("bloom" | "bud")[] {
  const n = Math.max(0, Math.floor(total));
  const d = Math.min(Math.max(0, Math.floor(done)), n);
  return Array.from({ length: n }, (_, i) => (i < d ? "bloom" : "bud"));
}

export function flowerLabel(done: number, total: number): string {
  return `${Math.min(Math.max(0, done), total)} of ${total} focus sessions done this round`;
}
