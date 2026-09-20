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
