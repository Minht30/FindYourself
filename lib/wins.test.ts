import { describe, expect, it } from "vitest";
import {
  buildWins,
  countDiaryDays,
  isQuietWeek,
  msUntilWinsWindow,
  streakLine,
  weekRangeLabel,
  winsHeadline,
  winsWindowOpen,
} from "@/lib/wins";
import { weekBounds, summarizeWeek } from "@/lib/focus/week";
import { streakView } from "@/lib/streak";

const at = (iso: string) => Date.parse(iso);
const H = 3_600_000;

describe("winsWindowOpen", () => {
  it("opens at 18:00 on Sunday local time and stays open until Monday", () => {
    // Toronto is UTC-4 in October.
    expect(winsWindowOpen(at("2026-10-11T21:59:00Z"), "America/Toronto")).toBe(false); // Sun 17:59
    expect(winsWindowOpen(at("2026-10-11T22:00:00Z"), "America/Toronto")).toBe(true); // Sun 18:00
    expect(winsWindowOpen(at("2026-10-12T03:59:00Z"), "America/Toronto")).toBe(true); // Sun 23:59
    expect(winsWindowOpen(at("2026-10-12T04:00:00Z"), "America/Toronto")).toBe(false); // Mon 00:00
  });

  it("is closed on every other weekday, whatever the hour", () => {
    for (let d = 5; d <= 10; d++) {
      for (const h of [0, 12, 18, 23]) {
        const iso = `2026-10-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:30:00Z`;
        expect(winsWindowOpen(at(iso), "UTC")).toBe(false);
      }
    }
  });

  it("follows the person's zone, not the server's", () => {
    // Sunday 18:00 in Hanoi (UTC+7) is Sunday 11:00 UTC.
    expect(winsWindowOpen(at("2026-10-11T11:00:00Z"), "Asia/Ho_Chi_Minh")).toBe(true);
    expect(winsWindowOpen(at("2026-10-11T11:00:00Z"), "UTC")).toBe(false);
    // Pago Pago (UTC-11): Sunday 18:00 is Monday 05:00 UTC.
    expect(winsWindowOpen(at("2026-10-12T05:00:00Z"), "Pacific/Pago_Pago")).toBe(true);
    expect(winsWindowOpen(at("2026-10-12T05:00:00Z"), "UTC")).toBe(false);
    // Kiritimati (UTC+14): Sunday 18:00 is Sunday 04:00 UTC.
    expect(winsWindowOpen(at("2026-10-11T04:00:00Z"), "Pacific/Kiritimati")).toBe(true);
    expect(winsWindowOpen(at("2026-10-11T03:59:00Z"), "Pacific/Kiritimati")).toBe(false);
  });

  it("is right on days the clocks change (both directions)", () => {
    // New York falls back on Sunday 2026-11-01: 18:00 EST is 23:00 UTC.
    expect(winsWindowOpen(at("2026-11-01T22:59:00Z"), "America/New_York")).toBe(false);
    expect(winsWindowOpen(at("2026-11-01T23:00:00Z"), "America/New_York")).toBe(true);
    // ... and springs forward on Sunday 2026-03-08: 18:00 EDT is 22:00 UTC.
    expect(winsWindowOpen(at("2026-03-08T21:59:00Z"), "America/New_York")).toBe(false);
    expect(winsWindowOpen(at("2026-03-08T22:00:00Z"), "America/New_York")).toBe(true);
  });
});

describe("msUntilWinsWindow", () => {
  it("is null while the card is open", () => {
    expect(msUntilWinsWindow(at("2026-10-11T22:00:00Z"), "America/Toronto")).toBeNull();
    expect(msUntilWinsWindow(at("2026-10-12T03:00:00Z"), "America/Toronto")).toBeNull();
  });

  it("counts down to Sunday 18:00 local", () => {
    expect(msUntilWinsWindow(at("2026-10-11T21:00:00Z"), "America/Toronto")).toBe(1 * H); // Sun 17:00
    expect(msUntilWinsWindow(at("2026-10-10T16:00:00Z"), "America/Toronto")).toBe(30 * H); // Sat 12:00
    expect(msUntilWinsWindow(at("2026-10-12T16:00:00Z"), "America/Toronto")).toBe(150 * H); // Mon 12:00 -> next Sunday
  });

  it("uses the wall clock, not 'midnight + 18 hours', on a clock-change day", () => {
    // Saturday 12:00 EDT 2026-10-31 to Sunday 18:00 EST 2026-11-01: 31 hours (a 25-hour day).
    expect(msUntilWinsWindow(at("2026-10-31T16:00:00Z"), "America/New_York")).toBe(31 * H);
  });

  it("always lands exactly on the moment the window opens", () => {
    const zones = ["UTC", "America/Toronto", "Asia/Ho_Chi_Minh", "Pacific/Pago_Pago", "Pacific/Kiritimati", "Europe/London", "Australia/Lord_Howe"];
    let seed = 7;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
    for (let i = 0; i < 400; i++) {
      const now = at("2026-01-01T00:00:00Z") + Math.floor(rnd() * 365 * 24) * H + Math.floor(rnd() * 60) * 60_000;
      const zone = zones[i % zones.length];
      const wait = msUntilWinsWindow(now, zone);
      if (wait === null) {
        expect(winsWindowOpen(now, zone)).toBe(true);
      } else {
        expect(wait).toBeGreaterThan(0);
        expect(winsWindowOpen(now + wait, zone)).toBe(true);
        expect(winsWindowOpen(now + wait - 1, zone)).toBe(false);
      }
    }
  });
});

