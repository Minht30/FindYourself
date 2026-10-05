import { describe, expect, it } from "vitest";
import { classify, createSaver, type SaveOutcome, type SaveStatus } from "./saver";
import { defaultSettings, type MixerSettings } from "./state";

const tick = () => new Promise<void>((r) => setImmediate(r));

// A clock the tests drive by hand.
function fakeClock() {
  let now = 0;
  let id = 0;
  const q = new Map<number, { at: number; fn: () => void }>();
  return {
    timers: {
      set: (fn: () => void, ms: number) => {
        const i = ++id;
        q.set(i, { at: now + ms, fn });
        return i;
      },
      clear: (i: unknown) => void q.delete(i as number),
    },
    async advance(ms: number) {
      const end = now + ms;
      for (;;) {
        const next = [...q.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        q.delete(next[0]);
        now = next[1].at;
        next[1].fn();
        await tick();
      }
      now = end;
    },
    pending: () => q.size,
  };
}

function setup(responses: SaveOutcome[] | ((n: number) => SaveOutcome | Promise<SaveOutcome>)) {
  const clock = fakeClock();
  const sent: MixerSettings[] = [];
  const saved: number[] = [];
  const statuses: SaveStatus[] = [];
  const saver = createSaver({
    send: async (s) => {
      sent.push(s);
      return typeof responses === "function" ? responses(sent.length) : responses[Math.min(sent.length - 1, responses.length - 1)];
    },
    onSaved: (rev) => saved.push(rev),
    onStatus: (s) => statuses.push(s),
    timers: clock.timers,
    debounceMs: 800,
    retryMs: [1000, 5000],
  });
  return { clock, sent, saved, statuses, saver };
}
const mix = (rain: number): MixerSettings => ({ ...defaultSettings(), levels: { ...defaultSettings().levels, rain } });
const ok: SaveOutcome = { ok: true };

describe("debounce", () => {
  it("a burst of changes sends one save, with the last state", async () => {
    const t = setup([ok]);
    for (let i = 1; i <= 50; i++) t.saver.queue(mix(i / 100), i);
    await t.clock.advance(799);
    expect(t.sent.length).toBe(0);
    await t.clock.advance(2);
    expect(t.sent.length).toBe(1);
    expect(t.sent[0].levels.rain).toBe(0.5);
    expect(t.saved).toEqual([50]);
  });

  it("each change restarts the quiet period", async () => {
    const t = setup([ok]);
    t.saver.queue(mix(0.1), 1);
    await t.clock.advance(700);
    t.saver.queue(mix(0.2), 2);
    await t.clock.advance(700);
    expect(t.sent.length).toBe(0);
    await t.clock.advance(150);
    expect(t.sent.length).toBe(1);
  });

  it("flush() sends right away (tab hidden) and the debounce does not send it again", async () => {
    const t = setup([ok]);
    t.saver.queue(mix(0.3), 1);
    await t.saver.flush();
    expect(t.sent.length).toBe(1);
    await t.clock.advance(5000);
    expect(t.sent.length).toBe(1);
    expect(t.saver.isIdle()).toBe(true);
  });

  it("flush() with nothing queued sends nothing", async () => {
    const t = setup([ok]);
    await t.saver.flush();
    expect(t.sent.length).toBe(0);
  });
});

describe("one save at a time", () => {
  it("a change made while a save is in flight is sent afterwards, never in parallel", async () => {
    let release!: () => void;
    let inflightNow = 0;
    let maxInflight = 0;
    const clock = fakeClock();
    const sent: number[] = [];
    const saver = createSaver({
      send: async (s) => {
        inflightNow++;
        maxInflight = Math.max(maxInflight, inflightNow);
        sent.push(s.levels.rain);
        if (sent.length === 1) await new Promise<void>((r) => (release = r));
        inflightNow--;
        return ok;
      },
      onSaved: () => {},
      onStatus: () => {},
      timers: clock.timers,
      debounceMs: 800,
    });
    saver.queue(mix(0.1), 1);
    await clock.advance(800); // first save starts and hangs
    expect(sent).toEqual([0.1]);
    saver.queue(mix(0.9), 2);
    await clock.advance(800); // debounce fires, but one is in flight
    expect(sent).toEqual([0.1]);
    release();
    await tick();
    await clock.advance(10);
    expect(sent).toEqual([0.1, 0.9]);
    expect(maxInflight).toBe(1);
  });

  it("only clears the pending revision that was actually saved", async () => {
    let release!: () => void;
    const clock = fakeClock();
    const saved: number[] = [];
    let n = 0;
    const saver = createSaver({
      send: async () => {
        if (++n === 1) await new Promise<void>((r) => (release = r));
        return ok;
      },
      onSaved: (rev) => saved.push(rev),
      onStatus: () => {},
      timers: clock.timers,
    });
    saver.queue(mix(0.1), 7);
    await clock.advance(800);
    saver.queue(mix(0.2), 8); // edited while rev 7 is being saved
    release();
    await tick();
    expect(saved).toEqual([7]); // the store compares with its current rev (8) and stays pending
  });
});

describe("failure", () => {
  it("keeps the change, reports the reason and retries with backoff until it works", async () => {
    const fail: SaveOutcome = { ok: false, reason: "network", retry: true };
    const t = setup([fail, fail, ok]);
    t.saver.queue(mix(0.4), 1);
    await t.clock.advance(800);
    expect(t.sent.length).toBe(1);
    expect(t.statuses[t.statuses.length - 1]).toEqual({ kind: "failed", reason: "network" });
    expect(t.saved).toEqual([]);
    await t.clock.advance(999);
    expect(t.sent.length).toBe(1);
    await t.clock.advance(2); // first retry after 1000 ms
    expect(t.sent.length).toBe(2);
    await t.clock.advance(4990);
    expect(t.sent.length).toBe(2);
    await t.clock.advance(20); // second retry after 5000 ms
    expect(t.sent.length).toBe(3);
    expect(t.saved).toEqual([1]);
    expect(t.statuses[t.statuses.length - 1]).toEqual({ kind: "saved" });
    expect(t.clock.pending()).toBe(0);
  });

  it("the backoff stays at its last step instead of growing forever", async () => {
    const fail: SaveOutcome = { ok: false, reason: "network", retry: true };
    const t = setup(() => fail);
    t.saver.queue(mix(0.4), 1);
    await t.clock.advance(800);
    await t.clock.advance(1000);
    await t.clock.advance(5000);
    const before = t.sent.length;
    await t.clock.advance(5000);
    await t.clock.advance(5000);
    expect(t.sent.length).toBe(before + 2);
  });

  it("a thrown error (offline) counts as a retryable network failure", async () => {
    const clock = fakeClock();
    const statuses: SaveStatus[] = [];
    let n = 0;
    const saver = createSaver({
      send: async () => {
        if (++n === 1) throw new TypeError("Failed to fetch");
        return ok;
      },
      onSaved: () => {},
      onStatus: (s) => statuses.push(s),
      timers: clock.timers,
      retryMs: [500],
    });
    saver.queue(mix(0.4), 1);
    await clock.advance(800);
    expect(statuses[statuses.length - 1]).toEqual({ kind: "failed", reason: "network" });
    await clock.advance(501);
    expect(statuses[statuses.length - 1]).toEqual({ kind: "saved" });
  });

  it("a refused save is not retried; the next edit tries again", async () => {
    const refused: SaveOutcome = { ok: false, reason: "bad_level", retry: false };
    const t = setup([refused, ok]);
    t.saver.queue(mix(0.4), 1);
    await t.clock.advance(800);
    expect(t.statuses[t.statuses.length - 1]).toEqual({ kind: "failed", reason: "bad_level" });
    await t.clock.advance(120_000);
    expect(t.sent.length).toBe(1);
    expect(t.clock.pending()).toBe(0);
    t.saver.queue(mix(0.5), 2);
    await t.clock.advance(800);
    expect(t.sent.length).toBe(2);
    expect(t.saved).toEqual([2]);
  });

  it("a new edit during backoff replaces the wait and sends the newest state", async () => {
    const fail: SaveOutcome = { ok: false, reason: "network", retry: true };
    const t = setup([fail, ok]);
    t.saver.queue(mix(0.1), 1);
    await t.clock.advance(800); // fails; retry armed for +1000
    t.saver.queue(mix(0.8), 2);
    await t.clock.advance(800);
    expect(t.sent.length).toBe(2);
    expect(t.sent[1].levels.rain).toBe(0.8);
    expect(t.saved).toEqual([2]);
  });

  it("retryNow() skips the wait (back online)", async () => {
    const fail: SaveOutcome = { ok: false, reason: "network", retry: true };
    const t = setup([fail, ok]);
    t.saver.queue(mix(0.1), 1);
    await t.clock.advance(800);
    expect(t.sent.length).toBe(1);
    t.saver.retryNow();
    await tick();
    expect(t.sent.length).toBe(2);
    expect(t.saved).toEqual([1]);
  });

  it("retryNow() with nothing to save does nothing", async () => {
    const t = setup([ok]);
    t.saver.retryNow();
    await tick();
    expect(t.sent.length).toBe(0);
  });

  it("cancel() drops a pending debounce", async () => {
    const t = setup([ok]);
    t.saver.queue(mix(0.1), 1);
    t.saver.cancel();
    await t.clock.advance(5000);
    expect(t.sent.length).toBe(0);
  });
});

describe("classify (the server action's answer)", () => {
  it("ok is ok", () => {
    expect(classify({ ok: true })).toEqual({ ok: true });
  });
  it("no result at all means signed out (the middleware redirected the POST) and is worth retrying", () => {
    expect(classify(undefined)).toEqual({ ok: false, reason: "unauthenticated", retry: true });
    expect(classify(null)).toEqual({ ok: false, reason: "unauthenticated", retry: true });
  });
  it("unauthenticated is retryable: the user may sign in again in another tab", () => {
    expect(classify({ ok: false, error: "unauthenticated" })).toEqual({ ok: false, reason: "unauthenticated", retry: true });
  });
  it("validation failures are permanent", () => {
    for (const e of ["not_an_object", "bad_levels", "unknown_layer", "bad_level", "bad_master", "bad_muted"]) {
      expect(classify({ ok: false, error: e })).toEqual({ ok: false, reason: e, retry: false });
    }
  });
  it("integrity / policy errors are permanent, other database errors are retried", () => {
    expect(classify({ ok: false, error: "db_23514" }).ok === false && (classify({ ok: false, error: "db_23514" }) as { retry: boolean }).retry).toBe(false);
    expect((classify({ ok: false, error: "db_42501" }) as { retry: boolean }).retry).toBe(false);
    expect((classify({ ok: false, error: "db_57014" }) as { retry: boolean }).retry).toBe(true);
    expect((classify({ ok: false, error: "db_error" }) as { retry: boolean }).retry).toBe(true);
  });
});
