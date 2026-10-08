import { describe, expect, it } from "vitest";
import {
  COMING_SOON,
  DAY_REGIONS,
  NIGHT_REGIONS,
  THEME_NAMES,
  dayNightOf,
  isNightHour,
  parseThemePrefs,
  resolveDayNight,
  resolveTheme,
  themeFor,
  toggledMode,
  type ThemePrefs,
} from "@/lib/theme";

const at = (iso: string) => Date.parse(iso);

describe("isNightHour", () => {
  it("is night from 18:00 up to 06:00 and day otherwise, at every edge", () => {
    expect(isNightHour(17)).toBe(false);
    expect(isNightHour(18)).toBe(true);
    expect(isNightHour(23)).toBe(true);
    expect(isNightHour(0)).toBe(true);
    expect(isNightHour(5)).toBe(true);
    expect(isNightHour(6)).toBe(false);
    expect(isNightHour(12)).toBe(false);
  });

  it("splits the 24 hours into 12 night hours and 12 day hours", () => {
    const night = Array.from({ length: 24 }, (_, h) => h).filter(isNightHour);
    expect(night).toHaveLength(12);
  });
});

describe("resolveDayNight", () => {
  it("a fixed mode ignores the clock", () => {
    expect(resolveDayNight("day", at("2026-10-08T23:00:00Z"), "UTC")).toBe("day");
    expect(resolveDayNight("night", at("2026-10-08T12:00:00Z"), "UTC")).toBe("night");
  });

  it("Auto flips at 18:00 and 06:00 on the wall clock, to the minute", () => {
    expect(resolveDayNight("auto", at("2026-10-08T17:59:00Z"), "UTC")).toBe("day");
    expect(resolveDayNight("auto", at("2026-10-08T18:00:00Z"), "UTC")).toBe("night");
    expect(resolveDayNight("auto", at("2026-10-08T05:59:00Z"), "UTC")).toBe("night");
    expect(resolveDayNight("auto", at("2026-10-08T06:00:00Z"), "UTC")).toBe("day");
  });

  it("reads the clock in the person's own zone, not the server's", () => {
    // 11:00 UTC is 18:00 in Ho Chi Minh City (UTC+7), 12:00 in London (BST, UTC+1),
    // 07:00 in New York (EDT, UTC-4) and 01:00 in Honolulu (UTC-10).
    const ms = at("2026-10-08T11:00:00Z");
    expect(resolveDayNight("auto", ms, "Asia/Ho_Chi_Minh")).toBe("night");
    expect(resolveDayNight("auto", ms, "Pacific/Honolulu")).toBe("night");
    expect(resolveDayNight("auto", ms, "America/New_York")).toBe("day");
    expect(resolveDayNight("auto", ms, "Europe/London")).toBe("day");
    // 12:00 UTC is 08:00 in New York and 19:00 in Ho Chi Minh City.
    const noon = at("2026-10-08T12:00:00Z");
    expect(resolveDayNight("auto", noon, "America/New_York")).toBe("day");
    expect(resolveDayNight("auto", noon, "Asia/Ho_Chi_Minh")).toBe("night");
  });

  it("follows a clock change: the 18:00 boundary moves in UTC when the zone changes its offset", () => {
    // New York ends daylight saving on 2026-11-01 (02:00 EDT becomes 01:00 EST).
    expect(resolveDayNight("auto", at("2026-11-01T21:59:00Z"), "America/New_York")).toBe("day"); // 16:59 EST
    expect(resolveDayNight("auto", at("2026-11-01T22:59:00Z"), "America/New_York")).toBe("day"); // 17:59 EST
    expect(resolveDayNight("auto", at("2026-11-01T23:00:00Z"), "America/New_York")).toBe("night"); // 18:00 EST
    // and it begins on 2026-03-08 (02:00 EST becomes 03:00 EDT): 18:00 EDT is 22:00 UTC.
    expect(resolveDayNight("auto", at("2026-03-08T21:59:00Z"), "America/New_York")).toBe("day");
    expect(resolveDayNight("auto", at("2026-03-08T22:00:00Z"), "America/New_York")).toBe("night");
  });

  it("an unknown or empty zone is read as UTC", () => {
    expect(resolveDayNight("auto", at("2026-10-08T18:00:00Z"), "Mars/Phobos")).toBe("night");
    expect(resolveDayNight("auto", at("2026-10-08T12:00:00Z"), "")).toBe("day");
  });
});

