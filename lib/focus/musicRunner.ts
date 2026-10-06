"use client";

import { useMixerStore } from "@/lib/audio/store";
import { useMusicStore } from "@/lib/music/store";
import { musicStep, resolveChoice, runStep, type MusicDeps } from "./music";
import { useFocusMusicStore } from "./musicStore";
import { setTimerHook } from "./store";

// The real player and mixer, as the pure runner sees them. Every call here
// happens inside the click (or key press) that moved the timer, which is the
// user gesture browsers require before audio may start.
const deps: MusicDeps = {
  music: {
    playing: () => useMusicStore.getState().playing,
    source: () => useMusicStore.getState().source,
    hasCurrent: () => useMusicStore.getState().queue.current !== null,
    playList: (ids, startId, source, repeat) => useMusicStore.getState().playList(ids, startId, source, repeat),
    resume: () => {
      const s = useMusicStore.getState();
      if (!s.playing) s.togglePlay();
    },
    pause: () => useMusicStore.getState().pause(),
  },
  ambient: {
    playing: () => useMixerStore.getState().playing,
    play: () => useMixerStore.getState().play(),
    pause: () => useMixerStore.getState().pause(),
  },
};

// Starts and stops the chosen music as the timer moves. Returns a disconnect
// function. Mounted once, by FocusProvider.
export function connectFocusMusic(): () => void {
  setTimerHook((prev, next) => {
    const { choice, pauseOnBreaks } = useFocusMusicStore.getState().settings;
    const step = musicStep(prev, next, pauseOnBreaks);
    if (step === "none") return;
    const { library } = useMusicStore.getState();
    runStep(step, resolveChoice(choice, library), deps);
  });
  return () => setTimerHook(null);
}
