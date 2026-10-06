import { describe, expect, it } from "vitest";
import { isKnownTimeZone } from "@/lib/timezone";

describe("isKnownTimeZone", () => {
  it("accepts real zones", () => {
    for (const z of ["UTC", "Asia/Ho_Chi_Minh", "America/Los_Angeles", "Pacific/Kiritimati", "Europe/London"]) {
      expect(isKnownTimeZone(z)).toBe(true);
    }
  });

  it("refuses everything else", () => {
    for (const z of ["", "Mars/Phobos", "not a zone", "../../etc", " UTC", null, undefined, 5, {}, "A".repeat(65)]) {
      expect(isKnownTimeZone(z)).toBe(false);
    }
  });
});
