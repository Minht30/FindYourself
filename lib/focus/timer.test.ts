import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  MIN_LOGGED_ABANDON_MS,
  applySettings,
  complete,
  cupsFilled,
  elapsedMs,
  formatClock,
  initialState,
  nextPhase,
  pause,
  phaseMs,
  progressAt,
  remainingAt,
  reset,
  sanitizeSettings,
  sanitizeState,
  setLink,
  settle,
  skip,
  start,
  type Settings,
  type TimerState,
} from "./timer";

const S: Settings = DEFAULT_SETTINGS;
const MIN = 60_000;
const T0 = 1_700_000_000_000;
let n = 0;
const newId = () => `id-${++n}`;

function running(now = T0, s = S): TimerState {
  return start(initialState(s), now, newId);
}

describe("start / pause / resume", () => {
  it("starts a full 25:00 phase with a fresh session id", () => {
    const st = running();
    expect(st.status).toBe("running");
    expect(st.endsAt).toBe(T0 + 25 * MIN);
    expect(st.startedAt).toBe(T0);
    expect(st.sessionId).toMatch(/^id-/);
    expect(remainingAt(st, T0)).toBe(25 * MIN);
  });

  it("start on a running timer is a no-op (same object)", () => {
    const st = running();
    expect(start(st, T0 + 5_000, newId)).toBe(st);
  });

  it("pause freezes the remaining time and drops the deadline", () => {
    const p = pause(running(), T0 + 10 * MIN);
    expect(p.status).toBe("paused");
    expect(p.endsAt).toBeNull();
    expect(p.remainingMs).toBe(15 * MIN);
    // however long we sit paused, nothing moves
    expect(remainingAt(p, T0 + 999 * MIN)).toBe(15 * MIN);
  });

  it("resume keeps the session id and start time, and re-anchors the deadline", () => {
    const first = running();
    const p = pause(first, T0 + 10 * MIN);
    const r = start(p, T0 + 30 * MIN, newId);
    expect(r.status).toBe("running");
    expect(r.sessionId).toBe(first.sessionId);
    expect(r.startedAt).toBe(T0);
    expect(r.endsAt).toBe(T0 + 30 * MIN + 15 * MIN);
  });

  it("pause on a non-running timer does nothing", () => {
    const idle = initialState(S);
    expect(pause(idle, T0)).toBe(idle);
  });

  it("elapsed focus time excludes paused time", () => {
    let st = running();
    st = pause(st, T0 + 4 * MIN);
    st = start(st, T0 + 20 * MIN, newId);
    expect(elapsedMs(st, T0 + 23 * MIN)).toBe(7 * MIN);
    expect(progressAt(st, T0 + 23 * MIN)).toBeCloseTo(7 / 25, 6);
  });
});

describe("completion and the long-break cadence", () => {
  it("a finished focus logs completed=true as of its deadline, not the late tick", () => {
    const st = running();
    const late = T0 + 25 * MIN + 7_000;
    const t = settle(st, late, S, newId);
    expect(t).not.toBeNull();
    expect(t!.record).toMatchObject({
      id: st.sessionId,
      startedAt: T0,
      endedAt: T0 + 25 * MIN,
      durationSec: 25 * 60,
      plannedSec: 25 * 60,
      completed: true,
    });
    expect(t!.finished).toBe("focus");
    expect(t!.state.phase).toBe("short");
    expect(t!.state.status).toBe("idle");
    expect(t!.state.cycle).toBe(1);
  });

  it("settle does nothing before the deadline, or when not running", () => {
    expect(settle(running(), T0 + 25 * MIN - 1, S, newId)).toBeNull();
    expect(settle(initialState(S), T0 + 999 * MIN, S, newId)).toBeNull();
    expect(settle(pause(running(), T0 + MIN), T0 + 999 * MIN, S, newId)).toBeNull();
  });

  it("settle never chains into the next phase, even with autoStart", () => {
    const auto = { ...S, autoStart: true };
    const t = settle(running(T0, auto), T0 + 60 * MIN, auto, newId)!;
    expect(t.state.status).toBe("idle");
  });

  it("complete with autoStart chains the next phase from the deadline", () => {
    const auto = { ...S, autoStart: true };
    const st = running(T0, auto);
    const t = complete(st, st.endsAt!, auto, true, newId);
    expect(t.state.status).toBe("running");
    expect(t.state.phase).toBe("short");
    expect(t.state.startedAt).toBe(T0 + 25 * MIN);
    expect(t.state.endsAt).toBe(T0 + 30 * MIN);
    expect(t.state.sessionId).not.toBe(st.sessionId);
  });

  it("every 4th completed focus leads to the long break, then the cycle resets", () => {
    const seq: string[] = [];
    let cycle = 0;
    let phase: "focus" | "short" | "long" = "focus";
    for (let i = 0; i < 9; i++) {
      seq.push(phase);
      const nx = nextPhase(phase, cycle, S);
      phase = nx.phase;
      cycle = nx.cycle;
    }
    expect(seq).toEqual(["focus", "short", "focus", "short", "focus", "short", "focus", "long", "focus"]);
    // the 9th step (the second cycle's first focus) has just been counted
    expect(cycle).toBe(1);
  });

  it("cyclesBeforeLong is honoured", () => {
    const two = { ...S, cyclesBeforeLong: 2 };
    expect(nextPhase("focus", 0, two)).toEqual({ phase: "short", cycle: 1 });
    expect(nextPhase("focus", 1, two)).toEqual({ phase: "long", cycle: 2 });
    expect(nextPhase("long", 2, two)).toEqual({ phase: "focus", cycle: 0 });
  });

  it("breaks produce no session record", () => {
    const brk = start({ ...initialState(S), phase: "short", plannedMs: 5 * MIN, remainingMs: 5 * MIN }, T0, newId);
    const t = settle(brk, T0 + 6 * MIN, S, newId)!;
    expect(t.record).toBeNull();
    expect(t.finished).toBe("short");
    expect(t.state.phase).toBe("focus");
  });

  it("cups mirror the cycle and cap at the cycle length", () => {
    expect(cupsFilled({ ...initialState(S), cycle: 3 }, S)).toBe(3);
    expect(cupsFilled({ ...initialState(S), cycle: 4 }, S)).toBe(4);
    expect(cupsFilled({ ...initialState(S), cycle: 9 }, S)).toBe(4);
  });
});

