import { stepDrop, stepFlake, type Drop, type Flake, type Rng } from "@/lib/scene/wind";

// Draws the falling things on the scene's one canvas: snow at night (a few flakes, bent
// by the wind and streaking sideways in a gust) and rain by the mixer's rain level (by
// day and night). It moves the particles with the pure steps in lib/scene/wind.ts.
export type PrecipInput = {
  flakes: Flake[];
  drops: Drop[];
  snow: number; // how many flakes to show
  rain: number; // how many drops to show
  wind: number;
  gusting: boolean;
  dt: number;
  W: number;
  H: number;
  rng: Rng;
  rainColour: string;
};

export function drawPrecip(ctx: CanvasRenderingContext2D, o: PrecipInput) {
  const { flakes, drops, snow, rain, wind, gusting, dt, W, H, rng } = o;
  ctx.clearRect(0, 0, W, H);
  ctx.lineCap = "round";

  for (let i = 0; i < snow && i < flakes.length; i++) {
    const f = (flakes[i] = stepFlake(flakes[i], wind, dt, W, H, rng));
    const px = f.x * W;
    const py = f.y * H;
    const vx = wind * 22 + Math.sin(f.ph) * f.sw * 0.6;
    ctx.strokeStyle = ctx.fillStyle = `rgba(236,244,255,${f.a})`;
    if (gusting && wind > 1.6) {
      ctx.lineWidth = f.r;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - vx * 0.05, py - f.vy * 0.02);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(px, py, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (rain > 0) {
    ctx.strokeStyle = o.rainColour;
    ctx.lineWidth = 1.2;
    const lean = Math.min(0.5, 0.12 + wind * 0.05); // the wind slants the rain
    for (let i = 0; i < rain && i < drops.length; i++) {
      const d = (drops[i] = stepDrop(drops[i], dt, H));
      const x = d.x * W;
      const y = d.y * H;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - d.len * lean, y + d.len);
      ctx.stroke();
    }
  }
}
