import { isoWeekdayMon0, shiftISODate, todayInTimeZone, zonedInstantUTC } from "@/lib/dates";
import { formatDuration, type WeekSummary } from "@/lib/focus/week";
import { streakLabel, type StreakView } from "@/lib/streak";

// The weekly wins card ("Your week"): focus time, tasks finished, diary days
// and the streak for the user's local Monday-Sunday week, shown from Sunday
// 18:00 local. All of it is pure maths on numbers the page has already read;
// the queries live in lib/winsData.ts.

export const WINS_HOUR = 18;
const SUNDAY = 6; // Monday = 0

// "Is it Sunday evening where this person is?" The zone, not the server's
// clock, decides: 18:00 on Sunday in Auckland is still Sunday morning in
// Toronto.
export function winsWindowOpen(nowMs: number, timeZone: string): boolean {
  const iso = todayInTimeZone(timeZone, new Date(nowMs));
  if (isoWeekdayMon0(iso) !== SUNDAY) return false;
  return localHour(nowMs, timeZone) >= WINS_HOUR;
}

function localHour(nowMs: number, timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", hour: "2-digit" }).formatToParts(new Date(nowMs));
    const h = Number(parts.find((p) => p.type === "hour")?.value);
    return Number.isFinite(h) ? h % 24 : 0;
  } catch {
    return new Date(nowMs).getUTCHours();
  }
}

// Milliseconds until the card opens, or null if it is open right now. Used to
// refresh a page that was left open from the afternoon.
export function msUntilWinsWindow(nowMs: number, timeZone: string): number | null {
  if (winsWindowOpen(nowMs, timeZone)) return null;
  const iso = todayInTimeZone(timeZone, new Date(nowMs));
  const sunday = shiftISODate(iso, SUNDAY - isoWeekdayMon0(iso));
  return zonedInstantUTC(sunday, WINS_HOUR, timeZone).getTime() - nowMs;
}

export type DiaryRow = { entry_date: string; content_chars: number | null; mood: string | null };

// A diary day counts the way the streak counts it: text or a mood, once per date.
export function countDiaryDays(rows: readonly DiaryRow[], fromISO: string, toISO: string): number {
  const days = new Set<string>();
  for (const r of rows) {
    if (r.entry_date < fromISO || r.entry_date > toISO) continue;
    if ((r.content_chars ?? 0) > 0 || r.mood) days.add(r.entry_date);
  }
  return days.size;
}

export type WeekWins = {
  mondayISO: string;
  sundayISO: string;
  focusSeconds: number;
  focusSessions: number;
  tasksCompleted: number;
  diaryDays: number;
  streak: StreakView;
};

export function buildWins(input: {
  mondayISO: string;
  week: WeekSummary;
  tasksCompleted: number;
  diaryDays: number;
  streak: StreakView;
}): WeekWins {
  return {
    mondayISO: input.mondayISO,
    sundayISO: shiftISODate(input.mondayISO, 6),
    focusSeconds: input.week.totalSeconds,
    focusSessions: input.week.sessions,
    tasksCompleted: Math.max(0, Math.floor(input.tasksCompleted)),
    diaryDays: Math.min(7, Math.max(0, Math.floor(input.diaryDays))),
    streak: input.streak,
  };
}

export function isQuietWeek(w: WeekWins): boolean {
  return w.focusSeconds === 0 && w.tasksCompleted === 0 && w.diaryDays === 0;
}

// One warm sentence. Never a grade, and a quiet week is allowed to be quiet.
export function winsHeadline(w: WeekWins): string {
  if (isQuietWeek(w)) return "A quiet week. Rest counts too, and a new one starts tomorrow.";
  const parts: string[] = [];
  if (w.tasksCompleted > 0) parts.push(`${w.tasksCompleted} ${w.tasksCompleted === 1 ? "task" : "tasks"} finished`);
  if (w.focusSeconds >= 60) parts.push(`${formatDuration(w.focusSeconds)} of focus`);
  if (w.diaryDays > 0) parts.push(`${w.diaryDays} ${w.diaryDays === 1 ? "day" : "days"} in the diary`);
  const list = parts.length <= 1 ? parts[0] ?? "" : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  return `${list.charAt(0).toUpperCase()}${list.slice(1)}. That is a real week.`;
}

export function streakLine(w: WeekWins): string {
  const { current, broken, previous } = w.streak;
  if (current > 0) return streakLabel(current);
  return broken && previous > 0 ? "Starts again with one small thing" : "Not started yet";
}

// "Oct 5 – Oct 11"
export function weekRangeLabel(mondayISO: string): string {
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const at = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return fmt.format(new Date(Date.UTC(y, m - 1, d)));
  };
  return `${at(mondayISO)} – ${at(shiftISODate(mondayISO, 6))}`;
}
