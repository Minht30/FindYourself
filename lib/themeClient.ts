"use client";

import { resolveTheme, type ThemeName, type ThemePrefs } from "@/lib/theme";
import { THEME_COOKIE, THEME_PREF_COOKIE, prefsOrDefault, serializePrefs } from "@/lib/themeCookies";
import { TZ_MANUAL_COOKIE, isKnownTimeZone, zoneFromCookie } from "@/lib/timezone";

// Browser-side theme plumbing: read the choice from its cookie, work out the theme
// right now, put it on <html>, and mirror it for the server's next request.
// (The very first paint is done earlier, by the inline script in the head.)

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? m[1] : null;
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=31536000;samesite=lax`;
}

export function readPrefs(): ThemePrefs {
  return prefsOrDefault(readCookie(THEME_PREF_COOKIE));
}

export function writePrefs(prefs: ThemePrefs) {
  writeCookie(THEME_PREF_COOKIE, serializePrefs(prefs));
}

// The zone the person's clock is read in: the one they pinned in Settings, else the device's.
export function currentZone(): string {
  const manual = zoneFromCookie(readCookie(TZ_MANUAL_COOKIE));
  if (manual) return manual;
  try {
    const browser = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (isKnownTimeZone(browser)) return browser;
  } catch {
    // fall through to UTC
  }
  return "UTC";
}

// Puts the theme for `prefs` (default: the saved choice) on <html> and in the
// `fy-theme` cookie. Returns it.
export function applyTheme(prefs: ThemePrefs = readPrefs()): ThemeName {
  const theme = resolveTheme(prefs, Date.now(), currentZone());
  const root = document.documentElement;
  if (root.getAttribute("data-theme") !== theme) root.setAttribute("data-theme", theme);
  writeCookie(THEME_COOKIE, theme);
  return theme;
}
