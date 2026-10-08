import { describe, expect, it } from "vitest";
import { blend, contrastRatio } from "@/lib/contrast";
import { THEME_SELECTORS, css, tokens } from "@/lib/cssTokens";

// Panels are see-through over the painting, so a text colour is judged on the panel
// colour laid over the worst parts of the wallpaper behind it. The worst parts below
// were measured on each wallpaper as it is shown (scaled to cover 1440 x 900, 2560 x 900
// and 430 x 860, averaged over about a glyph's width, the darkest and brightest 0.1 % of
// the picture; the most extreme of the three sizes). Re-measure when a wallpaper changes
// (the Monstadt one is a 1623 x 640 stand-in until the proper 16:9 file arrives).
const WALLPAPER_EXTREMES = {
  monstadt: { dark: "#061111", bright: "#FEFCED" },
  "nodkrai-night": { dark: "#010B41", bright: "#BDD7FA" },
} as const;

function glassAlpha(name: "glass-panel" | "glass-card"): number {
  const m = css.match(new RegExp(`--${name}:\\s*color-mix\\(in srgb,\\s*var\\(--bg-elevated\\)\\s+(\\d+)%,\\s*transparent\\)`));
  if (!m) throw new Error(`--${name} is not a color-mix of --bg-elevated in globals.css`);
  return Number(m[1]) / 100;
}

const INKS = ["ink-primary", "ink-secondary", "ink-muted", "accent-strong", "danger"] as const;

describe("the glass tokens", () => {
  it("are read from the stylesheet (the parser works): panel is more see-through than card", () => {
    expect(glassAlpha("glass-panel")).toBeGreaterThan(0.5);
    expect(glassAlpha("glass-card")).toBeGreaterThanOrEqual(glassAlpha("glass-panel"));
    expect(glassAlpha("glass-card")).toBeLessThan(1);
  });

  it("refuse a token that is not a color-mix of the elevated surface", () => {
    expect(() => glassAlpha("glass-nothing" as "glass-panel")).toThrow(/not a color-mix/);
  });
});

describe.each(Object.entries(WALLPAPER_EXTREMES))("%s: text on glass over the worst of the wallpaper", (name, extremes) => {
  const t = tokens(THEME_SELECTORS[name as keyof typeof THEME_SELECTORS]);

  it.each([
    ["panel", "glass-panel"],
    ["card", "glass-card"],
  ] as const)("keeps every text colour at 4.5:1 on a %s", (_label, token) => {
    const alpha = glassAlpha(token);
    for (const ground of [extremes.dark, extremes.bright]) {
      const surface = blend(t["bg-elevated"], ground, alpha);
      for (const ink of INKS) {
        expect(contrastRatio(t[ink], surface), `${ink} on ${token} over ${ground}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("would catch a panel that is too see-through (the check can fail)", () => {
    // At 70 % the brown accent text over the brightest cloud falls below 4.5:1 in Monstadt,
    // the muted ink in Nod-Krai: the measurement is not vacuous.
    const worstAt70 = Math.min(
      ...[extremes.dark, extremes.bright].flatMap((ground) => INKS.map((ink) => contrastRatio(t[ink], blend(t["bg-elevated"], ground, 0.7)))),
    );
    expect(worstAt70).toBeLessThan(4.5);
  });
});

describe("blend", () => {
  it("is the colour at alpha 1 and the ground at alpha 0, and a mix between", () => {
    expect(blend("#102030", "#F0E0D0", 1)).toBe("#102030");
    expect(blend("#102030", "#F0E0D0", 0)).toBe("#F0E0D0");
    expect(blend("#000000", "#FFFFFF", 0.5)).toBe("#808080");
  });
});

// Focus Mode shows the same painting dimmed by a veil, with its own light-on-dark text colours
// (the [data-focus-surface] overrides). The worst case for light text is the brightest part of
// the painting, lightened least by the veil.
describe.each([
  ["monstadt", "\n[data-focus-surface] {"],
  ["nodkrai-night", ':root[data-theme="nodkrai-night"] [data-focus-surface] {'],
] as const)("%s: Focus Mode text over the veiled painting", (name, selector) => {
  const t = tokens(selector);
  const start = css.indexOf(selector);
  const block = css.slice(start, css.indexOf("}", start));
  const m = block.match(/--fm-veil:\s*rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (!m) throw new Error(`no --fm-veil in ${selector}`);
  const hex = "#" + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("").toUpperCase();
  const alpha = Number(m[4]);
  const surface = blend(hex, WALLPAPER_EXTREMES[name].bright, alpha);

  it("keeps the small text colours at 4.5:1 over the brightest painting, and the ring and break colours at 3:1", () => {
    for (const ink of ["ink-primary", "ink-secondary", "ink-muted"]) expect(contrastRatio(t[ink], surface), ink).toBeGreaterThanOrEqual(4.5);
    // in the dark room accent-strong is an alias for the accent; the break green is overridden by day and inherited at night
    const theme = tokens(THEME_SELECTORS[name]);
    expect(contrastRatio(theme.accent, surface), "ring (accent)").toBeGreaterThanOrEqual(3);
    expect(contrastRatio(t.success ?? theme.success, surface), "break (success)").toBeGreaterThanOrEqual(3);
  });

  it("the veil is strong enough to matter (a veil of 20 percent would not hold)", () => {
    const weak = blend(hex, WALLPAPER_EXTREMES[name].bright, 0.2);
    const worst = Math.min(...["ink-primary", "ink-secondary", "ink-muted"].map((ink) => contrastRatio(t[ink], weak)));
    expect(worst).toBeLessThan(4.5);
  });
});
