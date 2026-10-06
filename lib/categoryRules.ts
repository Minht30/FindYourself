// Category rules the app checks before asking the database (which re-checks
// every one of them: see migration 20261006062143). Pure, so the named reasons
// can be tested without a network.

export const MAX_CATEGORIES = 12;
export const MAX_NAME = 40;

// The swatches the picker offers. The first five are the defaults every account
// starts with (their names also follow the theme, see lib/categories.ts).
export const PALETTE = [
  "#C69B7B", "#D97757", "#8B9DC3", "#9CAF88", "#B497BD",
  "#E3B04B", "#6FA8A0", "#D98BA5", "#7F8FA6", "#A5846A", "#B0553F", "#6E9F5B",
] as const;

export type CategoryReason =
  | "unauthenticated"
  | "bad_name"
  | "name_too_long"
  | "bad_color"
  | "duplicate_name"
  | "category_limit"
  | "not_found"
  | "bad_target"
  | "last_category"
  | "bad_order"
  | "bad_id"
  | "db_error";

export const CATEGORY_MESSAGES: Record<CategoryReason, string> = {
  unauthenticated: "Sign in again to change your categories.",
  bad_name: "Give the category a name.",
  name_too_long: `Keep the name to ${MAX_NAME} characters or fewer.`,
  bad_color: "Pick one of the colours.",
  duplicate_name: "You already have a category with that name.",
  category_limit: `You can have up to ${MAX_CATEGORIES} categories.`,
  not_found: "That category is gone. Refresh the page.",
  bad_target: "Choose a different category to move things to.",
  last_category: "Keep at least one category.",
  bad_order: "The list changed. Refresh the page and try again.",
  bad_id: "That category could not be found.",
  db_error: "Could not save that. Try again.",
};

export type NameResult = { ok: true; value: string } | { ok: false; reason: "bad_name" | "name_too_long" };

// Control characters and line / paragraph separators are not allowed in a name.
// (Built from a string so no raw separator character sits in the source.)
const CONTROL = new RegExp("[\u0000-\u001F\u007F\u2028\u2029]");

export function validateCategoryName(input: unknown): NameResult {
  if (typeof input !== "string") return { ok: false, reason: "bad_name" };
  const value = input.replace(/\s+/g, " ").trim();
  if (value === "" || CONTROL.test(value)) return { ok: false, reason: "bad_name" };
  if ([...value].length > MAX_NAME) return { ok: false, reason: "name_too_long" };
  return { ok: true, value };
}

export function validateCategoryColor(input: unknown): input is string {
  return typeof input === "string" && /^#[0-9A-Fa-f]{6}$/.test(input);
}

export function normalizeColor(input: string): string {
  return input.toUpperCase();
}

// Names clash ignoring case and surrounding space, like the database's index.
export function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

// The database's own refusals into our reasons (by message, then SQLSTATE).
export function reasonFromDb(error: { message?: string; code?: string } | null | undefined): CategoryReason {
  const msg = error?.message ?? "";
  for (const r of ["not_found", "bad_target", "last_category", "bad_order", "category_limit"] as const) {
    if (msg.includes(r)) return r;
  }
  if (error?.code === "23505") return "duplicate_name";
  if (error?.code === "23514") return msg.includes("categories_name_len") ? "bad_name" : msg.includes("categories_color") ? "bad_color" : "db_error";
  if (error?.code === "42501") return "unauthenticated";
  return "db_error";
}
