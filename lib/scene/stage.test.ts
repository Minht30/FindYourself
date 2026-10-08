import { describe, expect, it } from "vitest";
import { STAGES, fitStage, stageFor, stageTransform } from "./stage";

const SHAPES: [number, number][] = [
  [1440, 900],
  [2560, 900],
  [430, 860],
  [1024, 768],
  [3840, 2160],
];

describe("fitStage", () => {
  it.each(Object.keys(STAGES) as (keyof typeof STAGES)[])("%s: the painting always covers the whole screen, whatever its shape", (theme) => {
    const { pic } = STAGES[theme];
    for (const [W, H] of SHAPES) {
      const f = stageFor(theme, W, H);
      const w = pic.w * f.scale;
      const h = pic.h * f.scale;
      expect(w, `${W}x${H} width`).toBeGreaterThanOrEqual(W - 0.001);
      expect(h, `${W}x${H} height`).toBeGreaterThanOrEqual(H - 0.001);
      // no empty band on the left or top; none on the right or bottom either (the nudge may only push right a little)
      expect(f.y).toBeLessThanOrEqual(0.001);
      expect(f.y + h).toBeGreaterThanOrEqual(H - 0.001);
      expect(f.x + w).toBeGreaterThanOrEqual(W - 0.001);
    }
  });

  it("scales by the larger of the two ratios (cover), times the zoom", () => {
    const f = fitStage(1000, 500, { w: 500, h: 500 }, { zoom: 1, pinX: 0, pinY: 1 });
    expect(f.scale).toBe(2); // width needs 2x, height 1x
    expect(f.x).toBe(0);
    expect(f.y).toBeCloseTo(-500); // 1000 tall in a 500 window, pinned to the bottom
  });

  it("pins the leftover space: 0 left or top, 1 right or bottom, 0.5 centred", () => {
    const pic = { w: 200, h: 100 };
    const left = fitStage(100, 100, pic, { zoom: 1, pinX: 0, pinY: 0.5 });
    const right = fitStage(100, 100, pic, { zoom: 1, pinX: 1, pinY: 0.5 });
    const mid = fitStage(100, 100, pic, { zoom: 1, pinX: 0.5, pinY: 0.5 });
    expect(left.x).toBe(0);
    expect(right.x).toBe(-100);
    expect(mid.x).toBe(-50);
  });

  it("the Monstadt painting is pinned to the right and 40 percent down; Nod-Krai a little right of centre", () => {
    const day = stageFor("monstadt", 1440, 900);
    const night = stageFor("nodkrai-night", 1440, 900);
    expect(day.x + 1623 * day.scale).toBeGreaterThan(1440); // its right edge reaches (and passes) the screen's
    expect(night.x / (1440 - 1673 * night.scale)).toBeCloseTo(0.62, 5);
  });

  it("pins Nod-Krai further right on a portrait screen, so the tower stays in view", () => {
    const wide = stageFor("nodkrai-night", 1440, 900);
    const tall = stageFor("nodkrai-night", 430, 860);
    expect(tall.x / (430 - 1673 * tall.scale)).toBeCloseTo(0.9, 5);
    expect(wide.x / (1440 - 1673 * wide.scale)).toBeCloseTo(0.62, 5);
  });

  it("never divides by a zero-sized window", () => {
    const f = fitStage(0, 0, { w: 100, h: 100 }, { zoom: 1, pinX: 0.5, pinY: 0.5 });
    expect(Number.isFinite(f.scale) && Number.isFinite(f.x) && Number.isFinite(f.y)).toBe(true);
  });

  it("writes a transform string", () => {
    expect(stageTransform({ scale: 1.5, x: -10.04, y: 2 })).toBe("translate(-10.0px, 2.0px) scale(1.5000)");
  });
});
