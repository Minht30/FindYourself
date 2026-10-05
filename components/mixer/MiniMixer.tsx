"use client";

import { usePathname } from "next/navigation";
import { useCatalogue } from "./MixerProvider";
import LayerSlider from "./LayerSlider";
import MasterVolume from "./MasterVolume";
import PlayButton from "./PlayButton";
import ProblemNote from "./ProblemNote";

// The small mixer at the bottom of the sidebar (PRD 6.0). Hidden on /chill,
// where the full mixer is the page.
export default function MiniMixer() {
  const pathname = usePathname();
  const layers = useCatalogue();
  if (pathname?.startsWith("/chill")) return null;

  return (
    <section aria-labelledby="mini-mixer-title" className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-2">
        <h2 id="mini-mixer-title" className="text-[11px] font-ui font-semibold text-ink-muted uppercase tracking-wider">
          Ambient
        </h2>
        <PlayButton compact />
      </div>
      <ProblemNote className="px-2" />
      <div className="flex flex-col gap-0.5">
        {layers.map((l) => (
          <LayerSlider key={l.key} layer={l} compact />
        ))}
      </div>
      <MasterVolume compact />
    </section>
  );
}
