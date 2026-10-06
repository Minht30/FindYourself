import { describe, expect, it } from "vitest";
import {
  FOCUS_GOAL_DEFAULT_MINUTES,
  FOCUS_GOAL_PRESETS,
  diaryRing,
  diaryWritten,
  focusRing,
  isValidFocusGoal,
  ringStroke,
  sanitizeFocusGoal,
  sumFocusSeconds,
  taskRing,
} from "@/lib/rings";

describe("taskRing", () => {
  it("is done / (done + still open)", () => {
    expect(taskRing(3, 2)).toMatchObject({ fraction: 0.6, value: "3 of 5", detail: "2 to go", complete: false });
  });

  it("moves forward when a task is finished (the denominator does not shrink)", () => {
    const before = taskRing(1, 3);
    const after = taskRing(2, 2);
    expect(after.fraction).toBeGreaterThan(before.fraction);
    expect(before.value).toBe("1 of 4");
    expect(after.value).toBe("2 of 4");
  });

  it("is complete when nothing is left open", () => {
    expect(taskRing(4, 0)).toMatchObject({ fraction: 1, complete: true, detail: "All done", value: "4 of 4" });
  });

  it("is empty, not full, when nothing was planned", () => {
    expect(taskRing(0, 0)).toMatchObject({ fraction: 0, complete: false, value: "0 of 0", detail: "Nothing planned for today" });
    expect(taskRing(0, 0).aria).toMatch(/nothing planned/i);
  });

  it("is empty with open tasks and none done", () => {
    expect(taskRing(0, 3)).toMatchObject({ fraction: 0, complete: false, value: "0 of 3" });
  });

  it("treats junk counts as zero", () => {
    expect(taskRing(-2, NaN)).toMatchObject({ fraction: 0, value: "0 of 0" });
    expect(taskRing(2.9, 1.2)).toMatchObject({ value: "2 of 3" });
  });
});

describe("focusRing", () => {
  it("measures today's focus against the goal", () => {
    expect(focusRing(3600, 120)).toMatchObject({ fraction: 0.5, value: "1h 00m of 2h 00m", detail: "1h 00m to go", complete: false });
  });

  it("is complete at the goal and capped at a full ring beyond it", () => {
    expect(focusRing(7200, 120)).toMatchObject({ fraction: 1, complete: true, detail: "Goal reached" });
    const over = focusRing(10_000, 120);
    expect(over.fraction).toBe(1);
    expect(over.value).toBe("2h 46m of 2h 00m");
    expect(over.complete).toBe(true);
  });

  it("is empty with no focus", () => {
    expect(focusRing(0, 90)).toMatchObject({ fraction: 0, value: "0m of 1h 30m", complete: false });
  });

  it("falls back to the default goal for a stored value it does not accept", () => {
    for (const bad of [0, 14, 721, 17, 1.5, "120", null, undefined, NaN]) {
      expect(focusRing(0, bad).value).toBe("0m of 2h 00m");
    }
  });

  it("ignores junk seconds", () => {
    expect(focusRing(-5, 60).fraction).toBe(0);
    expect(focusRing(NaN, 60).fraction).toBe(0);
  });

  it("describes itself for a screen reader", () => {
    expect(focusRing(1800, 60).aria).toBe("Focus: 30m of 1h 00m today");
    expect(focusRing(3600, 60).aria).toBe("Focus: 1h 00m of 1h 00m today, goal reached");
  });
});

describe("focus goal", () => {
  it("accepts whole steps of five from 15 to 720", () => {
    for (const ok of [15, 20, 120, 715, 720]) expect(isValidFocusGoal(ok)).toBe(true);
    for (const bad of [0, 5, 10, 14, 16, 721, 725, -5, 1.5, NaN, Infinity, "60", null, undefined, {}]) expect(isValidFocusGoal(bad)).toBe(false);
  });

  it("offers presets the database accepts", () => {
    for (const p of FOCUS_GOAL_PRESETS) expect(isValidFocusGoal(p)).toBe(true);
    expect(FOCUS_GOAL_PRESETS).toContain(FOCUS_GOAL_DEFAULT_MINUTES);
  });

  it("sanitises", () => {
    expect(sanitizeFocusGoal(45)).toBe(45);
    expect(sanitizeFocusGoal(46)).toBe(FOCUS_GOAL_DEFAULT_MINUTES);
  });
});

describe("diaryRing", () => {
  it("is all or nothing", () => {
    expect(diaryRing(true)).toMatchObject({ fraction: 1, complete: true, value: "Written" });
    expect(diaryRing(false)).toMatchObject({ fraction: 0, complete: false, value: "Not yet" });
  });

  it("counts text or a mood, the way the streak does", () => {
    expect(diaryWritten({ content_chars: 12, mood: null })).toBe(true);
    expect(diaryWritten({ content_chars: 0, mood: "calm" })).toBe(true);
    expect(diaryWritten({ content_chars: 0, mood: null })).toBe(false);
    expect(diaryWritten({ content_chars: null, mood: null })).toBe(false);
    expect(diaryWritten(null)).toBe(false);
    expect(diaryWritten(undefined)).toBe(false);
  });
});

describe("ringStroke", () => {
  it("fills from none to all", () => {
    const r = 20;
    const c = 2 * Math.PI * r;
    expect(ringStroke(0, r)).toEqual({ circumference: c, dashOffset: c });
    expect(ringStroke(1, r).dashOffset).toBe(0);
    expect(ringStroke(0.25, r).dashOffset).toBeCloseTo(c * 0.75);
  });

  it("clamps out-of-range fractions", () => {
    expect(ringStroke(2, 10).dashOffset).toBe(0);
    expect(ringStroke(-1, 10).dashOffset).toBeCloseTo(2 * Math.PI * 10);
    expect(ringStroke(NaN, 10).dashOffset).toBeCloseTo(2 * Math.PI * 10);
  });
});

describe("sumFocusSeconds", () => {
  it("adds up sessions and skips junk", () => {
    expect(sumFocusSeconds([{ duration_seconds: 1500 }, { duration_seconds: 600 }, { duration_seconds: -3 }, { duration_seconds: NaN }])).toBe(2100);
    expect(sumFocusSeconds([])).toBe(0);
  });
});
