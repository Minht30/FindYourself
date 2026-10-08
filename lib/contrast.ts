// WCAG 2.1 contrast, for checking the theme's colours (see contrast.test.ts).

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function luminance(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// A colour laid over another at `alpha` (0..1), as a hex string: what a see-through
// panel looks like once it is on top of a picture.
export function blend(fg: string, bg: string, alpha: number): string {
  const f = parseInt(fg.replace("#", ""), 16);
  const b = parseInt(bg.replace("#", ""), 16);
  const mix = (shift: number) => Math.round(alpha * ((f >> shift) & 255) + (1 - alpha) * ((b >> shift) & 255));
  return "#" + [16, 8, 0].map((sh) => mix(sh).toString(16).padStart(2, "0")).join("").toUpperCase();
}
