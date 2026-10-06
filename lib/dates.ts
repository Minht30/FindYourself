// Date helpers for the week view and for calendar days (plain "YYYY-MM-DD"
// strings). Weeks start on Monday, matching the Google Calendar convention the
// design borrows from.
//
// Nothing here reads the BROWSER's time zone: every function that needs a zone
// is given one (see lib/zoned.ts for the wall-clock maths in a named zone), so
// the app can work in a zone the person chose rather than the one their device
// happens to be set to.

export const HOUR_HEIGHT_PX = 56;
export const DAY_START_HOUR = 6;   // 6 AM — first row rendered
export const DAY_END_HOUR = 23;    // 11 PM — last row rendered (exclusive of 24)
export const HOURS_IN_VIEW = DAY_END_HOUR - DAY_START_HOUR;

export function formatHour(hour24: number): string {
  const h = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const suffix = hour24 < 12 ? "AM" : "PM";
  return `${h} ${suffix}`;
}

// Given minutes from midnight, return pixel offset inside the day column
// (whose top corresponds to DAY_START_HOUR).
export function minutesToPx(minutes: number): number {
  return ((minutes - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT_PX;
}

// ── Day-level helpers (diary) ────────────────────────────────────────────────
// Diary days are calendar dates, not instants, so they travel as plain
// "YYYY-MM-DD" strings. All arithmetic below is done in UTC on purpose: a
// date string has no timezone, and UTC math never hits a DST gap.

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Strict YYYY-MM-DD check. Rejects shapes like "2026-9-1" and impossible
// dates like "2026-02-31" (which Date would silently roll into March).
export function isValidISODate(s: string | undefined | null): s is string {
  if (!s || !ISO_DATE_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function shiftISODate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

// Today's calendar date in an IANA timezone. Falls back to UTC if the zone
// name is unknown to the runtime.
export function todayInTimeZone(timeZone: string, now: Date = new Date()): string {
  try {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

// "Tuesday, September 29, 2026"
export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

// Monday = 0 … Sunday = 6 for a YYYY-MM-DD string (weeks start Monday app-wide).
export function isoWeekdayMon0(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

// Offset (ms) of an IANA zone from UTC at a given instant: local wall time
// minus UTC. Positive east of Greenwich.
export function zoneOffsetMs(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUTC = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUTC - (instant - (instant % 1000));
}

// The UTC instant at which calendar day `iso` begins in `timeZone`, e.g. for
// "completed today" range queries. Re-checks the offset at the candidate so
// days that start or end on a DST switch still land on local midnight.
export function zonedDayStartUTC(iso: string, timeZone: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  const wall = Date.UTC(y, m - 1, d);
  let guess = wall - zoneOffsetMs(wall, timeZone);
  guess = wall - zoneOffsetMs(guess, timeZone);
  return new Date(guess);
}

// The UTC instant at which the wall clock in `timeZone` reads `hour`:00 on
// calendar day `iso`. Not midnight + hour hours: on a DST-change day (often a
// Sunday) those differ. Same two-pass offset check as zonedDayStartUTC.
export function zonedInstantUTC(iso: string, hour: number, timeZone: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  const wall = Date.UTC(y, m - 1, d, hour);
  let guess = wall - zoneOffsetMs(wall, timeZone);
  guess = wall - zoneOffsetMs(guess, timeZone);
  return new Date(guess);
}
