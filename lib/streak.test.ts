import { describe, expect, it } from "vitest";
import { streakLabel, streakMessage, streakView, toStoredStreak } from "@/lib/streak";

const TODAY = "2026-10-06";

describe("toStoredStreak", () => {
  it("reads a profile row", () => {
    expect(toStoredStreak({ streak_count: 3, streak_last_date: "2026-10-05", streak_best: 7 })).toEqual({
      count: 3,
      lastDate: "2026-10-05",
      best: 7,
    });
  });

  it("treats a missing or malformed row as no streak", () => {
    const empty = { count: 0, lastDate: null, best: 0 };
    expect(toStoredStreak(null)).toEqual(empty);
    expect(toStoredStreak(undefined)).toEqual(empty);
    expect(toStoredStreak({})).toEqual(empty);
    expect(toStoredStreak({ streak_count: 4, streak_last_date: null, streak_best: 0 })).toEqual(empty);
    expect(toStoredStreak({ streak_count: 4, streak_last_date: "2026-02-31", streak_best: 0 })).toEqual(empty);
    expect(toStoredStreak({ streak_count: "4", streak_last_date: "oops", streak_best: "x" })).toEqual(empty);
  });

  it("never reports a best smaller than the count, and drops junk numbers", () => {
    expect(toStoredStreak({ streak_count: 5, streak_last_date: "2026-10-05", streak_best: 2 }).best).toBe(5);
    expect(toStoredStreak({ streak_count: -3, streak_last_date: "2026-10-05", streak_best: NaN }).count).toBe(0);
    expect(toStoredStreak({ streak_count: 2.9, streak_last_date: "2026-10-05", streak_best: 0 }).count).toBe(2);
  });
});

describe("streakView", () => {
  const stored = (count: number, lastDate: string | null, best = count) => ({ count, lastDate, best });

  it("is alive and done when today already counts", () => {
    expect(streakView(stored(4, TODAY), TODAY)).toMatchObject({ current: 4, doneToday: true, atRisk: false, broken: false });
  });

  it("is alive but at risk when the last active day was yesterday", () => {
    expect(streakView(stored(4, "2026-10-05"), TODAY)).toMatchObject({ current: 4, doneToday: false, atRisk: true, broken: false });
  });

  it("is broken after a whole missed day, and remembers how long it was", () => {
    expect(streakView(stored(9, "2026-10-04"), TODAY)).toMatchObject({ current: 0, broken: true, previous: 9, atRisk: false });
    expect(streakView(stored(2, "2025-01-01"), TODAY)).toMatchObject({ current: 0, broken: true, previous: 2 });
  });

  it("has nothing to say about someone who never had a streak", () => {
    expect(streakView(stored(0, null), TODAY)).toMatchObject({ current: 0, broken: false, previous: 0, doneToday: false, atRisk: false });
  });

  it("treats a last day after today (zone skew) as today", () => {
    expect(streakView(stored(3, "2026-10-07"), TODAY)).toMatchObject({ current: 3, doneToday: true });
  });

  it("works across month and year boundaries", () => {
    expect(streakView(stored(2, "2026-09-30"), "2026-10-01").atRisk).toBe(true);
    expect(streakView(stored(2, "2025-12-31"), "2026-01-01").atRisk).toBe(true);
    expect(streakView(stored(2, "2025-12-30"), "2026-01-01").broken).toBe(true);
    expect(streakView(stored(2, "2028-02-28"), "2028-02-29").atRisk).toBe(true);
  });

  it("keeps the best through a lapse", () => {
    expect(streakView(stored(1, "2026-09-01", 12), TODAY).best).toBe(12);
  });

  it("fails safe on a bad `today`", () => {
    expect(streakView(stored(4, "2026-10-05"), "nope")).toMatchObject({ current: 0, broken: false });
  });
});

describe("copy", () => {
  it("never shames a lapse", () => {
    const msg = streakMessage(streakView({ count: 9, lastDate: "2026-10-01", best: 9 }, TODAY));
    expect(msg).toMatch(/welcome back/i);
    expect(msg).not.toMatch(/lost|fail|broke|missed|shame/i);
  });

  it("covers each state", () => {
    expect(streakMessage(streakView({ count: 0, lastDate: null, best: 0 }, TODAY))).toMatch(/start a streak/i);
    expect(streakMessage(streakView({ count: 3, lastDate: "2026-10-05", best: 3 }, TODAY))).toMatch(/keeps it going/i);
    expect(streakMessage(streakView({ count: 3, lastDate: TODAY, best: 3 }, TODAY))).toMatch(/today counts/i);
    expect(streakMessage(streakView({ count: 1, lastDate: TODAY, best: 1 }, TODAY))).toMatch(/begins/i);
  });

  it("labels days", () => {
    expect(streakLabel(1)).toBe("1 day");
    expect(streakLabel(0)).toBe("0 days");
    expect(streakLabel(12)).toBe("12 days");
  });
});
