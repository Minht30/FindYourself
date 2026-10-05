import { beforeEach, describe, expect, it, vi } from "vitest";

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
const events: string[] = [];
const g = globalThis as unknown as { localStorage: MemoryStorage; window: { dispatchEvent: (e: Event) => void } };
g.localStorage = storage;
g.window = { dispatchEvent: (e: Event) => void events.push(e.type) };

import { createFlusher, refreshPending, useSync, type SaveFn } from "./flush";
import { enqueueSession, pendingSessions } from "./sessions";
import type { SessionRecord } from "./timer";

function rec(id: string): SessionRecord {
  return {
    id,
    startedAt: 1_000,
    endedAt: 2_000,
    durationSec: 1500,
    plannedSec: 1500,
    completed: true,
    taskId: null,
    blockId: null,
    label: null,
  };
}
const ids = () => pendingSessions().map((r) => r.id);

beforeEach(() => {
  storage.clear();
  events.length = 0;
  useSync.setState({ pending: 0, syncing: false, lastError: null });
});

describe("outbox", () => {
  it("never queues the same session twice", () => {
    enqueueSession(rec("a"));
    enqueueSession(rec("a"));
    expect(ids()).toEqual(["a"]);
  });

  it("tells the app a session was queued", () => {
    enqueueSession(rec("a"));
    expect(events).toContain("fy-outbox");
  });

  it("survives corrupt storage by reading as empty", () => {
    storage.setItem("fy-focus-outbox", "{oops");
    expect(pendingSessions()).toEqual([]);
    storage.setItem("fy-focus-outbox", JSON.stringify([rec("ok"), { id: 5 }, null]));
    expect(ids()).toEqual(["ok"]);
  });
});

describe("flush", () => {
  it("drops what the server saved", async () => {
    enqueueSession(rec("a"));
    enqueueSession(rec("b"));
    const save: SaveFn = async (batch) => ({ ok: true, saved: batch.map((r) => r.id), rejected: [] });
    await createFlusher(save)();
    expect(ids()).toEqual([]);
    expect(useSync.getState()).toMatchObject({ pending: 0, lastError: null, syncing: false });
  });

  it("keeps everything and records the exact reason when signed out", async () => {
    enqueueSession(rec("a"));
    const save = vi.fn<SaveFn>(async () => ({ ok: false, error: "unauthenticated" }));
    await createFlusher(save)();
    expect(save).toHaveBeenCalledTimes(1); // no hammering the server in a loop
    expect(ids()).toEqual(["a"]);
    expect(useSync.getState()).toMatchObject({ pending: 1, lastError: "unauthenticated", syncing: false });
  });

  it("a call that resolves with no result (middleware redirect to /login) keeps the queue and does not throw", async () => {
    enqueueSession(rec("a"));
    const save = vi.fn(async () => undefined) as unknown as SaveFn;
    await expect(createFlusher(save)()).resolves.toBeUndefined();
    expect(ids()).toEqual(["a"]);
    expect(useSync.getState()).toMatchObject({ pending: 1, lastError: "no_response", syncing: false });
  });

  it("treats a thrown request (offline) as retryable", async () => {
    enqueueSession(rec("a"));
    await createFlusher(async () => {
      throw new Error("Failed to fetch");
    })();
    expect(ids()).toEqual(["a"]);
    expect(useSync.getState().lastError).toBe("network");
  });

  it("drops a rejected record so it cannot block the queue, and keeps the rest", async () => {
    enqueueSession(rec("bad"));
    enqueueSession(rec("good"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await createFlusher(async () => ({ ok: true, saved: ["good"], rejected: [{ id: "bad", reason: "bad_duration" }] }))();
    expect(ids()).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("bad"));
    warn.mockRestore();
  });

  it("an id the server neither saved nor rejected stays queued, and the loop stops", async () => {
    enqueueSession(rec("a"));
    const save = vi.fn<SaveFn>(async () => ({ ok: true, saved: [], rejected: [] }));
    await createFlusher(save)();
    expect(save).toHaveBeenCalledTimes(1);
    expect(ids()).toEqual(["a"]);
    expect(useSync.getState().lastError).toBe("no_progress");
  });

  it("drains more than one batch (50 per request)", async () => {
    for (let i = 0; i < 120; i++) enqueueSession(rec(`s${i}`));
    const sizes: number[] = [];
    await createFlusher(async (batch) => {
      sizes.push(batch.length);
      return { ok: true, saved: batch.map((r) => r.id), rejected: [] };
    })();
    expect(sizes).toEqual([50, 50, 20]);
    expect(ids()).toEqual([]);
  });

  it("a second flush while one is running does nothing", async () => {
    enqueueSession(rec("a"));
    let release!: () => void;
    const save = vi.fn<SaveFn>(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ ok: true, saved: ["a"], rejected: [] });
        }),
    );
    const flush = createFlusher(save);
    const first = flush();
    const second = flush();
    release();
    await Promise.all([first, second]);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("retries successfully on the next call after a failure (nothing lost)", async () => {
    enqueueSession(rec("a"));
    let up = false;
    const flush = createFlusher(async (batch) =>
      up ? { ok: true, saved: batch.map((r) => r.id), rejected: [] } : { ok: false, error: "unauthenticated" },
    );
    await flush();
    expect(ids()).toEqual(["a"]);
    up = true;
    await flush();
    expect(ids()).toEqual([]);
    expect(useSync.getState().lastError).toBeNull();
  });

  it("refreshPending mirrors the outbox size", () => {
    enqueueSession(rec("a"));
    enqueueSession(rec("b"));
    refreshPending();
    expect(useSync.getState().pending).toBe(2);
  });
});
