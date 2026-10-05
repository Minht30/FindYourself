import { describe, expect, it } from "vitest";
import { LAYER_KEYS } from "./layers";
import { defaultSettings } from "./state";
import { validateMixer, type MixerReason } from "./validate";

const good = () => ({ levels: { ...defaultSettings().levels }, master: 0.8, muted: false });
const reason = (raw: unknown): MixerReason | "ok" => {
  const v = validateMixer(raw);
  return v.ok ? "ok" : v.reason;
};

describe("validateMixer", () => {
  it("accepts a complete, in-range mix and returns exactly the columns to write", () => {
    const v = validateMixer(good());
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(Object.keys(v.row).sort()).toEqual(["levels", "master_volume", "muted"]);
      expect(Object.keys(v.row.levels).sort()).toEqual([...LAYER_KEYS].sort());
    }
  });

  it("rejects anything that is not a plain object", () => {
    for (const bad of [null, undefined, 3, "x", [], true]) expect(reason(bad)).toBe("not_an_object");
  });

  it("rejects missing, non-object and array levels", () => {
    expect(reason({ master: 0.5, muted: false })).toBe("bad_levels");
    expect(reason({ ...good(), levels: "rain" })).toBe("bad_levels");
    expect(reason({ ...good(), levels: [0.5] })).toBe("bad_levels");
    expect(reason({ ...good(), levels: null })).toBe("bad_levels");
  });

  it("rejects an unknown layer instead of silently dropping it", () => {
    expect(reason({ ...good(), levels: { ...good().levels, thunder: 0.5 } })).toBe("unknown_layer");
  });

  it("rejects a missing layer, an out-of-range level, and non-numbers", () => {
    const { rain: _rain, ...rest } = good().levels;
    expect(reason({ ...good(), levels: rest })).toBe("bad_level");
    for (const v of [1.01, -0.01, NaN, Infinity, "0.5", null, undefined, {}, true]) {
      expect(reason({ ...good(), levels: { ...good().levels, rain: v } }), String(v)).toBe("bad_level");
    }
  });

  it("accepts the edges 0 and 1", () => {
    expect(reason({ ...good(), levels: { ...good().levels, rain: 0, fire: 1 } })).toBe("ok");
  });

  it("rejects a bad master", () => {
    for (const v of [2, -1, NaN, "0.5", undefined, null]) expect(reason({ ...good(), master: v }), String(v)).toBe("bad_master");
  });

  it("only a real boolean is a muted flag", () => {
    for (const v of ["true", 1, 0, null, undefined]) expect(reason({ ...good(), muted: v }), String(v)).toBe("bad_muted");
    expect(reason({ ...good(), muted: true })).toBe("ok");
  });

  it("rounds to 3 decimals", () => {
    const v = validateMixer({ ...good(), master: 0.123456, levels: { ...good().levels, rain: 0.66666 } });
    expect(v.ok && v.row.master_volume).toBe(0.123);
    expect(v.ok && v.row.levels.rain).toBe(0.667);
  });

  it("never copies extra fields (a client cannot smuggle in user_id)", () => {
    const v = validateMixer({ ...good(), user_id: "someone-else", current_track_id: "x", updated_at: "2020" });
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect("user_id" in v.row).toBe(false);
      expect("current_track_id" in v.row).toBe(false);
    }
  });

  it("checks the order: a bad layer is reported before a bad master", () => {
    expect(reason({ levels: { ...good().levels, rain: 9 }, master: 9, muted: "x" })).toBe("bad_level");
  });
});
