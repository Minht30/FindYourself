"use client";

import { Pause, Play } from "lucide-react";
import { useMixerStore } from "@/lib/audio/store";

// Start / stop the ambient mix. Starting is the explicit first click that
// browsers require and that DESIGN_SYSTEM promises: nothing ever autoplays.
export default function PlayButton({ compact = false }: { compact?: boolean }) {
  const playing = useMixerStore((s) => s.playing);
  const play = useMixerStore((s) => s.play);
  const pause = useMixerStore((s) => s.pause);

  return (
    <button
      type="button"
      onClick={playing ? pause : play}
      aria-label={playing ? "Pause ambient sound" : "Play ambient sound"}
      className={`inline-flex items-center gap-2 rounded-full font-ui font-medium transition border border-[var(--border-strong)] ${
        playing
          ? "bg-bg-elevated text-ink-primary hover:bg-accent-soft hover:text-cat-ink hover:border-accent"
          : "bg-accent text-cat-ink hover:bg-accent-soft border-transparent shadow-glow"
      } ${compact ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm"}`}
    >
      {playing ? <Pause size={compact ? 13 : 16} /> : <Play size={compact ? 13 : 16} />}
      {playing ? "Pause" : "Play"}
    </button>
  );
}
