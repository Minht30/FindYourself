"use client";

import { Play } from "lucide-react";
import { primeAudio } from "@/lib/audio/context";
import { useMixerStore } from "@/lib/audio/store";
import { useCatalogue } from "./MixerProvider";
import LayerSlider from "./LayerSlider";
import MasterVolume from "./MasterVolume";
import PlayButton from "./PlayButton";
import ProblemNote from "./ProblemNote";

// The full mixer on /chill. Sound never starts by itself (browsers forbid it
// and DESIGN_SYSTEM promises it), so until the first click this page says so
// and offers one big, obvious button.
export default function MixerPanel() {
  const layers = useCatalogue();
  const playing = useMixerStore((s) => s.playing);
  const play = useMixerStore((s) => s.play);

  return (
    <div className="flex flex-col gap-5">
      {!playing && (
        <div
          data-testid="tap-to-begin"
          className="rounded-lg border border-[var(--border-strong)] bg-bg-overlay p-6 flex flex-col items-center gap-3 text-center"
        >
          <p className="font-display text-xl">Tap to begin</p>
          <p className="text-sm text-ink-secondary max-w-sm">
            Sound only starts when you ask it to. Set the mix below first if you like, then press play.
          </p>
          <button
            type="button"
            onClick={() => {
              primeAudio();
              play();
            }}
            className="inline-flex items-center gap-2 rounded-full bg-accent text-cat-ink font-ui font-semibold px-6 py-3 shadow-glow hover:bg-accent-soft transition"
          >
            <Play size={18} />
            Begin
          </button>
          <ProblemNote />
        </div>
      )}

      <section aria-label="Ambient mixer" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg">Mixer</h2>
          {playing && <PlayButton />}
        </div>
        {playing && <ProblemNote />}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {layers.map((l) => (
            <LayerSlider key={l.key} layer={l} />
          ))}
        </div>
        <div className="rounded-lg bg-bg-elevated border border-[var(--border)] p-4 shadow-card">
          <MasterVolume />
        </div>
      </section>
    </div>
  );
}
