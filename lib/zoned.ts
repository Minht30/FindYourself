import { isValidISODate, shiftISODate, todayInTimeZone, zoneOffsetMs } from "@/lib/dates";

// Calendar-day and wall-clock maths in a NAMED time zone, for anything that
// has to follow the app's zone (the automatic one or the one a person chose)
// rather than whatever the browser happens to be set to. A calendar day is a
// "YYYY-MM-DD" string; a moment is milliseconds since 1970; minutes are the
// wall-clock minutes since midnight in the zone. Pure, so every zone and every
// clock change can be tested exactly.

const MIN_PER_DAY = 1440;

// The hour of day (0-23) on the wall clock in the zone right now.
export function hourInZone(ms: number, timeZone: string): number {
  return Math.floor(wallMinutes(ms, timeZone) / 60);
}

const pad2 = (n: number) => String(n).padStart(2, "0");

// An <input type="datetime-local"> value ("2026-10-06T17:00") for a stored
// moment, read on the wall clock of `timeZone`; "" for none.
export function toZonedInput(iso: string | null | undefined, timeZone: string): string {
  if (!iso) return "";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "";
  const minutes = wallMinutes(ms, timeZone);
  return `${dayIsoOf(ms, timeZone)}T${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}`;
}

// The reverse: what the person typed (wall clock in `timeZone`) as a UTC ISO
// string, or null when it is not a real date and time.
export function fromZonedInput(value: string, timeZone: string): string | null {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m || !isValidISODate(m[1])) return null;
  const h = Number(m[2]);
  const min = Number(m[3]);
  if (h > 23 || min > 59) return null;
  return wallToInstant(m[1], h * 60 + min, timeZone).toISOString();
}

export function dayIsoOf(ms: number, timeZone: string): string {
  return todayInTimeZone(timeZone, new Date(ms));
}

// Wall-clock minutes since local midnight, 0..1439.
export function wallMinutes(ms: number, timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(ms));
    const h = Number(parts.find((p) => p.type === "hour")?.value);
    const m = Number(parts.find((p) => p.type === "minute")?.value);
    return Number.isFinite(h) && Number.isFinite(m) ? (h % 24) * 60 + m : 0;
  } catch {
    const d = new Date(ms);
    return d.getUTCHours() * 60 + d.getUTCMinutes();
  }
}

// Whole days from `aIso` to `bIso` (negative if b is earlier).
export function dayDiff(aIso: string, bIso: string): number {
  const [ay, am, ad] = aIso.split("-").map(Number);
  const [by, bm, bd] = bIso.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

// Minutes from the start of local day `dayIso` to the moment `ms`, by the wall
// clock: a block that runs past midnight has an end beyond 1440, a moment on an
// earlier day is negative. (Wall-clock, not elapsed: on a clock-change day the
// two differ by an hour, and the grid is drawn by the wall clock.)
export function minutesIntoDay(ms: number, dayIso: string, timeZone: string): number {
  return dayDiff(dayIso, dayIsoOf(ms, timeZone)) * MIN_PER_DAY + wallMinutes(ms, timeZone);
}

// The moment at which the wall clock in `timeZone` reads `minutes` after
// midnight on `dayIso` (`minutes` may be negative or above 1440 to reach the
// neighbouring days). Same two-pass offset check as zonedDayStartUTC.
export function wallToInstant(dayIso: string, minutes: number, timeZone: string): Date {
  const [y, m, d] = dayIso.split("-").map(Number);
  const wall = Date.UTC(y, m - 1, d, 0, minutes);
  let guess = wall - zoneOffsetMs(wall, timeZone);
  guess = wall - zoneOffsetMs(guess, timeZone);
  return new Date(guess);
}

// The Monday of the week to show: the `?week=` date's week if it is a real
// date, else the week holding `todayIso`.
export function weekMondayFromParam(param: string | null | undefined, todayIso: string): string {
  const base = isValidISODate(param) ? param : todayIso;
  const [y, m, d] = base.split("-").map(Number);
  const weekday = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // Monday = 0
  return shiftISODate(base, -weekday);
}

export function weekDayIsos(mondayIso: string): string[] {
  return Array.from({ length: 7 }, (_, i) => shiftISODate(mondayIso, i));
}

export function dayOfMonth(iso: string): number {
  return Number(iso.slice(8, 10));
}

const MONTH = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
function monthShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return MONTH.format(new Date(Date.UTC(y, m - 1, d)));
}

// "Oct 5 – 11, 2026", or "Sep 28 – Oct 4, 2026" when the week spans two months.
export function formatWeekRangeIso(mondayIso: string): string {
  const sunday = shiftISODate(mondayIso, 6);
  const year = sunday.slice(0, 4);
  const a = monthShort(mondayIso);
  const b = monthShort(sunday);
  return a === b
    ? `${a} ${dayOfMonth(mondayIso)} – ${dayOfMonth(sunday)}, ${year}`
    : `${a} ${dayOfMonth(mondayIso)} – ${b} ${dayOfMonth(sunday)}, ${year}`;
}

// "EDT", "GMT+9", "UTC": the zone's short name at that moment.
export function zoneAbbrev(timeZone: string, ms: number): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" }).formatToParts(new Date(ms));
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

// "9:30 AM" for a wall-clock minute count.
export function formatWallMinutes(minutes: number): string {
  const m = ((Math.round(minutes) % MIN_PER_DAY) + MIN_PER_DAY) % MIN_PER_DAY;
  const h24 = Math.floor(m / 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m % 60).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
}
