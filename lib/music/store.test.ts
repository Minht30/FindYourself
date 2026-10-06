import { beforeEach, describe, expect, it, vi } from "vitest";

// The store drives a real audio element in the browser; here it drives a
// recording fake, so what it asks the engine to do can be asserted.
const mocks = vi.hoisted(() => {
  const engine = {
    loadedId: null as string | null,
    load: vi.fn(async (id: string) => void (engine.loadedId = id)),
    play: vi.fn(async () => {}),
    pause: vi.fn(),
    stop: vi.fn(),
    restart: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
    setMuted: vi.fn(),
    unload: vi.fn(() => void (engine.loadedId = null)),
  };
  const audio = { currentTime: 0 };
  return { engine, audio };
});
vi.mock("./player", () => ({ getEngine: () => mocks.engine, getAudio: () => mocks.audio }));

import { emptyQueue } from "./queue";
import { LIBRARY, useMusicStore } from "./store";

const { engine, audio } = mocks;
const S = () => useMusicStore.getState();
const reset = () => {
  useMusicStore.setState({
    queue: emptyQueue(),
    source: LIBRARY,
    volume: 0.7,
    muted: false,
    position: 0,
    library: { trackIds: [], playlists: [] },
    playing: false,
    loading: false,
    problem: null,
  });
  engine.loadedId = null;
  audio.currentTime = 0;
  for (const f of Object.values(engine)) if (typeof f === "function" && "mockClear" in f) (f as ReturnType<typeof vi.fn>).mockClear();
};
const lib = ["a", "b", "c", "d"];

beforeEach(reset);

describe("starting", () => {
  it("nothing plays or loads by itself", () => {
    expect(engine.load).not.toHaveBeenCalled();
    expect(engine.play).not.toHaveBeenCalled();
    expect(S().playing).toBe(false);
  });
  it("playList loads the chosen track and plays it", () => {
    S().playList(lib, "c");
    expect(engine.load).toHaveBeenCalledWith("c", { play: true });
    expect(S().queue.current).toBe("c");
    expect(S().queue.order).toEqual(lib);
  });
  it("playList with no start plays the first; with an empty list does nothing", () => {
    S().playList(lib);
    expect(engine.load).toHaveBeenLastCalledWith("a", { play: true });
    engine.load.mockClear();
    S().playList([]);
    expect(engine.load).not.toHaveBeenCalled();
  });
  it("remembers where the queue came from", () => {
    S().playList(["x", "y"], "y", { kind: "playlist", id: "p1" });
    expect(S().source).toEqual({ kind: "playlist", id: "p1" });
  });
});

describe("focus-session music support", () => {
  it("playList can set the repeat mode (a playlist loops as a whole, a track on its own)", () => {
    S().playList(["a", "b"], null, { kind: "playlist", id: "p" }, "all");
    expect(S().queue.repeat).toBe("all");
    S().playList(["c"], "c", { kind: "track", id: "c" }, "one");
    expect(S().queue.repeat).toBe("one");
    expect(S().queue.current).toBe("c");
  });
  it("without a repeat argument the existing mode is kept", () => {
    S().playList(lib, "a", LIBRARY, "all");
    S().playList(lib, "b");
    expect(S().queue.repeat).toBe("all");
  });
  it("a single-track source is not widened to the whole library by a sync", () => {
    S().playList(["c"], "c", { kind: "track", id: "c" }, "one");
    S().syncLibrary(lib, []);
    expect(S().queue.order).toEqual(["c"]);
    expect(S().source).toEqual({ kind: "track", id: "c" });
  });
  it("a single-track source whose track is deleted empties the queue", () => {
    S().playList(["c"], "c", { kind: "track", id: "c" }, "one");
    useMusicStore.setState({ playing: true });
    S().syncLibrary(["a", "b", "d"], []);
    expect(S().queue.current).toBeNull();
    expect(engine.unload).toHaveBeenCalled();
  });
  it("remembers the library snapshot for code outside React", () => {
    S().syncLibrary(lib, [{ id: "p1", name: "P", trackIds: ["b", "a"] }]);
    expect(S().library).toEqual({ trackIds: lib, playlists: [{ id: "p1", trackIds: ["b", "a"] }] });
  });
  it("a stored track source comes back, an unknown kind does not", () => {
    const merge = useMusicStore.persist.getOptions().merge!;
    expect((merge({ source: { kind: "track", id: "t1" } }, S()) as ReturnType<typeof S>).source).toEqual({ kind: "track", id: "t1" });
    expect((merge({ source: { kind: "weird", id: "t1" } }, S()) as ReturnType<typeof S>).source).toEqual(LIBRARY);
  });
});

