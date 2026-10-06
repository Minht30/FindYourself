import { formatLongDate, isValidISODate, isoWeekdayMon0, shiftISODate } from "@/lib/dates";

// The sidebar's month calendar: a day-picker that jumps the timetable to that
// week (or the diary to that day). Pure: dates in, cells and links out. Weeks
// start on Monday, like the rest of the app. All dates are plain YYYY-MM-DD
// strings (a calendar day has no time zone).

export type MonthCell = { iso: string; day: number; inMonth: boolean };

const SIX_WEEKS = 6; // a fixed height, so the widget never jumps between months

export function firstOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function shiftMonth(firstISO: string, delta: number): string {
  const [y, m] = firstISO.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 10);
}

export function weekMonday(iso: string): string {
  return shiftISODate(iso, -isoWeekdayMon0(iso));
}

// Six Monday-first rows that cover the month; days of the neighbouring months
// fill the corners and are marked `inMonth: false`.
export function monthGrid(firstISO: string): MonthCell[][] {
  const start = weekMonday(firstISO);
  const month = firstISO.slice(0, 7);
  return Array.from({ length: SIX_WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const iso = shiftISODate(start, w * 7 + d);
      return { iso, day: Number(iso.slice(8)), inMonth: iso.startsWith(month) };
    }),
  );
}

const MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
export function monthLabel(firstISO: string): string {
  const [y, m] = firstISO.split("-").map(Number);
  return MONTH_FMT.format(new Date(Date.UTC(y, m - 1, 1)));
}

export function dayLabel(iso: string): string {
  return formatLongDate(iso);
}

export type Selection = { kind: "week"; monday: string } | { kind: "day"; iso: string } | null;

function pathIs(pathname: string | null | undefined, base: string): boolean {
  return pathname === base || !!pathname?.startsWith(base + "/");
}

// What the current page is showing: the timetable shows a week (`?week=`, or
// this week), the diary a day (`/diary/DATE`, or today). Other pages show none.
export function selectionFor(pathname: string | null | undefined, weekParam: string | null | undefined, today: string | null): Selection {
  if (pathIs(pathname, "/today")) {
    if (isValidISODate(weekParam)) return { kind: "week", monday: weekMonday(weekParam) };
    return today ? { kind: "week", monday: weekMonday(today) } : null;
  }
  if (pathIs(pathname, "/diary")) {
    const fromPath = pathname?.split("/")[2];
    if (isValidISODate(fromPath)) return { kind: "day", iso: fromPath };
    return today ? { kind: "day", iso: today } : null;
  }
  return null;
}

// Which month to show: the one holding the selection (the middle of a week, so
// a week that straddles two months shows the one it mostly belongs to), else
// the month of today.
export function anchorMonth(selection: Selection, today: string | null): string | null {
  if (selection?.kind === "week") return firstOfMonth(shiftISODate(selection.monday, 3));
  if (selection?.kind === "day") return firstOfMonth(selection.iso);
  return today ? firstOfMonth(today) : null;
}

// Where a click on a day goes: the diary opens that day; everywhere else the
// timetable opens the week that holds it.
export function dayHref(pathname: string | null | undefined, iso: string): string {
  return pathIs(pathname, "/diary") ? `/diary/${iso}` : `/today?week=${iso}`;
}

// The diary does not take entries for days that have not happened yet.
export function isDayDisabled(pathname: string | null | undefined, iso: string, today: string | null): boolean {
  return pathIs(pathname, "/diary") && today !== null && iso > today;
}

export function isInSelection(selection: Selection, iso: string): boolean {
  if (!selection) return false;
  if (selection.kind === "day") return selection.iso === iso;
  return iso >= selection.monday && iso <= shiftISODate(selection.monday, 6);
}

export const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;
