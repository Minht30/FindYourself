import { isValidISODate, shiftISODate } from "@/lib/dates";

// The streak itself is computed and stored by the database (migration
// 20261006050028): `streak_count` is the length of the run of consecutive
// active days that ends at `streak_last_date`. The client can never write it.
//
// What the database cannot know without a clock is whether that run is still
// alive *today*. That is this file: a pure function of the stored numbers and
// the user's local "today" (from the fy-tz cookie, like the rest of the app).

export const STREAK_COLUMNS = "streak_count, streak_last_date, streak_best";

export type StoredStreak = { count: number; lastDate: string | null; best: number };

export type StreakView = {
  /** The streak as of today: 0 once a whole day has been missed. */
  current: number;
  /** Today already counts (a diary entry or a completed task). */
  doneToday: boolean;
  /** Alive, but today does not count yet: one thing today keeps it going. */
  atRisk: boolean;
  /** A streak existed and has lapsed (a day was missed). */
  broken: boolean;
  /** How long the lapsed streak was (0 unless `broken`). */
  previous: number;
  best: number;
};

type StreakRow = { streak_count?: unknown; streak_last_date?: unknown; streak_best?: unknown } | null | undefined;

function wholeNumber(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
}

// A profile row (or nothing) into the stored shape. Nothing, or a malformed
// row, is "no streak yet".
export function toStoredStreak(row: StreakRow): StoredStreak {
  const lastDate = isValidISODate(row?.streak_last_date as string | undefined) ? (row!.streak_last_date as string) : null;
  const count = lastDate ? wholeNumber(row?.streak_count) : 0;
  return { count, lastDate, best: Math.max(wholeNumber(row?.streak_best), count) };
}

export function streakView(stored: StoredStreak, today: string): StreakView {
  const { count, lastDate, best } = stored;
  const none = { current: 0, doneToday: false, atRisk: false, broken: false, previous: 0, best };
  if (!lastDate || count <= 0 || !isValidISODate(today)) return none;
  // The database counts in the zone saved on the profile; the page's "today"
  // comes from the browser's cookie. For a moment after travelling they can
  // differ by a day, so a last day at or after today simply counts as today.
  if (lastDate >= today) return { ...none, current: count, doneToday: true };
  if (lastDate === shiftISODate(today, -1)) return { ...none, current: count, atRisk: true };
  return { ...none, broken: true, previous: count };
}

// The one line shown next to the number. Gentle on purpose: a lapsed streak is
// a fresh start, never a reproach.
export function streakMessage(view: StreakView): string {
  if (view.broken) return "Welcome back. A new streak starts with one small thing today.";
  if (view.current === 0) return "Write a diary line or finish a task to start a streak.";
  if (view.atRisk) return "One diary line or one finished task today keeps it going.";
  return view.current === 1 ? "A streak begins." : "Today counts. See you tomorrow.";
}

export function streakLabel(current: number): string {
  return current === 1 ? "1 day" : `${current} days`;
}
