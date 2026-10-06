import { describe, expect, it } from "vitest";
import { formatDayLabel, formatTimeLabel, msToNextMinute } from "./clock";

// 2026-10-05 20:42:17 in New York (EDT, UTC-4) = 2026-10-06 00:42:17 UTC
const d = new Date("2026-10-06T00:42:17Z");

describe("labels", () => {
  it("formats the day (weekday, month, day) in the given zone", () => {
    expect(formatDayLabel(d, "en-US", "America/New_York")).toBe("Mon, Oct 5");
    // the same instant is already Tuesday in Tokyo
    expect(formatDayLabel(d, "en-US", "Asia/Tokyo")).toBe("Tue, Oct 6");
  });
  it("formats the time without seconds", () => {
    expect(formatTimeLabel(d, "en-US", "America/New_York").replace(/\s/g, " ")).toBe("8:42 PM");
    expect(formatTimeLabel(d, "en-GB", "Asia/Tokyo")).toMatch(/^0?9:42$/); // 24 hour clock, no AM/PM
  });
  it("crosses midnight correctly", () => {
    const late = new Date("2026-10-06T03:59:00Z"); // 23:59 Monday in New York
    expect(formatDayLabel(late, "en-US", "America/New_York")).toBe("Mon, Oct 5");
    const after = new Date("2026-10-06T04:00:00Z"); // 00:00 Tuesday
    expect(formatDayLabel(after, "en-US", "America/New_York")).toBe("Tue, Oct 6");
  });
});

describe("msToNextMinute", () => {
  it("counts down to the next minute boundary, with a small cushion", () => {
    expect(msToNextMinute(0)).toBe(60_040);
    expect(msToNextMinute(17_000)).toBe(43_040);
    expect(msToNextMinute(59_999)).toBe(41);
  });
  it("is always positive and never more than a minute and a cushion", () => {
    for (let t = 1_700_000_000_000; t < 1_700_000_000_000 + 200_000; t += 997) {
      const ms = msToNextMinute(t);
      expect(ms).toBeGreaterThan(0);
      expect(ms).toBeLessThanOrEqual(60_040);
      // landing there puts us in the next minute
      expect(Math.floor((t + ms) / 60_000)).toBe(Math.floor(t / 60_000) + 1);
    }
  });
  it("copes with negative timestamps", () => {
    expect(msToNextMinute(-1000)).toBe(1_040);
  });
});
