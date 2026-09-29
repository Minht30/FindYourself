// The six diary moods. Order and values mirror the `diary_mood` Postgres enum
// (migration 20260920215755); labels + emoji follow DESIGN_SYSTEM.md
// ("Mood picker uses emoji + text label").
export const MOODS = [
  { value: "radiant", emoji: "🌞", label: "Radiant" },
  { value: "calm", emoji: "🍃", label: "Calm" },
  { value: "focused", emoji: "🎯", label: "Focused" },
  { value: "tired", emoji: "😴", label: "Tired" },
  { value: "low", emoji: "🌧️", label: "Low" },
  { value: "stormy", emoji: "⛈️", label: "Stormy" },
] as const;

export type DiaryMood = (typeof MOODS)[number]["value"];

export function isDiaryMood(value: unknown): value is DiaryMood {
  return MOODS.some((m) => m.value === value);
}
