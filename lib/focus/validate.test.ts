import { describe, expect, it } from "vitest";
import { validateSession } from "./validate";

const NOW = Date.UTC(2026, 9, 5, 12, 0, 0);
const MIN = 60_000;
const ID = "0f8b1c3e-6a7d-4e21-9c55-3a2b1d4e5f60";
const TASK = "11111111-2222-4333-8444-555555555555";

function base(over: Record<string, unknown> = {}) {
  return {
    id: ID,
    startedAt: NOW - 30 * MIN,
    endedAt: NOW - 5 * MIN,
    durationSec: 1500,
    plannedSec: 1500,
    completed: true,
    taskId: null,
    blockId: null,
    label: null,
    ...over,
  };
}

describe("validateSession: accepts", () => {
  it("a completed session and maps it to a row", () => {
    const v = validateSession(base({ taskId: TASK, label: "  Write essay  " }), NOW);
    expect(v).toEqual({
      ok: true,
      row: {
        id: ID,
        started_at: new Date(NOW - 30 * MIN).toISOString(),
        ended_at: new Date(NOW - 5 * MIN).toISOString(),
        duration_seconds: 1500,
        planned_seconds: 1500,
        task_id: TASK,
        time_block_id: null,
        label: "Write essay",
        completed: true,
      },
    });
  });

  it("an abandoned session at exactly 60 s", () => {
    expect(validateSession(base({ completed: false, durationSec: 60, endedAt: NOW - 28 * MIN }), NOW).ok).toBe(true);
  });

  it("paused time: 10 min focused over a 25 min wall clock", () => {
    expect(validateSession(base({ completed: false, durationSec: 600 }), NOW).ok).toBe(true);
  });

  it("a 1-minute and a 120-minute plan (the settings limits)", () => {
    expect(
      validateSession(base({ plannedSec: 60, durationSec: 60, startedAt: NOW - 3 * MIN, endedAt: NOW - 2 * MIN }), NOW).ok,
    ).toBe(true);
    expect(
      validateSession(base({ plannedSec: 7200, durationSec: 7200, startedAt: NOW - 130 * MIN, endedAt: NOW - 5 * MIN }), NOW).ok,
    ).toBe(true);
  });

  it("an empty or whitespace label becomes null", () => {
    expect(validateSession(base({ label: "   " }), NOW)).toMatchObject({ ok: true, row: { label: null } });
  });

  it("a slightly future end (clock skew) is fine", () => {
    expect(validateSession(base({ endedAt: NOW + 3 * MIN, startedAt: NOW - 25 * MIN }), NOW).ok).toBe(true);
  });
});

describe("validateSession: rejects, with the reason", () => {
  it.each([
    ["null", null, "bad_shape"],
    ["a string", "x", "bad_shape"],
    ["a non-uuid id", base({ id: "not-a-uuid" }), "bad_id"],
    ["a missing id", base({ id: undefined }), "bad_id"],
    ["completed not a boolean", base({ completed: "yes" }), "bad_completed"],
    ["NaN start", base({ startedAt: NaN }), "bad_time"],
    ["start before 2020", base({ startedAt: 1000 }), "bad_time"],
    ["end in the far future", base({ endedAt: NOW + 3 * 60 * MIN }), "bad_time"],
    ["end before start", base({ startedAt: NOW, endedAt: NOW - MIN }), "bad_time"],
    ["planned 59 s", base({ plannedSec: 59, durationSec: 59 }), "bad_planned"],
    ["planned 7201 s", base({ plannedSec: 7201, durationSec: 7201 }), "bad_planned"],
    ["fractional planned", base({ plannedSec: 1500.5 }), "bad_planned"],
    ["duration over planned", base({ completed: false, durationSec: 1501 }), "bad_duration"],
    ["negative duration", base({ completed: false, durationSec: -1 }), "bad_duration"],
    ["completed but short", base({ durationSec: 1000 }), "bad_duration"],
    ["10 min focused in a 1 min window", base({ completed: false, durationSec: 600, startedAt: NOW - 2 * MIN, endedAt: NOW - MIN }), "bad_duration"],
    ["abandoned at 59 s", base({ completed: false, durationSec: 59 }), "too_short"],
    ["a non-uuid task id", base({ taskId: "abc" }), "bad_link"],
    ["a non-uuid block id", base({ blockId: 5 }), "bad_link"],
    ["a numeric label", base({ label: 42 }), "bad_label"],
    ["a 201-char label", base({ label: "x".repeat(201) }), "bad_label"],
  ])("%s", (_name, raw, reason) => {
    expect(validateSession(raw, NOW)).toEqual({ ok: false, reason });
  });

  it("a 200-char label is the longest accepted", () => {
    expect(validateSession(base({ label: "x".repeat(200) }), NOW).ok).toBe(true);
  });

  it("ignores any extra fields a tampered client adds (user_id cannot be smuggled in)", () => {
    const v = validateSession(base({ user_id: "other", created_at: "2020-01-01" }), NOW);
    expect(v.ok && Object.keys(v.row).sort()).toEqual(
      ["completed", "duration_seconds", "ended_at", "id", "label", "planned_seconds", "started_at", "task_id", "time_block_id"],
    );
  });
});
