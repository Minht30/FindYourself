import type { UrlCache } from "./signed-url";

// The playback engine: one audio element driven through a small, testable API.
// It knows nothing about queues or React. Given a track id it fetches a signed
// URL, sets it on the element and plays; when the URL has expired (the element
// errors, or play is pressed after a long pause) it fetches a fresh one and
// carries on from the same position.
//
// Nothing here ever starts by itself: `load(id, { play: false })` only prepares
// a track, and `play` is called from a click.

export interface AudioLike extends EventTarget {
  src: string;
  currentTime: number;
  readonly duration: number;
  readonly paused: boolean;
  readonly ended: boolean;
  volume: number;
  muted: boolean;
  preload: string;
  play(): Promise<void>;
  pause(): void;
  removeAttribute(name: string): void;
  load(): void;
}

// Why sound is not coming out even though it was asked for.
export type Problem = "blocked" | "unavailable" | "unauthenticated";

export type EngineEvents = {
  onTime?: (positionSeconds: number, durationSeconds: number) => void;
  onPlaying?: (playing: boolean) => void;
  onEnded?: () => void;
  onProblem?: (problem: Problem | null) => void;
  onLoading?: (loading: boolean) => void;
};

// After this many consecutive failures on one track the engine gives up on it
// (a deleted object, a lost connection) instead of refreshing forever.
const MAX_RECOVERIES = 2;

export function createPlaybackEngine(audio: AudioLike, urls: UrlCache) {
  let events: EngineEvents = {};
  let loadedId: string | null = null;
  let wantPlay = false;
  let token = 0; // bumps on every load so a slow answer for an old track is dropped
  let recoveries = 0;

  const emitTime = () => events.onTime?.(finite(audio.currentTime), finite(audio.duration));
  const problem = (p: Problem | null) => events.onProblem?.(p);

  async function start(): Promise<void> {
    try {
      await audio.play();
      problem(null);
    } catch (e) {
      const name = (e as { name?: string } | null)?.name;
      if (name === "AbortError") return; // a newer load or a pause interrupted it: not a failure
      wantPlay = false;
      problem(name === "NotAllowedError" ? "blocked" : "unavailable");
      events.onPlaying?.(false);
    }
  }

  // Fetch (or reuse) a URL for `id`, put it on the element and, if wanted, play.
  async function attach(id: string, startAt: number, play: boolean, force: boolean): Promise<void> {
    const mine = ++token;
    // Switching tracks: the old one stops now, not after the new URL has arrived.
    if (loadedId !== id && !audio.paused) audio.pause();
    loadedId = id;
    wantPlay = play;
    events.onLoading?.(true);
    const r = await urls.get(id, { force });
    if (mine !== token) return;
    events.onLoading?.(false);
    if (!r.ok) {
      wantPlay = false;
      events.onPlaying?.(false);
      problem(r.reason === "unauthenticated" ? "unauthenticated" : "unavailable");
      return;
    }
    audio.src = r.url;
    // A prepared-but-not-playing track only fetches its metadata, not the whole file.
    audio.preload = play ? "auto" : "metadata";
    if (startAt > 0) audio.currentTime = startAt;
    emitTime();
    if (play) await start();
  }

  const onError = () => {
    if (!loadedId) return;
    if (recoveries >= MAX_RECOVERIES) {
      token++; // cancel any recovery still in flight: giving up means giving up
      wantPlay = false;
      audio.pause();
      events.onLoading?.(false);
      events.onPlaying?.(false);
      problem("unavailable");
      return;
    }
    recoveries++;
    const id = loadedId;
    const at = finite(audio.currentTime);
    urls.invalidate(id);
    void attach(id, at, wantPlay, true);
  };

  const listeners: [string, () => void][] = [
    ["timeupdate", emitTime],
    ["durationchange", emitTime],
    ["loadedmetadata", emitTime],
    ["play", () => events.onPlaying?.(true)],
    ["pause", () => events.onPlaying?.(false)],
    ["playing", () => (recoveries = 0)], // a track that plays has recovered
    ["ended", () => events.onEnded?.()],
    ["error", onError],
  ];
  for (const [name, fn] of listeners) audio.addEventListener(name, fn);

  return {
    attach: (e: EngineEvents) => void (events = e),

    // Prepare a track. Without `play` nothing starts and, if the URL is not
    // known yet, only the URL request is made.
    load(id: string, opts: { play: boolean; startAt?: number }): Promise<void> {
      recoveries = 0;
      return attach(id, opts.startAt ?? 0, opts.play, false);
    },

    // Called from a click. A track that is loaded and whose URL is still good
    // plays synchronously (what iOS Safari needs from a gesture); an expired
    // one is refreshed first and resumes from where it was.
    async play(): Promise<void> {
      if (!loadedId) return;
      wantPlay = true;
      if (audio.src && urls.peek(loadedId)) return start();
      return attach(loadedId, finite(audio.currentTime), true, true);
    },

    pause() {
      wantPlay = false;
      audio.pause();
    },

    stop() {
      wantPlay = false;
      audio.pause();
      audio.currentTime = 0;
      emitTime();
    },

    seek(seconds: number) {
      if (!Number.isFinite(seconds)) return;
      const d = finite(audio.duration);
      audio.currentTime = Math.max(0, d > 0 ? Math.min(seconds, d) : seconds);
      emitTime();
    },

    restart() {
      audio.currentTime = 0;
      emitTime();
      if (wantPlay && audio.paused) void start();
    },

    setVolume(v: number) {
      audio.volume = Math.min(1, Math.max(0, Number.isFinite(v) ? v : 1));
    },
    setMuted(m: boolean) {
      audio.muted = m;
    },

    // Forget the loaded track (it was deleted, or the queue emptied).
    unload() {
      token++;
      loadedId = null;
      wantPlay = false;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      emitTime();
    },

    get loadedId() {
      return loadedId;
    },
    get playing() {
      return !audio.paused;
    },
    dispose() {
      token++;
      for (const [name, fn] of listeners) audio.removeEventListener(name, fn);
      audio.pause();
    },
  };
}

export type PlaybackEngine = ReturnType<typeof createPlaybackEngine>;

const finite = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
