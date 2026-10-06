import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_FOCUS_MUSIC,
  musicStep,
  resolveChoice,
  runStep,
  sameSource,
  sanitizeFocusMusic,
  wantsMusic,
  type MusicDeps,
  type Resolved,
} from "./music";
import * as T from "./timer";

const S = T.DEFAULT_SETTINGS;
let n = 0;
const id = () => `s${++n}`;
const T0 = 1_000_000;

const idle = T.initialState(S);
const focusRunning = T.start(idle, T0, id);
const focusPaused = T.pause(focusRunning, T0 + 60_000);
const breakIdle = T.complete(focusRunning, T0 + 25 * 60_000, S, false, id).state; // short break, not started
const breakRunning = T.complete(focusRunning, T0 + 25 * 60_000, S, true, id).state; // auto-started

describe("wantsMusic", () => {
  it("only while a timer runs; breaks only if asked", () => {
    expect(wantsMusic(idle, true)).toBe(false);
    expect(wantsMusic(focusRunning, true)).toBe(true);
    expect(wantsMusic(focusPaused, true)).toBe(false);
    expect(wantsMusic(breakRunning, true)).toBe(false);
    expect(wantsMusic(breakRunning, false)).toBe(true);
    expect(wantsMusic(breakIdle, false)).toBe(false);
  });
});

describe("musicStep: every way the timer can move", () => {
  it("starting a focus session starts the music", () => {
    expect(musicStep(idle, focusRunning, true)).toBe("start");
  });
  it("pausing stops it; resuming starts it again", () => {
    expect(musicStep(focusRunning, focusPaused, true)).toBe("stop");
    expect(musicStep(focusPaused, T.start(focusPaused, T0 + 90_000, id), true)).toBe("start");
  });
  it("resetting a running session stops it; so does skipping a focus phase", () => {
    expect(musicStep(focusRunning, T.reset(focusRunning, T0 + 60_000, S).state, true)).toBe("stop");
    expect(musicStep(focusRunning, T.skip(focusRunning, T0 + 60_000, S, false, id).state, true)).toBe("stop");
  });
  it("a finished session stops the music so the chime is heard on its own (pause on breaks)", () => {
    expect(musicStep(focusRunning, breakIdle, true)).toBe("stop");
    expect(musicStep(focusRunning, breakRunning, true)).toBe("stop");
  });
  it("with 'keep playing on breaks', an auto-started break changes nothing; an idle one stops it", () => {
    expect(musicStep(focusRunning, breakRunning, false)).toBe("none");
    expect(musicStep(focusRunning, breakIdle, false)).toBe("stop");
  });
  it("the break starting later resumes it only if breaks are allowed", () => {
    const started = T.start(breakIdle, T0 + 26 * 60_000, id);
    expect(musicStep(breakIdle, started, true)).toBe("none");
    expect(musicStep(breakIdle, started, false)).toBe("start");
  });
  it("a break ending into a running focus session starts the music again", () => {
    const next = T.complete(breakRunning, T0 + 30 * 60_000, S, true, id).state;
    expect(next.phase).toBe("focus");
    expect(next.status).toBe("running");
    expect(musicStep(breakRunning, next, true)).toBe("start");
    expect(musicStep(breakRunning, next, false)).toBe("none");
  });
  it("skipping a break into an auto-started focus phase starts it", () => {
    const next = T.skip(breakRunning, T0 + 27 * 60_000, S, true, id).state;
    expect(musicStep(breakRunning, next, true)).toBe("start");
  });
  it("things that are not a change of 'a timer is running' do nothing", () => {
    expect(musicStep(idle, idle, true)).toBe("none");
    expect(musicStep(focusRunning, focusRunning, true)).toBe("none");
    expect(musicStep(idle, T.selectPhase(idle, "short", S), true)).toBe("none");
    expect(musicStep(focusPaused, T.reset(focusPaused, T0 + 70_000, S).state, true)).toBe("none");
  });
});

describe("sanitizeFocusMusic (localStorage is hostile)", () => {
  it("defaults on garbage", () => {
    for (const raw of [null, undefined, 3, "x", [], {}, { choice: 5 }, { choice: { kind: "weird" } }, { choice: { kind: "track" } }]) {
      expect(sanitizeFocusMusic(raw)).toEqual(DEFAULT_FOCUS_MUSIC);
    }
  });
  it("keeps good values and repairs bad ones", () => {
    expect(sanitizeFocusMusic({ choice: { kind: "ambient" }, pauseOnBreaks: false })).toEqual({ choice: { kind: "ambient" }, pauseOnBreaks: false });
    expect(sanitizeFocusMusic({ choice: { kind: "track", id: "t1" }, pauseOnBreaks: "no" })).toEqual({ choice: { kind: "track", id: "t1" }, pauseOnBreaks: true });
    expect(sanitizeFocusMusic({ choice: { kind: "playlist", id: "p1" } }).choice).toEqual({ kind: "playlist", id: "p1" });
  });
  it("rejects an id that is empty, not a string or absurdly long", () => {
    for (const bad of ["", 5, null, "x".repeat(65)]) {
      expect(sanitizeFocusMusic({ choice: { kind: "track", id: bad } }).choice).toEqual({ kind: "none" });
    }
  });
});

