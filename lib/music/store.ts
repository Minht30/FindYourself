"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeStorage } from "@/lib/safeStorage";
import type { Problem } from "./engine";
import { getAudio, getEngine } from "./player";
import * as Q from "./queue";
import type { Playlist } from "./playlist";

// Where the queue came from: the whole library, one playlist, or one track
// (what "music for my focus sessions" can be set to).
export type Source = { kind: "library" } | { kind: "playlist"; id: string } | { kind: "track"; id: string };
export const LIBRARY: Source = { kind: "library" };

export const DEFAULT_VOLUME = 0.7;

type MusicStore = {
  queue: Q.QueueState;
  source: Source;
  // music volume and mute: independent of the ambient mixer (no ducking in v1)
  volume: number;
  muted: boolean;
  // where the current track was left, in seconds: persisted on pause / hide /
  // track change, so a reload opens on the same spot (paused)
  position: number;

  // The library as last synced (not persisted): lets code outside React, such as
  // the focus-session music, resolve "this playlist" to track ids.
  library: { trackIds: string[]; playlists: { id: string; trackIds: string[] }[] };

  // Never persisted: the player only ever starts from a click, so a reload
  // (or a new tab) always opens silent.
  playing: boolean;
  loading: boolean;
  problem: Problem | null;
  hydrated: boolean;

  // Start `ids` from `startId`, optionally setting the repeat mode (focus music
  // loops, so it lasts the whole session). Called from a click.
  playList: (ids: readonly string[], startId?: string | null, source?: Source, repeat?: Q.Repeat) => void;
  togglePlay: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  jump: (id: string) => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  setMuted: (m: boolean) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;

  // The track ended on its own.
  ended: () => void;
  // The library or a playlist changed under the queue.
  syncLibrary: (trackIds: readonly string[], playlists: readonly Playlist[]) => void;
  // Make the player open on `trackId` (the one the account remembers), paused.
  restoreTrack: (trackId: string, trackIds: readonly string[]) => void;
  savePosition: () => void;
  setPlayback: (p: Partial<Pick<MusicStore, "playing" | "loading" | "problem">>) => void;
};

const clamp01 = (n: unknown, fallback: number) =>
  typeof n === "number" && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;

const newSeed = () => (Math.random() * 2 ** 31) >>> 0;

const sameIds = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

