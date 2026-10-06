import { formatDuration } from "@/lib/focus/week";

// The progress rings on /today: tasks done, focus time against the daily goal,
// and the diary. Pure: counts in, ring descriptions out. The page reads the
// numbers (with the user's own "today"); the component draws them.

export const FOCUS_GOAL_DEFAULT_MINUTES = 120;
export const FOCUS_GOAL_MIN = 15;
export const FOCUS_GOAL_MAX = 720;
export const FOCUS_GOAL_STEP = 5;
// What the picker offers; the database accepts any step of 5 in range.
export const FOCUS_GOAL_PRESETS = [30, 45, 60, 90, 120, 150, 180, 240, 300] as const;

export function isValidFocusGoal(n: unknown): n is number {
  return (
    typeof n === "number" &&
    Number.isInteger(n) &&
    n >= FOCUS_GOAL_MIN &&
    n <= FOCUS_GOAL_MAX &&
    n % FOCUS_GOAL_STEP === 0
  );
}

// A stored value into a usable goal; anything unexpected is the default.
export function sanitizeFocusGoal(raw: unknown): number {
  return isValidFocusGoal(raw) ? raw : FOCUS_GOAL_DEFAULT_MINUTES;
}

export type RingKey = "tasks" | "focus" | "diary";

export type Ring = {
  key: RingKey;
  label: string;
  /** 0 to 1; overshoot is capped at 1. */
  fraction: number;
  /** The number on the ring, e.g. "3 of 5". */
  value: string;
  /** A short line under it. */
  detail: string;
  /** The goal for this ring is met. */
  complete: boolean;
  /** One full sentence for screen readers. */
  aria: string;
};

const clamp01 = (x: number) => (Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0);
const count = (n: number) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

// Today's plan is what is still open for today (or overdue) plus what was
// finished today, so finishing a task moves the ring forward instead of
// shrinking the denominator. A task finished today that was dated for another
// day still counts as done. With nothing planned the ring is empty, not full:
// an empty day is not an achievement.
export function taskRing(doneToday: number, openForToday: number): Ring {
  const done = count(doneToday);
  const open = count(openForToday);
  const total = done + open;
  const complete = total > 0 && open === 0;
  const detail = total === 0 ? "Nothing planned for today" : complete ? "All done" : `${open} to go`;
  const value = total === 0 ? "0 of 0" : `${done} of ${total}`;
  return {
    key: "tasks",
    label: "Tasks",
    fraction: total === 0 ? 0 : clamp01(done / total),
    value,
    detail,
    complete,
    aria: total === 0 ? "Tasks: nothing planned for today" : `Tasks: ${done} of ${total} done today`,
  };
}

export function focusRing(focusSeconds: number, goalMinutes: unknown): Ring {
  const goal = sanitizeFocusGoal(goalMinutes);
  const goalSeconds = goal * 60;
  const seconds = Number.isFinite(focusSeconds) && focusSeconds > 0 ? Math.floor(focusSeconds) : 0;
  const complete = seconds >= goalSeconds;
  const value = `${formatDuration(seconds)} of ${formatDuration(goalSeconds)}`;
  return {
    key: "focus",
    label: "Focus",
    fraction: clamp01(seconds / goalSeconds),
    value,
    detail: complete ? "Goal reached" : `${formatDuration(goalSeconds - seconds)} to go`,
    complete,
    aria: `Focus: ${value} today${complete ? ", goal reached" : ""}`,
  };
}

export function diaryRing(writtenToday: boolean): Ring {
  return {
    key: "diary",
    label: "Diary",
    fraction: writtenToday ? 1 : 0,
    value: writtenToday ? "Written" : "Not yet",
    detail: writtenToday ? "Today is in the diary" : "A line or a mood counts",
    complete: writtenToday,
    aria: writtenToday ? "Diary: today is written" : "Diary: nothing written today yet",
  };
}

// Stroke geometry for an SVG circle of radius `r`: the dash array is the whole
// circle, the offset hides what is not yet filled. A full ring has offset 0.
export function ringStroke(fraction: number, r: number): { circumference: number; dashOffset: number } {
  const circumference = 2 * Math.PI * r;
  return { circumference, dashOffset: circumference * (1 - clamp01(fraction)) };
}

// The diary counts for the ring the way it counts for the streak: text or a mood.
export function diaryWritten(row: { content_chars?: number | null; mood?: string | null } | null | undefined): boolean {
  return !!row && ((row.content_chars ?? 0) > 0 || !!row.mood);
}

export function sumFocusSeconds(rows: readonly { duration_seconds: number }[]): number {
  let total = 0;
  for (const r of rows) if (Number.isFinite(r.duration_seconds) && r.duration_seconds > 0) total += r.duration_seconds;
  return total;
}
