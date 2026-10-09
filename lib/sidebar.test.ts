import { describe, expect, it } from "vitest";
import { SIDEBAR_COOKIE, parseSidebarCollapsed, sidebarCookie } from "@/lib/sidebar";

describe("sidebar cookie", () => {
  it("folds only on the exact value it writes", () => {
    expect(parseSidebarCollapsed("min")).toBe(true);
  });

  it("stays open for a missing, empty or unknown value", () => {
    for (const v of [undefined, null, "", "full", "MIN", "1", "true", "min "]) {
      expect(parseSidebarCollapsed(v)).toBe(false);
    }
  });

  it("round-trips what it writes", () => {
    for (const collapsed of [true, false]) {
      const value = sidebarCookie(collapsed).split(";")[0].split("=")[1];
      expect(parseSidebarCollapsed(value)).toBe(collapsed);
    }
  });

  it("is a site-wide, one-year, same-site cookie", () => {
    const c = sidebarCookie(true);
    expect(c.startsWith(`${SIDEBAR_COOKIE}=`)).toBe(true);
    expect(c).toContain("path=/");
    expect(c).toContain("max-age=31536000");
    expect(c).toContain("samesite=lax");
  });
});
