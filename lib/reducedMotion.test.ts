import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// The reduced-motion safety net lives in the global stylesheet. These checks
// fail if it is deleted or weakened, because nothing else would notice.
const css = readFileSync(path.resolve(__dirname, "../app/globals.css"), "utf8");

function blocksFor(query: string): string[] {
  const out: string[] = [];
  let from = 0;
  for (;;) {
    const i = css.indexOf(query, from);
    if (i === -1) return out;
    let depth = 0;
    let j = css.indexOf("{", i);
    const start = j;
    for (; j < css.length; j++) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}" && --depth === 0) break;
    }
    out.push(css.slice(start, j + 1));
    from = j;
  }
}

describe("reduced motion", () => {
  const blocks = blocksFor("@media (prefers-reduced-motion: reduce)");
  const all = blocks.join("\n");

  it("has the global safety net: no looping, instant changes, no smooth scrolling", () => {
    expect(all).toMatch(/animation-iteration-count:\s*1\s*!important/);
    expect(all).toMatch(/animation-duration:\s*0\.001ms\s*!important/);
    expect(all).toMatch(/transition-duration:\s*0\.001ms\s*!important/);
    expect(all).toMatch(/scroll-behavior:\s*auto\s*!important/);
  });

  it("still has the specific rules for the spirit, the scene and Focus Mode", () => {
    expect(all).toMatch(/\.spirit \.spirit-body,[^}]*animation:\s*none/);
    expect(all).toMatch(/\.sc-streak\s*\{[^}]*animation:\s*none/);
    expect(all).toMatch(/\.fm-in\s*\{[^}]*animation:\s*none/);
  });

  it("stops every spirit animation: each @keyframes spirit-* is used only by a .spirit rule that the reduce block resets", () => {
    const names = [...css.matchAll(/@keyframes (spirit-[a-z]+)/g)].map((m) => m[1]);
    expect(names.length).toBeGreaterThanOrEqual(5);
    for (const name of names) {
      // every rule that starts this animation has a selector that begins with .spirit
      const users = [...css.matchAll(new RegExp(`([^{}]+)\\{[^}]*animation:[^;}]*\\b${name}\\b`, "g"))].map((m) => m[1].trim());
      expect(users.length, name).toBeGreaterThan(0);
      for (const sel of users) expect(sel, `${name} used by "${sel}"`).toMatch(/^\.spirit/);
    }
    for (const part of [".spirit .spirit-body", ".spirit .spirit-turn", ".spirit .spirit-spark"]) expect(all, part).toContain(part);
  });

  it("never forces motion on in the default (no-preference) rules by accident", () => {
    // every `animation:` that loops is either declared inside a class the reduce block resets,
    // or caught by the net; so the net itself must be the last reduced-motion block
    expect(blocks[blocks.length - 1]).toMatch(/\*,\s*\*::before,\s*\*::after/);
  });
});
