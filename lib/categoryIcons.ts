// The small picture on every timetable block, by category (as in the design: a leaf for deep
// work, two people for meetings, a book, a moon, a flower). The five seeded categories have
// their own; a category the person made, or renamed, gets a plain tag.
export type CategoryIconKey = "leaf" | "people" | "book" | "moon" | "flower" | "tag";

const BY_NAME: Record<string, CategoryIconKey> = {
  "deep work": "leaf",
  meetings: "people",
  learning: "book",
  rest: "moon",
  personal: "flower",
};

export function categoryIconKey(category: { name: string } | null | undefined): CategoryIconKey {
  if (!category) return "tag";
  return BY_NAME[category.name.trim().toLowerCase()] ?? "tag";
}
