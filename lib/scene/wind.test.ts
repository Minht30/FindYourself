import { describe, expect, it } from "vitest";
import { mulberry32 } from "@/lib/audio/rng";
import {
  DAY_CALM,
  GUST_MS,
  MAX_DROPS,
  MAX_FLAKES,
  NIGHT_CALM,
  breathe,
  calmWind,
  dropsShown,
  easeSpeed,
  endGust,
  fanBend,
  frostSway,
  gustDelay,
  gustPeak,
  leafFlutter,
  makeDrops,
  makeFlakes,
  spinTarget,
  startGust,
  stepAngle,
  stepDrop,
  stepFlake,
  stepWind,
} from "./wind";

describe("the wind", () => {
  it("starts calm and a gust raises the target, not the value (it eases up)", () => {
    const w = calmWind(NIGHT_CALM);
    const g = startGust(w, 0.6);
    expect(g.gusting).toBe(true);
    expect(g.value).toBe(NIGHT_CALM);
    expect(g.target).toBeCloseTo(2.4 + 3 * 0.6);
  });

  it("a stronger slider blows a harder gust, and the slider is clamped", () => {
    expect(gustPeak(0)).toBe(2.4);
    expect(gustPeak(1)).toBe(5.4);
    expect(gustPeak(-3)).toBe(2.4);
    expect(gustPeak(9)).toBe(5.4);
    expect(gustPeak(0.8)).toBeGreaterThan(gustPeak(0.2));
  });

  it("eases toward the target and never overshoots, even after a long frame", () => {
    let w = startGust(calmWind(1), 1);
    let last = w.value;
    for (let i = 0; i < 600; i++) {
      w = stepWind(w, 1 / 60);
      expect(w.value).toBeGreaterThanOrEqual(last);
      expect(w.value).toBeLessThanOrEqual(w.target);
      last = w.value;
    }
    expect(w.value).toBeCloseTo(5.4, 1); // ten seconds of frames
    // a huge dt (tab asleep) lands on the target, not past it
    expect(stepWind(startGust(calmWind(1), 1), 100).value).toBe(5.4);
    expect(stepWind(startGust(calmWind(1), 1), -5).value).toBe(1);
  });

  it("settles back to calm when the gust ends", () => {
    let w = endGust({ value: 5.4, target: 5.4, gusting: true }, DAY_CALM);
    expect(w.gusting).toBe(false);
    expect(w.value).toBe(5.4); // ending the gust changes the target, not the value
    for (let i = 0; i < 600; i++) w = stepWind(w, 1 / 60);
    expect(w.value).toBeCloseTo(DAY_CALM, 1);
  });

  it("waits 9 to 15 s between gusts at night and 8 to 14 s by day, and a gust lasts 5.4 s", () => {
    const rng = mulberry32(3);
    for (let i = 0; i < 200; i++) {
      const n = gustDelay(rng, true);
      const d = gustDelay(rng, false);
      expect(n).toBeGreaterThanOrEqual(9000);
      expect(n).toBeLessThanOrEqual(15000);
      expect(d).toBeGreaterThanOrEqual(8000);
      expect(d).toBeLessThanOrEqual(14000);
    }
    expect(GUST_MS).toBe(5400);
  });
});

