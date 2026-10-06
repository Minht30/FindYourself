"use client";

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { saveCurrentTrack } from "@/app/(app)/chill/music-actions";
import { getAudio, getEngine } from "@/lib/music/player";
import type { Playlist } from "@/lib/music/playlist";
import type { Usage } from "@/lib/music/quota";
import { usePlayback, useMusicStore } from "@/lib/music/store";
import type { Track } from "@/lib/music/types";

type MusicContextValue = {
  tracks: readonly Track[];
  playlists: readonly Playlist[];
  usage: Usage;
};

const MusicContext = createContext<MusicContextValue>({
  tracks: [],
  playlists: [],
  usage: { count: 0, totalBytes: 0 },
});
export const useMusic = () => useContext(MusicContext);

const SAVE_DELAY_MS = 1500;

// Owns the music player's side effects, mounted once in the app layout above
// every page, so music keeps playing while you move between pages: the single
// audio element lives outside React (lib/music/player.ts) and this wires it to
// the store, restores the last queue (paused: nothing ever autoplays), keeps
// the queue in step with the library and the playlists, remembers the current
// track in the account, and tells the operating system what is playing.
//
// The library and playlists are read on the server by the app layout and
// handed down, so the server HTML and the first client render agree; actions
// revalidate the layout, so they refresh after every change.
export default function MusicProvider({
  tracks,
  playlists,
  initialTrackId = null,
  children,
}: {
  tracks: readonly Track[];
  playlists: readonly Playlist[];
  // the track the account remembers (mixer_state.current_track_id), or null
  initialTrackId?: string | null;
  children: React.ReactNode;
}) {
  const value = useMemo<MusicContextValue>(
    () => ({
      tracks,
      playlists,
      usage: { count: tracks.length, totalBytes: tracks.reduce((n, t) => n + t.sizeBytes, 0) },
    }),
    [tracks, playlists],
  );

  // Latest library for effects that must not re-run on every refresh.
  const libraryRef = useRef({ tracks, playlists });
  libraryRef.current = { tracks, playlists };
  const hydrated = useMusicStore((s) => s.hydrated);

  // Mount: wire the engine, restore, subscribe.
  useEffect(() => {
    const store = useMusicStore;
    const engine = getEngine();
    const audio = getAudio();
    engine.attach({
      onTime: (position, duration) => {
        const p = usePlayback.getState();
        if (p.position !== position || p.duration !== duration) usePlayback.setState({ position, duration });
      },
      onPlaying: (playing) => store.getState().setPlayback({ playing }),
      onLoading: (loading) => store.getState().setPlayback({ loading }),
      onProblem: (problem) => store.getState().setPlayback({ problem }),
      onEnded: () => store.getState().ended(),
    });

    let stopped = false;
    let lastSaved: string | null = initialTrackId;
    let timer: number | undefined;
    let unsubscribe = () => {};

    const send = async (trackId: string | null, retry = true) => {
      try {
        const r = await saveCurrentTrack({ trackId });
        if (r?.ok) lastSaved = trackId;
        else if (!r && retry) window.setTimeout(() => void send(trackId, false), 5000); // signed out: try once more later
      } catch {
        if (retry) window.setTimeout(() => void send(trackId, false), 5000);
      }
    };

    void Promise.resolve(store.persist.rehydrate()).then(() => {
      if (stopped) return;
      const { tracks: ts, playlists: ps } = libraryRef.current;
      const ids = ts.map((t) => t.id);
      const s = store.getState();
      engine.setVolume(s.volume);
      engine.setMuted(s.muted);
      // This device's own queue wins; otherwise open on the track the account remembers.
      if (!(s.queue.current && ids.includes(s.queue.current)) && initialTrackId) {
        store.getState().restoreTrack(initialTrackId, ids);
      }
      store.getState().syncLibrary(ids, ps);
      const { queue, position } = store.getState();
      // Prepare the track (its URL and position) but never start it.
      if (queue.current) void engine.load(queue.current, { play: false, startAt: position });

      // From here on a change of track is remembered in the account after a quiet moment.
      let prevCurrent = queue.current;
      unsubscribe = store.subscribe((next) => {
        if (next.queue.current === prevCurrent) return;
        prevCurrent = next.queue.current;
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          if (prevCurrent !== lastSaved) void send(prevCurrent);
        }, SAVE_DELAY_MS);
      });
    });

    const hide = () => store.getState().savePosition();
    const onVisibility = () => document.hidden && hide();
    window.addEventListener("pagehide", hide);
    document.addEventListener("visibilitychange", onVisibility);

    // Dev only: lets the live tests look at the real element and the store.
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __fyMusicDebug?: unknown }).__fyMusicDebug = {
        audio,
        engine,
        store,
        playback: usePlayback,
        saveCurrentTrack,
      };
    }

    return () => {
      stopped = true;
      unsubscribe();
      window.clearTimeout(timer);
      window.removeEventListener("pagehide", hide);
      document.removeEventListener("visibilitychange", onVisibility);
      // The element and the engine are deliberately kept: they outlive the provider.
    };
    // Mount once: `initialTrackId` describes the page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The library or a playlist changed (an upload, a delete, a reorder): bring the queue in step.
  useEffect(() => {
    if (!hydrated) return;
    useMusicStore.getState().syncLibrary(
      tracks.map((t) => t.id),
      playlists,
    );
  }, [hydrated, tracks, playlists]);

  // Operating-system media controls: lock screen, headphone buttons, media keys.
  const currentId = useMusicStore((s) => s.queue.current);
  const playing = useMusicStore((s) => s.playing);
  const current = useMemo(() => tracks.find((t) => t.id === currentId) ?? null, [tracks, currentId]);
  useEffect(() => {
    const ms = typeof navigator !== "undefined" ? navigator.mediaSession : undefined;
    if (!ms || typeof MediaMetadata === "undefined") return;
    ms.metadata = current ? new MediaMetadata({ title: current.title, artist: current.artist || "FindYourself" }) : null;
  }, [current]);
  useEffect(() => {
    const ms = typeof navigator !== "undefined" ? navigator.mediaSession : undefined;
    if (!ms) return;
    ms.playbackState = !current ? "none" : playing ? "playing" : "paused";
  }, [current, playing]);
  useEffect(() => {
    const ms = typeof navigator !== "undefined" ? navigator.mediaSession : undefined;
    if (!ms) return;
    const s = () => useMusicStore.getState();
    const set = (action: MediaSessionAction, fn: MediaSessionActionHandler | null) => {
      try {
        ms.setActionHandler(action, fn);
      } catch {
        // an action this browser does not know
      }
    };
    set("play", () => !s().playing && s().togglePlay());
    set("pause", () => s().pause());
    set("previoustrack", () => s().previous());
    set("nexttrack", () => s().next());
    set("seekto", (d) => typeof d.seekTime === "number" && s().seek(d.seekTime));
    set("seekbackward", (d) => s().seek(Math.max(0, getAudio().currentTime - (d.seekOffset ?? 10))));
    set("seekforward", (d) => s().seek(getAudio().currentTime + (d.seekOffset ?? 10)));
    return () => {
      for (const a of ["play", "pause", "previoustrack", "nexttrack", "seekto", "seekbackward", "seekforward"] as const) set(a, null);
    };
  }, []);
  // lock-screen scrubber, about once a second
  const position = usePlayback((p) => Math.floor(p.position));
  const duration = usePlayback((p) => p.duration);
  useEffect(() => {
    const ms = typeof navigator !== "undefined" ? navigator.mediaSession : undefined;
    if (!ms || !current || !Number.isFinite(duration) || duration <= 0) return;
    try {
      ms.setPositionState({ duration, position: Math.min(position, duration), playbackRate: 1 });
    } catch {
      // some browsers refuse inconsistent values; the scrubber is a nicety
    }
  }, [current, position, duration]);

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}