describe("themeFor and resolveTheme", () => {
  const prefs: ThemePrefs = { mode: "auto", dayRegion: "monstadt", nightRegion: "nodkrai" };

  it("maps each (mode, region) to a theme the stylesheet knows", () => {
    expect(themeFor("day", prefs)).toBe("monstadt");
    expect(themeFor("night", prefs)).toBe("nodkrai-night");
    for (const d of DAY_REGIONS) expect(THEME_NAMES).toContain(themeFor("day", { ...prefs, dayRegion: d }));
    for (const n of NIGHT_REGIONS) expect(THEME_NAMES).toContain(themeFor("night", { ...prefs, nightRegion: n }));
  });

  it("resolves from the prefs and the clock together", () => {
    expect(resolveTheme(prefs, at("2026-10-08T12:00:00Z"), "UTC")).toBe("monstadt");
    expect(resolveTheme(prefs, at("2026-10-08T22:00:00Z"), "UTC")).toBe("nodkrai-night");
    expect(resolveTheme({ ...prefs, mode: "night" }, at("2026-10-08T12:00:00Z"), "UTC")).toBe("nodkrai-night");
    expect(resolveTheme({ ...prefs, mode: "day" }, at("2026-10-08T22:00:00Z"), "UTC")).toBe("monstadt");
  });

  it("dayNightOf is the inverse of themeFor", () => {
    expect(dayNightOf("monstadt")).toBe("day");
    expect(dayNightOf("nodkrai-night")).toBe("night");
  });

  it("the chip toggles to the opposite of what is showing, as a fixed mode", () => {
    expect(toggledMode("day")).toBe("night");
    expect(toggledMode("night")).toBe("day");
  });
});

describe("parseThemePrefs", () => {
  it("accepts every mode with the regions that have art", () => {
    for (const mode of ["auto", "day", "night"]) {
      expect(parseThemePrefs({ mode, dayRegion: "monstadt", nightRegion: "nodkrai" })).toEqual({
        ok: true,
        prefs: { mode, dayRegion: "monstadt", nightRegion: "nodkrai" },
      });
    }
  });

  it("names why it refuses a mode", () => {
    for (const bad of [null, undefined, 5, "auto", [], {}, { mode: "dusk", dayRegion: "monstadt", nightRegion: "nodkrai" }, { mode: 1, dayRegion: "monstadt", nightRegion: "nodkrai" }]) {
      expect(parseThemePrefs(bad)).toEqual({ ok: false, reason: "bad_mode" });
    }
  });

  it("names why it refuses a region: not a region at all, or a region with no art yet", () => {
    expect(parseThemePrefs({ mode: "auto", dayRegion: "narnia", nightRegion: "nodkrai" })).toEqual({ ok: false, reason: "bad_region" });
    expect(parseThemePrefs({ mode: "auto", dayRegion: "monstadt", nightRegion: "" })).toEqual({ ok: false, reason: "bad_region" });
    expect(parseThemePrefs({ mode: "auto", dayRegion: "monstadt" })).toEqual({ ok: false, reason: "bad_region" });
    // Wrong mode's region: Natlan is a night region, not a day one.
    expect(parseThemePrefs({ mode: "auto", dayRegion: "natlan", nightRegion: "nodkrai" })).toEqual({ ok: false, reason: "bad_region" });
    for (const d of COMING_SOON.day) expect(parseThemePrefs({ mode: "auto", dayRegion: d, nightRegion: "nodkrai" })).toEqual({ ok: false, reason: "region_unavailable" });
    for (const n of COMING_SOON.night) expect(parseThemePrefs({ mode: "night", dayRegion: "monstadt", nightRegion: n })).toEqual({ ok: false, reason: "region_unavailable" });
  });

  it("checks the mode before the regions", () => {
    expect(parseThemePrefs({ mode: "dusk", dayRegion: "narnia", nightRegion: "narnia" })).toEqual({ ok: false, reason: "bad_mode" });
  });
});
