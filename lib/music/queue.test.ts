import { describe, expect, it } from "vitest";
import {
  cycleRepeat,
  emptyQueue,
  jump,
  load,
  next,
  playFrom,
  previous,
  reconcile,
  sanitizeQueue,
  setRepeat,
  setShuffle,
  type QueueState,
} from "./queue";
import { isPermutation } from "./playlist";

const L = ["a", "b", "c", "d"];
const at = (current: string, over: Partial<QueueState> = {}): QueueState => ({
  ...load(emptyQueue(), L, current),
  ...over,
});

describe("playFrom / load", () => {
  it("starts at the chosen track, or the first", () => {
    expect(playFrom(emptyQueue(), L, "c")).toMatchObject({ action: "play", state: { current: "c", order: L } });
    expect(playFrom(emptyQueue(), L).state.current).toBe("a");
  });
  it("ignores an unknown start and removes duplicates", () => {
    expect(playFrom(emptyQueue(), ["a", "a", "b"], "zzz").state).toMatchObject({ base: ["a", "b"], current: "a" });
  });
  it("an empty list stops", () => {
    expect(playFrom(emptyQueue(), [])).toMatchObject({ action: "stop", state: { current: null } });
  });
  it("with shuffle on, the start track leads and the rest is a permutation", () => {
    const prev = { ...emptyQueue(), shuffle: true };
    for (let seed = 1; seed < 30; seed++) {
      const q = load(prev, L, "c", seed);
      expect(q.order[0]).toBe("c");
      expect(isPermutation(L, q.order)).toBe(true);
      expect(q.current).toBe("c");
    }
  });
});

describe("next", () => {
  it("moves along the order", () => {
    expect(next(at("a"), false)).toMatchObject({ action: "play", state: { current: "b" } });
    expect(next(at("c"), true)).toMatchObject({ action: "play", state: { current: "d" } });
  });
  it("repeat off: the end stops, parked on the first track (auto and manual)", () => {
    for (const auto of [true, false]) {
      expect(next(at("d"), auto)).toMatchObject({ action: "stop", state: { current: "a" } });
    }
  });
  it("repeat all: wraps to the start", () => {
    expect(next(at("d", { repeat: "all" }), true)).toMatchObject({ action: "play", state: { current: "a" } });
  });
  it("repeat all with one track restarts it", () => {
    const one = { ...load(emptyQueue(), ["a"], "a"), repeat: "all" as const };
    expect(next(one, true).action).toBe("restart");
  });
  it("repeat one: a natural end restarts, but a manual next still advances", () => {
    expect(next(at("b", { repeat: "one" }), true)).toMatchObject({ action: "restart", state: { current: "b" } });
    expect(next(at("b", { repeat: "one" }), false)).toMatchObject({ action: "play", state: { current: "c" } });
  });
  it("repeat all + shuffle: a new lap is a fresh permutation that does not start with the track just played", () => {
    for (let seed = 1; seed < 60; seed++) {
      const q: QueueState = { ...load({ ...emptyQueue(), shuffle: true, repeat: "all" }, L, "a", seed) };
      const last = q.order[q.order.length - 1];
      const t = next({ ...q, current: last }, true);
      expect(t.action).toBe("play");
      expect(isPermutation(L, t.state.order)).toBe(true);
      expect(t.state.order[0]).not.toBe(last);
      expect(t.state.current).toBe(t.state.order[0]);
    }
  });
  it("walking a shuffled queue plays every track exactly once before the end", () => {
    let q = load({ ...emptyQueue(), shuffle: true }, L, "b", 7);
    const played = [q.current!];
    for (let i = 0; i < L.length - 1; i++) {
      q = next(q, true).state;
      played.push(q.current!);
    }
    expect(isPermutation(L, played)).toBe(true);
    expect(next(q, true).action).toBe("stop");
  });
  it("nothing playing: stop", () => {
    expect(next(emptyQueue(), true).action).toBe("stop");
  });
});

describe("previous", () => {
  it("past 3 seconds it restarts the track", () => {
    expect(previous(at("c"), 3.5)).toMatchObject({ action: "restart", state: { current: "c" } });
  });
  it("within 3 seconds it goes back one", () => {
    expect(previous(at("c"), 3)).toMatchObject({ action: "play", state: { current: "b" } });
    expect(previous(at("c"), 0)).toMatchObject({ action: "play", state: { current: "b" } });
  });
  it("at the first track: restart (repeat off) or wrap to the last (repeat all)", () => {
    expect(previous(at("a"), 1)).toMatchObject({ action: "restart", state: { current: "a" } });
    expect(previous(at("a", { repeat: "all" }), 1)).toMatchObject({ action: "play", state: { current: "d" } });
  });
  it("nothing playing: stop", () => {
    expect(previous(emptyQueue(), 0).action).toBe("stop");
  });
});

describe("jump", () => {
  it("plays a track in the queue", () => {
    expect(jump(at("a"), "d")).toMatchObject({ action: "play", state: { current: "d" } });
  });
  it("ignores one that is not in it", () => {
    expect(jump(at("a"), "zzz")).toMatchObject({ action: "keep", state: { current: "a" } });
  });
});

