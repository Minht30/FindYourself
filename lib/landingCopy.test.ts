import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CARE, FEATURES, GITHUB_URL, HERO, SMALL_ITEMS, THEMES, allCopy } from "@/lib/landingCopy";

const root = path.resolve(__dirname, "..");

describe("the landing page copy", () => {
  it("follows the app's copy rules: no 'please', no 'successfully', no exclamation marks, no em dashes", () => {
    for (const s of allCopy()) {
      expect(s, s).not.toMatch(/\bplease\b/i);
      expect(s, s).not.toMatch(/successfully/i);
      expect(s, s).not.toMatch(/!/);
      expect(s, s).not.toMatch(/—/);
    }
  });

  it("has the three screenshots of each feature, in both themes, as files that exist and are small", () => {
    expect(FEATURES.map((f) => f.key)).toEqual(["timetable", "diary", "focus"]);
    for (const f of FEATURES)
      for (const tag of ["day", "night"]) {
        const file = path.join(root, "public/assets/landing", `${f.key}-${tag}.webp`);
        expect(existsSync(file), file).toBe(true);
        expect(readFileSync(file).length, file).toBeLessThan(120_000);
      }
  });

  it("describes every picture in words (alt text), more than a label", () => {
    for (const f of FEATURES) expect(f.alt.length, f.key).toBeGreaterThan(40);
  });

  it("has the three small items and the three care claims, each a full sentence", () => {
    expect(SMALL_ITEMS).toHaveLength(3);
    expect(CARE).toHaveLength(3);
    for (const x of [...SMALL_ITEMS, ...CARE]) expect(x.text, x.key).toMatch(/\.$/);
  });

  it("states the night hours the app really uses", () => {
    expect(THEMES.text).toContain("18:00 to 06:00");
  });

  it("only claims what the privacy page says (no ads, no analytics, no tracking, no AI, notifications off by default)", () => {
    const privacy = readFileSync(path.join(root, "app/privacy/page.tsx"), "utf8");
    expect(privacy).toMatch(/no ads, no analytics, no tracking cookies/);
    expect(privacy).toMatch(/There is no AI feature in FindYourself/);
    const timer = readFileSync(path.join(root, "lib/focus/timer.ts"), "utf8");
    expect(timer).toMatch(/notifications:\s*false/);
    const calm = CARE.find((c) => c.key === "calm")!.text;
    expect(calm).toMatch(/No ads, no analytics, no tracking, and no AI features/);
    expect(calm).toMatch(/Notifications stay off unless you turn them on/);
  });

  it("says the streak starts fresh with a welcome, as the streak card does", () => {
    const streak = readFileSync(path.join(root, "lib/streak.ts"), "utf8");
    expect(streak).toContain("Welcome back.");
    expect(SMALL_ITEMS.find((i) => i.key === "streak")!.text).toContain("welcome back");
  });

  it("links to the real repository and keeps the hero's words", () => {
    expect(GITHUB_URL).toBe("https://github.com/Minht30/FindYourself");
    expect(HERO.title + " " + HERO.accent).toBe("Plan your day. Find yourself.");
  });
});