describe("abandoning (reset / skip)", () => {
  it("59 s of focus is NOT logged, 60 s is (completed=false)", () => {
    const st = running();
    expect(reset(st, T0 + MIN_LOGGED_ABANDON_MS - 1_000, S).record).toBeNull();
    const r = reset(st, T0 + MIN_LOGGED_ABANDON_MS, S);
    expect(r.record).toMatchObject({ id: st.sessionId, completed: false, durationSec: 60, plannedSec: 1500, endedAt: T0 + MIN });
  });

  it("an abandoned session does not earn a cup and returns to a full idle focus", () => {
    const st = { ...running(), cycle: 2 };
    const r = reset(st, T0 + 10 * MIN, S);
    expect(r.state).toMatchObject({ phase: "focus", status: "idle", cycle: 2, remainingMs: 25 * MIN, sessionId: null });
    expect(r.finished).toBeNull();
  });

  it("abandoned duration counts focused time only, not paused time", () => {
    let st = running();
    st = pause(st, T0 + 3 * MIN);
    const r = reset(st, T0 + 90 * MIN, S);
    expect(r.record!.durationSec).toBe(180);
  });

  it("a paused session that got far enough is still logged on reset", () => {
    const st = pause(running(), T0 + 2 * MIN);
    expect(reset(st, T0 + 5 * MIN, S).record?.completed).toBe(false);
  });

  it("resetting an idle timer logs nothing", () => {
    expect(reset(initialState(S), T0, S).record).toBeNull();
  });

  it("resetting a break logs nothing and keeps it a break", () => {
    const brk = start({ ...initialState(S), phase: "short", plannedMs: 5 * MIN, remainingMs: 5 * MIN, cycle: 1 }, T0, newId);
    const r = reset(brk, T0 + 2 * MIN, S);
    expect(r.record).toBeNull();
    expect(r.state).toMatchObject({ phase: "short", status: "idle", cycle: 1 });
  });

  it("skipping a break goes to focus; the long break clears the cycle", () => {
    const brk = { ...initialState(S), phase: "long" as const, plannedMs: 15 * MIN, remainingMs: 15 * MIN, cycle: 4 };
    const t = skip(brk, T0, S, false, newId);
    expect(t.state).toMatchObject({ phase: "focus", status: "idle", cycle: 0 });
  });

  it("skipping a focus phase is the same as resetting it", () => {
    const st = running();
    const t = skip(st, T0 + 5 * MIN, S, false, newId);
    expect(t.record?.completed).toBe(false);
    expect(t.state.phase).toBe("focus");
    expect(t.state.cycle).toBe(0);
  });
});

