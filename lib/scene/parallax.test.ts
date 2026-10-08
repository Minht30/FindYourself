import { describe, expect, it } from "vitest";
import { layerOffset, pointerToUnit } from "./parallax";

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
