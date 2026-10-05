// Geometry of the square pixel track the timer is drawn on. Pure, so it can be
// tested: the track is a loop of square cells; progress lights them up
// clockwise from the top-left corner.

export type Cell = { col: number; row: number };

// Cells of an n x n square's outline, clockwise from the top-left corner.
export function trackCells(n: number): Cell[] {
  if (n < 2) throw new Error("track needs at least 2 cells per side");
  const cells: Cell[] = [];
  for (let c = 0; c < n - 1; c++) cells.push({ col: c, row: 0 }); // top, left to right
  for (let r = 0; r < n - 1; r++) cells.push({ col: n - 1, row: r }); // right, down
  for (let c = n - 1; c > 0; c--) cells.push({ col: c, row: n - 1 }); // bottom, right to left
  for (let r = n - 1; r > 0; r--) cells.push({ col: 0, row: r }); // left, up
  return cells;
}

// How many cells are lit for a progress of 0..1. A started phase always shows
// at least one lit cell so "running" is visible straight away; a finished one
// lights the whole loop.
export function litCells(progress: number, total: number, started: boolean): number {
  const p = Math.min(1, Math.max(0, progress));
  const n = Math.floor(p * total);
  return started ? Math.min(total, Math.max(1, n)) : n;
}
