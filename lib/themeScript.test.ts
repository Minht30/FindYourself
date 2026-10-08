import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { DAY_REGIONS, NIGHT_REGIONS, THEME_MODES, resolveTheme, themeFor, type ThemePrefs } from "@/lib/theme";
import { THEME_COOKIE, THEME_PREF_COOKIE, parsePrefsCookie, prefsOrDefault, serializePrefs } from "@/lib/themeCookies";
import { themeInitScript } from "@/lib/themeScript";

// Runs the real inline script in a sandbox with a fake document, cookie jar,
// localStorage, clock and browser zone, and reports what it did.
type Run = { cookies?: Record<string, string>; legacy?: string; nowMs: number; browserZone?: string };

function runScript({ cookies = {}, legacy, nowMs, browserZone = "UTC" }: Run) {
  const jar = new Map(Object.entries(cookies));
  const attrs = new Map<string, string>();
  const store = new Map<string, string>(legacy === undefined ? [] : [["fy-theme", legacy]]);
  const document = {
    get cookie() {
      return [...jar].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("; ");
    },
    set cookie(line: string) {
      const [pair] = line.split(";");
      const i = pair.indexOf("=");
      jar.set(pair.slice(0, i), decodeURIComponent(pair.slice(i + 1)));
    },
    documentElement: { setAttribute: (k: string, v: string) => attrs.set(k, v) },
  };
  const RealIntl = Intl;
  const FakeIntl = {
    DateTimeFormat: function (locale?: string, options?: Intl.DateTimeFormatOptions) {
      if (locale === undefined && options === undefined) return { resolvedOptions: () => ({ timeZone: browserZone }) };
      return new RealIntl.DateTimeFormat(locale, options);
    },
  };
  // `new Date()` with no argument is the pretend "now"; with an argument it is a real Date.
  class FakeDate extends Date {
    constructor(...args: unknown[]) {
      super(...((args.length ? args : [nowMs]) as [number]));
    }
  }
  const localStorage = { getItem: (k: string) => store.get(k) ?? null, removeItem: (k: string) => void store.delete(k) };
  vm.runInNewContext(themeInitScript(), { document, Intl: FakeIntl, Date: FakeDate, localStorage, decodeURIComponent, encodeURIComponent, RegExp, parseInt });
  return { theme: attrs.get("data-theme"), cookies: Object.fromEntries(jar), legacyLeft: store.get("fy-theme") };
}

const ZONES = ["UTC", "America/Toronto", "Asia/Ho_Chi_Minh", "Pacific/Auckland", "Pacific/Pago_Pago", "Asia/Kolkata"];

