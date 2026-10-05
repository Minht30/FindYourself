import { isoWeekdayMon0, shiftISODate, zonedDayStartUTC } from "@/lib/dates";

// The week tile's maths. Pure: sessions in, numbers out. Days are the user's
// *local* calendar days (Monday first, like the rest of the app), and their
// edges come from zonedDayStartUTC, so a 23-hour or 25-hour DST day still gets
// its sessions and a session at 00:10 lands on the right side of midnight.

export type WeekSession = { started_at: string; duration_seconds: number; completed: boolean };

export type WeekDay = { iso: string; label: string; startMs: number; endMs: number };

export type WeekBounds = { mondayISO: string; startMs: number; endMs: number; days: WeekDay[] };

export type DaySummary = {
  iso: string;
  label: string;
  seconds: number;
  sessions: number;
  isToday: boolean;
  isFuture: boolean;
};

export type WeekSummary = {
  totalSeconds: number;
  sessions: number; // finished + stopped early
  completed: number;
  days: DaySummary[];
  todaySessions: number;
};

const DAY_LABEL = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });

export function weekMondayISO(todayISO: string): string {
  return shiftISODate(todayISO, -isoWeekdayMon0(todayISO));
}

export function weekBounds(todayISO: string, timeZone: string): WeekBounds {
  const mondayISO = weekMondayISO(todayISO);
  const days: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
    const iso = shiftISODate(mondayISO, i);
    const [y, m, d] = iso.split("-").map(Number);
    return {
      iso,
      label: DAY_LABEL.format(new Date(Date.UTC(y, m - 1, d))),
      startMs: zonedDayStartUTC(iso, timeZone).getTime(),
      endMs: zonedDayStartUTC(shiftISODate(iso, 1), timeZone).getTime(),
    };
  });
  return { mondayISO, startMs: days[0].startMs, endMs: days[6].endMs, days };
}

export function summarizeWeek(sessions: WeekSession[], bounds: WeekBounds, todayISO: string): WeekSummary {
  const days: DaySummary[] = bounds.days.map((d) => ({
    iso: d.iso,
    label: d.label,
    seconds: 0,
    sessions: 0,
    isToday: d.iso === todayISO,
    isFuture: d.iso > todayISO,
  }));
  let completed = 0;
  for (const s of sessions) {
    const t = Date.parse(s.started_at);
    const i = bounds.days.findIndex((d) => t >= d.startMs && t < d.endMs);
    if (i === -1) continue; // outside this week
    days[i].seconds += s.duration_seconds;
    days[i].sessions += 1;
    if (s.completed) completed += 1;
  }
  return {
    totalSeconds: days.reduce((n, d) => n + d.seconds, 0),
    sessions: days.reduce((n, d) => n + d.sessions, 0),
    completed,
    days,
    todaySessions: days.find((d) => d.isToday)?.sessions ?? 0,
  };
}

// "3h 25m", "45m", "0m". Under a minute but not zero reads "<1m".
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0m";
  if (seconds < 60) return "<1m";
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${String(m % 60).padStart(2, "0")}m` : `${m}m`;
}
