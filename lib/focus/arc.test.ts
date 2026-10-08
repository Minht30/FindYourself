import { describe, expect, it } from "vitest";
import { angleDeg, arcEnd, arcOffset, circumference, clamp01, flowerLabel, flowerStates, ringLabel, shouldSnap, spiritProgress, spiritState } from "./arc";

describe("the arc", () => {
  it("runs 0 to 360 degrees clockwise from the top, and never outside it", () => {
    expect(angleDeg(0)).toBe(0);
    expect(angleDeg(0.25)).toBe(90);
    expect(angleDeg(1)).toBe(360);
    expect(angleDeg(-3)).toBe(0);
    expect(angleDeg(7)).toBe(360);
    expect(angleDeg(Number.NaN)).toBe(0);
  });

  it("draws none of the circle at 0 and all of it at 1", () => {
    const r = 100;
    expect(arcOffset(0, r)).toBeCloseTo(circumference(r));
    expect(arcOffset(1, r)).toBeCloseTo(0);
    expect(arcOffset(0.5, r)).toBeCloseTo(circumference(r) / 2);
  });

  it("puts the end of the arc at the top, right, bottom and left at 0, 25, 50 and 75 percent", () => {
    const r = 100;
    const at = (p: number) => {
      const e = arcEnd(p, r);
      return [Math.round(e.x) + 0, Math.round(e.y) + 0]; // + 0 turns -0 into 0
    };
    expect(at(0)).toEqual([0, -100]);
    expect(at(0.25)).toEqual([100, 0]);
    expect(at(0.5)).toEqual([0, 100]);
    expect(at(0.75)).toEqual([-100, 0]);
    expect(at(1)).toEqual([0, -100]);
  });

  it("clamp01 keeps a progress inside 0..1", () => {
    expect([clamp01(-1), clamp01(0.4), clamp01(2), clamp01(Number.POSITIVE_INFINITY)]).toEqual([0, 0.4, 1, 0]);
  });
});

describe("shouldSnap: when the glide must jump instead", () => {
  it("is false for the ordinary forward tick and for a tiny wobble either way", () => {
    expect(shouldSnap(0.4, 0.401)).toBe(false);
    expect(shouldSnap(0.4, 0.39)).toBe(false);
  });
  it("is true for a reset or a new phase (progress goes back to the start)", () => {
    expect(shouldSnap(0.9, 0)).toBe(true);
    expect(shouldSnap(0.5, 0.2)).toBe(true);
  });
  it("is true for a page opened part-way through a session (a big step forward)", () => {
    expect(shouldSnap(0, 0.6)).toBe(true);
  });
});

describe("what the spirit is doing", () => {
  it("cheers when a session just finished, whatever else is true", () => {
    expect(spiritState("focus", "idle", true)).toBe("cheer");
    expect(spiritState("short", "running", true)).toBe("cheer");
  });
  it("sleeps through every break, running or not", () => {
    for (const phase of ["short", "long"] as const) for (const status of ["idle", "running", "paused"] as const) expect(spiritState(phase, status, false), `${phase} ${status}`).toBe("sleep");
  });
  it("drifts while a focus session runs, hovers when it is paused, waits when idle", () => {
    expect(spiritState("focus", "running", false)).toBe("run");
    expect(spiritState("focus", "paused", false)).toBe("pause");
    expect(spiritState("focus", "idle", false)).toBe("idle");
  });
  it("follows the arc only while running or paused; otherwise waits at the top", () => {
    expect(spiritProgress("run", 0.4)).toBe(0.4);
    expect(spiritProgress("pause", 0.4)).toBe(0.4);
    for (const s of ["idle", "sleep", "cheer"] as const) expect(spiritProgress(s, 0.4), s).toBe(0);
  });
});

describe("the words", () => {
  it("names the ring's progress for a screen reader", () => {
    expect(ringLabel("focus", 0.5)).toBe("Focus progress, 50 percent");
    expect(ringLabel("long", 1.4)).toBe("Break progress, 100 percent");
  });

  it("blooms the flowers for the sessions done and leaves the rest as buds", () => {
    expect(flowerStates(2, 4)).toEqual(["bloom", "bloom", "bud", "bud"]);
    expect(flowerStates(0, 3)).toEqual(["bud", "bud", "bud"]);
    expect(flowerStates(9, 4)).toEqual(["bloom", "bloom", "bloom", "bloom"]);
    expect(flowerStates(-1, 2)).toEqual(["bud", "bud"]);
    expect(flowerStates(1, 0)).toEqual([]);
  });

  it("says how many of the round are done, never more than the round", () => {
    expect(flowerLabel(2, 4)).toBe("2 of 4 focus sessions done this round");
    expect(flowerLabel(6, 4)).toBe("4 of 4 focus sessions done this round");
  });
});
