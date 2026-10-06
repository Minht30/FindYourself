import { describe, expect, it } from "vitest";
import {
  anchorMonth,
  dayHref,
  firstOfMonth,
  isDayDisabled,
  isInSelection,
  monthGrid,
  monthLabel,
  selectionFor,
  shiftMonth,
  weekMonday,
} from "@/lib/miniMonth";

describe("month stepping", () => {
  it("steps by whole months across year ends", () => {
    expect(shiftMonth("2026-10-01", 1)).toBe("2026-11-01");
    expect(shiftMonth("2026-12-01", 1)).toBe("2027-01-01");
    expect(shiftMonth("2026-01-01", -1)).toBe("2025-12-01");
    expect(shiftMonth("2026-10-01", 14)).toBe("2027-12-01");
    expect(shiftMonth("2026-10-01", -22)).toBe("2024-12-01");
    expect(shiftMonth("2026-10-01", 0)).toBe("2026-10-01");
  });

  it("finds the first of a month and labels it", () => {
    expect(firstOfMonth("2026-10-17")).toBe("2026-10-01");
    expect(monthLabel("2026-10-01")).toBe("October 2026");
    expect(monthLabel("2028-02-01")).toBe("February 2028");
  });

  it("finds the Monday of a week", () => {
    expect(weekMonday("2026-10-06")).toBe("2026-10-05"); // a Tuesday
    expect(weekMonday("2026-10-05")).toBe("2026-10-05"); // a Monday
    expect(weekMonday("2026-10-11")).toBe("2026-10-05"); // a Sunday
    expect(weekMonday("2026-01-01")).toBe("2025-12-29");
  });
});

describe("monthGrid", () => {
  it("is six Monday-first weeks of seven days", () => {
    const g = monthGrid("2026-10-01");
    expect(g).toHaveLength(6);
    for (const row of g) expect(row).toHaveLength(7);
    // Oct 1 2026 is a Thursday: the first row starts Monday Sep 28
    expect(g[0][0]).toEqual({ iso: "2026-09-28", day: 28, inMonth: false });
    expect(g[0][3]).toEqual({ iso: "2026-10-01", day: 1, inMonth: true });
  });

  it("contains every day of the month exactly once, in order", () => {
    for (const first of ["2026-02-01", "2028-02-01", "2026-10-01", "2026-03-01", "2027-02-01", "2025-12-01"]) {
      const days = monthGrid(first).flat().filter((c) => c.inMonth);
      const [y, m] = first.split("-").map(Number);
      const length = new Date(Date.UTC(y, m, 0)).getUTCDate();
      expect(days.map((c) => c.day)).toEqual(Array.from({ length }, (_, i) => i + 1));
    }
  });

  it("is consecutive days with every row starting on a Monday", () => {
    for (const first of ["2026-09-01", "2026-11-01", "2027-02-01", "2026-06-01"]) {
      const cells = monthGrid(first).flat();
      for (let i = 1; i < cells.length; i++) {
        const a = Date.parse(cells[i - 1].iso);
        const b = Date.parse(cells[i].iso);
        expect(b - a).toBe(86_400_000);
      }
      for (const row of monthGrid(first)) expect(weekMonday(row[0].iso)).toBe(row[0].iso);
    }
  });

  it("handles a month that starts on a Monday (the first row is all in the month)", () => {
    // Jun 1 2026 is a Monday
    expect(monthGrid("2026-06-01")[0].every((c) => c.inMonth)).toBe(true);
  });
});

describe("selectionFor", () => {
  const today = "2026-10-06";

  it("is the week in view on the timetable", () => {
    expect(selectionFor("/today", "2026-09-30", today)).toEqual({ kind: "week", monday: "2026-09-28" });
    expect(selectionFor("/today", null, today)).toEqual({ kind: "week", monday: "2026-10-05" });
    expect(selectionFor("/today", "garbage", today)).toEqual({ kind: "week", monday: "2026-10-05" });
  });

  it("is the day in view in the diary", () => {
    expect(selectionFor("/diary/2026-09-30", null, today)).toEqual({ kind: "day", iso: "2026-09-30" });
    expect(selectionFor("/diary", null, today)).toEqual({ kind: "day", iso: today });
    expect(selectionFor("/diary/nope", null, today)).toEqual({ kind: "day", iso: today });
  });

  it("is nothing elsewhere, or before today is known", () => {
    expect(selectionFor("/focus", null, today)).toBeNull();
    expect(selectionFor("/chill", null, today)).toBeNull();
    expect(selectionFor(null, null, today)).toBeNull();
    expect(selectionFor("/today", null, null)).toBeNull();
    expect(selectionFor("/today-ish", null, today)).toBeNull();
  });
});

describe("anchorMonth", () => {
  it("shows the month a week mostly belongs to", () => {
    // Mon Sep 28 .. Sun Oct 4: Thursday is Oct 1
    expect(anchorMonth({ kind: "week", monday: "2026-09-28" }, "2026-10-06")).toBe("2026-10-01");
    // Mon Oct 26 .. Sun Nov 1: Thursday is Oct 29
    expect(anchorMonth({ kind: "week", monday: "2026-10-26" }, "2026-10-06")).toBe("2026-10-01");
  });

  it("follows a day, else today", () => {
    expect(anchorMonth({ kind: "day", iso: "2026-03-14" }, "2026-10-06")).toBe("2026-03-01");
    expect(anchorMonth(null, "2026-10-06")).toBe("2026-10-01");
    expect(anchorMonth(null, null)).toBeNull();
  });
});

describe("dayHref and isDayDisabled", () => {
  it("opens that day in the diary, and that week in the timetable (from any other page)", () => {
    expect(dayHref("/diary/2026-10-01", "2026-09-30")).toBe("/diary/2026-09-30");
    expect(dayHref("/diary", "2026-09-30")).toBe("/diary/2026-09-30");
    expect(dayHref("/today", "2026-09-30")).toBe("/today?week=2026-09-30");
    expect(dayHref("/focus", "2026-09-30")).toBe("/today?week=2026-09-30");
    expect(dayHref(null, "2026-09-30")).toBe("/today?week=2026-09-30");
  });

  it("greys out future days only in the diary", () => {
    expect(isDayDisabled("/diary/2026-10-06", "2026-10-07", "2026-10-06")).toBe(true);
    expect(isDayDisabled("/diary/2026-10-06", "2026-10-06", "2026-10-06")).toBe(false);
    expect(isDayDisabled("/diary/2026-10-06", "2026-10-05", "2026-10-06")).toBe(false);
    expect(isDayDisabled("/today", "2026-12-25", "2026-10-06")).toBe(false);
    expect(isDayDisabled("/diary", "2026-12-25", null)).toBe(false);
  });
});

describe("isInSelection", () => {
  it("covers all seven days of a selected week, and nothing around it", () => {
    const sel = { kind: "week", monday: "2026-10-05" } as const;
    expect(isInSelection(sel, "2026-10-04")).toBe(false);
    expect(isInSelection(sel, "2026-10-05")).toBe(true);
    expect(isInSelection(sel, "2026-10-11")).toBe(true);
    expect(isInSelection(sel, "2026-10-12")).toBe(false);
  });

  it("is a single day for a day", () => {
    const sel = { kind: "day", iso: "2026-10-06" } as const;
    expect(isInSelection(sel, "2026-10-06")).toBe(true);
    expect(isInSelection(sel, "2026-10-07")).toBe(false);
    expect(isInSelection(null, "2026-10-06")).toBe(false);
  });
});