describe("togglePlay", () => {
  it("does nothing with an empty queue", () => {
    S().togglePlay();
    expect(engine.play).not.toHaveBeenCalled();
    expect(engine.load).not.toHaveBeenCalled();
  });
  it("a prepared track plays through the engine; one that is not loaded is loaded at the saved position", () => {
    S().playList(lib, "b");
    reset();
    useMusicStore.setState({ queue: { ...emptyQueue(), base: lib, order: lib, current: "b" }, position: 42 });
    S().togglePlay();
    expect(engine.load).toHaveBeenCalledWith("b", { play: true, startAt: 42 });
    engine.load.mockClear();
    engine.loadedId = "b";
    S().togglePlay();
    expect(engine.play).toHaveBeenCalledTimes(1);
    expect(engine.load).not.toHaveBeenCalled();
  });
  it("while playing it pauses and remembers the position", () => {
    useMusicStore.setState({ queue: { ...emptyQueue(), base: lib, order: lib, current: "b" }, playing: true });
    engine.loadedId = "b";
    audio.currentTime = 73.9;
    S().togglePlay();
    expect(engine.pause).toHaveBeenCalled();
    expect(S().position).toBe(73);
  });
  it("a click on play clears an old problem", () => {
    useMusicStore.setState({ queue: { ...emptyQueue(), base: lib, order: lib, current: "a" }, problem: "unavailable" });
    engine.loadedId = "a";
    S().togglePlay();
    expect(S().problem).toBeNull();
  });
});

describe("moving around", () => {
  beforeEach(() => S().playList(lib, "b"));
  it("next and previous load the neighbours", () => {
    S().next();
    expect(engine.load).toHaveBeenLastCalledWith("c", { play: true });
    audio.currentTime = 0;
    S().previous();
    expect(engine.load).toHaveBeenLastCalledWith("b", { play: true });
  });
  it("previous past three seconds restarts instead", () => {
    audio.currentTime = 10;
    S().previous();
    expect(engine.restart).toHaveBeenCalled();
    expect(S().queue.current).toBe("b");
  });
  it("jump goes to a track in the queue and ignores others", () => {
    S().jump("d");
    expect(engine.load).toHaveBeenLastCalledWith("d", { play: true });
    engine.load.mockClear();
    S().jump("zzz");
    expect(engine.load).not.toHaveBeenCalled();
  });
  it("the end of the queue (repeat off) stops and parks on the first track, paused", () => {
    S().jump("d");
    engine.load.mockClear();
    S().ended();
    expect(engine.stop).toHaveBeenCalled();
    expect(engine.load).toHaveBeenCalledWith("a", { play: false });
    expect(S().queue.current).toBe("a");
  });
  it("repeat one restarts on a natural end", () => {
    S().cycleRepeat();
    S().cycleRepeat();
    expect(S().queue.repeat).toBe("one");
    engine.load.mockClear();
    S().ended();
    expect(engine.restart).toHaveBeenCalled();
    expect(engine.load).not.toHaveBeenCalled();
  });
  it("a manual next resets the saved position", () => {
    useMusicStore.setState({ position: 99 });
    S().next();
    expect(S().position).toBe(0);
  });
  it("shuffle does not interrupt playback or change the track", () => {
    engine.load.mockClear();
    S().toggleShuffle();
    expect(S().queue.shuffle).toBe(true);
    expect(S().queue.current).toBe("b");
    expect(engine.load).not.toHaveBeenCalled();
    expect(engine.stop).not.toHaveBeenCalled();
  });
});

describe("volume and mute", () => {
  it("clamps and delegates; mute is separate", () => {
    S().setVolume(3);
    expect(S().volume).toBe(1);
    expect(engine.setVolume).toHaveBeenLastCalledWith(1);
    S().setVolume(-1);
    expect(S().volume).toBe(0);
    S().setVolume(Number.NaN);
    expect(S().volume).toBe(0.7);
    S().setMuted(true);
    expect(engine.setMuted).toHaveBeenLastCalledWith(true);
    expect(S().muted).toBe(true);
    expect(S().volume).toBe(0.7);
  });
  it("seek delegates and remembers", () => {
    S().seek(55);
    expect(engine.seek).toHaveBeenCalledWith(55);
    expect(S().position).toBe(55);
  });
});

