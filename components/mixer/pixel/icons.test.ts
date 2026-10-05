import { describe, expect, it } from "vitest";
import { LAYER_KEYS } from "@/lib/audio/layers";
import { ICON_PALETTE, ICON_SIZE, LAYER_ICONS } from "./icons";

describe("mixer icons", () => {
  it("every layer has an icon", () => {
    expect(Object.keys(LAYER_ICONS).sort()).toEqual([...LAYER_KEYS].sort());
  });

  for (const key of LAYER_KEYS) {
    it(`${key}: two frames, each 12x12, using only known palette keys`, () => {
      const frames = LAYER_ICONS[key];
      expect(frames.length).toBe(2);
      frames.forEach((grid, f) => {
        expect(grid.length, `${key} frame ${f} rows`).toBe(ICON_SIZE);
        grid.forEach((row, y) => {
          expect(row.length, `${key} frame ${f} row ${y} "${row}"`).toBe(ICON_SIZE);
          for (const ch of row) {
            if (ch !== ".") expect(ICON_PALETTE[ch], `${key}: unknown key "${ch}"`).toBeDefined();
          }
        });
      });
    });

    it(`${key}: the two frames differ, so an active layer visibly moves`, () => {
      const [a, b] = LAYER_ICONS[key];
      expect(a.join("")).not.toBe(b.join(""));
    });
  }
});
