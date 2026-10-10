import { describe, expect, it } from "vitest";
import { blend, contrastRatio } from "@/lib/contrast";
import { PAPER_SELECTOR, THEME_SELECTORS, css, paperAlpha, paperBlur, percentToken, rawToken, scoped, tokens } from "@/lib/cssTokens";

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

// ── Paper panels (components/ui/Panel.tsx) ───────────────────────────────────
// A panel's paper is a wash of two colours laid over the painting at --paper-a, behind a backdrop
// blur. The blur matters: it averages the painting, so the grounds a glyph can sit on are far
// less extreme than the sharp picture (the brightest part of the Nod-Krai painting falls from
// 0.96 to 0.50 relative luminance behind a 10 px blur). So the paper is judged over the blurred
// extremes: the darkest and brightest 0.1 % of each wallpaper after a gaussian blur of the panel's
// own radius, the most extreme of the same three window shapes as above (1440 x 900, 2560 x 900,
// 430 x 860). Re-measure when a wallpaper or a blur changes.
const BLURRED_EXTREMES = {
  monstadt: { blur: 8, dark: "#0A181B", bright: "#FDFCEB" },
  "nodkrai-night": { blur: 10, dark: "#040D4A", bright: "#A7BBF6" },
} as const;

// the ink colours as a text colour on a paper surface: the day tokens, or the night block under the paper scope
const PAPER_TOKENS = {
  monstadt: { selector: THEME_SELECTORS.monstadt, t: tokens(THEME_SELECTORS.monstadt) },
  "nodkrai-night": { selector: THEME_SELECTORS["nodkrai-night"], t: scoped(THEME_SELECTORS["nodkrai-night"], PAPER_SELECTOR) },
} as const;

