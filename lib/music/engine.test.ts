import { describe, expect, it, vi } from "vitest";
import { createPlaybackEngine, type AudioLike, type Problem } from "./engine";
import { REFRESH_MARGIN_MS, createUrlCache, isFresh, type UrlAnswer } from "./signed-url";

// ── fakes ─────────────────────────────────────────────────────────────────────
class FakeAudio extends EventTarget implements AudioLike {
  src = "";
  currentTime = 0;
  duration = NaN;
  paused = true;
  ended = false;
  volume = 1;
  muted = false;
  preload = "";
  playCalls = 0;
  playError: { name: string } | null = null;
  play() {
    this.playCalls++;
    if (this.playError) return Promise.reject(this.playError);
    this.paused = false;
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  }
  pause() {
    if (this.paused) return;
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
  }
  removeAttribute(n: string) {
    if (n === "src") this.src = "";
  }
  load() {}
  fire(name: string) {
    this.dispatchEvent(new Event(name));
  }
}

function setup(over: { fetch?: (id: string) => Promise<UrlAnswer | undefined> } = {}) {
  let t = 1_000_000;
  const calls: string[] = [];
  let n = 0;
  const fetchUrl =
    over.fetch ??
    (async (id: string): Promise<UrlAnswer> => {
      calls.push(id);
      return { ok: true, url: `https://x/${id}?v=${++n}`, expiresAt: t + 3_600_000 };
    });
  const urls = createUrlCache(fetchUrl, () => t);
  const audio = new FakeAudio();
  const engine = createPlaybackEngine(audio, urls);
  const log = { playing: [] as boolean[], problems: [] as (Problem | null)[], ended: 0, time: [] as number[], loading: [] as boolean[] };
  engine.attach({
    onPlaying: (p) => log.playing.push(p),
    onProblem: (p) => log.problems.push(p),
    onEnded: () => log.ended++,
    onTime: (pos) => log.time.push(pos),
    onLoading: (l) => log.loading.push(l),
  });
  return { audio, engine, urls, calls, log, advance: (ms: number) => (t += ms) };
}

describe("url cache", () => {
  it("fetches once and reuses a fresh URL", async () => {
    const calls: string[] = [];
    const c = createUrlCache(async (id) => (calls.push(id), { ok: true, url: "u", expiresAt: 10_000_000 }), () => 0);
    await c.get("a");
    await c.get("a");
    expect(calls).toEqual(["a"]);
  });
  it("shares one request between simultaneous callers", async () => {
    let n = 0;
    const c = createUrlCache(async () => (n++, { ok: true, url: "u", expiresAt: 10_000_000 }), () => 0);
    await Promise.all([c.get("a"), c.get("a"), c.get("a")]);
    expect(n).toBe(1);
  });
  it("treats a URL inside the refresh margin as expired", async () => {
    let t = 0;
    let n = 0;
    const c = createUrlCache(async () => ({ ok: true, url: `u${++n}`, expiresAt: t + 3_600_000 }), () => t);
    await c.get("a");
    t += 3_600_000 - REFRESH_MARGIN_MS - 1;
    expect(c.peek("a")).toBeDefined();
    t += 2;
    expect(c.peek("a")).toBeUndefined();
    expect((await c.get("a")).ok && n).toBe(2);
  });
  it("force and invalidate fetch again", async () => {
    let n = 0;
    const c = createUrlCache(async () => ({ ok: true, url: `u${++n}`, expiresAt: 10_000_000 }), () => 0);
    await c.get("a");
    await c.get("a", { force: true });
    c.invalidate("a");
    await c.get("a");
    expect(n).toBe(3);
  });
  it("does not cache a failure, and names it", async () => {
    let n = 0;
    const c = createUrlCache(async () => (++n === 1 ? { ok: false, reason: "not_found" } : { ok: true, url: "u", expiresAt: 10_000_000 }), () => 0);
    expect(await c.get("a")).toEqual({ ok: false, reason: "not_found" });
    expect((await c.get("a")).ok).toBe(true);
  });
  it("a signed-out action (no result) is `unauthenticated`; a throw is `db_error`", async () => {
    expect(await createUrlCache(async () => undefined).get("a")).toEqual({ ok: false, reason: "unauthenticated" });
    expect(
      await createUrlCache(async () => {
        throw new Error("network");
      }).get("a"),
    ).toEqual({ ok: false, reason: "db_error" });
  });
  it("isFresh", () => {
    expect(isFresh(undefined, 0)).toBe(false);
    expect(isFresh({ url: "u", expiresAt: 1_000_000 }, 0)).toBe(true);
    expect(isFresh({ url: "u", expiresAt: 1000 }, 0)).toBe(false);
  });
});

