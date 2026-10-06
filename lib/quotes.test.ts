import { describe, expect, it } from "vitest";
import { dayNumber, quoteForDate, quoteIndexForDay, strideFor, toQuote, type Quote } from "@/lib/quotes";
import { shiftISODate } from "@/lib/dates";

const make = (n: number): Quote[] => Array.from({ length: n }, (_, i) => ({ id: i + 1, text: `q${i + 1}`, author: null }));

describe("dayNumber", () => {
  it("counts whole days from 1970-01-01", () => {
    expect(dayNumber("1970-01-01")).toBe(0);
    expect(dayNumber("1970-01-02")).toBe(1);
    expect(dayNumber("2026-10-06")).toBe(20_732);
    expect(dayNumber("1969-12-31")).toBe(-1);
  });

  it("steps by exactly one across month, year and leap-day boundaries", () => {
    for (const d of ["2026-02-28", "2028-02-28", "2026-12-31", "2026-03-28", "2026-10-31"]) {
      expect(dayNumber(shiftISODate(d, 1)) - dayNumber(d)).toBe(1);
    }
  });
});

describe("strideFor", () => {
  it("is always coprime with the list length", () => {
    const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
    for (let n = 2; n <= 400; n++) expect(gcd(strideFor(n), n)).toBe(1);
  });

  it("spreads neighbouring days apart (about 38 % of the list)", () => {
    expect(strideFor(120)).toBe(47); // round(45.84) = 46 shares a factor with 120, 47 does not
    expect(strideFor(10)).toBe(7); // 4 and 6 share a factor with 10, 5 too, 7 does not
    expect(strideFor(1)).toBe(1);
  });
});

describe("quoteForDate", () => {
  const quotes = make(120);

  it("gives the same quote for the same date, every time", () => {
    const a = quoteForDate("2026-10-06", quotes);
    expect(a).not.toBeNull();
    for (let i = 0; i < 5; i++) expect(quoteForDate("2026-10-06", quotes)).toEqual(a);
  });

  it("does not depend on the order the rows arrive in", () => {
    const shuffled = [...quotes].reverse();
    for (const d of ["2026-10-06", "2026-10-07", "2027-01-01", "2024-02-29"]) {
      expect(quoteForDate(d, shuffled)).toEqual(quoteForDate(d, quotes));
    }
  });

  it("pins a known value (a changed rule would silently reshuffle every day)", () => {
    // day 20732 * stride 47 = 974404; mod 120 = 4 -> the 5th quote
    expect(quoteForDate("2026-10-06", quotes)?.id).toBe(5);
  });

  it("shows a different quote on consecutive days", () => {
    let day = "2026-01-01";
    for (let i = 0; i < 800; i++) {
      const next = shiftISODate(day, 1);
      expect(quoteForDate(next, quotes)?.id).not.toBe(quoteForDate(day, quotes)?.id);
      day = next;
    }
  });

  it("shows every quote exactly once in any run of n consecutive days", () => {
    for (const start of ["2026-01-01", "2026-10-06", "2027-12-20", "2024-02-20"]) {
      const seen = new Set<number>();
      let day = start;
      for (let i = 0; i < quotes.length; i++) {
        seen.add(quoteForDate(day, quotes)!.id);
        day = shiftISODate(day, 1);
      }
      expect(seen.size).toBe(quotes.length);
    }
  });

  it("repeats a quote only after a full lap, and keeps the same lap order", () => {
    expect(quoteForDate("2026-10-06", quotes)).toEqual(quoteForDate(shiftISODate("2026-10-06", 120), quotes));
    expect(quoteForDate("2026-10-06", quotes)).toEqual(quoteForDate(shiftISODate("2026-10-06", 240), quotes));
  });

  it("works for every list length from 1 to 200 and for dates before 1970", () => {
    for (let n = 1; n <= 200; n++) {
      const list = make(n);
      for (const d of ["2026-10-06", "1969-12-31", "1960-03-01"]) {
        const q = quoteForDate(d, list);
        expect(q && q.id >= 1 && q.id <= n).toBe(true);
      }
    }
  });

  it("returns null for an empty list or a malformed date", () => {
    expect(quoteForDate("2026-10-06", [])).toBeNull();
    for (const bad of ["", "2026-13-01", "2026-02-30", "yesterday", "2026-1-1"]) {
      expect(quoteForDate(bad, quotes)).toBeNull();
    }
  });

  it("always answers with the only quote when there is one", () => {
    expect(quoteForDate("2026-10-06", make(1))?.id).toBe(1);
  });

  it("indexes safely", () => {
    expect(quoteIndexForDay(5, 0)).toBe(-1);
    expect(quoteIndexForDay(-7, 10)).toBeGreaterThanOrEqual(0);
  });
});

describe("toQuote", () => {
  it("reads a row and trims", () => {
    expect(toQuote({ id: 3, text: "  Begin.  ", author: null })).toEqual({ id: 3, text: "Begin.", author: null });
    expect(toQuote({ id: 3, text: "Begin.", author: " Someone " })).toEqual({ id: 3, text: "Begin.", author: "Someone" });
  });

  it("drops malformed rows", () => {
    expect(toQuote(null)).toBeNull();
    expect(toQuote({ id: "3", text: "x" })).toBeNull();
    expect(toQuote({ id: 1.5, text: "x" })).toBeNull();
    expect(toQuote({ id: 3, text: "   " })).toBeNull();
    expect(toQuote({ id: 3, text: 5 })).toBeNull();
  });

  it("treats a blank author as none, and markup as plain text", () => {
    expect(toQuote({ id: 1, text: "x", author: "  " })?.author).toBeNull();
    expect(toQuote({ id: 1, text: "<b>x</b>", author: null })?.text).toBe("<b>x</b>");
  });
});
