"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeStorage } from "@/lib/safeStorage";
import { DEFAULT_FOCUS_MUSIC, sanitizeFocusMusic, type FocusMusicChoice, type FocusMusicSettings } from "./music";

type FocusMusicStore = {
  settings: FocusMusicSettings;
  hydrated: boolean;
  setChoice: (choice: FocusMusicChoice) => void;
  setPauseOnBreaks: (on: boolean) => void;
};

// What plays during focus sessions, remembered per device in localStorage like
// the timer settings (Minh's decision C). Never starts anything by itself.
export const useFocusMusicStore = create<FocusMusicStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_FOCUS_MUSIC,
      hydrated: false,
      setChoice: (choice) => set({ settings: sanitizeFocusMusic({ ...get().settings, choice }) }),
      setPauseOnBreaks: (pauseOnBreaks) => set({ settings: { ...get().settings, pauseOnBreaks } }),
    }),
    {
      name: "fy-focus-music",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ settings: s.settings }),
      // Server HTML and the first client render show the default (no music);
      // FocusProvider rehydrates in an effect, so there is no mismatch.
      skipHydration: true,
      merge: (persisted, current) => {
        const p = (persisted && typeof persisted === "object" ? persisted : {}) as Record<string, unknown>;
        return { ...current, settings: sanitizeFocusMusic(p.settings) };
      },
      onRehydrateStorage: () => () => {
        useFocusMusicStore.setState({ hydrated: true });
      },
    },
  ),
);