describe("shuffle and repeat settings", () => {
  it("turning shuffle on keeps the current track in front and does not interrupt playback", () => {
    for (let seed = 1; seed < 20; seed++) {
      const t = setShuffle(at("c"), true, seed);
      expect(t.action).toBe("keep");
      expect(t.state.current).toBe("c");
      expect(t.state.order[0]).toBe("c");
      expect(isPermutation(L, t.state.order)).toBe(true);
    }
  });
  it("turning it off restores the list's own order, on the same track", () => {
    const on = setShuffle(at("c"), true, 5).state;
    const off = setShuffle(on, false).state;
    expect(off.order).toEqual(L);
    expect(off.current).toBe("c");
  });
  it("a no-op is `keep` and the same state", () => {
    const s = at("a");
    expect(setShuffle(s, false).state).toBe(s);
    expect(setRepeat(s, "off").state).toBe(s);
  });
  it("cycles repeat off -> all -> one -> off", () => {
    let s = at("a");
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) {
      s = cycleRepeat(s).state;
      seen.push(s.repeat);
    }
    expect(seen).toEqual(["all", "one", "off", "all"]);
  });
});

describe("reconcile (the library changed under the queue)", () => {
  const all = new Set(L);
  it("keeps everything when nothing changed", () => {
    expect(reconcile(at("b"), all)).toMatchObject({ action: "keep", state: { current: "b", order: L } });
  });
  it("removing a track that is not playing keeps the current one", () => {
    const t = reconcile(at("b"), new Set(["a", "b", "d"]));
    expect(t.action).toBe("keep");
    expect(t.state.order).toEqual(["a", "b", "d"]);
    expect(t.state.current).toBe("b");
  });
  it("removing the playing track moves on to the one now at its place (`play`)", () => {
    const t = reconcile(at("b"), new Set(["a", "c", "d"]));
    expect(t.action).toBe("play");
    expect(t.state.current).toBe("c");
  });
  it("removing the playing LAST track moves to the new last", () => {
    const t = reconcile(at("d"), new Set(["a", "b", "c"]));
    expect(t).toMatchObject({ action: "play", state: { current: "c" } });
  });
  it("removing everything stops", () => {
    expect(reconcile(at("b"), new Set())).toMatchObject({ action: "stop", state: { current: null, order: [], base: [] } });
  });
  it("a shuffled order keeps its order for what is left and appends new tracks", () => {
    const s = setShuffle(at("a"), true, 9).state;
    const t = reconcile(s, new Set([...L, "e"]), [...L, "e"]);
    expect(t.state.order.slice(0, 4)).toEqual(s.order);
    expect(t.state.order[4]).toBe("e");
    expect(isPermutation([...L, "e"], t.state.order)).toBe(true);
  });
  it("a new base (a playlist reordered) changes a non-shuffled order but not the current track", () => {
    const t = reconcile(at("b"), all, ["d", "c", "b", "a"]);
    expect(t.state.order).toEqual(["d", "c", "b", "a"]);
    expect(t.state.current).toBe("b");
    expect(t.action).toBe("keep");
  });
  it("nothing playing stays nothing playing", () => {
    expect(reconcile(emptyQueue(), all).action).toBe("keep");
  });
});

describe("sanitizeQueue (what comes back from localStorage)", () => {
  it("round-trips a good queue", () => {
    const s = setShuffle(at("c", { repeat: "all" }), true, 11).state;
    expect(sanitizeQueue(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
  it("copes with garbage", () => {
    for (const raw of [null, undefined, 5, "x", [], {}, { base: "nope", order: 7, current: 3, repeat: "sideways", seed: "x" }]) {
      const q = sanitizeQueue(raw);
      expect(q.base).toEqual([]);
      expect(q.current).toBeNull();
      expect(q.repeat).toBe("off");
    }
  });
  it("drops ids that are not in the library and fixes a current that vanished", () => {
    const q = sanitizeQueue({ base: ["a", "b", "x"], order: ["a", "b", "x"], current: "x", repeat: "one", shuffle: false }, new Set(["a", "b"]));
    expect(q.base).toEqual(["a", "b"]);
    expect(q.order).toEqual(["a", "b"]);
    expect(q.current).toBe("a");
    expect(q.repeat).toBe("one");
  });
  it("rebuilds an order that is not a permutation of base", () => {
    const q = sanitizeQueue({ base: ["a", "b", "c"], order: ["c", "c"], current: "b", shuffle: true, seed: 3 });
    expect(isPermutation(["a", "b", "c"], q.order)).toBe(true);
    expect(q.current).toBe("b");
  });
  it("without shuffle the order is always the base", () => {
    expect(sanitizeQueue({ base: ["a", "b", "c"], order: ["c", "b", "a"], shuffle: false }).order).toEqual(["a", "b", "c"]);
  });
  it("removes duplicates", () => {
    expect(sanitizeQueue({ base: ["a", "a", "b"], order: ["a", "b"], current: "a" }).base).toEqual(["a", "b"]);
  });
});
