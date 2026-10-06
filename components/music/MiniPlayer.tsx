"use client";

import type { CSSProperties } from "react";
import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { LIBRARY, useMusicStore, usePlayback } from "@/lib/music/store";
import { formatDuration } from "@/lib/music/types";
import { useMusic } from "./MusicProvider";

const PROBLEM_TEXT = {
  blocked: "Your browser blocked playback. Press play to start.",
  unavailable: "This track could not be played. Try another, or press play to retry.",
  unauthenticated: "Sign in again to play your music.",
} as const;

// The persistent player: on every page, at the bottom. It never starts by
// itself (a reload always opens paused) and mute stays visible at every width.
// Plain on purpose: the real design is the Figma stage.
export default function MiniPlayer() {
  const { tracks, playlists } = useMusic();
  const currentId = useMusicStore((s) => s.queue.current);
  const shuffle = useMusicStore((s) => s.queue.shuffle);
  const repeat = useMusicStore((s) => s.queue.repeat);
  const source = useMusicStore((s) => s.source);
  const playing = useMusicStore((s) => s.playing);
  const loading = useMusicStore((s) => s.loading);
  const problem = useMusicStore((s) => s.problem);
  const volume = useMusicStore((s) => s.volume);
  const muted = useMusicStore((s) => s.muted);
  const position = usePlayback((p) => p.position);
  const duration = usePlayback((p) => p.duration);
  const { playList, togglePlay, next, previous, seek, setVolume, setMuted, toggleShuffle, cycleRepeat } = useMusicStore.getState();

  if (tracks.length === 0) return null;

  const current = tracks.find((t) => t.id === currentId) ?? null;
  // The current track was just deleted: the queue moves on in a moment. Until
  // then show nothing, rather than flashing the "Play my music" prompt.
  if (currentId && !current) return null;
  const sourceName = source.kind === "playlist" ? (playlists.find((p) => p.id === source.id)?.name ?? "Your library") : "Your library";
  const known = Number.isFinite(duration) && duration > 0 ? duration : (current?.durationSeconds ?? 0);
  const at = Math.min(Math.floor(position), Math.floor(known));
  const vol = Math.round(volume * 100);
  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;
  const btn = "shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink transition disabled:opacity-40";

  return (
    <section
      aria-label="Music player"
      data-testid="mini-player"
      data-state={!current ? "empty" : playing ? "playing" : "paused"}
      className="sticky bottom-0 z-40 bg-bg-elevated border-t border-[var(--border)] px-3 sm:px-5 py-2"
    >
      {!current ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="mp-start"
            onClick={() => playList(tracks.map((t) => t.id), null, LIBRARY)}
            className="inline-flex items-center gap-2 rounded-full bg-accent text-cat-ink font-ui font-semibold text-sm px-4 py-2 shadow-glow hover:bg-accent-soft transition"
          >
            <Play size={15} />
            Play my music
          </button>
          <p className="text-xs text-ink-secondary">{tracks.length} {tracks.length === 1 ? "track" : "tracks"} in your library</p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="flex items-center gap-1 order-1">
            <button type="button" aria-label="Previous track" onClick={previous} className={btn}>
              <SkipBack size={16} />
            </button>
            <button
              type="button"
              data-testid="mp-play"
              aria-label={playing ? "Pause music" : "Play music"}
              onClick={togglePlay}
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-accent text-cat-ink shadow-glow hover:bg-accent-soft transition"
            >
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button type="button" aria-label="Next track" onClick={next} className={btn}>
              <SkipForward size={16} />
            </button>
          </div>

          <div className="order-2 min-w-0 flex-1 basis-32">
            <p data-testid="mp-title" className="font-ui font-medium text-sm truncate">
              {current.title}
            </p>
            <p className="text-xs text-ink-secondary truncate">
              {current.artist || "Unknown artist"} · {sourceName}
              {loading ? " · loading…" : ""}
            </p>
          </div>

          {/* On a phone the seek bar takes its own row below the controls */}
          <div className="order-4 sm:order-3 basis-full sm:basis-auto sm:flex-1 sm:max-w-md flex items-center gap-2">
            <span data-testid="mp-position" className="font-mono text-xs tabular-nums text-ink-secondary w-10 text-right">
              {formatDuration(at)}
            </span>
            <input
              type="range"
              data-testid="mp-seek"
              aria-label="Seek"
              min={0}
              max={Math.max(1, Math.floor(known))}
              step={1}
              value={at}
              disabled={known <= 0}
              onChange={(e) => seek(Number(e.target.value))}
              aria-valuetext={`${formatDuration(at)} of ${formatDuration(known)}`}
              className="fy-range"
              style={{ "--fill": `${known > 0 ? (at / known) * 100 : 0}%` } as CSSProperties}
            />
            <span className="font-mono text-xs tabular-nums text-ink-secondary w-10">{formatDuration(known)}</span>
          </div>

          <div className="order-3 sm:order-4 flex items-center gap-1 ml-auto">
            <button
              type="button"
              data-testid="mp-shuffle"
              aria-label="Shuffle"
              aria-pressed={shuffle}
              onClick={toggleShuffle}
              className={`${btn} ${shuffle ? "bg-accent-soft text-cat-ink" : ""}`}
            >
              <Shuffle size={15} />
            </button>
            <button
              type="button"
              data-testid="mp-repeat"
              data-repeat={repeat}
              aria-label={`Repeat: ${repeat}`}
              onClick={cycleRepeat}
              className={`${btn} ${repeat !== "off" ? "bg-accent-soft text-cat-ink" : ""}`}
            >
              <RepeatIcon size={15} />
            </button>
            <button
              type="button"
              data-testid="mp-mute"
              aria-label={muted ? "Unmute music" : "Mute music"}
              aria-pressed={muted}
              onClick={() => setMuted(!muted)}
              className={btn}
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              data-testid="mp-volume"
              aria-label="Music volume"
              min={0}
              max={100}
              step={1}
              value={vol}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              aria-valuetext={vol === 0 ? "Music volume, off" : `Music volume, ${vol} percent`}
              className="fy-range hidden sm:block w-24"
              style={{ "--fill": `${muted ? 0 : vol}%` } as CSSProperties}
            />
          </div>
        </div>
      )}
      {problem && (
        <p role="status" aria-live="polite" data-testid="mp-problem" data-problem={problem} className="text-xs text-danger mt-1">
          {PROBLEM_TEXT[problem]}
        </p>
      )}
    </section>
  );
}
