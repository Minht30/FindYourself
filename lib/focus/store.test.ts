import { beforeEach, describe, expect, it } from "vitest";

// The store reads localStorage through a try/catch wrapper, so a tiny in-memory
// stand-in is all it needs under node.
class MemoryStorage {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.has(k) ? (this.data.get(k) as string) : null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, String(v));
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
  clear() {
    this.data.clear();
  }
}
const storage = new MemoryStorage();
(globalThis as unknown as { localStorage: MemoryStorage }).localStorage = storage;

import { pendingSessions } from "./sessions";
import { useFocusStore } from "./store";
import { DEFAULT_SETTINGS, initialState, type TimerState } from "./timer";

const MIN = 60_000;
const store = () => useFocusStore.getState();

// Written after the store is reset (resetting writes to storage too, via persist).
let pending: string | null = null;
function persisted(timer: TimerState, settings = DEFAULT_SETTINGS) {
  pending = JSON.stringify({ state: { timer, settings }, version: 1 });
}

async function reload() {
  useFocusStore.setState({ timer: initialState(DEFAULT_SETTINGS), settings: DEFAULT_SETTINGS, hydrated: false, lastFinished: null });
  if (pending !== null) storage.setItem("fy-focus", pending);
  pending = null;
  await useFocusStore.persist.rehydrate();
}

beforeEach(async () => {
  storage.clear();
  await reload();
});

describe("restoring from localStorage", () => {
  it("unparseable JSON falls back to a fresh idle timer and still marks hydrated", async () => {
    pending = "{not json";
    await reload();
    expect(store().hydrated).toBe(true);
    expect(store().timer).toEqual(initialState(DEFAULT_SETTINGS));
  });

  it("a state with the wrong shape is replaced, not trusted", async () => {
    pending = JSON.stringify({ state: { timer: { phase: "nap", status: 7 }, settings: { focusMin: -4 } }, version: 1 });
    await reload();
    expect(store().timer.phase).toBe("focus");
    expect(store().timer.status).toBe("idle");
    expect(store().settings.focusMin).toBe(1); // clamped, not dropped
  });

  it("a running timer comes back running with the same deadline", async () => {
    const now = Date.now();
    persisted({ ...initialState(DEFAULT_SETTINGS), status: "running", sessionId: "s1", startedAt: now - MIN, endsAt: now + 24 * MIN });
    await reload();
    expect(store().timer.status).toBe("running");
    expect(store().timer.endsAt).toBe(now + 24 * MIN);
    expect(store().timer.sessionId).toBe("s1");
  });

  it("a deadline that passed while the tab was closed completes as of the deadline, with no chain", async () => {
    const now = Date.now();
    const endsAt = now - 2 * 60 * MIN;
    persisted(
      { ...initialState(DEFAULT_SETTINGS), status: "running", sessionId: "gone", startedAt: endsAt - 25 * MIN, endsAt },
      { ...DEFAULT_SETTINGS, autoStart: true },
    );
    await reload();
    store().tick(now, { away: true });
    expect(store().timer).toMatchObject({ phase: "short", status: "idle", cycle: 1 });
    expect(store().lastFinished).toMatchObject({ phase: "focus", away: true });
    const [rec] = pendingSessions();
    expect(rec).toMatchObject({ id: "gone", completed: true, endedAt: endsAt, durationSec: 1500 });
  });
});

describe("ticking", () => {
  it("does nothing before the deadline", () => {
    store().startOrResume();
    store().tick(Date.now() + 10_000);
    expect(store().timer.status).toBe("running");
    expect(pendingSessions()).toHaveLength(0);
    expect(store().lastFinished).toBeNull();
  });

  it("a tick more than 5 minutes late counts as away (no chime) but is still saved", () => {
    store().startOrResume();
    const ends = store().timer.endsAt!;
    store().tick(ends + 6 * MIN);
    expect(store().lastFinished?.away).toBe(true);
    expect(pendingSessions()).toHaveLength(1);
  });

  it("an on-time tick is not away, advances the cycle, and each finish gets a new seq", () => {
    store().startOrResume();
    store().tick(store().timer.endsAt! + 500);
    expect(store().lastFinished).toMatchObject({ phase: "focus", away: false, seq: 1 });
    store().startOrResume();
    store().tick(store().timer.endsAt! + 500);
    expect(store().lastFinished?.seq).toBe(2);
    // the second finish was the break, which hands back to focus
    expect(store().lastFinished?.phase).toBe("short");
    expect(store().timer).toMatchObject({ phase: "focus", status: "idle", cycle: 1 });
  });

  it("autoStart chains straight into the break on an on-time finish", () => {
    store().setSettings({ autoStart: true });
    store().startOrResume();
    store().tick(store().timer.endsAt! + 200);
    expect(store().timer).toMatchObject({ phase: "short", status: "running" });
  });

  it("the same session is never queued twice", () => {
    store().startOrResume();
    const ends = store().timer.endsAt!;
    const id = store().timer.sessionId;
    store().tick(ends + 1);
    // a second tab replays the same finish from the same persisted state
    persisted({ ...initialState(DEFAULT_SETTINGS), status: "running", sessionId: id, startedAt: ends - 25 * MIN, endsAt: ends });
    return reload().then(() => {
      store().tick(ends + 2);
      expect(pendingSessions().filter((r) => r.id === id)).toHaveLength(1);
    });
  });
});

