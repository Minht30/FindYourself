// Pixel art as data. Every sprite is a grid of palette keys; nothing is an
// image file. Colours are CSS variables (--pix-*), so the same cat is a warm
// ginger in Sunny Cafe and gets a neon rim in Netcafe After Dark.
//
//   o outline   f fur   s fur shade   b fur light (belly, muzzle)
//   p nose pink e eye   w eye shine   . transparent
//   cup:  c china   i inside of an empty cup   k coffee   m foam   h highlight

export type Grid = readonly string[];
export type Palette = Record<string, string>;

export const CAT_PALETTE: Palette = {
  o: "var(--pix-outline)",
  f: "var(--pix-fur)",
  s: "var(--pix-fur-shade)",
  b: "var(--pix-fur-light)",
  p: "var(--pix-pink)",
  e: "var(--pix-eye)",
  w: "var(--pix-white)",
};

export const CUP_PALETTE: Palette = {
  o: "var(--pix-outline)",
  c: "var(--pix-china)",
  h: "var(--pix-white)",
  i: "var(--pix-china-inside)",
  k: "var(--pix-coffee)",
  m: "var(--pix-foam)",
};

// ── parts ───────────────────────────────────────────────────────────────────

const HEAD: Grid = [
  ".o.....o.",
  "ofo...ofo",
  "offfsfffo",
  "ofwfffwfo",
  "ofefffefo",
  "ofbbpbbfo",
  ".ooooooo.",
];

// Same footprint as HEAD so a blink or a sleep is a straight swap.
const HEAD_CLOSED: Grid = [
  ".o.....o.",
  "ofo...ofo",
  "offfsfffo",
  "offfffffo",
  "ofeefeefo",
  "ofbbpbbfo",
  ".ooooooo.",
];

const TORSO: Grid = [
  "..oooooooo..",
  ".offsffsffo.",
  "offsffsffffo",
  "ofbbbbbbbbfo",
  ".oooooooooo.",
];

const TAIL_A: Grid = [".oo..", "ofo..", "ofo..", ".ofo.", "..ofo", "...oo"];
const TAIL_B: Grid = ["oo...", "ofo..", ".ofo.", ".ofo.", "..ofo", "...oo"];

const LEG_STAND: Grid = [".ofo.", ".ofo.", ".ooo."];
const LEG_TUCK: Grid = [".ofo.", ".ooo.", "....."];
const LEG_BACK: Grid = [".ofo.", "ofo..", "ooo.."];
const LEG_FWD: Grid = [".ofo.", "..ofo", "..ooo"];

const LOAF: Grid = [
  "...oooooooooo..",
  ".ooffsffsffffoo",
  "offsffsfffffffo",
  "ofbbbbbbbbbbbfo",
  ".ooooooooooooo.",
];
const LOAF_TAIL: Grid = [".oo.", "offo", ".oo."];

// ── composer ────────────────────────────────────────────────────────────────

type Part = { grid: Grid; x: number; y: number; far?: boolean };

// Layers parts onto a transparent canvas, later parts on top. `far` parts are
// the legs on the far side of the body: same shape, shaded so they sit back.
export function compose(width: number, height: number, parts: Part[]): string[] {
  const canvas: string[][] = Array.from({ length: height }, () => Array<string>(width).fill("."));
  for (const { grid, x, y, far } of parts) {
    grid.forEach((row, dy) => {
      [...row].forEach((ch, dx) => {
        if (ch === ".") return;
        const cx = x + dx;
        const cy = y + dy;
        if (cy < 0 || cy >= height || cx < 0 || cx >= width) return;
        canvas[cy][cx] = far && (ch === "f" || ch === "b") ? "s" : ch;
      });
    });
  }
  return canvas.map((r) => r.join(""));
}

export const CAT_W = 22;
export const CAT_H = 13;

type Pose = {
  rear: [Grid, number]; // near rear leg + x
  front: [Grid, number];
  rearFar: [Grid, number];
  frontFar: [Grid, number];
  lift: number; // body raised by this many rows (airborne)
  head?: Grid;
  tail?: Grid;
};

