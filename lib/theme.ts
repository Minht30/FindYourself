import { isKnownTimeZone } from "@/lib/timezone";
import { hourInZone } from "@/lib/zoned";

// Which theme the app shows. Two modes, two regions each:
//   Day   -> Monstadt (Liyue later)
//   Night -> Nod-Krai (Natlan later)
// A person picks a mode setting (Day, Night, or Auto = follow the clock) and,
// per mode, a region. Auto follows the wall clock in the app's own zone (the
// one lib/timezone.ts resolves): night from 18:00 up to 06:00. Pure, so every
// boundary and every clock change can be tested exactly.

export const THEME_MODES = ["auto", "day", "night"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export type DayNight = "day" | "night";

// Regions a person can pick today. A region that has no art yet is listed in
// COMING_SOON so the picker can show it, and is refused by name until it moves
// into these lists.
export const DAY_REGIONS = ["monstadt"] as const;
export const NIGHT_REGIONS = ["nodkrai"] as const;
export type DayRegion = (typeof DAY_REGIONS)[number];
export type NightRegion = (typeof NIGHT_REGIONS)[number];

export const COMING_SOON = { day: ["liyue"], night: ["natlan"] } as const;

// The value of <html data-theme>; one per (mode, region) the app can draw.
export const THEME_NAMES = ["monstadt", "nodkrai-night"] as const;
export type ThemeName = (typeof THEME_NAMES)[number];

export type ThemePrefs = { mode: ThemeMode; dayRegion: DayRegion; nightRegion: NightRegion };

export const DEFAULT_THEME_PREFS: ThemePrefs = { mode: "auto", dayRegion: "monstadt", nightRegion: "nodkrai" };

// Night is 18:00 up to (not including) 06:00 on the wall clock.
export const NIGHT_STARTS_AT = 18;
export const NIGHT_ENDS_AT = 6;

export function isNightHour(hour: number): boolean {
  return hour >= NIGHT_STARTS_AT || hour < NIGHT_ENDS_AT;
}

// Day or night right now for a mode setting. Auto reads the clock in `zone`
// (an unknown zone is read as UTC, the same fallback the rest of the app uses).
export function resolveDayNight(mode: ThemeMode, nowMs: number, zone: string): DayNight {
  if (mode === "day") return "day";
  if (mode === "night") return "night";
  return isNightHour(hourInZone(nowMs, isKnownTimeZone(zone) ? zone : "UTC")) ? "night" : "day";
}

// The theme for a day or night, in the person's chosen region for it.
export function themeFor(dayNight: DayNight, prefs: ThemePrefs): ThemeName {
  if (dayNight === "night") {
    switch (prefs.nightRegion) {
      case "nodkrai":
        return "nodkrai-night";
    }
  }
  switch (prefs.dayRegion) {
    case "monstadt":
      return "monstadt";
  }
}

export function resolveTheme(prefs: ThemePrefs, nowMs: number, zone: string): ThemeName {
  return themeFor(resolveDayNight(prefs.mode, nowMs, zone), prefs);
}

export function dayNightOf(theme: ThemeName): DayNight {
  return theme === "nodkrai-night" ? "night" : "day";
}

// The top bar chip toggles what is showing: from day to a fixed night, from
// night to a fixed day. Settings puts it back to Auto.
export function toggledMode(showing: DayNight): ThemeMode {
  return showing === "night" ? "day" : "night";
}

// ── What a "change my theme" request may be ─────────────────────────
export type ThemePrefsResult =
  | { ok: true; prefs: ThemePrefs }
  | { ok: false; reason: "bad_mode" | "bad_region" | "region_unavailable" };

const inList = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === "string" && (list as readonly string[]).includes(v);

// Anything else is refused by name before the profile is touched. A region that
// is known but has no art yet (Liyue, Natlan) is "region_unavailable", so the
// message can say "not available yet" instead of "not a region".
export function parseThemePrefs(input: unknown): ThemePrefsResult {
  if (typeof input !== "object" || input === null) return { ok: false, reason: "bad_mode" };
  const i = input as { mode?: unknown; dayRegion?: unknown; nightRegion?: unknown };
  if (!inList(THEME_MODES, i.mode)) return { ok: false, reason: "bad_mode" };
  for (const [region, list, soon] of [
    [i.dayRegion, DAY_REGIONS, COMING_SOON.day],
    [i.nightRegion, NIGHT_REGIONS, COMING_SOON.night],
  ] as const) {
    if (inList(list, region)) continue;
    return { ok: false, reason: inList(soon, region) ? "region_unavailable" : "bad_region" };
  }
  return { ok: true, prefs: { mode: i.mode, dayRegion: i.dayRegion as DayRegion, nightRegion: i.nightRegion as NightRegion } };
}

// ── Names a person sees ─────────────────────────────────────────────
export const THEME_LABELS: Record<ThemeName, string> = { monstadt: "Monstadt", "nodkrai-night": "Nod-Krai" };

export function isThemeName(v: unknown): v is ThemeName {
  return typeof v === "string" && (THEME_NAMES as readonly string[]).includes(v);
}
