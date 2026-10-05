// A tiny seedable random source. The synths take one so tests (and the offline
// renders that prove each layer makes sound) are deterministic; the live app
// just passes Math.random.

export type Rng = () => number;

// mulberry32: small, fast, good enough for "which droplet comes next".
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const between = (rng: Rng, lo: number, hi: number) => lo + (hi - lo) * rng();

export function pick<T>(rng: Rng, list: readonly T[]): T {
  return list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
}

// Exponentially distributed gap with the given mean: a Poisson process, which
// is what random droplets and crackles actually look like.
export function expGap(rng: Rng, mean: number): number {
  return -Math.log(1 - Math.min(rng(), 0.999999)) * mean;
}
