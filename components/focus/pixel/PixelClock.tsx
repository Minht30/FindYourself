import { GLYPHS, GLYPH_GAP, GLYPH_H, textWidth } from "./digits";

// "05:00" drawn from the hand-made digit grids as crisp SVG rects. `unit` is the
// CSS size of one glyph pixel: "2px" in the header chip, a container-relative
// length ("1.9cqw") inside the ring, so the clock scales with the ring.
export default function PixelClock({
  text,
  unit,
  className = "",
}: {
  text: string;
  unit: string;
  className?: string;
}) {
  const w = textWidth(text);
  let x = 0;
  const rects: { x: number; y: number }[] = [];
  [...text].forEach((ch, i) => {
    const g = GLYPHS[ch];
    if (!g) return;
    if (i > 0) x += GLYPH_GAP;
    g.forEach((row, y) => {
      [...row].forEach((c, dx) => {
        if (c === "#") rects.push({ x: x + dx, y });
      });
    });
    x += g[0].length;
  });

  return (
    <svg
      viewBox={`0 0 ${w} ${GLYPH_H}`}
      shapeRendering="crispEdges"
      aria-hidden
      focusable="false"
      className={className}
      style={{ width: `calc(${w} * ${unit})`, height: `calc(${GLYPH_H} * ${unit})`, display: "block" }}
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={1} height={1} fill="currentColor" />
      ))}
    </svg>
  );
}
