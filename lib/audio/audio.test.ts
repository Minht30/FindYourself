import { describe, expect, it } from "vitest";
import { crestFactor, peak, quietFraction, rms, spectralCentroid } from "./analyze";
import { LAYERS, LAYER_KEYS, isLayerKey, mergeCatalogue } from "./layers";
import { generateNoise, makeLoopable, normalise } from "./noise";
import { mulberry32 } from "./rng";
import {
  DEFAULT_MASTER,
  clampLevel,
  defaultSettings,
  gainToLevel,
  levelText,
  levelToGain,
  percent,
  sameSettings,
  sanitizeSettings,
  targetsFor,
} from "./state";

const SR = 44100;
const sine = (hz: number, seconds = 1) =>
  Float32Array.from({ length: SR * seconds }, (_, i) => Math.sin((2 * Math.PI * hz * i) / SR));

describe("rng", () => {
  it("is deterministic for a seed and stays in [0, 1)", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 1000; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it("differs between seeds", () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe("noise", () => {
  it.each(["white", "pink", "brown"] as const)("%s noise is normalised to the target RMS and finite", (kind) => {
    const x = generateNoise(kind, 20000, mulberry32(3));
    expect(rms(x)).toBeCloseTo(0.25, 2);
    expect(Array.from(x).every(Number.isFinite)).toBe(true);
  });

  it("is darker from white to pink to brown", () => {
    const c = (k: "white" | "pink" | "brown") => spectralCentroid(generateNoise(k, SR * 2, mulberry32(5)), SR);
    expect(c("white")).toBeGreaterThan(c("pink"));
    expect(c("pink")).toBeGreaterThan(c("brown"));
  });

  it("normalise leaves silence alone instead of dividing by zero", () => {
    expect(Array.from(normalise(new Float32Array(8), 0.25))).toEqual(new Array(8).fill(0));
  });

  it("a looped buffer has no jump where the end meets the start", () => {
    const fade = 2000;
    const raw = generateNoise("pink", 40000 + fade, mulberry32(9));
    const loop = makeLoopable(raw, fade);
    expect(loop.length).toBe(40000);
    // Neighbouring samples of correlated noise differ by little; the seam must
    // look like any other neighbouring pair, not a discontinuity.
    const typical = (() => {
      let worst = 0;
      for (let i = 1000; i < 30000; i++) worst = Math.max(worst, Math.abs(loop[i] - loop[i - 1]));
      return worst;
    })();
    const seam = Math.abs(loop[0] - loop[loop.length - 1]);
    expect(seam).toBeLessThanOrEqual(typical);
    // And the tail is untouched raw noise.
    expect(loop[39999]).toBe(raw[39999]);
  });
});

describe("analyze", () => {
  it("measures a sine's RMS, peak and crest factor", () => {
    const x = sine(440);
    expect(rms(x)).toBeCloseTo(Math.SQRT1_2, 2);
    expect(peak(x)).toBeCloseTo(1, 2);
    expect(crestFactor(x)).toBeCloseTo(Math.SQRT2, 1);
  });

  it("finds the frequency of a sine", () => {
    expect(spectralCentroid(sine(1000), SR)).toBeGreaterThan(950);
    expect(spectralCentroid(sine(1000), SR)).toBeLessThan(1050);
    expect(spectralCentroid(sine(4000), SR)).toBeGreaterThan(3900);
  });

  it("returns 0 for silence, empty and too-short input", () => {
    expect(rms(new Float32Array(0))).toBe(0);
    expect(crestFactor(new Float32Array(100))).toBe(0);
    expect(spectralCentroid(new Float32Array(100), SR)).toBe(0);
    expect(spectralCentroid(new Float32Array(SR), SR)).toBe(0);
  });

  it("a click train is far peakier than steady noise", () => {
    const clicks = new Float32Array(SR);
    for (let i = 0; i < SR; i += 8000) clicks[i] = 1;
    expect(crestFactor(clicks)).toBeGreaterThan(20);
    expect(crestFactor(generateNoise("white", SR, mulberry32(1)))).toBeLessThan(6);
  });

  it("counts the quiet windows of a sparse signal", () => {
    const x = new Float32Array(SR); // 1 s: only the first 0.1 s makes sound
    x.set(sine(300, 1).subarray(0, SR / 10));
    const q = quietFraction(x, SR, 0.01);
    expect(q).toBeGreaterThan(0.85);
    expect(q).toBeLessThan(1);
    expect(quietFraction(sine(300), SR, 0.01)).toBe(0);
  });
});

describe("level curve", () => {
  it("maps 0 to silence and 1 to full, perceptually in between", () => {
    expect(levelToGain(0)).toBe(0);
    expect(levelToGain(1)).toBe(1);
    expect(levelToGain(0.5)).toBeCloseTo(0.25, 5);
    // -12 dB at the halfway point
    expect(20 * Math.log10(levelToGain(0.5))).toBeCloseTo(-12.04, 1);
  });
  it("is monotonic and gainToLevel inverts it", () => {
    let prev = -1;
    for (let l = 0; l <= 1.0001; l += 0.05) {
      const g = levelToGain(l);
      expect(g).toBeGreaterThanOrEqual(prev);
      prev = g;
      expect(gainToLevel(g)).toBeCloseTo(Math.min(1, l), 5);
    }
  });
  it("clamps wild values instead of amplifying them", () => {
    expect(levelToGain(7)).toBe(1);
    expect(levelToGain(-3)).toBe(0);
    expect(levelToGain(NaN)).toBe(0);
    expect(levelToGain(Infinity)).toBe(0); // not finite: fall back, never full blast
  });
});

describe("clampLevel", () => {
  it("accepts numbers and numeric strings, rejects everything else", () => {
    expect(clampLevel(0.4)).toBe(0.4);
    expect(clampLevel("0.4")).toBe(0.4);
    expect(clampLevel(2)).toBe(1);
    expect(clampLevel(-1)).toBe(0);
    expect(clampLevel("loud", 0.3)).toBe(0.3);
    expect(clampLevel("", 0.3)).toBe(0.3);
    expect(clampLevel(null, 0.3)).toBe(0.3);
    expect(clampLevel(undefined, 0.3)).toBe(0.3);
    expect(clampLevel({}, 0.3)).toBe(0.3);
    expect(clampLevel(NaN, 0.3)).toBe(0.3);
  });
});

describe("sanitizeSettings", () => {
  const d = defaultSettings();
  it("falls back to the defaults for anything that is not an object", () => {
    for (const bad of [null, undefined, 0, "x", [], true]) expect(sanitizeSettings(bad)).toEqual(d);
  });
  it("keeps valid values", () => {
    const s = sanitizeSettings({ levels: { rain: 0.9, fire: 0.1 }, master: 0.4, muted: true });
    expect(s.levels.rain).toBe(0.9);
    expect(s.levels.fire).toBe(0.1);
    expect(s.master).toBe(0.4);
    expect(s.muted).toBe(true);
  });
  it("gives missing layers their default level, not zero", () => {
    const s = sanitizeSettings({ levels: { rain: 0.9 } });
    expect(s.levels.keyboard).toBe(LAYERS.find((l) => l.key === "keyboard")!.defaultLevel);
    expect(s.master).toBe(DEFAULT_MASTER);
  });
  it("clamps out-of-range and drops unknown keys and wrong types", () => {
    const s = sanitizeSettings({
      levels: { rain: 5, fire: -1, keyboard: "abc", cafe: null, piano: "0.5", hacker: 1 },
      master: "x",
      muted: "yes",
    });
    expect(s.levels.rain).toBe(1);
    expect(s.levels.fire).toBe(0);
    expect(s.levels.keyboard).toBe(0.2);
    expect(s.levels.cafe).toBe(0.3);
    expect(s.levels.piano).toBe(0.5);
    expect("hacker" in s.levels).toBe(false);
    expect(s.master).toBe(DEFAULT_MASTER);
    expect(s.muted).toBe(false); // only a real `true` mutes
  });
  it("tolerates levels that are not an object", () => {
    expect(sanitizeSettings({ levels: "oops", master: 0.2 }).levels).toEqual(d.levels);
    expect(sanitizeSettings({ levels: [1, 2, 3] }).levels).toEqual(d.levels);
  });
  it("never lets a layer's default come from outside the catalogue", () => {
    expect(Object.keys(sanitizeSettings({ levels: { evil: 1 } }).levels).sort()).toEqual([...LAYER_KEYS].sort());
  });
});

describe("sameSettings", () => {
  it("compares every field", () => {
    const a = defaultSettings();
    expect(sameSettings(a, defaultSettings())).toBe(true);
    expect(sameSettings(a, { ...a, muted: true })).toBe(false);
    expect(sameSettings(a, { ...a, master: 0.1 })).toBe(false);
    expect(sameSettings(a, { ...a, levels: { ...a.levels, rain: 0.01 } })).toBe(false);
  });
});

describe("targetsFor", () => {
  it("applies the curve and the layer trim", () => {
    const s = sanitizeSettings({ levels: { rain: 0.5 }, master: 1 });
    const t = targetsFor(s);
    expect(t.layers.rain).toBeCloseTo(0.25 * LAYERS.find((l) => l.key === "rain")!.trim, 5);
    expect(t.master).toBe(1);
  });
  it("mute zeroes the master and nothing else", () => {
    const s = { ...defaultSettings(), muted: true };
    const t = targetsFor(s);
    expect(t.master).toBe(0);
    expect(t.layers.rain).toBeGreaterThan(0);
  });
  it("a layer at zero is silent", () => {
    expect(targetsFor(sanitizeSettings({ levels: { rain: 0 } })).layers.rain).toBe(0);
  });
});

describe("labels", () => {
  it("builds screen-reader text", () => {
    expect(levelText("Rain", 0.6)).toBe("Rain, 60 percent");
    expect(levelText("Rain", 0)).toBe("Rain, off");
    expect(levelText("Rain", 0.004)).toBe("Rain, off");
    expect(percent(0.999)).toBe(100);
  });
});

describe("layers catalogue", () => {
  it("has the five layers in order with unique keys and sane values", () => {
    expect(LAYER_KEYS).toEqual(["rain", "fire", "keyboard", "cafe", "piano"]);
    expect(new Set(LAYER_KEYS).size).toBe(5);
    for (const l of LAYERS) {
      expect(l.defaultLevel).toBeGreaterThanOrEqual(0);
      expect(l.defaultLevel).toBeLessThanOrEqual(1);
      expect(l.trim).toBeGreaterThan(0);
    }
  });
  it("isLayerKey rejects unknown keys", () => {
    expect(isLayerKey("rain")).toBe(true);
    expect(isLayerKey("thunder")).toBe(false);
    expect(isLayerKey(3)).toBe(false);
  });

  const row = (over: Record<string, unknown> = {}) => ({
    key: "rain",
    label: "Rain",
    kind: "synth",
    default_level: 0.6,
    sort_order: 1,
    ...over,
  });

  it("falls back to the built-ins when the table could not be read", () => {
    expect(mergeCatalogue(null)).toEqual([...LAYERS]);
    expect(mergeCatalogue(undefined)).toEqual([...LAYERS]);
    expect(mergeCatalogue([])).toEqual([...LAYERS]);
  });
  it("lets rows override label, order and default level (numeric arrives as a string)", () => {
    const merged = mergeCatalogue([row({ label: "Heavy rain", default_level: "0.75", sort_order: 9 })]);
    const rain = merged.find((l) => l.key === "rain")!;
    expect(rain.label).toBe("Heavy rain");
    expect(rain.defaultLevel).toBe(0.75);
    expect(merged[merged.length - 1].key).toBe("rain"); // sort_order 9 moves it last
  });
  it("ignores layers this build cannot play and malformed rows", () => {
    const merged = mergeCatalogue([
      row({ key: "thunder", label: "Thunder" }),
      row({ key: "fire", kind: "file" }),
      row({ key: "piano", label: "   ", default_level: "oops", sort_order: null }),
      null as never,
    ]);
    expect(merged.map((l) => l.key).sort()).toEqual([...LAYER_KEYS].sort());
    expect(merged.find((l) => l.key === "fire")!.label).toBe("Fireplace"); // file kind: built-in wins
    const piano = merged.find((l) => l.key === "piano")!;
    expect(piano.label).toBe("Piano");
    expect(piano.defaultLevel).toBe(0.3);
  });
  it("clamps a default level that is out of range", () => {
    expect(mergeCatalogue([row({ default_level: 4 })]).find((l) => l.key === "rain")!.defaultLevel).toBe(1);
  });
});
