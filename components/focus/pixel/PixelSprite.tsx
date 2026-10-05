import type { CSSProperties } from "react";
import type { Grid, Palette } from "./sprites";

type Rect = { x: number; y: number; w: number; key: string };

// Merge horizontal runs of one colour into a single rect: a 22x13 cat is a few
// dozen rects instead of ~150.
const cache = new WeakMap<Grid, Rect[]>();
function rectsOf(grid: Grid): Rect[] {
  const hit = cache.get(grid);
  if (hit) return hit;
  const out: Rect[] = [];
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const key = row[x];
      if (key === ".") {
        x++;
        continue;
      }
      let w = 1;
      while (x + w < row.length && row[x + w] === key) w++;
      out.push({ x, y, w, key });
      x += w;
    }
  });
  cache.set(grid, out);
  return out;
}

// One or more frames of pixel art as crisp SVG. Several frames animate with
// CSS `steps()` (see .pix-frames in globals.css), so there is no JS timer and
// prefers-reduced-motion simply shows the first frame.
export default function PixelSprite({
  frames,
  palette,
  px,
  fps = 6,
  className = "",
  title,
}: {
  frames: readonly Grid[];
  palette: Palette;
  px: number; // CSS px per sprite pixel
  fps?: number;
  className?: string;
  title?: string;
}) {
  const w = frames[0][0].length;
  const h = frames[0].length;
  const n = frames.length;
  const cycle = `${(n / fps).toFixed(3)}s`;
  return (
    <svg
      width={w * px}
      height={h * px}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      className={`${n > 1 ? "pix-frames" : ""} ${className}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {frames.map((grid, i) => (
        <g
          key={i}
          className={n > 1 ? `pix-frame pix-f${n}` : undefined}
          style={n > 1 ? ({ "--i": i, "--cycle": cycle } as CSSProperties) : undefined}
        >
          {rectsOf(grid).map((r, j) => (
            <rect key={j} x={r.x} y={r.y} width={r.w} height={1} style={{ fill: palette[r.key] }} />
          ))}
        </g>
      ))}
    </svg>
  );
}