export const useMusicStore = create<MusicStore>()(
  persist(
    (set, get) => {
      // Applies a queue transition: stores the new queue and does what it says
      // about playback.
      const run = (t: Q.Transition) => {
        const e = getEngine();
        const cur = t.state.current;
        set({ queue: t.state, position: 0, problem: null });
        switch (t.action) {
          case "play":
            if (cur) {
              // a new track: the readout starts from zero, not from the old one
              if (cur !== e.loadedId) usePlayback.setState({ position: 0, duration: 0 });
              void e.load(cur, { play: true });
            }
            break;
          case "restart":
            e.restart();
            break;
          case "stop":
            e.stop();
            if (cur) void e.load(cur, { play: false });
            else e.unload();
            break;
          case "keep":
            break;
        }
      };

      return {
        queue: Q.emptyQueue(),
        source: LIBRARY,
        volume: DEFAULT_VOLUME,
        muted: false,
        position: 0,
        library: { trackIds: [], playlists: [] },
        playing: false,
        loading: false,
        problem: null,
        hydrated: false,

        playList: (ids, startId, source = LIBRARY, repeat) => {
          set({ source });
          const queue = repeat ? Q.setRepeat(get().queue, repeat).state : get().queue;
          run(Q.playFrom(queue, ids, startId, newSeed()));
        },

        togglePlay: () => {
          const s = get();
          const cur = s.queue.current;
          if (!cur) return;
          const e = getEngine();
          if (s.playing) {
            e.pause();
            get().savePosition();
            return;
          }
          set({ problem: null });
          if (e.loadedId !== cur) void e.load(cur, { play: true, startAt: s.position });
          else void e.play();
        },
        pause: () => {
          if (!get().playing) return;
          getEngine().pause();
          get().savePosition();
        },

        next: () => run(Q.next(get().queue, false)),
        previous: () => run(Q.previous(get().queue, getAudio().currentTime || 0)),
        jump: (id) => run(Q.jump(get().queue, id)),
        ended: () => run(Q.next(get().queue, true)),

        seek: (seconds) => {
          getEngine().seek(seconds);
          set({ position: Math.max(0, seconds) });
        },
        setVolume: (v) => {
          const volume = clamp01(v, DEFAULT_VOLUME);
          getEngine().setVolume(volume);
          set({ volume });
        },
        setMuted: (muted) => {
          getEngine().setMuted(muted);
          set({ muted });
        },

        toggleShuffle: () => {
          const q = get().queue;
          set({ queue: Q.setShuffle(q, !q.shuffle, newSeed()).state });
        },
        cycleRepeat: () => set({ queue: Q.cycleRepeat(get().queue).state }),

        syncLibrary: (trackIds, playlists) => {
          const s = get();
          const valid = new Set(trackIds);
          set({
            library: { trackIds: [...trackIds], playlists: playlists.map((p) => ({ id: p.id, trackIds: [...p.trackIds] })) },
          });
          let source = s.source;
          let base: readonly string[] = trackIds;
          if (source.kind === "track") {
            base = [source.id];
          } else if (source.kind === "playlist") {
            const wanted = source.id;
            const p = playlists.find((x) => x.id === wanted);
            if (p) base = p.trackIds;
            else source = LIBRARY; // the playlist was deleted: carry on with the library
          }
          const t = Q.reconcile(s.queue, valid, base);
          const changed =
            !sameIds(t.state.base, s.queue.base) ||
            !sameIds(t.state.order, s.queue.order) ||
            t.state.current !== s.queue.current;
          if (source !== s.source) set({ source });
          if (!changed) return;
          if (t.action === "play" && !s.playing) {
            // the playing track vanished while paused: prepare the next, do not start it
            set({ queue: t.state, position: 0 });
            if (t.state.current) void getEngine().load(t.state.current, { play: false });
          } else if (t.action === "play" || t.action === "stop") {
            run(t);
          } else {
            set({ queue: t.state });
          }
        },

        restoreTrack: (trackId, trackIds) => {
          if (!trackIds.includes(trackId)) return;
          set({ source: LIBRARY, queue: Q.load(get().queue, trackIds, trackId), position: 0 });
        },

        savePosition: () => {
          const s = get();
          const a = getAudio();
          const e = getEngine();
          if (e.loadedId && e.loadedId === s.queue.current && Number.isFinite(a.currentTime)) {
            set({ position: Math.max(0, Math.floor(a.currentTime)) });
          }
        },

        setPlayback: (p) => set(p),
      };
    },
    {
      name: "fy-music",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ queue: s.queue, source: s.source, volume: s.volume, muted: s.muted, position: s.position }),
      // Server HTML and the first client render both show the empty player;
      // MusicProvider rehydrates in an effect, so there is no mismatch.
      skipHydration: true,
      merge: (persisted, current) => {
        const p = (persisted && typeof persisted === "object" ? persisted : {}) as Record<string, unknown>;
        const src = (p.source && typeof p.source === "object" ? p.source : {}) as Record<string, unknown>;
        const source: Source =
          (src.kind === "playlist" || src.kind === "track") && typeof src.id === "string" ? { kind: src.kind, id: src.id } : LIBRARY;
        return {
          ...current,
          queue: Q.sanitizeQueue(p.queue),
          source,
          volume: clamp01(p.volume, DEFAULT_VOLUME),
          muted: p.muted === true,
          position: typeof p.position === "number" && Number.isFinite(p.position) && p.position > 0 ? Math.floor(p.position) : 0,
        };
      },
      onRehydrateStorage: () => () => {
        useMusicStore.setState({ hydrated: true });
      },
    },
  ),
);

// Position and length of the playing track, written by the engine's events. A
// separate store so the seek bar re-renders on every tick without dragging the
// rest of the player with it.
type Playback = { position: number; duration: number };
export const usePlayback = create<Playback>(() => ({ position: 0, duration: 0 }));

export const currentTrackId = () => useMusicStore.getState().queue.current;
