"use client";

import type { CSSProperties } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { levelText, percent } from "@/lib/audio/state";
import { useMixerStore } from "@/lib/audio/store";

// The master volume, with its own mute toggle. The top bar has the always
// visible mute; this one sits right next to the slider it belongs to.
export default function MasterVolume({ compact = false }: { compact?: boolean }) {
  const master = useMixerStore((s) => s.settings.master);
  const muted = useMixerStore((s) => s.settings.muted);
  const setMaster = useMixerStore((s) => s.setMaster);
  const setMuted = useMixerStore((s) => s.setMuted);
  const p = percent(master);
  const id = `mix-master${compact ? "-mini" : ""}`;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setMuted(!muted)}
        aria-pressed={muted}
        aria-label={muted ? "Unmute" : "Mute"}
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink transition"
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      <label htmlFor={id} className={compact ? "sr-only" : "font-ui text-sm font-medium whitespace-nowrap"}>
        Master volume
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={p}
        onChange={(e) => setMaster(Number(e.target.value) / 100)}
        aria-valuetext={levelText("Master volume", master)}
        className="fy-range"
        style={{ "--fill": `${muted ? 0 : p}%` } as CSSProperties}
      />
      {!compact && (
        <output htmlFor={id} className="font-mono text-xs text-ink-secondary tabular-nums w-10 text-right">
          {muted ? "muted" : `${p}%`}
        </output>
      )}
    </div>
  );
}
