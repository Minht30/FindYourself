// Small formatting helpers for the live day / time shown on Chill. Locale and
// time zone are parameters so tests are exact; the app passes neither and gets
// the visitor's own (12 or 24 hour clock, their language, their zone).

export function formatDayLabel(d: Date, locale?: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric", timeZone }).format(d);
}

export function formatTimeLabel(d: Date, locale?: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone }).format(d);
}

// Milliseconds until the minute changes (plus a small cushion so the timer
// never fires a hair early and shows the old minute again). Exactly on the
// boundary it waits a whole minute rather than 0.
const CUSHION_MS = 40;
export function msToNextMinute(now: number): number {
  const into = ((now % 60_000) + 60_000) % 60_000;
  return 60_000 - into + CUSHION_MS;
}
