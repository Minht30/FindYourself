// Date helpers for the week view.
// Week starts on Monday (matches the mockup and the Google Calendar convention
// the design borrows from).

export const HOUR_HEIGHT_PX = 56;
export const DAY_START_HOUR = 6;   // 6 AM — first row rendered
export const DAY_END_HOUR = 23;    // 11 PM — last row rendered (exclusive of 24)
export const HOURS_IN_VIEW = DAY_END_HOUR - DAY_START_HOUR;

export function startOfWeekMonday(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const day = out.getDay();               // 0 = Sun ... 6 = Sat
  const diff = day === 0 ? -6 : 1 - day;  // rewind to Monday
  out.setDate(out.getDate() + diff);
  return out;
}

export function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatHour(hour24: number): string {
  const h = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const suffix = hour24 < 12 ? "AM" : "PM";
  return `${h} ${suffix}`;
}

// Minutes elapsed between midnight of `day` and `dt`. May be negative if `dt`
// is before the day, or > 24*60 if after — caller decides whether to clamp.
export function minutesFromDayStart(dt: Date, day: Date): number {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  return Math.round((dt.getTime() - dayStart.getTime()) / 60000);
}

// Given minutes from midnight, return pixel offset inside the day column
// (whose top corresponds to DAY_START_HOUR).
export function minutesToPx(minutes: number): number {
  return ((minutes - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT_PX;
}

export function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short" });
  const startMonth = monthFmt.format(weekStart);
  const endMonth = monthFmt.format(end);
  const year = end.getFullYear();
  if (startMonth === endMonth) {
    return `${startMonth} ${weekStart.getDate()} – ${end.getDate()}, ${year}`;
  }
  return `${startMonth} ${weekStart.getDate()} – ${endMonth} ${end.getDate()}, ${year}`;
}

// Parse ?week=YYYY-MM-DD into a Date anchored at that day, then round to Monday.
// Returns startOfWeek(today) if the param is missing or invalid.
export function parseWeekParam(param: string | undefined | null, now: Date = new Date()): Date {
  if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
    const [y, m, d] = param.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    if (!Number.isNaN(dt.getTime())) return startOfWeekMonday(dt);
  }
  return startOfWeekMonday(now);
}

export function toISODateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
function zoneOffsetMs(instant: number, timeZone: string): number {
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
