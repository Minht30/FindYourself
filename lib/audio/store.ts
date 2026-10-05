"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { primeAudio } from "@/lib/audio/context";
import { safeStorage } from "@/lib/safeStorage";
import { isLayerKey, type LayerKey } from "./layers";
import { clampLevel, defaultSettings, sanitizeSettings, type MixerSettings } from "./state";

// Why sound is not coming out even though it was asked for.
export type Problem = "blocked" | "unsupported" | null;

// What the sound button should show: nothing playing, playing, or muted.
export type SoundStatus = "off" | "on" | "muted";

type MixerStore = {
  settings: MixerSettings;
  // Never persisted: ambient sound only ever starts from an explicit click, so
  // a reload (or a new tab) always opens silent.
  playing: boolean;
  problem: Problem;
  hydrated: boolean;

  setLevel: (key: LayerKey, level: number) => void;
  setMaster: (level: number) => void;
  setMuted: (muted: boolean) => void;
  // Start ambient sound. Must be called from a click or key handler: it
  // unlocks the browser's audio in the same gesture. Also unmutes, because
  // pressing "play" while muted means "I want to hear it".
  play: () => void;
  pause: () => void;
  // The top bar's single button: off -> play, playing -> mute, muted -> unmute.
  toggleSound: () => void;
  setProblem: (p: Problem) => void;
};

export function soundStatus(s: Pick<MixerStore, "playing" | "settings">): SoundStatus {
  return !s.playing ? "off" : s.settings.muted ? "muted" : "on";
}

export const useMixerStore = create<MixerStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings(),
      playing: false,
      problem: null,
      hydrated: false,

      setLevel: (key, level) => {
        if (!isLayerKey(key)) return;
        set((s) => ({ settings: { ...s.settings, levels: { ...s.settings.levels, [key]: clampLevel(level) } } }));
      },
      setMaster: (level) => set((s) => ({ settings: { ...s.settings, master: clampLevel(level) } })),
      setMuted: (muted) => set((s) => ({ settings: { ...s.settings, muted } })),
      play: () => {
        primeAudio();
        set((s) => ({ playing: true, problem: null, settings: { ...s.settings, muted: false } }));
      },
      pause: () => set({ playing: false }),
      toggleSound: () => {
        const s = get();
        if (!s.playing) s.play();
        else s.setMuted(!s.settings.muted);
      },
      setProblem: (problem) => set(problem ? { problem, playing: false } : { problem }),
    }),
    {
      name: "fy-mixer",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ settings: s.settings }),
      // Server HTML and the first client render both show the default mixer;
      // MixerProvider rehydrates in an effect, so there is no mismatch.
      skipHydration: true,
      merge: (persisted, current) => ({
        ...current,
        settings: sanitizeSettings(persisted && typeof persisted === "object" ? (persisted as Record<string, unknown>).settings : null),
      }),
      onRehydrateStorage: () => () => {
        useMixerStore.setState({ hydrated: true });
      },
    },
  ),
);
