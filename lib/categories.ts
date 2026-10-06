// The five categories every account starts with, and the theme token each one
// follows so anything tagged with them re-colours when the theme flips. A
// category keeps following its token only while it still has its default
// colour: once someone recolours "Deep Work" (or renames it) the colour they
// chose is the colour they get, in both themes.
const SEEDED: Record<string, { color: string; token: string }> = {
  "Deep Work": { color: "#C69B7B", token: "var(--cat-deep)" },
  "Meetings": { color: "#D97757", token: "var(--cat-meeting)" },
  "Learning": { color: "#8B9DC3", token: "var(--cat-learn)" },
  "Rest": { color: "#9CAF88", token: "var(--cat-rest)" },
  "Personal": { color: "#B497BD", token: "var(--cat-personal)" },
};

export function categoryColor(category: { name: string; color: string } | null | undefined): string {
  const seeded = category ? SEEDED[category.name] : undefined;
  if (category && seeded && category.color.toUpperCase() === seeded.color) return seeded.token;
  return category?.color || "var(--cat-deep)";
}