describe("the inline theme script agrees with resolveTheme", () => {
  it("at every half hour across the clock changes of Toronto and Auckland, in every zone", () => {
    // Toronto changes its clock on 2026-03-08 and 2026-11-01; Auckland on 2026-04-05 and 2026-09-27.
    const starts = [Date.UTC(2026, 2, 7), Date.UTC(2026, 9, 31), Date.UTC(2026, 3, 4), Date.UTC(2026, 8, 26)];
    const prefs: ThemePrefs = { mode: "auto", dayRegion: "monstadt", nightRegion: "nodkrai" };
    let checked = 0;
    for (const start of starts) {
      for (let t = start; t < start + 3 * 86_400_000; t += 30 * 60_000) {
        for (const zone of ZONES) {
          const got = runScript({ cookies: { [THEME_PREF_COOKIE]: serializePrefs(prefs) }, nowMs: t, browserZone: zone });
          expect(got.theme, `${zone} at ${new Date(t).toISOString()}`).toBe(resolveTheme(prefs, t, zone));
          checked++;
        }
      }
    }
    // 4 windows of 3 days at 30 minutes (144 instants each), in 6 zones: the loop really ran
    expect(checked).toBe(starts.length * 144 * ZONES.length);
  });

  it("at the exact boundaries: 17:59, 18:00, 05:59 and 06:00 local", () => {
    // Toronto is UTC-4 on 2026-10-08.
    const at = (h: number, m: number) => Date.UTC(2026, 9, 8, h + 4, m);
    const expected: [number, number, string][] = [
      [17, 59, "monstadt"],
      [18, 0, "nodkrai-night"],
      [5, 59, "nodkrai-night"],
      [6, 0, "monstadt"],
    ];
    for (const [h, m, theme] of expected) {
      expect(runScript({ nowMs: at(h, m), browserZone: "America/Toronto" }).theme, `${h}:${m}`).toBe(theme);
    }
  });

  it("a fixed mode ignores the clock", () => {
    for (const mode of THEME_MODES.filter((m) => m !== "auto")) {
      for (const dayRegion of DAY_REGIONS) {
        for (const nightRegion of NIGHT_REGIONS) {
          const prefs: ThemePrefs = { mode, dayRegion, nightRegion };
          for (const hour of [3, 12, 20]) {
            const got = runScript({ cookies: { [THEME_PREF_COOKIE]: serializePrefs(prefs) }, nowMs: Date.UTC(2026, 9, 8, hour), browserZone: "UTC" });
            expect(got.theme).toBe(themeFor(mode === "night" ? "night" : "day", prefs));
          }
        }
      }
    }
  });

  it("the first visit with no cookies: 20:00 on the visitor's clock is night, whatever the server thought", () => {
    // 20:00 in Toronto is 00:00 UTC; a server with no zone would have guessed day from a UTC afternoon.
    const got = runScript({ nowMs: Date.UTC(2026, 9, 9, 0, 0), browserZone: "America/Toronto" });
    expect(got.theme).toBe("nodkrai-night");
    expect(got.cookies[THEME_COOKIE]).toBe("nodkrai-night");
  });

  it("a zone the person chose in Settings (fy-tz-manual) wins over the browser's", () => {
    // 12:00 UTC is day on a Toronto device, but the person pinned Auckland, where it is 01:00 (night)
    const got = runScript({ cookies: { "fy-tz-manual": "Pacific/Auckland" }, nowMs: Date.UTC(2026, 9, 8, 12, 0), browserZone: "America/Toronto" });
    expect(got.theme).toBe("nodkrai-night");
  });

  it("an unknown manual zone is ignored (the browser's is used), and an unknown browser zone reads as UTC", () => {
    expect(runScript({ cookies: { "fy-tz-manual": "Narnia/Lamppost" }, nowMs: Date.UTC(2026, 9, 9, 0, 0), browserZone: "America/Toronto" }).theme).toBe("nodkrai-night");
    expect(runScript({ nowMs: Date.UTC(2026, 9, 8, 20, 0), browserZone: "Narnia/Lamppost" }).theme).toBe("nodkrai-night");
    expect(runScript({ nowMs: Date.UTC(2026, 9, 8, 12, 0), browserZone: "Narnia/Lamppost" }).theme).toBe("monstadt");
  });

  it("a bad preference cookie is read as the defaults, exactly as the server reads it", () => {
    for (const bad of ["dusk:monstadt:nodkrai", "auto:liyue:nodkrai", "night", "night:monstadt:nodkrai:x", "x"]) {
      expect(parsePrefsCookie(bad)).toBeNull();
      const t = Date.UTC(2026, 9, 8, 20, 0);
      expect(runScript({ cookies: { [THEME_PREF_COOKIE]: bad }, nowMs: t }).theme, bad).toBe(resolveTheme(prefsOrDefault(bad), t, "UTC"));
    }
  });
});

describe("moving the old localStorage choice (once)", () => {
  const noon = Date.UTC(2026, 9, 8, 12, 0);

  it.each([
    ["netcafe-night", "night", "nodkrai-night"],
    ["nodkrai-night", "night", "nodkrai-night"],
    ["sunny-cafe", "day", "monstadt"],
    ["monstadt", "day", "monstadt"],
  ])("%s becomes the %s mode and the old key is removed", (old, mode, theme) => {
    const got = runScript({ legacy: old, nowMs: noon });
    expect(got.theme).toBe(theme);
    expect(got.cookies[THEME_PREF_COOKIE]).toBe(`${mode}:monstadt:nodkrai`);
    expect(got.legacyLeft).toBeUndefined();
  });

  it("an unknown old value is dropped without choosing anything", () => {
    const got = runScript({ legacy: "solarized", nowMs: noon });
    expect(got.cookies[THEME_PREF_COOKIE]).toBeUndefined();
    expect(got.legacyLeft).toBeUndefined();
    expect(got.theme).toBe("monstadt");
  });

  it("never overrides a choice already in the cookie", () => {
    const got = runScript({ legacy: "sunny-cafe", cookies: { [THEME_PREF_COOKIE]: "night:monstadt:nodkrai" }, nowMs: noon });
    expect(got.theme).toBe("nodkrai-night");
    expect(got.cookies[THEME_PREF_COOKIE]).toBe("night:monstadt:nodkrai");
    expect(got.legacyLeft).toBeUndefined();
  });
});
