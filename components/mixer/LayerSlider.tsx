"use client";

import type { CSSProperties } from "react";
import type { LayerMeta } from "@/lib/audio/layers";
import { levelText, percent } from "@/lib/audio/state";
import { useMixerStore } from "@/lib/audio/store";
import LayerIcon from "./LayerIcon";

// One layer's volume. A native range input, so the keyboard (arrows, Home, End,
// PageUp / PageDown), touch and screen readers all work for free;
// `aria-valuetext` reads "Rain, 60 percent" instead of a bare number.
export default function LayerSlider({
  layer,
  compact = false,
}: {
  layer: LayerMeta;
  compact?: boolean;
}) {
  const level = useMixerStore((s) => s.settings.levels[layer.key]);
  const playing = useMixerStore((s) => s.playing);
  const muted = useMixerStore((s) => s.settings.muted);
  const setLevel = useMixerStore((s) => s.setLevel);
  const p = percent(level);
  const id = `mix-${layer.key}${compact ? "-mini" : ""}`;
  const audible = playing && !muted && level > 0;

  const input = (
    <input
      id={id}
      type="range"
      min={0}
      max={100}
      step={1}
      value={p}
      onChange={(e) => setLevel(layer.key, Number(e.target.value) / 100)}
      aria-valuetext={levelText(layer.label, level)}
      className="fy-range"
      style={{ "--fill": `${p}%` } as CSSProperties}
    />
  );

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="shrink-0 w-6 flex justify-center" aria-hidden>
          <LayerIcon layer={layer.key} active={audible} px={2} />
        </span>
        <label htmlFor={id} className="w-[5.25rem] shrink-0 truncate text-xs font-ui text-ink-secondary">
          {layer.label}
        </label>
        {input}
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-glass-card border border-[var(--border)] p-4 shadow-card">
      <div className="flex items-center gap-3 mb-2">
        <LayerIcon layer={layer.key} active={audible} px={3} />
        <label htmlFor={id} className="font-ui font-medium text-sm flex-1">
          {layer.label}
        </label>
        <output htmlFor={id} className="font-mono text-xs text-ink-secondary tabular-nums w-10 text-right">
          {p === 0 ? "off" : `${p}%`}
        </output>
      </div>
      {input}
    </div>
  );
}
