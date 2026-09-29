// Map seeded category names to CSS-variable-backed tokens so anything tagged
// with a category re-colors when the theme flips. Falls back to the DB `color`
// hex for anything the user has renamed.
const CATEGORY_TOKEN: Record<string, string> = {
  "Deep Work": "var(--cat-deep)",
  "Meetings": "var(--cat-meeting)",
  "Learning": "var(--cat-learn)",
  "Rest": "var(--cat-rest)",
  "Personal": "var(--cat-personal)",
};

export function categoryColor(category: { name: string; color: string } | null | undefined): string {
  return (category && CATEGORY_TOKEN[category.name]) || category?.color || "var(--cat-deep)";
}
