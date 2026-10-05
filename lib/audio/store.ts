"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { primeAudio } from "@/lib/audio/context";
import { safeStorage } from "@/lib/safeStorage";
import { isLayerKey, type LayerKey } from "./layers";
import type { SaveStatus } from "./saver";
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

  // Saving to the account. `rev` counts user edits; `pending` means "this
  // device has edits the account does not have yet" and *is* persisted, so a
  // change made offline survives a reload and is sent at the next load.
  rev: number;
  pending: boolean;
  saveStatus: SaveStatus;

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

  // The resolved starting mix (lib/audio/resolve.ts). Not a user edit, so it
  // does not bump `rev`; `pending` says whether the account still needs it.
  applyResolved: (settings: MixerSettings, pending: boolean) => void;
  // The saver finished revision `rev`: clear `pending` unless a newer edit exists.
  markSaved: (rev: number) => void;
  setSaveStatus: (s: SaveStatus) => void;
};

export function soundStatus(s: Pick<MixerStore, "playing" | "settings">): SoundStatus {
  return !s.playing ? "off" : s.settings.muted ? "muted" : "on";
}

export const useMixerStore = create<MixerStore>()(
  persist(
    (set, get) => {
      // Every user edit goes through here: it changes the mix, marks it as not
      // yet saved, and bumps the revision the saver watches.
      const edit = (change: (s: MixerSettings) => MixerSettings) =>
        set((s) => ({ settings: change(s.settings), pending: true, rev: s.rev + 1 }));

      return {
        settings: defaultSettings(),
        playing: false,
        problem: null,
        hydrated: false,
        rev: 0,
        pending: false,
        saveStatus: { kind: "idle" },

        setLevel: (key, level) => {
          if (!isLayerKey(key)) return;
          const next = clampLevel(level);
          if (get().settings.levels[key] === next) return;
          edit((s) => ({ ...s, levels: { ...s.levels, [key]: next } }));
        },
        setMaster: (level) => {
          const next = clampLevel(level);
          if (get().settings.master === next) return;
          edit((s) => ({ ...s, master: next }));
        },
        setMuted: (muted) => {
          if (get().settings.muted === muted) return;
          edit((s) => ({ ...s, muted }));
        },
        play: () => {
          primeAudio();
          set({ playing: true, problem: null });
          get().setMuted(false);
        },
        pause: () => set({ playing: false }),
        toggleSound: () => {
          const s = get();
          if (!s.playing) s.play();
          else s.setMuted(!s.settings.muted);
        },
        setProblem: (problem) => set(problem ? { problem, playing: false } : { problem }),

        applyResolved: (settings, pending) => set({ settings, pending }),
        markSaved: (rev) => set((s) => (s.rev === rev ? { pending: false } : {})),
        setSaveStatus: (saveStatus) => set({ saveStatus }),
      };
    },
    {
      name: "fy-mixer",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ settings: s.settings, pending: s.pending }),
      // Server HTML and the first client render both show the default mixer;
      // MixerProvider rehydrates in an effect, so there is no mismatch.
      skipHydration: true,
      merge: (persisted, current) => {
        const p = (persisted && typeof persisted === "object" ? persisted : {}) as Record<string, unknown>;
        return { ...current, settings: sanitizeSettings(p.settings), pending: p.pending === true };
      },
      onRehydrateStorage: () => () => {
        useMixerStore.setState({ hydrated: true });
      },
    },
  ),
);