describe("resolveChoice", () => {
  const lib = { trackIds: ["a", "b", "c"], playlists: [{ id: "p1", trackIds: ["c", "a", "gone"] }, { id: "empty", trackIds: [] }] };
  it("none and ambient pass through", () => {
    expect(resolveChoice({ kind: "none" }, lib)).toEqual({ kind: "none" });
    expect(resolveChoice({ kind: "ambient" }, lib)).toEqual({ kind: "ambient" });
  });
  it("a track plays alone and loops itself", () => {
    expect(resolveChoice({ kind: "track", id: "b" }, lib)).toEqual({
      kind: "music",
      ids: ["b"],
      startId: "b",
      source: { kind: "track", id: "b" },
      repeat: "one",
    });
  });
  it("a playlist plays in its order, minus tracks that no longer exist, and loops as a whole", () => {
    expect(resolveChoice({ kind: "playlist", id: "p1" }, lib)).toEqual({
      kind: "music",
      ids: ["c", "a"],
      startId: null,
      source: { kind: "playlist", id: "p1" },
      repeat: "all",
    });
  });
  it("a deleted track, a deleted playlist and an empty playlist are `missing`", () => {
    expect(resolveChoice({ kind: "track", id: "zzz" }, lib)).toEqual({ kind: "missing" });
    expect(resolveChoice({ kind: "playlist", id: "zzz" }, lib)).toEqual({ kind: "missing" });
    expect(resolveChoice({ kind: "playlist", id: "empty" }, lib)).toEqual({ kind: "missing" });
  });
});

describe("sameSource", () => {
  it("compares kind and id", () => {
    expect(sameSource({ kind: "library" }, { kind: "library" })).toBe(true);
    expect(sameSource({ kind: "playlist", id: "p" }, { kind: "playlist", id: "p" })).toBe(true);
    expect(sameSource({ kind: "playlist", id: "p" }, { kind: "playlist", id: "q" })).toBe(false);
    expect(sameSource({ kind: "playlist", id: "p" }, { kind: "track", id: "p" })).toBe(false);
    expect(sameSource({ kind: "library" }, { kind: "track", id: "p" })).toBe(false);
  });
});

describe("runStep", () => {
  function deps(over: Partial<{ musicPlaying: boolean; source: MusicDeps["music"] extends { source: () => infer S } ? S : never; hasCurrent: boolean; ambientPlaying: boolean }> = {}) {
    const state = { musicPlaying: false, source: { kind: "library" } as ReturnType<MusicDeps["music"]["source"]>, hasCurrent: false, ambientPlaying: false, ...over };
    const d = {
      music: {
        playing: () => state.musicPlaying,
        source: () => state.source,
        hasCurrent: () => state.hasCurrent,
        playList: vi.fn(),
        resume: vi.fn(),
        pause: vi.fn(),
      },
      ambient: { playing: () => state.ambientPlaying, play: vi.fn(), pause: vi.fn() },
    };
    return d satisfies MusicDeps;
  }
  const playlist: Resolved = { kind: "music", ids: ["a", "b"], startId: null, source: { kind: "playlist", id: "p" }, repeat: "all" };

  it("does nothing for no choice, a missing choice, or the `none` step", () => {
    for (const r of [{ kind: "none" }, { kind: "missing" }] as Resolved[]) {
      const d = deps();
      runStep("start", r, d);
      runStep("stop", r, d);
      expect(d.music.playList).not.toHaveBeenCalled();
      expect(d.ambient.play).not.toHaveBeenCalled();
    }
    const d = deps();
    runStep("none", playlist, d);
    expect(d.music.playList).not.toHaveBeenCalled();
  });
  it("start: a fresh playlist starts from its beginning and loops", () => {
    const d = deps();
    runStep("start", playlist, d);
    expect(d.music.playList).toHaveBeenCalledWith(["a", "b"], null, { kind: "playlist", id: "p" }, "all");
  });
  it("start: the same queue paused (a pause or a break) is resumed, not restarted", () => {
    const d = deps({ source: { kind: "playlist", id: "p" }, hasCurrent: true, musicPlaying: false });
    runStep("start", playlist, d);
    expect(d.music.resume).toHaveBeenCalledTimes(1);
    expect(d.music.playList).not.toHaveBeenCalled();
  });
  it("start: already playing the same queue changes nothing", () => {
    const d = deps({ source: { kind: "playlist", id: "p" }, hasCurrent: true, musicPlaying: true });
    runStep("start", playlist, d);
    expect(d.music.resume).not.toHaveBeenCalled();
    expect(d.music.playList).not.toHaveBeenCalled();
  });
  it("start: something else is queued (the library): the choice replaces it", () => {
    const d = deps({ source: { kind: "library" }, hasCurrent: true, musicPlaying: true });
    runStep("start", playlist, d);
    expect(d.music.playList).toHaveBeenCalledTimes(1);
  });
  it("stop pauses music that is playing, and only that", () => {
    const playing = deps({ musicPlaying: true });
    runStep("stop", playlist, playing);
    expect(playing.music.pause).toHaveBeenCalledTimes(1);
    const quiet = deps({ musicPlaying: false });
    runStep("stop", playlist, quiet);
    expect(quiet.music.pause).not.toHaveBeenCalled();
  });
  it("ambient: start plays the mix if it is not playing; stop pauses it if it is", () => {
    const a = deps();
    runStep("start", { kind: "ambient" }, a);
    expect(a.ambient.play).toHaveBeenCalledTimes(1);
    const b = deps({ ambientPlaying: true });
    runStep("start", { kind: "ambient" }, b);
    expect(b.ambient.play).not.toHaveBeenCalled();
    runStep("stop", { kind: "ambient" }, b);
    expect(b.ambient.pause).toHaveBeenCalledTimes(1);
  });
  it("an ambient choice never touches the music player", () => {
    const d = deps({ musicPlaying: true });
    runStep("start", { kind: "ambient" }, d);
    runStep("stop", { kind: "ambient" }, d);
    expect(d.music.pause).not.toHaveBeenCalled();
    expect(d.music.playList).not.toHaveBeenCalled();
  });
});