describe("abandoning through the store", () => {
  it("reset under a minute logs nothing", () => {
    store().startOrResume();
    store().reset();
    expect(pendingSessions()).toHaveLength(0);
    expect(store().timer.status).toBe("idle");
  });

  it("reset after a minute logs completed=false with the focused time", () => {
    store().startOrResume();
    const t = store().timer;
    useFocusStore.setState({ timer: { ...t, startedAt: Date.now() - 10 * MIN, endsAt: Date.now() + 15 * MIN } });
    store().reset();
    const [rec] = pendingSessions();
    expect(rec.completed).toBe(false);
    expect(rec.durationSec).toBeGreaterThanOrEqual(599);
    expect(rec.durationSec).toBeLessThanOrEqual(601);
    expect(store().timer.cycle).toBe(0);
  });
});

describe("settings", () => {
  it("clamp, and retime an idle timer immediately", () => {
    store().setSettings({ focusMin: 50 });
    expect(store().timer.remainingMs).toBe(50 * MIN);
    store().setSettings({ focusMin: 9999 });
    expect(store().settings.focusMin).toBe(120);
  });

  it("do not retime a running timer", () => {
    store().startOrResume();
    store().setSettings({ focusMin: 50 });
    expect(store().timer.plannedMs).toBe(25 * MIN);
  });

  it("persist to localStorage", () => {
    store().setSettings({ chime: false, shortMin: 7 });
    const saved = JSON.parse(storage.getItem("fy-focus") as string);
    expect(saved.state.settings).toMatchObject({ chime: false, shortMin: 7 });
  });
});

describe("the timer hook (what focus-session music listens to)", () => {
  type Call = { prev: string; next: string; cause: string };
  const calls: Call[] = [];
  const label = (t: TimerState) => `${t.phase}:${t.status}`;

  beforeEach(async () => {
    calls.length = 0;
    const { setTimerHook } = await import("./store");
    setTimerHook((prev, next, cause) => calls.push({ prev: label(prev), next: label(next), cause }));
  });

  it("is told about a click: start, pause, resume, reset, as `user`", () => {
    store().startOrResume();
    store().pause();
    store().startOrResume();
    store().reset();
    expect(calls.map((c) => `${c.prev} -> ${c.next} (${c.cause})`)).toEqual([
      "focus:idle -> focus:running (user)",
      "focus:running -> focus:paused (user)",
      "focus:paused -> focus:running (user)",
      "focus:running -> focus:idle (user)",
    ]);
  });

  it("is told about the deadline passing as `tick`, with the break the timer moved to", () => {
    store().startOrResume();
    calls.length = 0;
    const endsAt = store().timer.endsAt as number;
    store().tick(endsAt + 100);
    expect(calls).toEqual([{ prev: "focus:running", next: "short:idle", cause: "tick" }]);
  });

  it("an auto-started next phase is one `tick` move into a running break", () => {
    store().setSettings({ autoStart: true });
    store().startOrResume();
    calls.length = 0;
    store().tick((store().timer.endsAt as number) + 100);
    expect(calls).toEqual([{ prev: "focus:running", next: "short:running", cause: "tick" }]);
  });

  it("is not told about anything on a ticks that change nothing, on settings, or on restoring a saved timer", async () => {
    store().tick(Date.now());
    store().setSettings({ chime: false });
    expect(calls).toEqual([]);
    const running: TimerState = { ...initialState(DEFAULT_SETTINGS), status: "running", sessionId: "s1", startedAt: Date.now(), endsAt: Date.now() + 10 * MIN };
    persisted(running);
    await reload();
    expect(store().timer.status).toBe("running");
    expect(calls).toEqual([]); // a page load that finds a running timer must not look like "the user started it"
  });

  it("a timer that finished while the page was closed settles quietly as `tick` (never a start)", () => {
    store().startOrResume();
    calls.length = 0;
    store().tick((store().timer.endsAt as number) + 60 * MIN, { away: true });
    expect(calls).toHaveLength(1);
    expect(calls[0].cause).toBe("tick");
    expect(calls[0].next).toBe("short:idle");
  });

  it("can be removed", async () => {
    const { setTimerHook } = await import("./store");
    setTimerHook(null);
    store().startOrResume();
    expect(calls).toEqual([]);
  });
});