describe("countDiaryDays", () => {
  const row = (entry_date: string, content_chars: number | null, mood: string | null = null) => ({ entry_date, content_chars, mood });

  it("counts days with text or a mood, once each, inside the week", () => {
    const rows = [
      row("2026-10-05", 120),
      row("2026-10-06", 0, "calm"),
      row("2026-10-07", 0, null), // an empty row does not count
      row("2026-10-08", null, null),
      row("2026-10-08", 40), // a duplicate date counts once
      row("2026-10-11", 5),
      row("2026-10-04", 999), // the Sunday before the week
      row("2026-10-12", 999), // the Monday after it
    ];
    expect(countDiaryDays(rows, "2026-10-05", "2026-10-11")).toBe(4);
  });

  it("is zero for no rows", () => {
    expect(countDiaryDays([], "2026-10-05", "2026-10-11")).toBe(0);
  });
});

describe("buildWins and the copy", () => {
  const bounds = weekBounds("2026-10-11", "UTC");
  const week = summarizeWeek(
    [
      { started_at: "2026-10-06T09:00:00Z", duration_seconds: 1500, completed: true },
      { started_at: "2026-10-08T09:00:00Z", duration_seconds: 1500, completed: true },
      { started_at: "2026-10-04T09:00:00Z", duration_seconds: 9999, completed: true }, // last week
    ],
    bounds,
    "2026-10-11",
  );
  const streak = streakView({ count: 4, lastDate: "2026-10-11", best: 6 }, "2026-10-11");
  const wins = buildWins({ mondayISO: bounds.mondayISO, week, tasksCompleted: 9, diaryDays: 5, streak });

  it("carries the week's numbers", () => {
    expect(wins).toMatchObject({ mondayISO: "2026-10-05", sundayISO: "2026-10-11", focusSeconds: 3000, focusSessions: 2, tasksCompleted: 9, diaryDays: 5 });
    expect(wins.streak.current).toBe(4);
  });

  it("clamps nonsense counts", () => {
    const w = buildWins({ mondayISO: "2026-10-05", week, tasksCompleted: -3, diaryDays: 12, streak });
    expect(w.tasksCompleted).toBe(0);
    expect(w.diaryDays).toBe(7);
    expect(buildWins({ mondayISO: "2026-10-05", week, tasksCompleted: 2.9, diaryDays: 1, streak }).tasksCompleted).toBe(2);
  });

  it("writes a warm headline from what happened", () => {
    expect(winsHeadline(wins)).toBe("9 tasks finished, 50m of focus and 5 days in the diary. That is a real week.");
    expect(winsHeadline({ ...wins, focusSeconds: 0, diaryDays: 0, tasksCompleted: 1 })).toBe("1 task finished. That is a real week.");
    expect(winsHeadline({ ...wins, tasksCompleted: 0, diaryDays: 1 })).toBe("50m of focus and 1 day in the diary. That is a real week.");
  });

  it("lets a quiet week be quiet, without reproach", () => {
    const quiet = { ...wins, focusSeconds: 0, focusSessions: 0, tasksCompleted: 0, diaryDays: 0 };
    expect(isQuietWeek(quiet)).toBe(true);
    const msg = winsHeadline(quiet);
    expect(msg).toMatch(/quiet week/i);
    expect(msg).not.toMatch(/fail|lazy|missed|nothing/i);
  });

  it("describes the streak for each state", () => {
    expect(streakLine(wins)).toBe("4 days");
    const lapsed = buildWins({ mondayISO: "2026-10-05", week, tasksCompleted: 0, diaryDays: 0, streak: streakView({ count: 5, lastDate: "2026-10-01", best: 5 }, "2026-10-11") });
    expect(streakLine(lapsed)).toMatch(/starts again/i);
    const never = buildWins({ mondayISO: "2026-10-05", week, tasksCompleted: 0, diaryDays: 0, streak: streakView({ count: 0, lastDate: null, best: 0 }, "2026-10-11") });
    expect(streakLine(never)).toBe("Not started yet");
  });

  it("labels the week", () => {
    expect(weekRangeLabel("2026-10-05")).toBe("Oct 5 – Oct 11");
    expect(weekRangeLabel("2026-09-28")).toBe("Sep 28 – Oct 4");
    expect(weekRangeLabel("2026-12-28")).toBe("Dec 28 – Jan 3");
  });
});
