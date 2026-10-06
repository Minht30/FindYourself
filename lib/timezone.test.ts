import { describe, expect, it } from "vitest";
import { effectiveZone, groupZones, isKnownTimeZone, parseZoneSetting, zoneFromCookie, zoneLabel } from "@/lib/timezone";

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

describe("parseZoneSetting", () => {
  it("accepts automatic with the browser's zone, and manual with a chosen zone", () => {
    expect(parseZoneSetting({ mode: "auto", browserZone: "America/Toronto" })).toEqual({ ok: true, setting: { mode: "auto", zone: "America/Toronto" } });
    expect(parseZoneSetting({ mode: "manual", zone: "Asia/Tokyo" })).toEqual({ ok: true, setting: { mode: "manual", zone: "Asia/Tokyo" } });
  });

  it("names why it refuses", () => {
    expect(parseZoneSetting({ mode: "manual", zone: "Mars/Phobos" })).toEqual({ ok: false, reason: "bad_timezone" });
    expect(parseZoneSetting({ mode: "manual" })).toEqual({ ok: false, reason: "bad_timezone" });
    expect(parseZoneSetting({ mode: "auto", browserZone: "" })).toEqual({ ok: false, reason: "bad_timezone" });
    expect(parseZoneSetting({ mode: "auto" })).toEqual({ ok: false, reason: "bad_timezone" });
    for (const bad of [null, undefined, 5, "manual", {}, { mode: "other", zone: "UTC" }, { mode: 1 }, []]) {
      expect(parseZoneSetting(bad)).toEqual({ ok: false, reason: "bad_mode" });
    }
  });

  it("ignores any extra fields a caller sends", () => {
    const r = parseZoneSetting({ mode: "manual", zone: "Asia/Tokyo", timezone_manual: false, id: "x" });
    expect(r).toEqual({ ok: true, setting: { mode: "manual", zone: "Asia/Tokyo" } });
  });
});

describe("zoneFromCookie and effectiveZone", () => {
  it("reads a possibly percent-encoded zone, or nothing", () => {
    expect(zoneFromCookie("Asia%2FTokyo")).toBe("Asia/Tokyo");
    expect(zoneFromCookie("Asia/Tokyo")).toBe("Asia/Tokyo");
    for (const bad of ["", "Mars%2FPhobos", "%E0%A4%A", null, undefined]) expect(zoneFromCookie(bad as string | null | undefined)).toBeNull();
  });

  it("lets a valid chosen zone win over the browser's, and falls back otherwise", () => {
    expect(effectiveZone("Asia%2FTokyo", "America/Toronto")).toBe("Asia/Tokyo");
    expect(effectiveZone(undefined, "America/Toronto")).toBe("America/Toronto");
    expect(effectiveZone("Mars%2FPhobos", "America/Toronto")).toBe("America/Toronto");
    expect(effectiveZone(undefined, "Nope")).toBe("UTC");
    expect(effectiveZone(null, undefined)).toBe("UTC");
  });
});

describe("zone list", () => {
  it("labels a zone by its city", () => {
    expect(zoneLabel("Asia/Ho_Chi_Minh")).toBe("Ho Chi Minh");
    expect(zoneLabel("America/Argentina/Buenos_Aires")).toBe("Argentina / Buenos Aires");
    expect(zoneLabel("UTC")).toBe("UTC");
  });

  it("groups by region with Other last, sorted, with no duplicates", () => {
    const groups = groupZones(["Europe/London", "Asia/Tokyo", "Asia/Ho_Chi_Minh", "UTC", "Etc/GMT+5", "America/New_York", "Asia/Tokyo"]);
    expect(groups.map((g) => g.region)).toEqual(["America", "Asia", "Europe", "Other"]);
    expect(groups[1].zones.map((z) => z.value)).toEqual(["Asia/Ho_Chi_Minh", "Asia/Tokyo"]);
    expect(groups[3].zones.map((z) => z.value).sort()).toEqual(["Etc/GMT+5", "UTC"]);
  });

  it("covers every zone the browser lists, each exactly once, and every one is known", () => {
    const all = Intl.supportedValuesOf("timeZone");
    const groups = groupZones(all);
    const flat = groups.flatMap((g) => g.zones.map((z) => z.value));
    expect(new Set(flat).size).toBe(flat.length);
    expect(flat.length).toBe(new Set(all).size);
    for (const z of flat) expect(isKnownTimeZone(z)).toBe(true);
    expect(flat).toContain("Asia/Tokyo");
  });
});
