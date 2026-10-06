import type { Playlist } from "@/lib/music/playlist";
import type { Repeat } from "@/lib/music/queue";
import type { Source } from "@/lib/music/store";
import type { TimerState } from "./timer";

// Music for focus sessions. What plays while a session runs is a per-device
// choice (localStorage, like the timer settings): nothing, the ambient mix,
// one of your tracks, or one of your playlists. This file is the pure part:
// the choice, when music should be on, and what a choice means for the player.
// It never touches audio; lib/focus/musicRunner.ts does that.

export type FocusMusicChoice =
  | { kind: "none" }
  | { kind: "ambient" } // the ambient mix only, no music
  | { kind: "track"; id: string }
  | { kind: "playlist"; id: string };

export type FocusMusicSettings = {
  choice: FocusMusicChoice;
  // Pause the music on breaks (the default). Off: it keeps going through them.
  pauseOnBreaks: boolean;
};

export const DEFAULT_FOCUS_MUSIC: FocusMusicSettings = { choice: { kind: "none" }, pauseOnBreaks: true };

export function sanitizeFocusMusic(raw: unknown): FocusMusicSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const c = (r.choice && typeof r.choice === "object" ? r.choice : {}) as Record<string, unknown>;
  let choice: FocusMusicChoice = { kind: "none" };
  if (c.kind === "ambient") choice = { kind: "ambient" };
  else if ((c.kind === "track" || c.kind === "playlist") && typeof c.id === "string" && c.id.length > 0 && c.id.length <= 64) {
    choice = { kind: c.kind, id: c.id };
  }
  return { choice, pauseOnBreaks: typeof r.pauseOnBreaks === "boolean" ? r.pauseOnBreaks : DEFAULT_FOCUS_MUSIC.pauseOnBreaks };
}

// The one rule: music is wanted while a timer is running, but on a break only
// if the person asked for it to carry on. A paused or idle timer wants none.
export function wantsMusic(t: TimerState, pauseOnBreaks: boolean): boolean {
  return t.status === "running" && (t.phase === "focus" || !pauseOnBreaks);
}

export type MusicStep = "start" | "stop" | "none";

// What a timer transition means for the music. `start` also covers resuming
// after a pause or a break; `stop` is a pause, never a rewind. Pure, so the same
// answer comes out whichever way the timer got there (a click, the deadline, a
// skip) and nothing happens on a page load (no transition, no step).
export function musicStep(prev: TimerState, next: TimerState, pauseOnBreaks: boolean): MusicStep {
  const before = wantsMusic(prev, pauseOnBreaks);
  const after = wantsMusic(next, pauseOnBreaks);
  if (!before && after) return "start";
  if (before && !after) return "stop";
  return "none";
}

export type Library = {
  trackIds: readonly string[];
  playlists: readonly Pick<Playlist, "id" | "trackIds">[];
};

export type Resolved =
  | { kind: "none" }
  | { kind: "ambient" }
  // the chosen track / playlist is gone (deleted, or an empty playlist)
  | { kind: "missing" }
  | { kind: "music"; ids: string[]; startId: string | null; source: Source; repeat: Repeat };

// What the choice means against the library as it is now. A track loops on its
// own and a playlist loops as a whole, so music lasts the whole session
// whatever its length.
export function resolveChoice(choice: FocusMusicChoice, lib: Library): Resolved {
  switch (choice.kind) {
    case "none":
      return { kind: "none" };
    case "ambient":
      return { kind: "ambient" };
    case "track":
      return lib.trackIds.includes(choice.id)
        ? { kind: "music", ids: [choice.id], startId: choice.id, source: { kind: "track", id: choice.id }, repeat: "one" }
        : { kind: "missing" };
    case "playlist": {
      const p = lib.playlists.find((x) => x.id === choice.id);
      const ids = p ? p.trackIds.filter((id) => lib.trackIds.includes(id)) : [];
      return ids.length > 0
        ? { kind: "music", ids, startId: null, source: { kind: "playlist", id: choice.id }, repeat: "all" }
        : { kind: "missing" };
    }
  }
}

export const sameSource = (a: Source, b: Source) =>
  a.kind === b.kind && (a.kind === "library" || (b.kind !== "library" && a.id === b.id));

// The player and the ambient mixer, as the runner needs to see them.
export type MusicDeps = {
  music: {
    playing: () => boolean;
    source: () => Source;
    hasCurrent: () => boolean;
    playList: (ids: string[], startId: string | null, source: Source, repeat: Repeat) => void;
    resume: () => void;
    pause: () => void;
  };
  ambient: { playing: () => boolean; play: () => void; pause: () => void };
};

// Does what a step says, for the resolved choice. Called from the click that
// started the timer (or, on an auto-started phase, from the deadline).
export function runStep(step: MusicStep, resolved: Resolved, d: MusicDeps): void {
  if (step === "none" || resolved.kind === "none" || resolved.kind === "missing") return;

  if (resolved.kind === "ambient") {
    if (step === "start" && !d.ambient.playing()) d.ambient.play();
    else if (step === "stop" && d.ambient.playing()) d.ambient.pause();
    return;
  }

  // music
  if (step === "stop") {
    if (d.music.playing()) d.music.pause();
    return;
  }
  const sameQueue = sameSource(d.music.source(), resolved.source) && d.music.hasCurrent();
  if (sameQueue) {
    if (!d.music.playing()) d.music.resume(); // carry on where it was
    return;
  }
  d.music.playList(resolved.ids, resolved.startId, resolved.source, resolved.repeat);
}