describe("links", () => {
  it("the session record carries the task link and title", () => {
    const st = setLink(running(), { kind: "task", id: "t-1", title: "Write essay" });
    const t = settle(st, T0 + 25 * MIN, S, newId)!;
    expect(t.record).toMatchObject({ taskId: "t-1", blockId: null, label: "Write essay" });
  });

  it("a block link fills blockId instead", () => {
    const st = setLink(running(), { kind: "block", id: "b-1", title: "Deep Work" });
    const t = reset(st, T0 + 2 * MIN, S);
    expect(t.record).toMatchObject({ taskId: null, blockId: "b-1", label: "Deep Work" });
  });

  it("the link survives into the next phase so the user does not re-pick it", () => {
    const st = setLink(running(), { kind: "task", id: "t-1", title: "x" });
    expect(settle(st, T0 + 25 * MIN, S, newId)!.state.link?.id).toBe("t-1");
  });
});

describe("settings", () => {
  it("clamps minutes to 1..120, rounds, and falls back on junk", () => {
    const s = sanitizeSettings({ focusMin: 0, shortMin: 999, longMin: 12.6, cyclesBeforeLong: 1 });
    expect(s.focusMin).toBe(1);
    expect(s.shortMin).toBe(120);
    expect(s.longMin).toBe(13);
    expect(s.cyclesBeforeLong).toBe(2);
    expect(sanitizeSettings({ focusMin: "25", volume: NaN, cyclesBeforeLong: 99 })).toMatchObject({
      focusMin: 25,
      volume: DEFAULT_SETTINGS.volume,
      cyclesBeforeLong: 8,
    });
  });

  it("non-objects give the defaults", () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings("nope")).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
  });

  it("changing durations retimes an idle timer but never a running one", () => {
    const s2 = { ...S, focusMin: 50 };
    expect(applySettings(initialState(S), s2)).toMatchObject({ plannedMs: 50 * MIN, remainingMs: 50 * MIN });
    const run = running();
    expect(applySettings(run, s2)).toBe(run);
    const paused = pause(run, T0 + MIN);
    expect(applySettings(paused, s2)).toBe(paused);
  });

  it("phaseMs reads the right setting", () => {
    expect(phaseMs("focus", S)).toBe(25 * MIN);
    expect(phaseMs("short", S)).toBe(5 * MIN);
    expect(phaseMs("long", S)).toBe(15 * MIN);
  });
});

describe("sanitizeState (corrupt or stale localStorage)", () => {
  it("round-trips a valid running state through JSON", () => {
    const st = running();
    expect(sanitizeState(JSON.parse(JSON.stringify(st)), S)).toEqual(st);
  });

  it("round-trips paused and idle states", () => {
    const p = pause(running(), T0 + MIN);
    expect(sanitizeState(JSON.parse(JSON.stringify(p)), S)).toEqual(p);
    const i = initialState(S);
    expect(sanitizeState(JSON.parse(JSON.stringify(i)), S)).toEqual(i);
  });

  it.each([
    ["null", null],
    ["a string", "oops"],
    ["empty object", {}],
    ["unknown phase", { ...running(), phase: "nap" }],
    ["unknown status", { ...running(), status: "sleeping" }],
    ["NaN planned", { ...running(), plannedMs: "x" }],
    ["zero planned", { ...running(), plannedMs: 0 }],
    ["running without a deadline", { ...running(), endsAt: null }],
    ["running without a session id", { ...running(), sessionId: null }],
    ["paused without a start time", { ...pause(running(), T0 + MIN), startedAt: null }],
  ])("falls back to a fresh idle timer for: %s", (_label, raw) => {
    expect(sanitizeState(raw, S)).toEqual(initialState(S));
  });

  it("keeps a good link and drops a malformed one", () => {
    const good = sanitizeState({ ...initialState(S), link: { kind: "task", id: "a", title: "b" } }, S);
    expect(good.link).toEqual({ kind: "task", id: "a", title: "b" });
    const bad = sanitizeState({ ...initialState(S), link: { kind: "pizza", id: 3 } }, S);
    expect(bad.link).toBeNull();
  });

  it("clamps remaining into 0..planned and cycle into range", () => {
    const st = sanitizeState({ ...initialState(S), remainingMs: 10 ** 12, cycle: -5 }, S);
    expect(st.remainingMs).toBe(25 * MIN);
    expect(st.cycle).toBe(0);
  });

  it("drops a stray deadline from a non-running state", () => {
    const st = sanitizeState({ ...pause(running(), T0 + MIN), endsAt: T0 + 5 }, S);
    expect(st.endsAt).toBeNull();
  });
});

describe("formatClock", () => {
  it.each([
    [25 * MIN, "25:00"],
    [25 * MIN - 1, "25:00"], // ceil: the first millisecond still reads 25:00
    [59_001, "01:00"],
    [59_000, "00:59"],
    [1, "00:01"],
    [0, "00:00"],
    [-5, "00:00"],
    [120 * MIN, "120:00"],
  ])("%d ms -> %s", (ms, text) => {
    expect(formatClock(ms)).toBe(text);
  });
});
