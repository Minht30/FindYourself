"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeStorage } from "@/lib/safeStorage";
import { enqueueSession } from "./sessions";
import * as T from "./timer";

// A tab that was throttled this long past its deadline counts as "away": the
// session is still saved, but nobody wants a chime for something that ended
// ages ago.
export const AWAY_MS = 5 * 60_000;

export type Finished = {
  seq: number; // bumps on every finished phase so effects can key on it
  phase: T.Phase;
  at: number; // when it ended (its deadline); shared by every tab, so it dedupes chimes
  away: boolean;
  record: T.SessionRecord | null;
};

type FocusStore = {
  timer: T.TimerState;
  settings: T.Settings;
  hydrated: boolean;
  lastFinished: Finished | null;
  // Focus Mode is a view, not timer state: never persisted, so a reload
  // always lands on the normal page with the timer still running.
  focusMode: boolean;

  startOrResume: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  tick: (now: number, opts?: { away?: boolean }) => void;
  setSettings: (patch: Partial<T.Settings>) => void;
  setLink: (link: T.FocusLink | null) => void;
  selectPhase: (phase: T.Phase) => void;
  setFocusMode: (on: boolean) => void;
};

const newId = () => crypto.randomUUID();

// Something outside the timer (the music for focus sessions) wants to know when
// the timer moves, and whether a person did it (a click, a key) or the clock did.
// It is told only about moves: restoring a saved timer on page load is not one,
// so nothing can start by itself when a page opens.
export type TimerCause = "user" | "tick";
type TimerHook = (prev: T.TimerState, next: T.TimerState, cause: TimerCause) => void;
let timerHook: TimerHook | null = null;
export function setTimerHook(hook: TimerHook | null) {
  timerHook = hook;
}

export const useFocusStore = create<FocusStore>()(
  persist(
    (set, get) => {
      // Applies a transition, hands any finished/abandoned focus session to the
      // outbox, and tells the UI a phase ended.
      const apply = (t: T.Transition, cause: TimerCause, away = false, at = Date.now()) => {
        const prev = get().timer;
        if (t.record) enqueueSession(t.record);
        set((s) => ({
          timer: t.state,
          lastFinished: t.finished
            ? { seq: (s.lastFinished?.seq ?? 0) + 1, phase: t.finished, at, away, record: t.record }
            : s.lastFinished,
        }));
        timerHook?.(prev, t.state, cause);
      };

      const initialSettings = T.DEFAULT_SETTINGS;
      return {
        timer: T.initialState(initialSettings),
        settings: initialSettings,
        hydrated: false,
        lastFinished: null,
        focusMode: false,

        startOrResume: () => {
          const prev = get().timer;
          set((s) => ({ timer: T.start(s.timer, Date.now(), newId) }));
          timerHook?.(prev, get().timer, "user");
        },
        pause: () => {
          const prev = get().timer;
          set((s) => ({ timer: T.pause(s.timer, Date.now()) }));
          timerHook?.(prev, get().timer, "user");
        },
        reset: () => {
          const { timer, settings } = get();
          apply(T.reset(timer, Date.now(), settings), "user");
        },
        skip: () => {
          const { timer, settings } = get();
          apply(T.skip(timer, Date.now(), settings, settings.autoStart, newId), "user");
        },
        tick: (now, opts) => {
          const { timer, settings } = get();
          if (timer.status !== "running" || timer.endsAt === null || timer.endsAt > now) return;
          const away = Boolean(opts?.away) || now - timer.endsAt > AWAY_MS;
          // Chaining on a resumed-after-away timer would start a break that is
          // already half over, so only chain on a live, on-time completion.
          const t = away
            ? T.complete(timer, timer.endsAt, settings, false, newId)
            : T.complete(timer, timer.endsAt, settings, settings.autoStart, newId);
          apply(t, "tick", away, timer.endsAt);
        },
        setSettings: (patch) =>
          set((s) => {
            const settings = T.sanitizeSettings({ ...s.settings, ...patch });
            return { settings, timer: T.applySettings(s.timer, settings) };
          }),
        setLink: (link) => set((s) => ({ timer: T.setLink(s.timer, link) })),
        selectPhase: (phase) => set((s) => ({ timer: T.selectPhase(s.timer, phase, s.settings) })),
        setFocusMode: (on) => set({ focusMode: on }),
      };
    },
    {
      name: "fy-focus",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ timer: s.timer, settings: s.settings }),
      // Server HTML and the first client render are both the default idle
      // timer; FocusProvider rehydrates in an effect, so there is no mismatch.
      skipHydration: true,
      merge: (persisted, current) => {
        const p = (persisted && typeof persisted === "object" ? persisted : {}) as Record<string, unknown>;
        const settings = T.sanitizeSettings(p.settings);
        const timer = T.applySettings(T.sanitizeState(p.timer, settings), settings);
        return { ...current, settings, timer };
      },
      onRehydrateStorage: () => () => {
        useFocusStore.setState({ hydrated: true });
      },
    },
  ),
);

// Seconds-resolution view of the timer, written by FocusProvider. Components
// that show the clock select from here, so they re-render once per second
// instead of on every 250 ms tick.
type Clock = { secondsLeft: number; progress: number };
export const useClock = create<Clock>(() => ({
  secondsLeft: T.DEFAULT_SETTINGS.focusMin * 60,
  progress: 0,
}));

export function syncClock(now = Date.now()) {
  const { timer } = useFocusStore.getState();
  const secondsLeft = Math.ceil(T.remainingAt(timer, now) / 1000);
  const progress = Math.round(T.progressAt(timer, now) * 1000) / 1000;
  const cur = useClock.getState();
  if (cur.secondsLeft !== secondsLeft || cur.progress !== progress) useClock.setState({ secondsLeft, progress });
}
