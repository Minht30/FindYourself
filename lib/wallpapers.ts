import type { ThemeName } from "@/lib/theme";

// The painting behind each theme. The stylesheet ("Wallpaper stage" in globals.css)
// sets them as backgrounds; this list is what the page preloads, and
// lib/wallpapers.test.ts keeps the two and the files in public/ in agreement.
// Phones (up to 767 px wide) get the smaller file where there is one.
export type Wallpaper = { src: string; phoneSrc?: string };

export const PHONE_MAX_WIDTH = 767;

export const WALLPAPERS: Record<ThemeName, Wallpaper> = {
  monstadt: { src: "/assets/world/Monstadt_Day/monstadt-day.webp" },
  "nodkrai-night": { src: "/assets/world/NodKrai_Night/nodkrai-night.webp", phoneSrc: "/assets/world/NodKrai_Night/nodkrai-night-1600.webp" },
};