describe("engine: nothing starts by itself", () => {
  it("load without play only prepares the track", async () => {
    const s = setup();
    await s.engine.load("a", { play: false });
    expect(s.audio.src).toContain("/a?");
    expect(s.audio.playCalls).toBe(0);
    expect(s.audio.paused).toBe(true);
    expect(s.log.playing).toEqual([]);
  });
  it("play with nothing loaded does nothing", async () => {
    const s = setup();
    await s.engine.play();
    expect(s.audio.playCalls).toBe(0);
  });
  it("load with play plays", async () => {
    const s = setup();
    await s.engine.load("a", { play: true });
    expect(s.audio.playCalls).toBe(1);
    expect(s.log.playing).toEqual([true]);
  });
  it("starts at a saved position", async () => {
    const s = setup();
    await s.engine.load("a", { play: false, startAt: 42 });
    expect(s.audio.currentTime).toBe(42);
  });
});

describe("engine: play from a click", () => {
  it("a prepared track with a good URL plays synchronously (inside the gesture)", async () => {
    const s = setup();
    await s.engine.load("a", { play: false });
    void s.engine.play();
    expect(s.audio.playCalls).toBe(1); // no await needed: the call happened in the same tick
  });
  it("a long pause past the URL's expiry refreshes it and resumes from the same spot", async () => {
    const s = setup();
    await s.engine.load("a", { play: false, startAt: 30 });
    const firstSrc = s.audio.src;
    s.advance(3_600_000);
    await s.engine.play();
    expect(s.calls).toEqual(["a", "a"]);
    expect(s.audio.src).not.toBe(firstSrc);
    expect(s.audio.currentTime).toBe(30);
    expect(s.audio.playCalls).toBe(1);
  });
  it("pause stops it, and does not resume it by itself later", async () => {
    const s = setup();
    await s.engine.load("a", { play: true });
    s.engine.pause();
    expect(s.audio.paused).toBe(true);
    s.audio.fire("error"); // an error while paused refreshes the URL but must not start playing
    await new Promise((r) => setTimeout(r, 0));
    expect(s.audio.playCalls).toBe(1);
  });
});

describe("engine: expired or failing URLs", () => {
  it("an error mid-track fetches a new URL and carries on from the same position", async () => {
    const s = setup();
    await s.engine.load("a", { play: true });
    s.audio.currentTime = 71;
    const before = s.audio.src;
    s.audio.fire("error");
    await new Promise((r) => setTimeout(r, 0));
    expect(s.calls).toEqual(["a", "a"]);
    expect(s.audio.src).not.toBe(before);
    expect(s.audio.currentTime).toBe(71);
    expect(s.audio.playCalls).toBe(2);
    expect(s.log.problems.at(-1)).toBeNull();
  });
  it("gives up after repeated failures with `unavailable`, and stops asking", async () => {
    const s = setup();
    await s.engine.load("a", { play: true });
    for (let i = 0; i < 5; i++) {
      s.audio.fire("error");
      await new Promise((r) => setTimeout(r, 0));
    }
    expect(s.log.problems.at(-1)).toBe("unavailable");
    expect(s.calls.length).toBe(3); // the first load + 2 recoveries
    expect(s.log.playing.at(-1)).toBe(false);
  });
  it("errors that arrive together: the give-up cancels recoveries still in flight", async () => {
    const s = setup();
    await s.engine.load("a", { play: true });
    for (let i = 0; i < 3; i++) s.audio.fire("error"); // all before any recovery has finished
    await new Promise((r) => setTimeout(r, 0));
    expect(s.log.problems.at(-1)).toBe("unavailable");
    expect(s.audio.paused).toBe(true);
    expect(s.log.playing.at(-1)).toBe(false);
  });
  it("a track that plays again has recovered (the counter resets)", async () => {
    const s = setup();
    await s.engine.load("a", { play: true });
    for (let round = 0; round < 4; round++) {
      s.audio.fire("error");
      await new Promise((r) => setTimeout(r, 0));
      s.audio.fire("playing");
    }
    expect(s.log.problems).not.toContain("unavailable");
  });
  it("a URL that cannot be fetched is named: unavailable, or unauthenticated when signed out", async () => {
    const a = setup({ fetch: async () => ({ ok: false, reason: "not_found" }) });
    await a.engine.load("a", { play: true });
    expect(a.log.problems).toEqual(["unavailable"]);
    expect(a.audio.playCalls).toBe(0);
    const b = setup({ fetch: async () => undefined });
    await b.engine.load("a", { play: true });
    expect(b.log.problems).toEqual(["unauthenticated"]);
  });
  it("the browser refusing to play is `blocked` (and playing is reported off)", async () => {
    const s = setup();
    s.audio.playError = { name: "NotAllowedError" };
    await s.engine.load("a", { play: true });
    expect(s.log.problems).toEqual(["blocked"]);
    expect(s.log.playing.at(-1)).toBe(false);
  });
  it("an AbortError (interrupted by a newer load) is not a problem", async () => {
    const s = setup();
    s.audio.playError = { name: "AbortError" };
    await s.engine.load("a", { play: true });
    expect(s.log.problems).toEqual([]);
  });
});