describe.each(Object.entries(BLURRED_EXTREMES))("%s: text on paper over the blurred painting", (name, ground) => {
  const { selector, t } = PAPER_TOKENS[name as keyof typeof PAPER_TOKENS];
  const alpha = paperAlpha(selector);
  const papers = [rawToken(selector, "paper-top"), rawToken(selector, "paper-bottom")];

  it("reads the paper tokens (the parser works) and a paper that is mostly there but still see-through", () => {
    for (const c of papers) expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(alpha).toBeGreaterThan(0.5);
    expect(alpha).toBeLessThan(1);
  });

  it("is measured with the blur the panel really has", () => {
    expect(paperBlur(selector)).toBe(ground.blur);
  });

  it("keeps every text colour at 4.5:1 on the top and the bottom of the paper, over the darkest and the brightest ground", () => {
    for (const g of [ground.dark, ground.bright]) {
      for (const paper of papers) {
        const surface = blend(paper, g, alpha);
        for (const ink of INKS) expect(contrastRatio(t[ink], surface), `${ink} on paper ${paper} over ${g}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("keeps the success and warning marks at 3:1", () => {
    for (const g of [ground.dark, ground.bright]) {
      for (const paper of papers) {
        const surface = blend(paper, g, alpha);
        for (const mark of ["success", "warning"]) expect(contrastRatio(t[mark], surface), `${mark} on paper ${paper} over ${g}`).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

// ── Chrome over the painting ─────────────────────────────────────────────────
// The sidebar and music bar are a wash at --chrome-a (98 % cream by day, opaque indigo at night),
// the top bar at --topbar-a (a cream bar by day, none at night), the pills at --pill-a (100 % by
// day, 78 % at night). None of them is blurred, so the sharp extremes above apply.
describe.each(Object.entries(WALLPAPER_EXTREMES))("%s: chrome over the worst of the wallpaper", (name, extremes) => {
  const selector = THEME_SELECTORS[name as keyof typeof THEME_SELECTORS];
  const t = tokens(selector);

  it("keeps the page inks at 4.5:1 on the sidebar and the music bar, both ends, over the darkest and the brightest ground", () => {
    const alpha = percentToken(selector, "chrome-a");
    for (const g of [extremes.dark, extremes.bright]) {
      for (const end of [t["chrome-top"], t["chrome-bottom"]]) {
        const surface = blend(end, g, alpha);
        for (const ink of ["ink-primary", "ink-secondary", "ink-muted", "accent-strong", "danger"]) {
          expect(contrastRatio(t[ink], surface), `${ink} on chrome ${end} over ${g}`).toBeGreaterThanOrEqual(4.5);
        }
        expect(contrastRatio(t["logo-ink"], surface), `logo on chrome over ${g}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("keeps the text on a pill, and on a hovered pill, at 4.5:1 over the darkest and the brightest ground", () => {
    const alpha = percentToken(selector, "pill-a");
    for (const g of [extremes.dark, extremes.bright]) {
      for (const bg of [t["pill-bg"], t["pill-hover"]]) {
        expect(contrastRatio(t["pill-ink"], blend(bg, g, alpha)), `pill-ink on ${bg} over ${g}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("keeps the text on the top bar itself (where it has a fill) at 4.5:1", () => {
    const alpha = percentToken(selector, "topbar-a");
    if (alpha === 0) return; // no bar: the text sits on pills, held above
    for (const g of [extremes.dark, extremes.bright]) {
      const surface = blend(t["topbar-top"], g, alpha);
      for (const ink of ["ink-primary", "ink-secondary", "ink-muted"]) expect(contrastRatio(t[ink], surface), `${ink} on top bar over ${g}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("the paper the Figma frames show, measured", () => {
  // Figma has Nod-Krai paper at 70 % (Diary) and 46 % (Timetable panel) and Monstadt at 78 %. They
  // look right and fail: the first number that holds is the one in globals.css, and what this
  // measures is the gap, so a decision to go lower is made knowing it.
  it("Nod-Krai at 70 %: the muted ink falls below 4.5:1 over the darkest blurred painting", () => {
    const { t } = PAPER_TOKENS["nodkrai-night"];
    const surface = blend(rawToken(THEME_SELECTORS["nodkrai-night"], "paper-bottom"), BLURRED_EXTREMES["nodkrai-night"].dark, 0.7);
    expect(contrastRatio(t["ink-muted"], surface)).toBeLessThan(4.5);
  });
  it("Nod-Krai at 46 % (the Timetable panel): even the heading ink misses 4.5:1", () => {
    const { t } = PAPER_TOKENS["nodkrai-night"];
    const surface = blend(rawToken(THEME_SELECTORS["nodkrai-night"], "paper-bottom"), BLURRED_EXTREMES["nodkrai-night"].dark, 0.46);
    expect(contrastRatio(t["ink-primary"], surface)).toBeLessThan(4.5);
  });
  it("Monstadt at 78 %: the muted ink and the red (danger) text fall below 4.5:1", () => {
    const { t } = PAPER_TOKENS.monstadt;
    const surface = blend(rawToken(THEME_SELECTORS.monstadt, "paper-bottom"), BLURRED_EXTREMES.monstadt.dark, 0.78);
    expect(contrastRatio(t["ink-muted"], surface)).toBeLessThan(4.5);
    expect(contrastRatio(t["danger"], surface)).toBeLessThan(4.5);
  });
});

describe("the paper's frame and watermark tokens", () => {
  const FRAME_PICTURES = ["frame-corner-img", "frame-edge-h-img", "frame-edge-v-img", "frame-medal-h-img", "frame-medal-v-img", "panel-mark-img"];
  it.each(Object.values(THEME_SELECTORS))("%s names every piece (a piece it does not draw is 'none' with size 0)", (selector) => {
    for (const name of FRAME_PICTURES) expect(rawToken(selector, name), name).toMatch(/^(none|url\("\/assets\/ui\/frame\/[a-z0-9-]+\.(webp|svg)"\))$/);
    for (const [img, size] of [
      ["frame-edge-h-img", "frame-edge-h-thick"],
      ["frame-edge-v-img", "frame-edge-v-thick"],
      ["frame-medal-h-img", "frame-medal-h-w"],
      ["frame-medal-v-img", "frame-medal-v-w"],
    ]) {
      // a picture that is not there has no size (or the empty box would still push the layout)
      if (rawToken(selector, img) === "none") expect(rawToken(selector, size), size).toBe("0px");
      else expect(rawToken(selector, size), size).not.toBe("0px");
    }
  });
  it("the Nod-Krai frame is sized by one scale, --fs", () => {
    const sel = THEME_SELECTORS["nodkrai-night"];
    for (const name of ["frame-corner-size", "frame-edge-h-thick", "frame-edge-v-thick", "frame-medal-h-w", "frame-medal-v-h", "paper-inset-x"]) {
      expect(rawToken(sel, name), name).toContain("var(--fs)");
    }
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
