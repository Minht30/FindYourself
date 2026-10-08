import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FEATURES } from "@/lib/landingCopy";
import { NIGHT_CLOUDS } from "@/lib/scene/layout";

// Everything in public/ is served to every visitor, so only finished, used, web-format art
// belongs there. Originals, sheets and stand-ins live in design-sources/ (git-ignored).
const root = path.resolve(__dirname, "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function sourceText(): string {
  let text = "";
  for (const base of ["app", "components", "lib"]) {
    for (const file of walk(path.join(root, base))) {
      if (/\.(ts|tsx|css)$/.test(file) && !/\.test\.tsx?$/.test(file)) text += readFileSync(file, "utf8") + "\n";
    }
  }
  return text;
}

const files = walk(path.join(root, "public/assets")).filter((f) => !f.endsWith(".gitkeep"));
const src = sourceText();

// files the code names piece by piece (a template, or a name held in a list) rather than as one path
const BUILT = new Set([
  ...FEATURES.flatMap((f) => [`${f.key}-day.webp`, `${f.key}-night.webp`]),
  ...NIGHT_CLOUDS.map((c) => c.file),
]);

describe("public/assets", () => {
  it("has art in it (the walk works)", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it("ships only web formats: WebP for pictures, SVG for the spirit", () => {
    for (const f of files) expect(f, f).toMatch(/\.(webp|svg)$/);
  });

  it("ships nothing the code does not use (originals and unused crops belong in design-sources)", () => {
    const unused = files.map((f) => path.basename(f)).filter((name) => !BUILT.has(name) && !src.includes(name));
    expect(unused).toEqual([]);
  });

  it("keeps every file under 600 KB and the whole folder under 2.5 MB", () => {
    let total = 0;
    for (const f of files) {
      const size = statSync(f).size;
      total += size;
      expect(size, f).toBeLessThan(600_000);
    }
    expect(total).toBeLessThan(2_500_000);
  });

  it("the files built from names exist (so the exceptions above are real)", () => {
    const names = new Set(files.map((f) => path.basename(f)));
    for (const n of BUILT) expect(names.has(n), n).toBe(true);
  });
});
