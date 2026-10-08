import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DAY_PICTURE, DAY_PLANTS, NIGHT_CLOUDS, NIGHT_FIXTURES, NIGHT_PICTURE, NIGHT_PLANTS, dayLayout, nightLayout } from "./layout";

describe("the night layout", () => {
  const L = nightLayout();

  it("is the same every time (the server and the browser draw the same sky)", () => {
    expect(nightLayout()).toEqual(L);
    expect(JSON.stringify(nightLayout(8))).not.toBe(JSON.stringify(L));
  });

  it("has the counts of the draft: 70 stars, 24 shore lights, 16 water glints", () => {
    expect([L.stars.length, L.shore.length, L.glints.length]).toEqual([70, 24, 16]);
  });

  it("keeps stars in the upper sky and shore lights on the far shore, inside the painting", () => {
    for (const s of L.stars) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(NIGHT_PICTURE.w);
      expect(s.y).toBeLessThanOrEqual(430);
      expect(s.size).toBeGreaterThanOrEqual(1);
      expect(s.delay).toBeLessThanOrEqual(0); // starts mid-twinkle
    }
    for (const w of L.shore) {
      expect(w.x).toBeGreaterThanOrEqual(760);
      expect(w.x).toBeLessThanOrEqual(1500);
      expect(w.y).toBeGreaterThanOrEqual(640);
      expect(w.y).toBeLessThanOrEqual(668);
    }
  });

  it("puts the warm glints under the lamp and the cool ones across the bay", () => {
    for (const g of L.glints) {
      expect(g.y).toBeGreaterThanOrEqual(690);
      expect(g.y).toBeLessThanOrEqual(840);
      if (g.warm) expect(g.x).toBeGreaterThanOrEqual(1200);
      if (g.warm) expect(g.x).toBeLessThanOrEqual(1260);
    }
    expect(L.glints.filter((g) => g.warm)).toHaveLength(4);
  });

  it("attaches the moon, beacon and lamp to the painting (inside it)", () => {
    for (const k of ["moon", "beacon", "lamp"] as const) {
      expect(NIGHT_FIXTURES[k].x).toBeLessThan(NIGHT_PICTURE.w);
      expect(NIGHT_FIXTURES[k].y).toBeLessThan(NIGHT_PICTURE.h);
    }
  });

  it("has one motion record per frost flower, and the art files for the clouds exist", () => {
    expect(L.plants).toHaveLength(NIGHT_PLANTS.length);
    for (const c of NIGHT_CLOUDS) expect(existsSync(path.resolve(__dirname, "../../public/assets/world/NodKrai_Night", c.file)), c.file).toBe(true);
  });
});

describe("the day layout", () => {
  const L = dayLayout();

  it("is the same every time", () => {
    expect(dayLayout()).toEqual(L);
  });

  it("has 11 seeds drifting at different heights, speeds and sizes, each starting mid-drift", () => {
    expect(L.seeds).toHaveLength(11);
    expect(new Set(L.seeds.map((s) => s.dur)).size).toBeGreaterThan(5);
    for (const s of L.seeds) {
      expect(s.y0).toBeGreaterThanOrEqual(30);
      expect(s.y0).toBeLessThanOrEqual(85);
      expect(s.size).toBeGreaterThanOrEqual(18);
      expect(s.size).toBeLessThanOrEqual(42);
      expect(s.delay).toBeLessThanOrEqual(0);
      expect(s.opacity).toBeGreaterThanOrEqual(0.45);
      expect(s.opacity).toBeLessThanOrEqual(0.85);
    }
  });

  it("has a motion record per fan flower, with a head angle and a spin factor", () => {
    expect(L.plants).toHaveLength(DAY_PLANTS.length);
    for (const p of L.plants) {
      expect(p.angle).toBeGreaterThanOrEqual(0);
      expect(p.angle).toBeLessThan(360);
      expect(p.k).toBeGreaterThanOrEqual(0.85);
      expect(p.k).toBeLessThanOrEqual(1.2);
    }
  });

  it("the picture is the one the stage fits", () => {
    expect(DAY_PICTURE).toEqual({ w: 1623, h: 640 });
  });
});
