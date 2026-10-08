import { DEFAULT_THEME_PREFS, dayNightOf, isThemeName, parseThemePrefs, resolveTheme, themeFor, type ThemeName, type ThemePrefs } from "@/lib/theme";
import { zoneFromCookie } from "@/lib/timezone";

// Two cookies carry the theme to the server, which has no browser to ask (the
// same idea as the time zone's `fy-tz`):
//   fy-theme-pref  what the person chose: "mode:dayRegion:nightRegion", e.g. "auto:monstadt:nodkrai"
//   fy-theme       the theme showing right now, written by the page on every load and
//                  every change of day or night. Only the very first request of a new
//                  visitor needs it: the server does not know their zone yet.
// The profile holds the same choice (`theme_mode`, `day_region`, `night_region`),
// so it follows a person to every device (ThemeSync copies it into the cookie).
export const THEME_PREF_COOKIE = "fy-theme-pref";
export const THEME_COOKIE = "fy-theme";

export function serializePrefs(prefs: ThemePrefs): string {
  return `${prefs.mode}:${prefs.dayRegion}:${prefs.nightRegion}`;
}

// A cookie value into prefs, or null when it is missing or not a choice the app can draw
// (a stale region, a hand-edited cookie): the caller then falls back to the defaults.
export function parsePrefsCookie(raw: string | undefined | null): ThemePrefs | null {
  if (!raw) return null;
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const [mode, dayRegion, nightRegion, ...extra] = value.split(":");
  if (extra.length > 0) return null;
  const parsed = parseThemePrefs({ mode, dayRegion, nightRegion });
  return parsed.ok ? parsed.prefs : null;
}

export function prefsOrDefault(raw: string | undefined | null): ThemePrefs {
  return parsePrefsCookie(raw) ?? DEFAULT_THEME_PREFS;
}

export type ServerThemeInput = {
  /** Raw `fy-theme-pref` cookie value. */
  pref: string | undefined | null;
  /** Raw `fy-theme` cookie value. */
  theme: string | undefined | null;
  /** Raw `fy-tz` cookie value. */
  zone: string | undefined | null;
  nowMs: number;
};

// The theme the server paints on <html>. A fixed mode needs no clock. Auto reads
// the clock in the person's zone; with no zone yet (a first visit) it uses the
// theme the page last wrote, and failing that UTC. The inline script in the head
// knows the real zone and corrects it before the first paint.
export function serverTheme({ pref, theme, zone, nowMs }: ServerThemeInput): ThemeName {
  const prefs = prefsOrDefault(pref);
  if (prefs.mode !== "auto") return resolveTheme(prefs, nowMs, "UTC");
  const known = zoneFromCookie(zone);
  if (known) return resolveTheme(prefs, nowMs, known);
  const last = themeCookieValue(theme);
  if (last && themeFor(dayNightOf(last), prefs) === last) return last;
  return resolveTheme(prefs, nowMs, "UTC");
}

export function themeCookieValue(raw: string | undefined | null): ThemeName | null {
  if (!raw) return null;
  try {
    const value = decodeURIComponent(raw);
    return isThemeName(value) ? value : null;
  } catch {
    return null;
  }
}
