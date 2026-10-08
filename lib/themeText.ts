import { COMING_SOON, DAY_REGIONS, NIGHT_REGIONS, THEME_LABELS, dayNightOf, type DayNight, type ThemeMode, type ThemeName } from "@/lib/theme";

// The words and the cards of the Appearance settings (components/settings/AppearanceCard.tsx).
// Kept apart from the component so the copy, the "what is available" rule and the
// announcements can be tested without a browser.

export const REGION_LABELS = { monstadt: "Monstadt", nodkrai: "Nod-Krai", liyue: "Liyue", natlan: "Natlan" } as const;
export type RegionKey = keyof typeof REGION_LABELS;

export type RegionCard = {
  mode: DayNight;
  region: RegionKey;
  label: string;
  blurb: string;
  /** A 16:9 picture of the scene; none for a region that has no art yet. */
  thumb: string | null;
  available: boolean;
};

const BLURBS: Record<RegionKey, string> = {
  monstadt: "Wind in the meadow, a bright town by the water.",
  nodkrai: "Aurora over a frozen bay, and a moth spirit for company.",
  liyue: "Coming soon. A new scene is on its way.",
  natlan: "Coming soon. A new scene is on its way.",
};

const THUMBS: Partial<Record<RegionKey, string>> = {
  monstadt: "/assets/world/Monstadt_Day/monstadt-thumb.webp",
  nodkrai: "/assets/world/NodKrai_Night/nodkrai-thumb.webp",
};

// One card per region, day regions first. A region is selectable exactly when
// lib/theme.ts lists it as one the app can draw; the ones in COMING_SOON are shown
// disabled. Adding a region to DAY_REGIONS or NIGHT_REGIONS turns its card on.
export const REGION_CARDS: readonly RegionCard[] = [
  ...[...DAY_REGIONS, ...COMING_SOON.day].map((r) => card("day", r, (DAY_REGIONS as readonly string[]).includes(r))),
  ...[...NIGHT_REGIONS, ...COMING_SOON.night].map((r) => card("night", r, (NIGHT_REGIONS as readonly string[]).includes(r))),
];

function card(mode: DayNight, region: RegionKey, available: boolean): RegionCard {
  return { mode, region, label: REGION_LABELS[region], blurb: BLURBS[region], thumb: available ? (THUMBS[region] ?? null) : null, available };
}

export const MODE_OPTIONS = [
  { value: "day", label: "Day", hint: "Always the day scene." },
  { value: "night", label: "Night", hint: "Always the night scene." },
  { value: "auto", label: "Auto", hint: "Follows your clock." },
] as const;

// Each refusal said in words, never a bare "error". Keyed by the reason
// saveThemePrefs returns.
export const THEME_REASONS: Record<string, string> = {
  unauthenticated: "Sign in again to change your appearance.",
  bad_mode: "That choice was not understood. Try again.",
  bad_region: "That region is not one this app has.",
  region_unavailable: "That region is not available yet.",
  db_error: "Could not save your appearance. Try again.",
};

export function reasonText(reason: string): string {
  return THEME_REASONS[reason] ?? THEME_REASONS.db_error;
}

const dayNightWord = (t: ThemeName) => (dayNightOf(t) === "night" ? "night" : "day");

// What the polite live region says after a change. `showing` is the theme on the
// page once the change is applied.
export function modeMessage(mode: ThemeMode, showing: ThemeName): string {
  const scene = `${THEME_LABELS[showing]}, ${dayNightWord(showing)}`;
  if (mode === "auto") return `Auto: following your clock. Showing ${scene} now.`;
  return `${mode === "night" ? "Night" : "Day"} mode. Showing ${scene}.`;
}

// A region was picked for `forMode`. The live scene changes only when that mode is
// the one on screen; otherwise the choice is kept for when it is.
export function regionMessage(forMode: DayNight, region: RegionKey, showing: ThemeName): string {
  if (dayNightOf(showing) === forMode) return `Switched to ${THEME_LABELS[showing]}, ${dayNightWord(showing)}.`;
  return `${REGION_LABELS[region]} is now your ${forMode} scene.`;
}
