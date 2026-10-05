import { describe, expect, it } from "vitest";
import { sceneVars } from "./intensity";
import { layerOffset, pointerToUnit } from "./parallax";
import { MAX_STREAKS, makeStreaks } from "./streaks";

describe("streaks", () => {
  const streaks = makeStreaks();

  it("makes the maximum number, in order, all within the window", () => {
    expect(streaks.length).toBe(MAX_STREAKS);
    streaks.forEach((s, i) => {
      expect(s.i).toBe(i);
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThan(1);
      expect(s.rest).toBeGreaterThanOrEqual(0);
      expect(s.rest).toBeLessThanOrEqual(1);
      expect(s.len).toBeGreaterThanOrEqual(14);
      expect(s.len).toBeLessThanOrEqual(36);
      expect(s.delay).toBeLessThanOrEqual(0);
      expect(s.fall).toBeGreaterThan(1);
    });
  });

  it("is deterministic, so the server and the browser draw the same rain (no hydration mismatch)", () => {
    expect(makeStreaks(11)).toEqual(makeStreaks(11));
    expect(makeStreaks(11)).not.toEqual(makeStreaks(12));
  });

  it("any prefix is evenly spread: more rain thickens the whole window, not one side", () => {
    for (const n of [4, 8, 12, 24, 48]) {
      const xs = streaks
        .slice(0, n)
        .map((s) => s.x)
        .sort((a, b) => a - b);
      const gaps = xs.map((x, i) => (i === 0 ? x + (1 - xs[xs.length - 1]) : x - xs[i - 1]));
      // The biggest empty stretch is at most ~2.7x an even share, whatever the count.
      expect(Math.max(...gaps), `n=${n}`).toBeLessThanOrEqual((1 / n) * 2.7);
    }
  });

  it("does not repeat a column", () => {
    expect(new Set(streaks.map((s) => s.x.toFixed(4))).size).toBe(MAX_STREAKS);
  });
});

describe("parallax", () => {
  const rect = { left: 100, top: 50, width: 800, height: 400 };

  it("maps the pointer to [-1, 1]", () => {
    expect(pointerToUnit(100, 50, rect)).toEqual({ x: -1, y: -1 });
    expect(pointerToUnit(500, 250, rect)).toEqual({ x: 0, y: 0 });
    expect(pointerToUnit(900, 450, rect)).toEqual({ x: 1, y: 1 });
  });
  it("clamps a pointer outside the scene", () => {
    expect(pointerToUnit(-5000, 9999, rect)).toEqual({ x: -1, y: 1 });
  });
  it("copes with a zero-size or NaN rect instead of producing NaN", () => {
    expect(pointerToUnit(10, 10, { left: 0, top: 0, width: 0, height: 0 })).toEqual({ x: 0, y: 0 });
    expect(pointerToUnit(NaN, 10, rect).x).toBe(0);
  });
  it("near layers move more than far ones, opposite to the pointer", () => {
    const u = { x: 1, y: -1 };
    const far = layerOffset(u, 0.1);
    const near = layerOffset(u, 0.8);
    expect(Math.abs(near.x)).toBeGreaterThan(Math.abs(far.x));
    expect(near.x).toBeLessThan(0);
    expect(near.y).toBeGreaterThan(0);
  });
  it("depth 0 never moves, the pointer at the centre never moves, depth is clamped", () => {
    expect(layerOffset({ x: 1, y: 1 }, 0)).toEqual({ x: 0, y: 0 });
    expect(layerOffset({ x: 0, y: 0 }, 1)).toEqual({ x: 0, y: 0 });
    expect(layerOffset({ x: 1, y: 0 }, 5)).toEqual(layerOffset({ x: 1, y: 0 }, 1));
    expect(Object.is(layerOffset({ x: 0, y: 0 }, 1).x, -0)).toBe(false);
  });
  it("is bounded by the maximum shift", () => {
    const o = layerOffset({ x: -1, y: 1 }, 1, 20, 12);
    expect(o).toEqual({ x: 20, y: -12 });
  });
});

describe("sceneVars", () => {
  it("rain follows the rain slider and shows that share of the streaks", () => {
    expect(sceneVars({ rain: 0, fire: 0 })).toMatchObject({ rain: 0, streaksShown: 0 });
    expect(sceneVars({ rain: 1, fire: 0 })).toMatchObject({ rain: 1, streaksShown: MAX_STREAKS });
    expect(sceneVars({ rain: 0.5, fire: 0 }).streaksShown).toBe(MAX_STREAKS / 2);
  });
  it("the room is never dark; the fire layer warms it up to full", () => {
    expect(sceneVars({ rain: 0, fire: 0 }).glow).toBe(0.4);
    expect(sceneVars({ rain: 0, fire: 1 }).glow).toBe(1);
    expect(sceneVars({ rain: 0, fire: 0.5 }).glow).toBeCloseTo(0.7, 3);
  });
  it("clamps wild values", () => {
    expect(sceneVars({ rain: 9, fire: -3 })).toMatchObject({ rain: 1, glow: 0.4, streaksShown: MAX_STREAKS });
    expect(sceneVars({ rain: NaN, fire: NaN }).rain).toBe(0);
  });
});
