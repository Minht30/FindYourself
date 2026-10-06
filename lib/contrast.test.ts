import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/contrast";

// Reads the real theme tokens from the stylesheet and holds them to WCAG 2.1 AA:
// 4.5:1 for text, 3:1 for graphics. Fails the moment a token drifts below.
const css = readFileSync(path.resolve(__dirname, "../app/globals.css"), "utf8");

function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  const out: Record<string, string> = {};
  for (const m of css.slice(open, close).matchAll(/--([a-z-]+):\s*(#[0-9A-Fa-f]{6})\s*;/g)) out[m[1]] = m[2];
  return out;
}

const THEMES = {
  day: tokens(':root,\n:root[data-theme="sunny-cafe"]'),
  night: tokens(':root[data-theme="netcafe-night"]'),
};
const SURFACES = ["bg-base", "bg-elevated", "bg-overlay", "bg-alt", "bg-window"] as const;

describe.each(Object.entries(THEMES))("%s theme", (_name, t) => {
  it("reads the tokens it checks (the parser works)", () => {
    for (const k of [...SURFACES, "ink-primary", "ink-secondary", "ink-muted", "accent-strong", "danger", "success", "accent", "accent-soft", "cat-ink"]) {
      expect(t[k], k).toMatch(/^#[0-9A-Fa-f]{6}$/);
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
});

describe("day theme extras", () => {
  const t = THEMES.day;
  it("accent-as-text also holds on the soft accent fill", () => {
    expect(contrastRatio(t["accent-strong"], t["accent-soft"])).toBeGreaterThanOrEqual(4.5);
  });
  it("white text on the danger fill (delete buttons) is readable", () => {
    expect(contrastRatio("#FFFFFF", t["danger"])).toBeGreaterThanOrEqual(4.5);
  });
});
