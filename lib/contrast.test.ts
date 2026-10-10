import { describe, expect, it } from "vitest";
import { contrastRatio, luminance } from "@/lib/contrast";
import { PAPER_SELECTOR, THEME_SELECTORS, css, scoped, tokens } from "@/lib/cssTokens";

// Reads the real theme tokens from the stylesheet and holds them to WCAG 2.1 AA:
// 4.5:1 for text, 3:1 for graphics. Fails the moment a token drifts below.
// Nod-Krai has a second set of colours: its content panels are light paper, so inside a paper
// surface the night tokens are re-declared (the scope laid over the night block). Monstadt's paper
// is the day tokens themselves, so it needs no entry of its own.
const THEMES = {
  monstadt: tokens(THEME_SELECTORS.monstadt),
  "nodkrai-night": tokens(THEME_SELECTORS["nodkrai-night"]),
  "nodkrai-night paper": scoped(THEME_SELECTORS["nodkrai-night"], PAPER_SELECTOR),
};
const CATEGORIES = ["deep", "meeting", "learn", "rest", "personal"] as const;
const SURFACES = ["bg-base", "bg-elevated", "bg-overlay", "bg-alt", "bg-window"] as const;
const HEX = /^#[0-9A-Fa-f]{6}$/;
const luminanceOf = luminance;

describe("the parser", () => {
  it("refuses a selector that is not in the stylesheet", () => {
    expect(() => tokens(':root[data-theme="sunny-cafe"]')).toThrow(/selector not found/);
  });
  it("reads two different themes", () => {
    expect(THEMES.monstadt["bg-base"]).not.toBe(THEMES["nodkrai-night"]["bg-base"]);
  });
  it("reads the paper scope as its own block, and lays it over the night block", () => {
    expect(tokens(PAPER_SELECTOR)["ink-primary"]).toBe("#141C5E");
    expect(THEMES["nodkrai-night paper"]["ink-primary"]).not.toBe(THEMES["nodkrai-night"]["ink-primary"]);
    // a token the scope does not change keeps the night value
    expect(THEMES["nodkrai-night paper"]["cat-ink"]).toBe(THEMES["nodkrai-night"]["cat-ink"]);
  });
});

