import { getTrackUrl } from "@/app/(app)/chill/music-actions";
import { createPlaybackEngine, type AudioLike, type PlaybackEngine } from "./engine";
import { createUrlCache } from "./signed-url";

// The one audio element and engine for the whole app. Created on first use, in
// the browser only (never during server rendering), and kept for the life of
// the page: the element is not part of any React tree, so navigating between
// pages cannot unmount it, and the music carries on.

let audio: HTMLAudioElement | null = null;
let engine: PlaybackEngine | null = null;

export function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
    audio.preload = "none"; // nothing is downloaded until a track is chosen
  }
  return audio;
}

export function getEngine(): PlaybackEngine {
  if (!engine) {
    engine = createPlaybackEngine(
      getAudio() as unknown as AudioLike,
      createUrlCache((id) => getTrackUrl({ id })),
    );
  }
  return engine;
}