function standingCat(p: Pose): string[] {
  const dy = -p.lift;
  return compose(CAT_W, CAT_H, [
    { grid: p.rearFar[0], x: p.rearFar[1], y: 10, far: true },
    { grid: p.frontFar[0], x: p.frontFar[1], y: 10, far: true },
    { grid: p.tail ?? TAIL_A, x: 0, y: 2 + dy },
    { grid: TORSO, x: 3, y: 5 + dy },
    { grid: p.head ?? HEAD, x: 12, y: 2 + dy },
    { grid: p.rear[0], x: p.rear[1], y: 10 },
    { grid: p.front[0], x: p.front[1], y: 10 },
  ]);
}

const STAND: Omit<Pose, "tail" | "head"> = {
  rear: [LEG_STAND, 4],
  front: [LEG_STAND, 11],
  rearFar: [LEG_STAND, 6],
  frontFar: [LEG_STAND, 9],
  lift: 0,
};

// Four-frame gallop: stretch, land, gather (airborne), land.
export const CAT_RUN: readonly string[][] = [
  standingCat({ rear: [LEG_BACK, 1], front: [LEG_FWD, 11], rearFar: [LEG_BACK, 3], frontFar: [LEG_FWD, 9], lift: 0 }),
  standingCat({ ...STAND, tail: TAIL_B }),
  standingCat({ rear: [LEG_TUCK, 5], front: [LEG_TUCK, 10], rearFar: [LEG_TUCK, 7], frontFar: [LEG_TUCK, 8], lift: 1 }),
  standingCat({ ...STAND, tail: TAIL_B }),
];

// Sitting-still frames for "paused" and "not started": a tail flick and a blink.
export const CAT_IDLE: readonly string[][] = [
  standingCat({ ...STAND, tail: TAIL_A }),
  standingCat({ ...STAND, tail: TAIL_A }),
  standingCat({ ...STAND, tail: TAIL_B }),
  standingCat({ ...STAND, tail: TAIL_A, head: HEAD_CLOSED }),
];

// Little hop with happy closed eyes, for the moment a session completes.
export const CAT_CHEER: readonly string[][] = [
  standingCat({ ...STAND, lift: 2, head: HEAD_CLOSED, tail: TAIL_B }),
  standingCat({ ...STAND, lift: 0, head: HEAD_CLOSED, tail: TAIL_A }),
];

export const SLEEP_W = 20;
export const SLEEP_H = 9;

// Curled up for the break: a loaf with the head resting on its paws.
export const CAT_SLEEP: readonly string[][] = [
  compose(SLEEP_W, SLEEP_H, [
    { grid: LOAF_TAIL, x: 0, y: 4 },
    { grid: LOAF, x: 3, y: 4 },
    { grid: HEAD_CLOSED, x: 11, y: 2 },
  ]),
  // second breath: head one row lower
  compose(SLEEP_W, SLEEP_H, [
    { grid: LOAF_TAIL, x: 0, y: 4 },
    { grid: LOAF, x: 3, y: 4 },
    { grid: HEAD_CLOSED, x: 11, y: 3 },
  ]),
];

export const HEAD_ONLY = HEAD;
export const HEAD_ONLY_CLOSED = HEAD_CLOSED;
export const HEAD_W = 9;
export const HEAD_H = 7;

// ── the tally cup ───────────────────────────────────────────────────────────

const CUP_EMPTY: Grid = [
  ".ooooooo...",
  "oiiiiiiioo.",
  "occcccccoco",
  "occcccccoco",
  "occcccccoo.",
  ".occccco...",
  "..ooooo....",
];

const CUP_FULL: Grid = [
  ".ooooooo...",
  "okkkkkkkoo.",
  "ocmmmmmcoco",
  "occchcccoco",
  "occcccccoo.",
  ".occccco...",
  "..ooooo....",
];

export const CUP_W = 11;
export const CUP_H = 7;
export const CUP = { empty: CUP_EMPTY, full: CUP_FULL } as const;
