import { describe, expect, it } from "vitest";
import { BUCKETS, BUCKET_EMPTY, BUCKET_LABELS, bucketOf, isOverdue, scheduledForBucket } from "@/lib/tasks";

describe("empty bucket copy", () => {
  it("has a gentle line for every bucket", () => {
    for (const b of BUCKETS) {
      expect(BUCKET_EMPTY[b].trim().length).toBeGreaterThan(8);
      expect(BUCKET_EMPTY[b]).not.toMatch(/error|fail|oops/i);
    }
    expect(Object.keys(BUCKET_EMPTY).sort()).toEqual(Object.keys(BUCKET_LABELS).sort());
  });
});

describe("buckets", () => {
  const today = "2026-10-06";
  it("derives the bucket from the date", () => {
    expect(bucketOf(null, today)).toBe("backlog");
    expect(bucketOf(today, today)).toBe("today");
    expect(bucketOf("2026-10-01", today)).toBe("today"); // overdue stays under Today
    expect(bucketOf("2026-10-07", today)).toBe("tomorrow");
  });

  it("round-trips through scheduledForBucket", () => {
    for (const b of BUCKETS) expect(bucketOf(scheduledForBucket(b, today), today)).toBe(b);
  });

  it("flags only open, dated, past tasks as overdue", () => {
    expect(isOverdue({ scheduled_for: "2026-10-05", completed_at: null }, today)).toBe(true);
    expect(isOverdue({ scheduled_for: "2026-10-05", completed_at: "2026-10-05T10:00:00Z" }, today)).toBe(false);
    expect(isOverdue({ scheduled_for: null, completed_at: null }, today)).toBe(false);
    expect(isOverdue({ scheduled_for: today, completed_at: null }, today)).toBe(false);
  });
});
