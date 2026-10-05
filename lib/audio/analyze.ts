// Small signal measurements. They let tests (and the dev-only audio debug
// hook) prove a synthesized layer actually makes sound, and roughly what kind:
// loud enough, bright or dark, steady or transient. No ears needed.

export function rms(x: ArrayLike<number>): number {
  if (x.length === 0) return 0;
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  return Math.sqrt(s / x.length);
}

export function peak(x: ArrayLike<number>): number {
  let p = 0;
  for (let i = 0; i < x.length; i++) p = Math.max(p, Math.abs(x[i]));
  return p;
}

// Peak over RMS: about 3-4 for noise, much higher for clicks and plucks.
export function crestFactor(x: ArrayLike<number>): number {
  const r = rms(x);
  return r === 0 ? 0 : peak(x) / r;
}

// In-place radix-2 FFT (length must be a power of two).
function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = i + k + len / 2;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
}

// Power-weighted mean frequency (Hz) over Hann-windowed frames: "how bright".
export function spectralCentroid(x: ArrayLike<number>, sampleRate: number, frame = 2048): number {
  const hop = frame / 2;
  const re = new Float64Array(frame);
  const im = new Float64Array(frame);
  const power = new Float64Array(frame / 2);
  let frames = 0;
  for (let start = 0; start + frame <= x.length; start += hop) {
    for (let i = 0; i < frame; i++) {
      const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (frame - 1));
      re[i] = x[start + i] * w;
      im[i] = 0;
    }
    fft(re, im);
    for (let k = 0; k < frame / 2; k++) power[k] += re[k] * re[k] + im[k] * im[k];
    frames++;
  }
  if (frames === 0) return 0;
  let num = 0;
  let den = 0;
  for (let k = 1; k < frame / 2; k++) {
    num += ((k * sampleRate) / frame) * power[k];
    den += power[k];
  }
  return den === 0 ? 0 : num / den;
}

// Fraction of 50 ms windows that are essentially silent: a steady bed has
// none, sparse piano notes and keyboard bursts have some.
export function quietFraction(x: ArrayLike<number>, sampleRate: number, thresholdRms: number): number {
  const win = Math.max(1, Math.floor(sampleRate * 0.05));
  let quiet = 0;
  let total = 0;
  for (let start = 0; start + win <= x.length; start += win) {
    let s = 0;
    for (let i = 0; i < win; i++) s += x[start + i] * x[start + i];
    if (Math.sqrt(s / win) < thresholdRms) quiet++;
    total++;
  }
  return total === 0 ? 0 : quiet / total;
}
