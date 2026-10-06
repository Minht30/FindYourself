import { describe, expect, it } from "vitest";
import { isPermutation, moveDown, moveItem, moveUp, shuffle, validatePlaylistName } from "./playlist";

const ids = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

describe("validatePlaylistName", () => {
  it("accepts 1-60 characters after cleaning", () => {
    expect(validatePlaylistName("  Rainy   day  ")).toEqual({ ok: true, value: "Rainy day" });
    expect(validatePlaylistName("x".repeat(60)).ok).toBe(true);
  });
  it("refuses empty, blank, too long and non-strings by reason", () => {
    for (const bad of ["", "   ", "x".repeat(61), null, undefined, 7, "\u0000​"]) {
      expect(validatePlaylistName(bad)).toEqual({ ok: false, reason: "bad_name" });
    }
  });
});

describe("moveItem", () => {
  it("moves forward and backward", () => {
    expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveItem(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });
  it("moves up and down one place, and stops at the ends", () => {
    expect(moveUp(["a", "b", "c"], 1)).toEqual(["b", "a", "c"]);
    expect(moveDown(["a", "b", "c"], 1)).toEqual(["a", "c", "b"]);
    expect(moveUp(["a", "b", "c"], 0)).toEqual(["a", "b", "c"]);
    expect(moveDown(["a", "b", "c"], 2)).toEqual(["a", "b", "c"]);
  });
  it("ignores bad indices and never mutates the input", () => {
    const input = ["a", "b", "c"];
    for (const [f, t] of [[-1, 0], [0, 3], [1.5, 0], [NaN, 1], [1, 1]] as const) {
      expect(moveItem(input, f, t)).toEqual(["a", "b", "c"]);
    }
    moveItem(input, 0, 2);
    expect(input).toEqual(["a", "b", "c"]);
  });
});

describe("isPermutation", () => {
  it("is true for the same set in another order", () => {
    expect(isPermutation(["a", "b", "c"], ["c", "a", "b"])).toBe(true);
    expect(isPermutation([], [])).toBe(true);
  });
  it("is false for a missing, extra, repeated or foreign id", () => {
    expect(isPermutation(["a", "b"], ["a"])).toBe(false);
    expect(isPermutation(["a", "b"], ["a", "b", "c"])).toBe(false);
    expect(isPermutation(["a", "b"], ["a", "a"])).toBe(false);
    expect(isPermutation(["a", "b"], ["a", "x"])).toBe(false);
    expect(isPermutation(["a", "a"], ["a", "a"])).toBe(false);
  });
});

describe("shuffle", () => {
  it("is a permutation: nothing lost, nothing repeated (many seeds)", () => {
    for (let seed = 0; seed < 200; seed++) {
      const s = shuffle(ids, seed);
      expect(isPermutation(ids, s)).toBe(true);
    }
  });
  it("is stable per seed and differs between seeds", () => {
    expect(shuffle(ids, 42)).toEqual(shuffle(ids, 42));
    const orders = new Set(Array.from({ length: 50 }, (_, s) => shuffle(ids, s).join("")));
    expect(orders.size).toBeGreaterThan(40);
  });
  it("does not touch its input", () => {
    const input = [...ids];
    shuffle(input, 1);
    expect(input).toEqual(ids);
  });
  it("keeps `first` at the front, still a permutation", () => {
    for (let seed = 0; seed < 50; seed++) {
      const s = shuffle(ids, seed, "e");
      expect(s[0]).toBe("e");
      expect(isPermutation(ids, s)).toBe(true);
    }
  });
  it("ignores a `first` that is not in the list", () => {
    expect(isPermutation(ids, shuffle(ids, 3, "zzz"))).toBe(true);
    expect(shuffle(ids, 3, "zzz")).toHaveLength(ids.length);
  });
  it("handles empty and single lists", () => {
    expect(shuffle([], 1)).toEqual([]);
    expect(shuffle(["a"], 1)).toEqual(["a"]);
  });
  it("is spread out: every item reaches every position over many seeds (no fixed point bias)", () => {
    const counts = Array.from({ length: 5 }, () => new Array(5).fill(0));
    const five = ["a", "b", "c", "d", "e"];
    for (let seed = 0; seed < 2000; seed++) shuffle(five, seed).forEach((x, pos) => counts[five.indexOf(x)][pos]++);
    for (const row of counts) for (const c of row) expect(c).toBeGreaterThan(250); // expected 400
  });
});
