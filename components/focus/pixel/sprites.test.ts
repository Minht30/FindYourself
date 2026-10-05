import { describe, expect, it } from "vitest";
import {
  CAT_CHEER,
  CAT_H,
  CAT_IDLE,
  CAT_PALETTE,
  CAT_RUN,
  CAT_SLEEP,
  CAT_W,
  CUP,
  CUP_H,
  CUP_PALETTE,
  CUP_W,
  HEAD_H,
  HEAD_ONLY,
  HEAD_ONLY_CLOSED,
  HEAD_W,
  SLEEP_H,
  SLEEP_W,
} from "./sprites";

function expectGrid(name: string, grid: readonly string[], w: number, h: number, palette: Record<string, string>) {
  expect(grid.length, `${name}: rows`).toBe(h);
  grid.forEach((row, i) => {
    expect(row.length, `${name}: row ${i} "${row}"`).toBe(w);
    for (const ch of row) {
      if (ch !== ".") expect(palette[ch], `${name}: unknown key "${ch}" in row ${i}`).toBeDefined();
    }
  });
}

describe("sprite grids", () => {
  it("every cat frame has the declared size and only known palette keys", () => {
    CAT_RUN.forEach((g, i) => expectGrid(`run ${i}`, g, CAT_W, CAT_H, CAT_PALETTE));
    CAT_IDLE.forEach((g, i) => expectGrid(`idle ${i}`, g, CAT_W, CAT_H, CAT_PALETTE));
    CAT_CHEER.forEach((g, i) => expectGrid(`cheer ${i}`, g, CAT_W, CAT_H, CAT_PALETTE));
    CAT_SLEEP.forEach((g, i) => expectGrid(`sleep ${i}`, g, SLEEP_W, SLEEP_H, CAT_PALETTE));
  });

  it("cups are rectangular and use only cup colours", () => {
    expectGrid("cup empty", CUP.empty, CUP_W, CUP_H, CUP_PALETTE);
    expectGrid("cup full", CUP.full, CUP_W, CUP_H, CUP_PALETTE);
  });

  it("head variants share a footprint so blinking is a straight swap", () => {
    expectGrid("head", HEAD_ONLY, HEAD_W, HEAD_H, CAT_PALETTE);
    expectGrid("head closed", HEAD_ONLY_CLOSED, HEAD_W, HEAD_H, CAT_PALETTE);
  });

  it("the run cycle actually animates (frames differ) and the cat is never blank", () => {
    expect(new Set(CAT_RUN.map((g) => g.join("|"))).size).toBeGreaterThanOrEqual(3);
    CAT_RUN.forEach((g, i) => expect(g.join("").replace(/\./g, "").length, `run ${i} not empty`).toBeGreaterThan(80));
  });

  it("the two sleep frames differ (a visible breath)", () => {
    expect(CAT_SLEEP[0].join("|")).not.toBe(CAT_SLEEP[1].join("|"));
  });
});
