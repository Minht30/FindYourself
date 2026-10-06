import { describe, expect, it } from "vitest";
import {
  dayDiff,
  dayIsoOf,
  dayOfMonth,
  formatWallMinutes,
  formatWeekRangeIso,
  fromZonedInput,
  hourInZone,
  minutesIntoDay,
  toZonedInput,
  wallMinutes,
  wallToInstant,
  weekDayIsos,
  weekMondayFromParam,
  zoneAbbrev,
} from "@/lib/zoned";

const at = (iso: string) => Date.parse(iso);

describe("dayIsoOf and wallMinutes", () => {
  // 2026-10-07 01:00 UTC
  const t = at("2026-10-07T01:00:00Z");

  it("puts one instant on different days and clocks in different zones", () => {
    expect(dayIsoOf(t, "America/Toronto")).toBe("2026-10-06"); // Tue 21:00
    expect(wallMinutes(t, "America/Toronto")).toBe(21 * 60);
    expect(dayIsoOf(t, "Asia/Tokyo")).toBe("2026-10-07"); // Wed 10:00
    expect(wallMinutes(t, "Asia/Tokyo")).toBe(10 * 60);
    expect(dayIsoOf(t, "Pacific/Pago_Pago")).toBe("2026-10-06"); // Tue 14:00
    expect(dayIsoOf(t, "Pacific/Kiritimati")).toBe("2026-10-07"); // Wed 15:00
    expect(wallMinutes(t, "Asia/Kolkata")).toBe(6 * 60 + 30); // half-hour zone: 06:30
  });

  it("reads midnight as 0, not 24", () => {
    expect(wallMinutes(at("2026-10-07T04:00:00Z"), "America/Toronto")).toBe(0);
    expect(dayIsoOf(at("2026-10-07T04:00:00Z"), "America/Toronto")).toBe("2026-10-07");
    expect(wallMinutes(at("2026-10-07T03:59:00Z"), "America/Toronto")).toBe(23 * 60 + 59);
  });
});

describe("dayDiff", () => {
  it("counts whole days, across month, year and leap days", () => {
    expect(dayDiff("2026-10-06", "2026-10-06")).toBe(0);
    expect(dayDiff("2026-10-06", "2026-10-09")).toBe(3);
    expect(dayDiff("2026-10-09", "2026-10-06")).toBe(-3);
    expect(dayDiff("2026-12-31", "2027-01-01")).toBe(1);
    expect(dayDiff("2028-02-28", "2028-03-01")).toBe(2);
  });
});

describe("minutesIntoDay", () => {
  it("is the wall clock on the same day", () => {
    // Tue Oct 6, 21:00 in Toronto
    expect(minutesIntoDay(at("2026-10-07T01:00:00Z"), "2026-10-06", "America/Toronto")).toBe(1260);
  });

  it("runs past 1440 for a block that ends after midnight, and below 0 before the day", () => {
    expect(minutesIntoDay(at("2026-10-07T04:30:00Z"), "2026-10-06", "America/Toronto")).toBe(1440 + 30);
    expect(minutesIntoDay(at("2026-10-06T03:00:00Z"), "2026-10-06", "America/Toronto")).toBe(-1440 + 23 * 60);
  });
});

describe("wallToInstant", () => {
  it("builds the moment for a wall-clock time in the zone", () => {
    expect(wallToInstant("2026-10-06", 9 * 60, "America/Toronto").toISOString()).toBe("2026-10-06T13:00:00.000Z");
    expect(wallToInstant("2026-10-06", 9 * 60, "Asia/Tokyo").toISOString()).toBe("2026-10-06T00:00:00.000Z");
    expect(wallToInstant("2026-10-06", 9 * 60 + 15, "Asia/Kolkata").toISOString()).toBe("2026-10-06T03:45:00.000Z");
  });

  it("handles both clock-change days (New York)", () => {
    // fall back on Sunday 2026-11-01 at 02:00 EDT: midnight is still EDT (UTC-4), 06:00 is EST (UTC-5)
    expect(wallToInstant("2026-11-01", 0, "America/New_York").toISOString()).toBe("2026-11-01T04:00:00.000Z");
    expect(wallToInstant("2026-11-01", 6 * 60, "America/New_York").toISOString()).toBe("2026-11-01T11:00:00.000Z");
    // spring forward on Sunday 2026-03-08 at 02:00 EST: midnight is EST (UTC-5), 06:00 is EDT (UTC-4)
    expect(wallToInstant("2026-03-08", 0, "America/New_York").toISOString()).toBe("2026-03-08T05:00:00.000Z");
    expect(wallToInstant("2026-03-08", 6 * 60, "America/New_York").toISOString()).toBe("2026-03-08T10:00:00.000Z");
  });

  it("reaches neighbouring days with minutes below 0 or above 1440", () => {
    expect(wallToInstant("2026-10-06", 1440 + 30, "UTC").toISOString()).toBe("2026-10-07T00:30:00.000Z");
    expect(wallToInstant("2026-10-06", -30, "UTC").toISOString()).toBe("2026-10-05T23:30:00.000Z");
  });

  it("round-trips: the wall clock of the instant it built is what was asked for", () => {
    const zones = ["UTC", "America/Toronto", "Asia/Tokyo", "Asia/Kolkata", "Pacific/Kiritimati", "Pacific/Pago_Pago", "Europe/London", "Australia/Lord_Howe", "America/St_Johns"];
    let seed = 11;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
    for (let i = 0; i < 600; i++) {
      const zone = zones[i % zones.length];
      const day = new Date(Date.UTC(2026, 0, 1 + Math.floor(rnd() * 365)));
      const iso = day.toISOString().slice(0, 10);
      const minutes = 6 * 60 + Math.floor(rnd() * 17 * 4) * 15; // grid hours, 15-minute steps
      const built = wallToInstant(iso, minutes, zone);
      expect(dayIsoOf(built.getTime(), zone), `${zone} ${iso} ${minutes}`).toBe(iso);
      expect(wallMinutes(built.getTime(), zone), `${zone} ${iso} ${minutes}`).toBe(minutes);
    }
  });
});

