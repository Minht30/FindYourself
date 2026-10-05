import { describe, expect, it } from "vitest";
import { litCells, trackCells } from "./ring";

describe("trackCells", () => {
  it.each([2, 5, 22])("an n=%d outline has 4(n-1) unique cells", (n) => {
    const cells = trackCells(n);
    expect(cells).toHaveLength(4 * (n - 1));
    expect(new Set(cells.map((c) => `${c.col},${c.row}`)).size).toBe(cells.length);
  });

  it("is a closed loop: every cell touches the next, and the last touches the first", () => {
    const cells = trackCells(22);
    cells.forEach((c, i) => {
      const next = cells[(i + 1) % cells.length];
      expect(Math.abs(c.col - next.col) + Math.abs(c.row - next.row), `step ${i}`).toBe(1);
    });
  });

  it("starts top-left and runs clockwise (right along the top first)", () => {
    const cells = trackCells(5);
    expect(cells[0]).toEqual({ col: 0, row: 0 });
    expect(cells[1]).toEqual({ col: 1, row: 0 });
    expect(cells[4]).toEqual({ col: 4, row: 0 }); // top-right corner
    expect(cells[8]).toEqual({ col: 4, row: 4 }); // bottom-right corner
  });

  it("stays on the outline", () => {
    for (const { col, row } of trackCells(22)) {
      expect(col === 0 || col === 21 || row === 0 || row === 21).toBe(true);
    }
  });

  it("rejects a degenerate size", () => {
    expect(() => trackCells(1)).toThrow();
  });
});

describe("litCells", () => {
  it("lights nothing when idle and fully when finished", () => {
    expect(litCells(0, 84, false)).toBe(0);
    expect(litCells(1, 84, true)).toBe(84);
  });

  it("a just-started phase shows one cell", () => {
    expect(litCells(0, 84, true)).toBe(1);
    expect(litCells(0.001, 84, true)).toBe(1);
  });

  it("is proportional and clamps out-of-range progress", () => {
    expect(litCells(0.5, 84, true)).toBe(42);
    expect(litCells(2, 84, true)).toBe(84);
    expect(litCells(-1, 84, false)).toBe(0);
  });

  it("a paused-at-zero phase (idle) never claims a cell", () => {
    expect(litCells(0, 84, false)).toBe(0);
  });
});
