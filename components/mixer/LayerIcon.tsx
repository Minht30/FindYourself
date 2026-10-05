import PixelSprite from "@/components/focus/pixel/PixelSprite";
import type { LayerKey } from "@/lib/audio/layers";
import { ICON_PALETTE, LAYER_ICONS } from "./pixel/icons";

// A layer's pixel icon: still when the layer is silent, animated when it is
// audible (reduced motion keeps it still either way, via .pix-frame).
export default function LayerIcon({ layer, active, px = 2 }: { layer: LayerKey; active: boolean; px?: number }) {
  const frames = LAYER_ICONS[layer];
  return (
    <PixelSprite
      key={active ? "on" : "off"}
      frames={active ? frames : [frames[0]]}
      palette={ICON_PALETTE}
      px={px}
      fps={2.5}
      className={active ? "" : "opacity-70"}
    />
  );
}
