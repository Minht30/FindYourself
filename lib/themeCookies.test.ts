import { describe, expect, it } from "vitest";
import { DAY_REGIONS, DEFAULT_THEME_PREFS, NIGHT_REGIONS, THEME_MODES, type ThemePrefs } from "@/lib/theme";
import { parsePrefsCookie, prefsOrDefault, serializePrefs, serverTheme, themeCookieValue } from "@/lib/themeCookies";

// 2026-10-08 in Toronto (UTC-4): 20:00 local is 00:00 UTC the next day, 12:00 local is 16:00 UTC.
const TORONTO_8PM = Date.UTC(2026, 9, 9, 0, 0);
const TORONTO_NOON = Date.UTC(2026, 9, 8, 16, 0);
const UTC_8PM = Date.UTC(2026, 9, 8, 20, 0);
const UTC_NOON = Date.UTC(2026, 9, 8, 12, 0);

describe("the preference cookie", () => {
  it("round-trips every mode and region the app can draw", () => {
    for (const mode of THEME_MODES) {
      for (const dayRegion of DAY_REGIONS) {
        for (const nightRegion of NIGHT_REGIONS) {
          const prefs: ThemePrefs = { mode, dayRegion, nightRegion };
          expect(parsePrefsCookie(serializePrefs(prefs))).toEqual(prefs);
        }
      }
    }
  });

  it("reads a percent-encoded value (the cookie jar may encode the colons)", () => {
    expect(parsePrefsCookie("night%3Amonstadt%3Anodkrai")).toEqual({ mode: "night", dayRegion: "monstadt", nightRegion: "nodkrai" });
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["a bad mode", "dusk:monstadt:nodkrai"],
    ["a region that is coming soon", "auto:liyue:nodkrai"],
    ["a night region in the day slot", "auto:nodkrai:nodkrai"],
    ["too few parts", "night"],
    ["too many parts", "night:monstadt:nodkrai:extra"],
    ["a broken escape", "%E0%A4%A"],
  ])("falls back to the defaults for %s", (_why, raw) => {
    expect(parsePrefsCookie(raw)).toBeNull();
    expect(prefsOrDefault(raw)).toEqual(DEFAULT_THEME_PREFS);
  });
});

describe("the theme cookie", () => {
  it("accepts only a theme the app can draw", () => {
    expect(themeCookieValue("nodkrai-night")).toBe("nodkrai-night");
    expect(themeCookieValue("monstadt")).toBe("monstadt");
    expect(themeCookieValue("netcafe-night")).toBeNull();
    expect(themeCookieValue("")).toBeNull();
    expect(themeCookieValue(undefined)).toBeNull();
    expect(themeCookieValue("%E0%A4%A")).toBeNull();
  });
});

describe("serverTheme: what the server paints on <html>", () => {
  const base = { pref: "auto:monstadt:nodkrai", theme: undefined, zone: "America%2FToronto" };

  it("auto follows the clock in the person's own zone, not the server's", () => {
    expect(serverTheme({ ...base, nowMs: TORONTO_8PM })).toBe("nodkrai-night");
    expect(serverTheme({ ...base, nowMs: TORONTO_NOON })).toBe("monstadt");
  });

  it("a fixed mode ignores the clock and the zone", () => {
    expect(serverTheme({ ...base, pref: "night:monstadt:nodkrai", nowMs: TORONTO_NOON })).toBe("nodkrai-night");
    expect(serverTheme({ ...base, pref: "day:monstadt:nodkrai", nowMs: TORONTO_8PM })).toBe("monstadt");
  });

  it("no cookies at all (a first visit): the default is auto, read in UTC", () => {
    expect(serverTheme({ pref: undefined, theme: undefined, zone: undefined, nowMs: UTC_8PM })).toBe("nodkrai-night");
    expect(serverTheme({ pref: undefined, theme: undefined, zone: undefined, nowMs: UTC_NOON })).toBe("monstadt");
  });

  it("auto with no zone yet uses the theme the page last wrote, over the UTC guess", () => {
    // 12:00 UTC would say day, but this visitor last saw night (they live somewhere it is evening)
    expect(serverTheme({ pref: "auto:monstadt:nodkrai", theme: "nodkrai-night", zone: undefined, nowMs: UTC_NOON })).toBe("nodkrai-night");
  });

  it("once the zone is known the clock wins over a stale theme cookie", () => {
    expect(serverTheme({ ...base, theme: "nodkrai-night", nowMs: TORONTO_NOON })).toBe("monstadt");
  });

  it("an unknown zone is treated as no zone", () => {
    expect(serverTheme({ pref: "auto:monstadt:nodkrai", theme: undefined, zone: "Narnia%2FLamppost", nowMs: UTC_8PM })).toBe("nodkrai-night");
    expect(serverTheme({ pref: "auto:monstadt:nodkrai", theme: undefined, zone: "Narnia%2FLamppost", nowMs: UTC_NOON })).toBe("monstadt");
  });

  it("garbage in every cookie still paints a real theme", () => {
    expect(serverTheme({ pref: "???", theme: "???", zone: "???", nowMs: UTC_NOON })).toBe("monstadt");
  });
});
