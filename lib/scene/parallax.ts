// Pointer parallax: the pointer's place over the scene becomes two numbers in
// [-1, 1], and each layer shifts by its own depth, so the near layers move more
// than the far ones. Pure, so the maths is tested; the component only writes
// the two numbers into CSS variables (no React re-render per pointer move).

export type Unit = { x: number; y: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function pointerToUnit(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): Unit {
  if (!(rect.width > 0) || !(rect.height > 0)) return { x: 0, y: 0 };
  const x = ((clientX - rect.left) / rect.width) * 2 - 1;
  const y = ((clientY - rect.top) / rect.height) * 2 - 1;
  return { x: clamp(Number.isFinite(x) ? x : 0, -1, 1), y: clamp(Number.isFinite(y) ? y : 0, -1, 1) };
}

// Pixels to shift a layer. Moving the pointer right moves the scene the other
// way (like looking through a window), so the sign is negative.
export function layerOffset(unit: Unit, depth: number, maxX = 18, maxY = 10): Unit {
  const d = clamp(depth, 0, 1);
  const out = { x: -unit.x * d * maxX, y: -unit.y * d * maxY };
  // avoid "-0" showing up in CSS
  return { x: out.x === 0 ? 0 : out.x, y: out.y === 0 ? 0 : out.y };
}
