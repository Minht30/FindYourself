import { CloudRain, Coffee, Flame, Keyboard, Piano, type LucideIcon } from "lucide-react";
import type { LayerKey } from "@/lib/audio/layers";

// One line icon per ambient layer (the pixel sprites are retired); a test holds
// "every layer has an icon".
export const LAYER_ICONS: Record<LayerKey, LucideIcon> = {
  rain: CloudRain,
  fire: Flame,
  keyboard: Keyboard,
  cafe: Coffee,
  piano: Piano,
};
