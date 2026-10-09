// The "stage" is the painting's own coordinate space, scaled and cropped like
// `background-size: cover`, so everything attached to the painting (the moon, the
// beacon, the shore lights, the aurora) stays on the same painted spot on every
// screen shape. Pure, so the fit is tested; the component writes one transform.

export type Picture = { w: number; h: number };

export type StageFit = { scale: number; x: number; y: number };

export type FitOptions = {
  // a little extra zoom so the edge never shows while the parallax layers move
  zoom: number;
  // where the leftover space goes: 0 pins the picture to the left / top, 1 to the right / bottom
  pinX: number;
  pinY: number;
  // push the picture up to this many px further right (never more than half the crop)
  nudgeX?: number;
};

export function fitStage(viewW: number, viewH: number, pic: Picture, o: FitOptions): StageFit {
  const W = Math.max(1, viewW);
  const H = Math.max(1, viewH);
  const scale = Math.max(W / pic.w, H / pic.h) * o.zoom;
  const w = pic.w * scale;
  const h = pic.h * scale;
  const nudge = o.nudgeX ? Math.min(o.nudgeX, Math.max(0, (w - W) / 2)) : 0;
  return { scale, x: (W - w) * o.pinX + nudge, y: (H - h) * o.pinY };
}

export const stageTransform = (f: StageFit): string => `translate(${f.x.toFixed(1)}px, ${f.y.toFixed(1)}px) scale(${f.scale.toFixed(4)})`;

// Nod-Krai on a window much wider than 16:9: filling the width zooms the painting so far that
// centring it cuts the moon off the top (from about 2.2 : 1) and, by 2.8 : 1, shows only 62 % of
// it. So the wider the window, the further up the picture is pinned; the numbers are chosen so
// the moon always lands about 45 painting-px below the top edge of what is shown. [window width /
// height at least, pin 0..1]; the same steps are in app/globals.css as `--night-y`
// (lib/scene/stage.test.ts keeps the two in agreement).
export const NIGHT_FRAMING: ReadonlyArray<readonly [number, number]> = [
  [3.4, 0.1],
  [3.0, 0.12],
  [2.8, 0.13],
  [2.6, 0.15],
  [2.4, 0.18],
  [2.2, 0.24],
  [2.0, 0.39],
];

export function nightPinY(viewW: number, viewH: number): number {
  const ratio = Math.max(1, viewW) / Math.max(1, viewH);
  for (const [min, pin] of NIGHT_FRAMING) if (ratio >= min) return pin;
  return 0.5;
}

// The two paintings and how each is pinned (from the live drafts in docs/prototypes).
export const STAGES = {
  // Monstadt: pinned to the right and 40 % down, so the castle and the bridge stay in view
  monstadt: { pic: { w: 1623, h: 640 }, options: (): FitOptions => ({ zoom: 1.015, pinX: 1, pinY: 0.4, nudgeX: 12 }) },
  // Nod-Krai: a little right of centre (further right on a portrait screen), so the tower and the moon stay in view
  "nodkrai-night": {
    pic: { w: 1673, h: 940 },
    options: (viewW: number, viewH: number): FitOptions => ({ zoom: 1.02, pinX: viewW / viewH < 0.9 ? 0.9 : 0.62, pinY: nightPinY(viewW, viewH) }),
  },
} as const;

export function stageFor(theme: keyof typeof STAGES, viewW: number, viewH: number): StageFit {
  const s = STAGES[theme];
  return fitStage(viewW, viewH, s.pic, s.options(viewW, viewH));
}
