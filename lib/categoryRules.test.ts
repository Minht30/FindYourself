import { describe, expect, it } from "vitest";
import {
  CATEGORY_MESSAGES,
  MAX_CATEGORIES,
  MAX_NAME,
  PALETTE,
  isUuid,
  normalizeColor,
  reasonFromDb,
  sameName,
  validateCategoryColor,
  validateCategoryName,
} from "@/lib/categoryRules";
import { categoryColor } from "@/lib/categories";
import { moveDown, moveUp } from "@/lib/music/playlist";

describe("validateCategoryName", () => {
  // built with fromCharCode so no raw separator character sits in the source
  const LS = String.fromCharCode(0x2028);
  const NUL = String.fromCharCode(0);
  const BEL = String.fromCharCode(7);
  const DEL = String.fromCharCode(0x7f);
  const NEWLINE = String.fromCharCode(10);
  const TAB = String.fromCharCode(9);

  it("trims and collapses whitespace", () => {
    expect(validateCategoryName("  Deep   Work  ")).toEqual({ ok: true, value: "Deep Work" });
    expect(validateCategoryName("Café ☕")).toEqual({ ok: true, value: "Café ☕" });
    // line and paragraph separators, newlines and tabs inside a name become one plain space
    expect(validateCategoryName("a" + LS + "b" + NEWLINE + "c" + TAB + "d")).toEqual({ ok: true, value: "a b c d" });
  });

  it("refuses empty, blank, control characters and non-strings by reason", () => {
    for (const bad of ["", "   ", NEWLINE + TAB, "a" + NUL + "b", "a" + BEL + "b", "a" + DEL + "b", null, undefined, 5, {}]) {
      expect(validateCategoryName(bad)).toEqual({ ok: false, reason: "bad_name" });
    }
  });

  it("allows exactly 40 characters (counting emoji as one) and refuses 41", () => {
    const smile = String.fromCodePoint(0x1f600);
    expect(validateCategoryName("x".repeat(MAX_NAME))).toMatchObject({ ok: true });
    expect(validateCategoryName("x".repeat(MAX_NAME + 1))).toEqual({ ok: false, reason: "name_too_long" });
    expect(validateCategoryName(smile.repeat(MAX_NAME))).toMatchObject({ ok: true });
    expect(validateCategoryName(smile.repeat(MAX_NAME + 1))).toEqual({ ok: false, reason: "name_too_long" });
  });

  it("treats markup as plain text (it is rendered as text, never as HTML)", () => {
    expect(validateCategoryName("<b>x</b>")).toEqual({ ok: true, value: "<b>x</b>" });
  });
});

describe("colours", () => {
  it("accepts #RRGGBB in either case and nothing else", () => {
    for (const ok of ["#C69B7B", "#c69b7b", "#000000", "#FFFFFF"]) expect(validateCategoryColor(ok)).toBe(true);
    for (const bad of ["C69B7B", "#C69B7", "#C69B7BA", "red", "rgb(0,0,0)", "#GGGGGG", "", null, undefined, 5]) {
      expect(validateCategoryColor(bad)).toBe(false);
    }
    expect(normalizeColor("#c69b7b")).toBe("#C69B7B");
  });

  it("offers only valid, distinct swatches", () => {
    expect(new Set(PALETTE).size).toBe(PALETTE.length);
    for (const c of PALETTE) expect(validateCategoryColor(c)).toBe(true);
  });
});

describe("names clash like the database's index", () => {
  it("ignores case and surrounding space", () => {
    expect(sameName("Deep Work", "  deep work ")).toBe(true);
    expect(sameName("Deep Work", "Deep Works")).toBe(false);
  });
});

describe("reasonFromDb", () => {
  it("maps the database's named refusals", () => {
    expect(reasonFromDb({ message: "category_limit" })).toBe("category_limit");
    expect(reasonFromDb({ message: "last_category" })).toBe("last_category");
    expect(reasonFromDb({ message: "bad_target" })).toBe("bad_target");
    expect(reasonFromDb({ message: "bad_order" })).toBe("bad_order");
    expect(reasonFromDb({ message: "not_found" })).toBe("not_found");
  });

  it("maps constraint codes", () => {
    expect(reasonFromDb({ code: "23505", message: 'duplicate key value violates unique constraint "categories_user_name_unique"' })).toBe("duplicate_name");
    expect(reasonFromDb({ code: "23514", message: 'violates check constraint "categories_name_len"' })).toBe("bad_name");
    expect(reasonFromDb({ code: "23514", message: 'violates check constraint "categories_color_hex"' })).toBe("bad_color");
    expect(reasonFromDb({ code: "42501", message: "permission denied" })).toBe("unauthenticated");
    expect(reasonFromDb({ code: "XX000", message: "boom" })).toBe("db_error");
    expect(reasonFromDb(null)).toBe("db_error");
  });

  it("has a message for every reason, and the cap is stated right", () => {
    for (const r of Object.keys(CATEGORY_MESSAGES) as (keyof typeof CATEGORY_MESSAGES)[]) expect(CATEGORY_MESSAGES[r].length).toBeGreaterThan(5);
    expect(CATEGORY_MESSAGES.category_limit).toContain(String(MAX_CATEGORIES));
  });
});

describe("isUuid", () => {
  it("accepts uuids only", () => {
    expect(isUuid("14cc53ea-a95f-40dd-86d3-ebbb184756b4")).toBe(true);
    for (const bad of ["", "nope", "14cc53ea-a95f-40dd-86d3", null, undefined, 5, "14cc53ea-a95f-40dd-86d3-ebbb184756b4x"]) expect(isUuid(bad)).toBe(false);
  });
});

describe("categoryColor", () => {
  it("follows the theme token while a default category keeps its default colour", () => {
    expect(categoryColor({ name: "Deep Work", color: "#C69B7B" })).toBe("var(--cat-deep)");
    expect(categoryColor({ name: "Rest", color: "#9caf88" })).toBe("var(--cat-rest)");
  });

  it("uses the chosen colour once a default category is recoloured or renamed", () => {
    expect(categoryColor({ name: "Deep Work", color: "#010203" })).toBe("#010203");
    expect(categoryColor({ name: "Focus work", color: "#C69B7B" })).toBe("#C69B7B");
  });

  it("uses the stored colour for a new category, and a fallback for none", () => {
    expect(categoryColor({ name: "Gym", color: "#6FA8A0" })).toBe("#6FA8A0");
    expect(categoryColor(null)).toBe("var(--cat-deep)");
    expect(categoryColor(undefined)).toBe("var(--cat-deep)");
  });
});

describe("reordering uses the same list helpers as playlists", () => {
  it("moves one step and stops at the ends", () => {
    expect(moveUp(["a", "b", "c"], 1)).toEqual(["b", "a", "c"]);
    expect(moveDown(["a", "b", "c"], 1)).toEqual(["a", "c", "b"]);
    expect(moveUp(["a", "b", "c"], 0)).toEqual(["a", "b", "c"]);
    expect(moveDown(["a", "b", "c"], 2)).toEqual(["a", "b", "c"]);
  });
});
