import { LAYERS, LAYER_KEYS, type LayerKey, type LayerMeta } from "./layers";

// The mixer's persisted settings and the pure maths around them. Nothing here
// touches Web Audio, the DOM or storage, so all of it is unit-tested.

export type Levels = Record<LayerKey, number>;

export type MixerSettings = {
  levels: Levels;
  master: number; // 0..1
  muted: boolean;
};

export const DEFAULT_MASTER = 0.8;

// `layers` is the merged catalogue (database defaults over the built-in ones).
export function defaultLevels(layers: readonly LayerMeta[] = LAYERS): Levels {
  return Object.fromEntries(layers.map((l) => [l.key, l.defaultLevel])) as Levels;
}

export function defaultSettings(layers: readonly LayerMeta[] = LAYERS): MixerSettings {
  return { levels: defaultLevels(layers), master: DEFAULT_MASTER, muted: false };
}

export function clampLevel(v: unknown, fallback = 0): number {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return Math.min(1, Math.max(0, n));
}

// Perceptual volume: loudness is roughly logarithmic, so a linear slider would
// have all of its "action" in the first quarter. Squaring gives -12 dB at the
// halfway point, which sounds like "half as loud" and keeps the top end usable.
export function levelToGain(level: number): number {
  const l = clampLevel(level);
  return l * l;
}

export function gainToLevel(gain: number): number {
  return Math.sqrt(Math.min(1, Math.max(0, gain)));
}

// Anything that came from storage or the network: wrong types, missing keys,
// numbers out of range, extra keys, or not an object at all, all land on a
// valid mixer (missing layers get their default level, not zero).
export function sanitizeSettings(raw: unknown, layers: readonly LayerMeta[] = LAYERS): MixerSettings {
  const base = defaultSettings(layers);
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  const lv = r.levels && typeof r.levels === "object" ? (r.levels as Record<string, unknown>) : {};
  const levels = { ...base.levels };
  for (const key of LAYER_KEYS) levels[key] = clampLevel(lv[key], base.levels[key]);
  return {
    levels,
    master: clampLevel(r.master, base.master),
    muted: r.muted === true,
  };
}

export function sameSettings(a: MixerSettings, b: MixerSettings): boolean {
  if (a.master !== b.master || a.muted !== b.muted) return false;
  return LAYER_KEYS.every((k) => a.levels[k] === b.levels[k]);
}

// What the audio graph should be: a gain per layer (level curve x loudness
// trim) and the master gain (0 while muted).
export type Targets = { master: number; layers: Record<LayerKey, number> };

export function targetsFor(s: MixerSettings): Targets {
  const layers = {} as Record<LayerKey, number>;
  for (const l of LAYERS) layers[l.key] = levelToGain(s.levels[l.key]) * l.trim;
  return { master: s.muted ? 0 : levelToGain(s.master), layers };
}

export function percent(level: number): number {
  return Math.round(clampLevel(level) * 100);
}

// Screen-reader text for a slider: "Rain, 60 percent" (or "off" at zero).
export function levelText(label: string, level: number): string {
  const p = percent(level);
  return p === 0 ? `${label}, off` : `${label}, ${p} percent`;
}
