// The clock's own pixel digits: a 5x7 grid per glyph, drawn by hand so the
// shapes that confuse each other in most pixel fonts (0, 6, 8, and 3 / 5) are
// obviously different. 0 has a slash through it; 6 and 9 have open tails; 8 is
// the only one with a closed waist. A test checks every pair of digits differs
// in enough pixels to be told apart at a glance.

export const GLYPH_H = 7;

export const GLYPHS: Record<string, readonly string[]> = {
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
  ":": ["...", ".#.", ".#.", "...", ".#.", ".#.", "..."],
};

export const GLYPH_GAP = 1;

// Width of `text` in glyph pixels, including the gaps.
export function textWidth(text: string): number {
  let w = 0;
  for (const [i, ch] of [...text].entries()) {
    const g = GLYPHS[ch];
    if (!g) continue;
    w += g[0].length + (i > 0 ? GLYPH_GAP : 0);
  }
  return w;
}
