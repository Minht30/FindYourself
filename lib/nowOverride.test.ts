import { describe, expect, it } from "vitest";
import { parseNowOverride } from "@/lib/nowOverride";

describe("parseNowOverride", () => {
  const iso = "2026-10-11T23:30:00Z";

  it("is always off in a production build", () => {
    expect(parseNowOverride(iso, "production")).toBeNull();
    expect(parseNowOverride(encodeURIComponent(iso), "production")).toBeNull();
  });

  it("reads a strict ISO instant outside production", () => {
    expect(parseNowOverride(iso, "development")?.toISOString()).toBe("2026-10-11T23:30:00.000Z");
    expect(parseNowOverride(iso, undefined)?.toISOString()).toBe("2026-10-11T23:30:00.000Z");
    expect(parseNowOverride(encodeURIComponent("2026-10-11T19:30:00-04:00"), "development")?.toISOString()).toBe("2026-10-11T23:30:00.000Z");
    expect(parseNowOverride("2026-10-11T23:30Z", "development")).not.toBeNull();
    expect(parseNowOverride("2026-10-11T23:30:15.250Z", "test")?.getUTCMilliseconds()).toBe(250);
  });

  it("refuses anything that is not a full instant with a zone", () => {
    for (const bad of [undefined, "", "tomorrow", "2026-10-11", "2026-10-11T23:30:00", "2026-13-11T23:30:00Z", "2026-10-32T23:30:00Z", "1700000000000", "2026-10-11 23:30:00Z", "%E0%A4%A"]) {
      expect(parseNowOverride(bad, "development")).toBeNull();
    }
  });
});