describe("weeks", () => {
  it("finds the Monday of the week named by the parameter, else today's week", () => {
    expect(weekMondayFromParam("2026-10-07", "2026-10-20")).toBe("2026-10-05"); // a Wednesday
    expect(weekMondayFromParam("2026-10-05", "2026-10-20")).toBe("2026-10-05"); // already Monday
    expect(weekMondayFromParam("2026-10-11", "2026-10-20")).toBe("2026-10-05"); // Sunday belongs to the week before it
    expect(weekMondayFromParam("2026-01-01", "2026-10-20")).toBe("2025-12-29");
    expect(weekMondayFromParam(undefined, "2026-10-06")).toBe("2026-10-05");
    expect(weekMondayFromParam(null, "2026-10-06")).toBe("2026-10-05");
    for (const bad of ["", "garbage", "2026-02-30", "2026-1-1", "20261006"]) expect(weekMondayFromParam(bad, "2026-10-06")).toBe("2026-10-05");
  });

  it("lists seven consecutive days from the Monday", () => {
    expect(weekDayIsos("2026-10-05")).toEqual(["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11"]);
    expect(weekDayIsos("2026-12-28")[6]).toBe("2027-01-03");
    expect(dayOfMonth("2026-10-06")).toBe(6);
    expect(dayOfMonth("2026-10-31")).toBe(31);
  });

  it("labels a week, naming both months and using the last day's year", () => {
    expect(formatWeekRangeIso("2026-10-05")).toBe("Oct 5 – 11, 2026");
    expect(formatWeekRangeIso("2026-09-28")).toBe("Sep 28 – Oct 4, 2026");
    expect(formatWeekRangeIso("2026-12-28")).toBe("Dec 28 – Jan 3, 2027");
  });
});

describe("zoneAbbrev and formatWallMinutes", () => {
  it("names the zone at that moment", () => {
    expect(zoneAbbrev("America/Toronto", at("2026-10-06T12:00:00Z"))).toBe("EDT");
    expect(zoneAbbrev("America/Toronto", at("2026-01-06T12:00:00Z"))).toBe("EST");
    expect(zoneAbbrev("UTC", at("2026-10-06T12:00:00Z"))).toBe("UTC");
    expect(zoneAbbrev("Asia/Tokyo", at("2026-10-06T12:00:00Z"))).toMatch(/GMT\+9|JST/);
    expect(zoneAbbrev("Mars/Phobos", at("2026-10-06T12:00:00Z"))).toBe("");
  });

  it("formats wall minutes as a 12-hour clock, wrapping around midnight", () => {
    expect(formatWallMinutes(0)).toBe("12:00 AM");
    expect(formatWallMinutes(570)).toBe("9:30 AM");
    expect(formatWallMinutes(720)).toBe("12:00 PM");
    expect(formatWallMinutes(1439)).toBe("11:59 PM");
    expect(formatWallMinutes(1440)).toBe("12:00 AM");
    expect(formatWallMinutes(-30)).toBe("11:30 PM");
  });
});

describe("hourInZone", () => {
  it("is the hour on the wall clock there, 0-23", () => {
    const t = at("2026-10-07T01:00:00Z");
    expect(hourInZone(t, "America/Toronto")).toBe(21);
    expect(hourInZone(t, "Asia/Tokyo")).toBe(10);
    expect(hourInZone(t, "Asia/Kolkata")).toBe(6);
    expect(hourInZone(at("2026-10-07T04:00:00Z"), "America/Toronto")).toBe(0);
  });
});

describe("the deadline input (datetime-local) in the app's zone", () => {
  it("shows a stored moment on that zone's wall clock", () => {
    expect(toZonedInput("2026-10-06T21:00:00Z", "America/Toronto")).toBe("2026-10-06T17:00");
    expect(toZonedInput("2026-10-06T21:00:00Z", "Asia/Tokyo")).toBe("2026-10-07T06:00");
    expect(toZonedInput("2026-10-06T21:00:00Z", "UTC")).toBe("2026-10-06T21:00");
    expect(toZonedInput(null, "UTC")).toBe("");
    expect(toZonedInput("nope", "UTC")).toBe("");
  });

  it("turns what was typed back into the same moment", () => {
    expect(fromZonedInput("2026-10-06T17:00", "America/Toronto")).toBe("2026-10-06T21:00:00.000Z");
    expect(fromZonedInput("2026-10-07T06:00", "Asia/Tokyo")).toBe("2026-10-06T21:00:00.000Z");
  });

  it("round-trips in every zone, and refuses anything that is not a real date and time", () => {
    for (const zone of ["UTC", "America/Toronto", "Asia/Tokyo", "Asia/Kolkata", "Pacific/Kiritimati", "Australia/Lord_Howe", "America/St_Johns"]) {
      for (const iso of ["2026-01-15T13:45:00.000Z", "2026-07-04T02:15:00.000Z", "2026-10-06T21:00:00.000Z", "2026-12-31T23:30:00.000Z"]) {
        expect(fromZonedInput(toZonedInput(iso, zone), zone), `${zone} ${iso}`).toBe(iso);
      }
    }
    for (const bad of ["", "2026-10-06", "2026-10-06 17:00", "2026-02-30T10:00", "2026-10-06T24:00", "2026-10-06T10:60", "x", "2026-1-6T10:00"]) {
      expect(fromZonedInput(bad, "UTC"), bad).toBeNull();
    }
  });
});
