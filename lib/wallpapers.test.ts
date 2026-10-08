import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { css } from "@/lib/cssTokens";
import { THEME_NAMES } from "@/lib/theme";
import { PHONE_MAX_WIDTH, WALLPAPERS } from "@/lib/wallpapers";

const publicDir = path.resolve(__dirname, "../public");

describe("the wallpapers", () => {
  it("has a painting for every theme", () => {
    expect(Object.keys(WALLPAPERS).sort()).toEqual([...THEME_NAMES].sort());
  });

  it.each(THEME_NAMES.flatMap((t) => [WALLPAPERS[t].src, WALLPAPERS[t].phoneSrc].filter((x): x is string => !!x)))("%s exists, is a WebP, and is not enormous", (src) => {
    const file = path.join(publicDir, src);
    expect(existsSync(file), file).toBe(true);
    expect(src).toMatch(/\.webp$/);
    expect(statSync(file).size).toBeLessThan(700_000);
  });

  it("is the same set of files the stylesheet shows (so the preload warms the right ones)", () => {
    for (const t of THEME_NAMES) {
      const { src, phoneSrc } = WALLPAPERS[t];
      const rule = css.slice(css.indexOf(`.wp-layer[data-wp="${t}"][data-seen]`));
      expect(rule, t).toContain(`url("${src}")`);
      if (phoneSrc) {
        const phone = css.slice(css.indexOf(`@media (max-width: ${PHONE_MAX_WIDTH}px)`));
        expect(phone, t).toContain(`url("${phoneSrc}")`);
      }
    }
  });
});

describe("the stage's motion", () => {
  it("fades the painting over 1.2 s and the panels over 300 ms, and the panel recolour is off under reduced motion", () => {
    expect(css).toMatch(/opacity 1\.2s ease/);
    const guarded = css.slice(css.indexOf("@media (prefers-reduced-motion: no-preference)"));
    expect(guarded.slice(0, 700)).toContain(":root.theme-fade");
    expect(guarded.slice(0, 900)).toMatch(/background-color 300ms/);
  });

  it("does not let the panel recolour override the painting's own fade (it once did)", () => {
    // `transition ... !important` on every element would replace the layers' 1.2 s opacity fade
    const guarded = css.slice(css.indexOf("@media (prefers-reduced-motion: no-preference)"));
    const from = guarded.indexOf(":root.theme-fade");
    const selector = guarded.slice(from, guarded.indexOf("{", from));
    expect(selector).toContain(":not(.wp-stage, .wp-layer, .wp-veil)");
    expect(selector).not.toMatch(/theme-fade \*/);
  });

  it("veils the painting only, never the panels, while a restriction is active", () => {
    expect(css).toMatch(/body:has\(\[data-restriction-active\]\) \.wp-veil\s*\{\s*opacity:\s*1/);
    expect(css).toMatch(/body:has\(\[data-restriction-active\]\) \.wp-layer\s*\{\s*filter:\s*saturate\(0\.85\)/);
    expect(css).toMatch(/\.wp-veil\s*\{[^}]*transition:\s*opacity 600ms/);
  });
});
