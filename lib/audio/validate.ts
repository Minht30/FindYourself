import { LAYER_KEYS } from "./layers";
import type { Levels, MixerSettings } from "./state";

// The server's gatekeeper for a saved mix. Every field is checked and a
// failure names its reason, so a test (or a log line) can say *why* a save was
// refused instead of just "error". The database re-checks the same ranges.

export type MixerRow = { levels: Levels; master_volume: number; muted: boolean };

export type MixerReason =
  | "not_an_object"
  | "bad_levels"
  | "unknown_layer"
  | "bad_level"
  | "bad_master"
  | "bad_muted";

export type MixerValidation = { ok: true; row: MixerRow; settings: MixerSettings } | { ok: false; reason: MixerReason };

const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const inRange = (v: unknown): v is number => isNumber(v) && v >= 0 && v <= 1;

// Rounded to 3 decimals: a slider has 101 positions, so more digits are noise.
const round = (v: number) => Math.round(v * 1000) / 1000;

export function validateMixer(raw: unknown): MixerValidation {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, reason: "not_an_object" };
  const r = raw as Record<string, unknown>;

  if (!r.levels || typeof r.levels !== "object" || Array.isArray(r.levels)) return { ok: false, reason: "bad_levels" };
  const given = r.levels as Record<string, unknown>;
  const known = new Set<string>(LAYER_KEYS);
  // Every layer must be present and in range. Unknown keys are refused rather
  // than dropped: a client that sends them is out of date or tampered with.
  for (const key of Object.keys(given)) if (!known.has(key)) return { ok: false, reason: "unknown_layer" };
  const levels = {} as Levels;
  for (const key of LAYER_KEYS) {
    const v = given[key];
    if (!inRange(v)) return { ok: false, reason: "bad_level" };
    levels[key] = round(v);
  }

  if (!inRange(r.master)) return { ok: false, reason: "bad_master" };
  if (typeof r.muted !== "boolean") return { ok: false, reason: "bad_muted" };

  const master = round(r.master);
  return {
    ok: true,
    row: { levels, master_volume: master, muted: r.muted },
    settings: { levels, master, muted: r.muted },
  };
}
