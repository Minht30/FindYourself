import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/contrast";
import { THEME_SELECTORS, tokens } from "@/lib/cssTokens";

// Reads the real theme tokens from the stylesheet and holds them to WCAG 2.1 AA:
// 4.5:1 for text, 3:1 for graphics. Fails the moment a token drifts below.
const THEMES = {
  monstadt: tokens(THEME_SELECTORS.monstadt),
  "nodkrai-night": tokens(THEME_SELECTORS["nodkrai-night"]),
};
const CATEGORIES = ["deep", "meeting", "learn", "rest", "personal"] as const;
const SURFACES = ["bg-base", "bg-elevated", "bg-overlay", "bg-alt", "bg-window"] as const;
const HEX = /^#[0-9A-Fa-f]{6}$/;

describe("the parser", () => {
  it("refuses a selector that is not in the stylesheet", () => {
    expect(() => tokens(':root[data-theme="sunny-cafe"]')).toThrow(/selector not found/);
  });
  it("reads two different themes", () => {
    expect(THEMES.monstadt["bg-base"]).not.toBe(THEMES["nodkrai-night"]["bg-base"]);
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