describe("plants", () => {
  it("breathe goes 0 to 1 and back, smooth at both ends", () => {
    expect(breathe(0, 4)).toBeCloseTo(0);
    expect(breathe(2, 4)).toBeCloseTo(1);
    expect(breathe(4, 4)).toBeCloseTo(0);
    expect(breathe(0.01, 4)).toBeLessThan(0.001);
  });

  it("a frost flower sways more in the wind and leans away from a gust, the other way for the other side", () => {
    const p = { phase: 0, amp: 2, dir: 1 };
    // at t where sin = 0 only the lean remains
    expect(frostSway(0, p, 1)).toBeCloseTo(0);
    expect(frostSway(0, p, 3)).toBeCloseTo(-3.2);
    expect(frostSway(0, { ...p, dir: -1 }, 3)).toBeCloseTo(3.2);
    const peak = (wind: number) => Math.max(...Array.from({ length: 200 }, (_, i) => Math.abs(frostSway(i / 20, { ...p, dir: 0 }, wind))));
    expect(peak(3)).toBeGreaterThan(peak(1));
  });

  it("a fan flower's stem bends within its clamps whatever the wind, upper part more than the lower", () => {
    for (const wind of [0, 1.6, 3, 6, 12]) {
      for (let t = 0; t < 10; t += 0.25) {
        const { lower, upper } = fanBend(t, 7, wind);
        expect(lower).toBeGreaterThanOrEqual(-7);
        expect(lower).toBeLessThanOrEqual(8);
        expect(upper).toBeGreaterThanOrEqual(-14);
        expect(upper).toBeLessThanOrEqual(17);
      }
    }
    const spread = (k: "lower" | "upper") => {
      const v = Array.from({ length: 100 }, (_, i) => fanBend(i / 10, 6, 3)[k]);
      return Math.max(...v) - Math.min(...v);
    };
    expect(spread("upper")).toBeGreaterThan(spread("lower"));
  });

  it("a leaf flutters wider in a gust", () => {
    const range = (wind: number) => {
      const v = Array.from({ length: 200 }, (_, i) => leafFlutter(i / 10, 30, wind, 0));
      return Math.max(...v) - Math.min(...v);
    };
    expect(range(4)).toBeGreaterThan(range(1));
    expect(range(0)).toBeCloseTo(0);
  });

  it("the head spins at 70 degrees a second, much faster in a gust, and not at all under reduced motion", () => {
    expect(spinTarget(false, 0.6, 1, false)).toBe(70);
    expect(spinTarget(true, 0.6, 1, false)).toBe(260 + 360 * 0.6);
    expect(spinTarget(true, 1, 1.2, false)).toBeCloseTo(620 * 1.2);
    expect(spinTarget(true, 1, 1, true)).toBe(0);
    expect(spinTarget(false, 1, 1, true)).toBe(0);
  });

  it("the spin speed eases (never jumps) and the angle wraps", () => {
    expect(easeSpeed(70, 600, 1 / 60)).toBeLessThan(90); // about 81: a step toward 600, not a jump
    expect(easeSpeed(70, 600, 1 / 60)).toBeGreaterThan(70);
    expect(stepAngle(359, 90, 1, 0.1)).toBeCloseTo(8);
    expect(stepAngle(1, 90, -1, 0.1)).toBeCloseTo(-8); // a negative angle is still a valid rotation
  });
});

describe("snow", () => {
  it("makes 40 flakes inside the screen, the same for the same seed", () => {
    const a = makeFlakes(mulberry32(1));
    expect(a).toHaveLength(MAX_FLAKES);
    expect(makeFlakes(mulberry32(1))).toEqual(a);
    for (const f of a) {
      expect(f.x).toBeGreaterThanOrEqual(0);
      expect(f.x).toBeLessThan(1);
      expect(f.r).toBeGreaterThanOrEqual(1.4);
    }
  });

  it("a flake falls, drifts with the wind, and comes back in at the top", () => {
    const rng = mulberry32(9);
    const f = { x: 0.5, y: 0.5, r: 2, vy: 50, ph: 0, sw: 10, a: 0.8 };
    const a = stepFlake(f, 1, 0.1, 1000, 1000, rng);
    expect(a.y).toBeGreaterThan(f.y);
    const windy = stepFlake(f, 5, 0.1, 1000, 1000, rng);
    expect(windy.x).toBeGreaterThan(a.x); // more wind, further right
    const gone = stepFlake({ ...f, y: 1.03 }, 1, 0.2, 1000, 1000, rng);
    expect(gone.y).toBeLessThan(0);
    const offRight = stepFlake({ ...f, x: 1.049 }, 8, 0.5, 1000, 1000, rng);
    expect(offRight.x).toBeLessThan(0);
  });

  it("never produces NaN for a zero-sized screen", () => {
    const f = stepFlake({ x: 0.1, y: 0.1, r: 2, vy: 40, ph: 0, sw: 5, a: 1 }, 1, 0.016, 0, 0, mulberry32(2));
    expect(Number.isFinite(f.x) && Number.isFinite(f.y)).toBe(true);
  });
});

describe("rain", () => {
  it("shows none at level 0 and all 60 at level 1, and ignores nonsense", () => {
    expect(dropsShown(0)).toBe(0);
    expect(dropsShown(1)).toBe(MAX_DROPS);
    expect(dropsShown(0.5)).toBe(30);
    expect(dropsShown(Number.NaN)).toBe(0);
    expect(dropsShown(5)).toBe(MAX_DROPS);
    expect(dropsShown(-1)).toBe(0);
  });

  it("spreads any first N drops across the whole width (the slider thickens the sky evenly)", () => {
    const drops = makeDrops(mulberry32(4));
    expect(drops).toHaveLength(MAX_DROPS);
    const first = drops.slice(0, 12).map((d) => d.x).sort((a, b) => a - b);
    const gaps = first.slice(1).map((x, i) => x - first[i]);
    expect(Math.max(...gaps)).toBeLessThan(0.25); // no wide empty stretch
    expect(first[0]).toBeLessThan(0.25);
    expect(first[first.length - 1]).toBeGreaterThan(0.75);
  });

  it("a drop falls and wraps to the top", () => {
    const d = { x: 0.3, y: 0.5, len: 20, speed: 500 };
    expect(stepDrop(d, 0.1, 1000).y).toBeCloseTo(0.55);
    expect(stepDrop({ ...d, y: 1.04 }, 0.1, 1000).y).toBe(-0.05);
  });
});