describe("syncLibrary (the library or a playlist changed)", () => {
  const setup = (playing: boolean) => {
    S().playList(lib, "b");
    useMusicStore.setState({ playing });
    engine.load.mockClear();
  };
  it("unchanged: no engine calls, same queue object", () => {
    setup(true);
    const q = S().queue;
    S().syncLibrary(lib, []);
    expect(S().queue).toBe(q);
    expect(engine.load).not.toHaveBeenCalled();
  });
  it("a track elsewhere in the queue was removed: current keeps playing, untouched", () => {
    setup(true);
    S().syncLibrary(["a", "b", "d"], []);
    expect(S().queue.order).toEqual(["a", "b", "d"]);
    expect(S().queue.current).toBe("b");
    expect(engine.load).not.toHaveBeenCalled();
    expect(engine.stop).not.toHaveBeenCalled();
  });
  it("the playing track was removed: carries on with the next one", () => {
    setup(true);
    S().syncLibrary(["a", "c", "d"], []);
    expect(S().queue.current).toBe("c");
    expect(engine.load).toHaveBeenCalledWith("c", { play: true });
  });
  it("the current track was removed while paused: the next is prepared, never started", () => {
    setup(false);
    S().syncLibrary(["a", "c", "d"], []);
    expect(S().queue.current).toBe("c");
    expect(engine.load).toHaveBeenCalledWith("c", { play: false });
    expect(engine.load).not.toHaveBeenCalledWith("c", { play: true });
  });
  it("everything removed: the engine is emptied", () => {
    setup(true);
    S().syncLibrary([], []);
    expect(S().queue.current).toBeNull();
    expect(engine.unload).toHaveBeenCalled();
  });
  it("a new track joins the end of the queue", () => {
    setup(true);
    S().syncLibrary([...lib, "e"], []);
    expect(S().queue.order).toEqual([...lib, "e"]);
    expect(engine.load).not.toHaveBeenCalled();
  });
  it("a playlist source follows that playlist's order and falls back to the library when it is deleted", () => {
    S().playList(["a", "b", "c"], "b", { kind: "playlist", id: "p1" });
    useMusicStore.setState({ playing: true });
    engine.load.mockClear();
    S().syncLibrary(lib, [{ id: "p1", name: "P", trackIds: ["c", "b", "a"] }]);
    expect(S().queue.order).toEqual(["c", "b", "a"]);
    expect(S().queue.current).toBe("b");
    S().syncLibrary(lib, []);
    expect(S().source).toEqual(LIBRARY);
    expect(S().queue.order).toEqual(lib);
  });
});

describe("restoring the account's track", () => {
  it("opens the queue on that track in library order, without starting it", () => {
    S().restoreTrack("c", lib);
    expect(S().queue.current).toBe("c");
    expect(S().queue.order).toEqual(lib);
    expect(engine.load).not.toHaveBeenCalled();
    expect(S().playing).toBe(false);
  });
  it("ignores a track that is not in the library", () => {
    S().restoreTrack("zzz", lib);
    expect(S().queue.current).toBeNull();
  });
});

describe("savePosition", () => {
  it("only records a position for the track that is actually loaded", () => {
    useMusicStore.setState({ queue: { ...emptyQueue(), base: lib, order: lib, current: "a" } });
    audio.currentTime = 30;
    engine.loadedId = "b";
    S().savePosition();
    expect(S().position).toBe(0);
    engine.loadedId = "a";
    S().savePosition();
    expect(S().position).toBe(30);
  });
});

describe("persistence", () => {
  const opts = () => useMusicStore.persist.getOptions();
  it("never persists `playing`, `loading` or a problem", () => {
    useMusicStore.setState({ playing: true, loading: true, problem: "blocked" });
    const saved = opts().partialize!(S()) as Record<string, unknown>;
    expect(Object.keys(saved).sort()).toEqual(["muted", "position", "queue", "source", "volume"]);
  });
  it("a hostile or stale stored value lands on a valid player", () => {
    const merged = opts().merge!(
      { queue: { base: "nope", current: 7 }, volume: 9, muted: "yes", position: -5, source: { kind: "playlist", id: 5 } },
      S(),
    ) as ReturnType<typeof S>;
    expect(merged.volume).toBe(1);
    expect(merged.muted).toBe(false);
    expect(merged.position).toBe(0);
    expect(merged.source).toEqual(LIBRARY);
    expect(merged.queue.current).toBeNull();
  });
  it("a good stored value comes back", () => {
    const merged = opts().merge!(
      { queue: { base: ["a", "b"], order: ["a", "b"], current: "b", shuffle: false, seed: 4, repeat: "all" }, volume: 0.25, muted: true, position: 61.8, source: { kind: "playlist", id: "p9" } },
      S(),
    ) as ReturnType<typeof S>;
    expect(merged.queue).toMatchObject({ current: "b", repeat: "all" });
    expect(merged.volume).toBe(0.25);
    expect(merged.muted).toBe(true);
    expect(merged.position).toBe(61);
    expect(merged.source).toEqual({ kind: "playlist", id: "p9" });
    expect(merged.playing).toBe(false);
  });
});
