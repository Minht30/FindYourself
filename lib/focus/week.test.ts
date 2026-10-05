import { describe, expect, it } from "vitest";
import { formatDuration, summarizeWeek, weekBounds, weekMondayISO, type WeekSession } from "./week";

const TZ = "America/Toronto";
const iso = (s: string) => new Date(s).toISOString();
const sess = (started: string, seconds: number, completed = true): WeekSession => ({
  started_at: iso(started),
  duration_seconds: seconds,
  completed,
});

describe("weekMondayISO", () => {
  it.each([
    ["2026-10-05", "2026-10-05"], // Monday
    ["2026-10-04", "2026-09-28"], // Sunday belongs to the week that started the Monday before
    ["2026-10-07", "2026-10-05"],
    ["2026-01-01", "2025-12-29"], // across a year boundary
    ["2024-03-01", "2024-02-26"], // across a leap day
  ])("%s -> %s", (day, monday) => {
    expect(weekMondayISO(day)).toBe(monday);
  });
});

describe("weekBounds", () => {
  it("has 7 contiguous Monday-first days in the user's zone", () => {
    const b = weekBounds("2026-10-07", TZ);
    expect(b.mondayISO).toBe("2026-10-05");
    expect(b.days.map((d) => d.label)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    b.days.forEach((d, i) => {
      if (i > 0) expect(d.startMs).toBe(b.days[i - 1].endMs);
    });
    // Toronto is UTC-4 in October: Monday starts at 04:00 UTC.
    expect(new Date(b.startMs).toISOString()).toBe("2026-10-05T04:00:00.000Z");
    expect(new Date(b.endMs).toISOString()).toBe("2026-10-12T04:00:00.000Z");
  });

  it("the DST-end Sunday is 25 hours long and the week still closes at local midnight", () => {
    // 2026-11-01 is the Sunday DST ends in Toronto (EDT -> EST).
    const b = weekBounds("2026-11-01", TZ);
    expect(b.mondayISO).toBe("2026-10-26");
    const sunday = b.days[6];
    expect((sunday.endMs - sunday.startMs) / 3_600_000).toBe(25);
    expect(new Date(b.endMs).toISOString()).toBe("2026-11-02T05:00:00.000Z"); // next Monday 00:00 EST
  });

  it("the DST-start Sunday is 23 hours long", () => {
    const b = weekBounds("2026-03-08", TZ);
    expect((b.days[6].endMs - b.days[6].startMs) / 3_600_000).toBe(23);
  });
});

describe("summarizeWeek", () => {
  const today = "2026-10-07"; // Wednesday
  const b = weekBounds(today, TZ);

  it("an empty week is all zeros", () => {
    const s = summarizeWeek([], b, today);
    expect(s).toMatchObject({ totalSeconds: 0, sessions: 0, completed: 0, todaySessions: 0 });
    expect(s.days.map((d) => d.seconds)).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it("sums time per local day, counts finished and stopped-early separately", () => {
    const s = summarizeWeek(
      [
        sess("2026-10-05T14:00:00Z", 1500), // Mon 10:00 local
        sess("2026-10-05T16:00:00Z", 600, false), // Mon 12:00 local, stopped early
        sess("2026-10-07T13:00:00Z", 1500), // Wed 09:00 local (today)
      ],
      b,
      today,
    );
    expect(s.totalSeconds).toBe(3600);
    expect(s.sessions).toBe(3);
    expect(s.completed).toBe(2);
    expect(s.days[0]).toMatchObject({ label: "Mon", seconds: 2100, sessions: 2 });
    expect(s.days[2]).toMatchObject({ label: "Wed", seconds: 1500, sessions: 1, isToday: true });
    expect(s.todaySessions).toBe(1);
  });

  it("flags today and the days after it", () => {
    const s = summarizeWeek([], b, today);
    expect(s.days.map((d) => [d.isToday, d.isFuture])).toEqual([
      [false, false],
      [false, false],
      [true, false],
      [false, true],
      [false, true],
      [false, true],
      [false, true],
    ]);
  });

  it("assigns by LOCAL midnight, not UTC: 23:30 Sunday vs 00:10 Monday in Toronto", () => {
    const sundayNight = summarizeWeek([sess("2026-10-12T03:30:00Z", 1500)], weekBounds("2026-10-09", TZ), "2026-10-09");
    // 2026-10-12T03:30Z is Sunday Oct 11 23:30 EDT: still this week, on Sunday
    expect(sundayNight.days[6]).toMatchObject({ label: "Sun", sessions: 1 });
    const mondayJustAfter = summarizeWeek([sess("2026-10-12T04:10:00Z", 1500)], weekBounds("2026-10-09", TZ), "2026-10-09");
    // 04:10Z is Monday Oct 12 00:10 EDT: next week, so it is not counted here
    expect(mondayJustAfter.sessions).toBe(0);
  });

  it("ignores sessions outside the week", () => {
    const s = summarizeWeek([sess("2026-10-04T20:00:00Z", 1500), sess("2026-10-20T20:00:00Z", 1500)], b, today);
    expect(s.sessions).toBe(0);
  });

  it("a session on the 25-hour DST Sunday lands on Sunday, the late-night one too", () => {
    const week = weekBounds("2026-11-01", TZ);
    const s = summarizeWeek(
      [sess("2026-11-02T04:30:00Z", 900), sess("2026-11-01T05:30:00Z", 900)],
      week,
      "2026-11-01",
    );
    // 04:30Z Nov 2 = Sunday Nov 1 23:30 EST; 05:30Z Nov 1 = Sunday 01:30 EDT
    expect(s.days[6].sessions).toBe(2);
  });
});

describe("formatDuration", () => {
  it.each([
    [0, "0m"],
    [-10, "0m"],
    [30, "<1m"],
    [60, "1m"],
    [2700, "45m"],
    [3600, "1h 00m"],
    [12300, "3h 25m"],
    [90000, "25h 00m"],
  ])("%d s -> %s", (s, text) => {
    expect(formatDuration(s)).toBe(text);
  });
});
