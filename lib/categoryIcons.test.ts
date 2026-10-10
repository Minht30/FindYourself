import { describe, expect, it } from "vitest";
import { categoryIconKey } from "@/lib/categoryIcons";

describe("categoryIconKey", () => {
  it("gives each seeded category its own picture", () => {
    const keys = ["Deep Work", "Meetings", "Learning", "Rest", "Personal"].map((name) => categoryIconKey({ name }));
    expect(keys).toEqual(["leaf", "people", "book", "moon", "flower"]);
    expect(new Set(keys).size).toBe(5);
  });

  it("ignores case and stray spaces", () => {
    expect(categoryIconKey({ name: "  deep WORK " })).toBe("leaf");
  });

  it("gives a made-up or missing category the plain tag", () => {
    expect(categoryIconKey({ name: "Gardening" })).toBe("tag");
    expect(categoryIconKey(undefined)).toBe("tag");
    expect(categoryIconKey(null)).toBe("tag");
  });
});
