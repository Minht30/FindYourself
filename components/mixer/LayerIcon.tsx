import type { LayerKey } from "@/lib/audio/layers";
import { LAYER_ICONS } from "./layerIcons";

// A layer's icon: lit in the accent while the layer is audible, quiet when it is silent.
// `px` keeps the old scale (2 = the compact rows, 3 = the full sliders).
export default function LayerIcon({ layer, active, px = 2 }: { layer: LayerKey; active: boolean; px?: number }) {
  const Icon = LAYER_ICONS[layer];
  return <Icon size={px * 8} aria-hidden strokeWidth={1.75} className={active ? "text-accent-strong" : "text-ink-muted"} />;
}