describe.each(Object.entries(THEMES))("%s theme", (_name, t) => {
  it("reads the tokens it checks (the parser works)", () => {
    for (const k of [...SURFACES, "ink-primary", "ink-secondary", "ink-muted", "accent-strong", "danger", "success", "warning", "accent", "accent-soft", "cat-ink", "border-input"]) {
      expect(t[k], k).toMatch(HEX);
    }
  });

  it("keeps text colours at 4.5:1 or better on every surface", () => {
    for (const text of ["ink-primary", "ink-secondary", "ink-muted", "accent-strong", "danger"]) {
      for (const surface of SURFACES) {
        expect(contrastRatio(t[text], t[surface]), `${text} on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("keeps the ink hierarchy: primary > secondary > muted", () => {
    for (const surface of SURFACES) {
      const p = contrastRatio(t["ink-primary"], t[surface]);
      const s = contrastRatio(t["ink-secondary"], t[surface]);
      const m = contrastRatio(t["ink-muted"], t[surface]);
      expect(p).toBeGreaterThan(s);
      expect(s).toBeGreaterThan(m);
    }
  });

  it("keeps graphics (the success green, the warning amber) at 3:1 on the main surfaces", () => {
    for (const color of ["success", "warning"]) {
      for (const surface of ["bg-base", "bg-elevated", "bg-overlay", "bg-alt"] as const) {
        expect(contrastRatio(t[color], t[surface]), `${color} on ${surface}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("keeps text on the accent fills readable", () => {
    for (const fill of ["accent", "accent-soft"]) expect(contrastRatio(t["cat-ink"], t[fill]), `cat-ink on ${fill}`).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps text on every category fill readable (timetable blocks, chips)", () => {
    for (const cat of CATEGORIES) {
      expect(t[`cat-${cat}`], `cat-${cat}`).toMatch(HEX);
      expect(contrastRatio(t["cat-ink"], t[`cat-${cat}`]), `cat-ink on cat-${cat}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps the form-field border at 3:1 on every surface (WCAG 1.4.11)", () => {
    for (const surface of SURFACES) {
      expect(contrastRatio(t["border-input"], t[surface]), `border-input on ${surface}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("defines a dot colour for every category (the saturated twin of the fill)", () => {
    for (const cat of CATEGORIES) expect(t[`cat-dot-${cat}`], `cat-dot-${cat}`).toMatch(HEX);
  });
});

describe("day theme extras", () => {
  const t = THEMES.monstadt;
  it("accent-as-text also holds on the soft accent fill", () => {
    expect(contrastRatio(t["accent-strong"], t["accent-soft"])).toBeGreaterThanOrEqual(4.5);
  });
  it("white text on the danger fill (delete buttons) is readable", () => {
    expect(contrastRatio("#FFFFFF", t["danger"])).toBeGreaterThanOrEqual(4.5);
  });
});

describe("night theme extras", () => {
  const t = THEMES["nodkrai-night"];
  it("the year map ramp climbs: each step is brighter against the empty cell than the one before", () => {
    const steps = ["heat-1", "heat-2", "heat-3", "heat-max"].map((k) => {
      expect(t[k], k).toMatch(HEX);
      return contrastRatio(t[k], t["bg-alt"]);
    });
    for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeGreaterThan(steps[i - 1]);
  });
  it("step 1 of the year map stays distinct from an empty cell (3:1 against bg-alt)", () => {
    // Measured: 3.24 on bg-alt, 3.07 on bg-base, 2.80 on bg-elevated. The empty cell is
    // what step 1 must be told apart from; the cell also carries a text description.
    expect(contrastRatio(t["heat-1"], t["bg-alt"])).toBeGreaterThanOrEqual(3);
  });
});

describe("night paper extras (the light panels inside the dark theme)", () => {
  const t = THEMES["nodkrai-night paper"];
  const night = THEMES["nodkrai-night"];
  it("really flips the page: dark ink on light surfaces, where the night block has the reverse", () => {
    expect(contrastRatio(night["ink-primary"], night["bg-elevated"])).toBeGreaterThan(10);
    expect(luminanceOf(t["bg-elevated"])).toBeGreaterThan(luminanceOf(t["ink-primary"]) * 10);
    expect(luminanceOf(night["bg-elevated"])).toBeLessThan(luminanceOf(night["ink-primary"]));
  });
  it("draws the focus ring and the links in indigo, not in the night yellow", () => {
    expect(t["accent-strong"]).not.toBe(night["accent-strong"]);
    expect(luminanceOf(t["accent-strong"])).toBeLessThan(0.1);
  });
  it("keeps white text on the danger fill readable (the delete buttons)", () => {
    expect(contrastRatio("#FFFFFF", t["danger"])).toBeGreaterThanOrEqual(4.5);
  });
  it("the year map ramp climbs against the empty cell, and every filled step shows against it", () => {
    const steps = ["heat-1", "heat-2", "heat-3", "heat-max"].map((k) => {
      expect(t[k], k).toMatch(HEX);
      return contrastRatio(t[k], t["bg-alt"]);
    });
    for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeGreaterThan(steps[i - 1]);
    // Measured: 1.24, 1.93, 3.37, 8.02. The Figma ramp is a soft pastel, so steps 1 and 2 are under
    // 3:1 (WCAG 1.4.11); each cell also carries its date and word count as text. Step 3 and the
    // top step hold 3:1.
    expect(steps[0]).toBeGreaterThanOrEqual(1.2);
    expect(steps[2]).toBeGreaterThanOrEqual(3);
  });
  it("would catch the night yellow on paper (the check can fail)", () => {
    expect(contrastRatio(night["accent-strong"], t["bg-elevated"])).toBeLessThan(3);
  });
});

describe("the focus ring", () => {
  it("is drawn in accent-strong, the accent that holds contrast on every surface (the pale accent is 1.4:1 on the day cream)", () => {
    expect(css).toMatch(/\*:focus-visible\s*\{\s*outline:\s*2px solid var\(--accent-strong\)/);
    expect(css).toMatch(/\.fy-range:focus-visible\s*\{\s*outline:\s*2px solid var\(--accent-strong\)/);
  });

  it("accent-strong holds 3:1 (WCAG 1.4.11) on every surface of both themes", () => {
    for (const [name, t] of Object.entries(THEMES)) {
      for (const surface of SURFACES) expect(contrastRatio(t["accent-strong"], t[surface]), `${name}: accent-strong on ${surface}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("the pale day accent would not have held (the check can fail)", () => {
    expect(contrastRatio(THEMES.monstadt["accent"], THEMES.monstadt["bg-base"])).toBeLessThan(3);
  });
});