describe("engine: loads that overlap", () => {
  it("a slow answer for an old track never overwrites a newer one", async () => {
    const releases: Record<string, () => void> = {};
    const s = setup({
      fetch: (id) =>
        new Promise((res) => {
          releases[id] = () => res({ ok: true, url: `https://x/${id}`, expiresAt: 10 ** 12 });
        }),
    });
    const first = s.engine.load("a", { play: true });
    const second = s.engine.load("b", { play: true });
    releases.b();
    await second;
    releases.a();
    await first;
    expect(s.audio.src).toBe("https://x/b");
    expect(s.audio.playCalls).toBe(1);
    expect(s.engine.loadedId).toBe("b");
  });
});

describe("engine: switching tracks", () => {
  it("the old track stops at once, before the new URL arrives", async () => {
    const s = setup();
    await s.engine.load("a", { play: true });
    expect(s.audio.paused).toBe(false);
    const pending = s.engine.load("b", { play: true });
    expect(s.audio.paused).toBe(true); // synchronous: nothing awaited yet
    await pending;
    expect(s.audio.src).toContain("/b?");
    expect(s.audio.paused).toBe(false);
  });
  it("re-loading the same track does not pause it first", async () => {
    const s = setup();
    await s.engine.load("a", { play: true });
    void s.engine.load("a", { play: true });
    expect(s.audio.paused).toBe(false);
  });
});

describe("engine: controls", () => {
  it("ended is reported", async () => {
    const s = setup();
    await s.engine.load("a", { play: true });
    s.audio.fire("ended");
    expect(s.log.ended).toBe(1);
  });
  it("seek clamps to the track, ignores NaN", async () => {
    const s = setup();
    await s.engine.load("a", { play: false });
    Object.defineProperty(s.audio, "duration", { value: 100 });
    s.engine.seek(250);
    expect(s.audio.currentTime).toBe(100);
    s.engine.seek(-5);
    expect(s.audio.currentTime).toBe(0);
    s.engine.seek(40);
    s.engine.seek(NaN);
    expect(s.audio.currentTime).toBe(40);
  });
  it("volume clamps to 0..1 and mute is separate", () => {
    const s = setup();
    s.engine.setVolume(2);
    expect(s.audio.volume).toBe(1);
    s.engine.setVolume(-1);
    expect(s.audio.volume).toBe(0);
    s.engine.setVolume(NaN);
    expect(s.audio.volume).toBe(1);
    s.engine.setMuted(true);
    expect(s.audio.muted).toBe(true);
    expect(s.audio.volume).toBe(1);
  });
  it("restart seeks to 0 and keeps playing; it does not start a paused player", async () => {
    const s = setup();
    await s.engine.load("a", { play: true });
    s.audio.currentTime = 50;
    s.engine.restart();
    expect(s.audio.currentTime).toBe(0);
    s.engine.pause();
    s.engine.restart();
    expect(s.audio.playCalls).toBe(1);
  });
  it("stop pauses and rewinds; unload forgets the track", async () => {
    const s = setup();
    await s.engine.load("a", { play: true });
    s.audio.currentTime = 9;
    s.engine.stop();
    expect(s.audio.paused).toBe(true);
    expect(s.audio.currentTime).toBe(0);
    s.engine.unload();
    expect(s.audio.src).toBe("");
    expect(s.engine.loadedId).toBeNull();
    await s.engine.play();
    expect(s.audio.playCalls).toBe(1);
  });
  it("time updates are reported as finite numbers", async () => {
    const s = setup();
    await s.engine.load("a", { play: false });
    s.audio.currentTime = 12.5;
    s.audio.fire("timeupdate");
    expect(s.log.time.at(-1)).toBe(12.5);
  });
  it("dispose removes its listeners", async () => {
    const s = setup();
    await s.engine.load("a", { play: true });
    s.engine.dispose();
    s.audio.fire("ended");
    expect(s.log.ended).toBe(0);
  });
});

describe("engine: URL requests", () => {
  it("one load = one URL request, and a repeat load of the same track reuses it", async () => {
    const fetchSpy = vi.fn(async (id: string): Promise<UrlAnswer> => ({ ok: true, url: `u-${id}`, expiresAt: 10 ** 12 }));
    const s = setup({ fetch: fetchSpy });
    await s.engine.load("a", { play: false });
    await s.engine.load("a", { play: false });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
