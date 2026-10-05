import { describe, expect, it } from "vitest";
import { GLYPHS, GLYPH_H, textWidth } from "./digits";

const DIGITS = "0123456789".split("");

describe("pixel digits", () => {
  it("every glyph is 7 rows of equal width, using only # and .", () => {
    for (const [ch, g] of Object.entries(GLYPHS)) {
      expect(g.length, ch).toBe(GLYPH_H);
      g.forEach((row, i) => {
        expect(row.length, `${ch} row ${i}`).toBe(g[0].length);
        expect(row, `${ch} row ${i}`).toMatch(/^[#.]+$/);
      });
    }
    for (const d of DIGITS) expect(GLYPHS[d][0].length, d).toBe(5);
  });

  it("every pair of digits differs in at least 5 pixels, so none can be mistaken for another", () => {
    const worst: [string, string, number][] = [];
    for (let i = 0; i < DIGITS.length; i++) {
      for (let j = i + 1; j < DIGITS.length; j++) {
        const a = GLYPHS[DIGITS[i]].join("");
        const b = GLYPHS[DIGITS[j]].join("");
        let diff = 0;
        for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) diff++;
        worst.push([DIGITS[i], DIGITS[j], diff]);
      }
    }
    worst.sort((x, y) => x[2] - y[2]);
    // the pairs that look alike in most pixel fonts
    for (const [a, b] of [["0", "8"], ["6", "8"], ["0", "6"], ["3", "8"], ["5", "6"], ["5", "3"], ["9", "8"], ["1", "7"]]) {
      const d = worst.find((w) => (w[0] === a && w[1] === b) || (w[0] === b && w[1] === a))![2];
      expect(d, `${a} vs ${b}`).toBeGreaterThanOrEqual(5);
    }
    expect(worst[0][2], `closest pair: ${worst[0][0]} vs ${worst[0][1]}`).toBeGreaterThanOrEqual(5);
  });

  it("measures text width including gaps", () => {
    expect(textWidth("05:00")).toBe(5 + 1 + 5 + 1 + 3 + 1 + 5 + 1 + 5);
    expect(textWidth("")).toBe(0);
    expect(textWidth("120:00")).toBeGreaterThan(textWidth("05:00"));
  });
});
