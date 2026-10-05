import { describe, expect, it } from "vitest";
import { mulberry32, type Rng } from "../rng";
import {
  PENTATONIC,
  midiToHz,
  planClinks,
  planCrackles,
  planDroplets,
  planGusts,
  planKeys,
  planPiano,
  planVoice,
} from "./plans";

const inOrder = (xs: { at: number }[]) => xs.every((x, i) => i === 0 || x.at >= xs[i - 1].at);

type Case = {
  cursor: (t: number) => unknown;
  plan: (c: unknown, now: number, until: number, rng: Rng) => { at: number }[];
};

// Each planner has its own cursor shape; this keeps the loop below generic.
function kase<C>(cursor: (t: number) => C, plan: (c: C, now: number, until: number, rng: Rng) => { at: number }[]): Case {
  return { cursor, plan } as unknown as Case;
}

describe("every planner", () => {
  const cases: Record<string, Case> = {
    droplets: kase((t) => ({ t }), planDroplets),
    gusts: kase((t) => ({ t }), planGusts),
    crackles: kase((t) => ({ t, cluster: 0 }), planCrackles),
    keys: kase((t) => ({ t, left: 0 }), planKeys),
    piano: kase((t) => ({ t, degree: 3 }), planPiano),
    voice: kase((t) => ({ t, speakingUntil: t + 5 }), planVoice),
    clinks: kase((t) => ({ t }), planClinks),
  };

  for (const [name, { cursor, plan }] of Object.entries(cases)) {
    it(`${name}: events are in time order and inside the window`, () => {
      const events = plan(cursor(1), 1, 31, mulberry32(1));
      expect(events.length).toBeGreaterThan(0);
      expect(inOrder(events)).toBe(true);
      for (const e of events) {
        expect(e.at).toBeGreaterThanOrEqual(1);
        // piano may add a left-hand note a hair after its partner
        expect(e.at).toBeLessThan(31.5);
      }
    });

    it(`${name}: a stalled scheduler skips ahead instead of firing stale events`, () => {
      // The planner was stuck at t=2 while the clock reached t=100.
      const events = plan(cursor(2), 100, 102, mulberry32(1));
      for (const e of events) expect(e.at).toBeGreaterThanOrEqual(100);
    });

    it(`${name}: planning in two halves equals planning once`, () => {
      // The engine plans a rolling window every 250 ms; windows must not drop
      // or duplicate events at their seams.
      const once = plan(cursor(0), 0, 20, mulberry32(1));
      const shared = cursor(0);
      const rng = mulberry32(1);
      const first = plan(shared, 0, 10, rng);
      const second = plan(shared, 0, 20, rng);
      expect(first.length + second.length).toBe(once.length);
    });
  }
});

describe("droplets", () => {
  it("are plentiful, mostly small, with a few fat ones", () => {
    const d = planDroplets({ t: 0 }, 0, 60, mulberry32(4));
    expect(d.length).toBeGreaterThan(900); // ~28 per second
    const small = d.filter((x) => x.amp < 0.2).length;
    expect(small / d.length).toBeGreaterThan(0.6);
    expect(d.some((x) => x.amp > 0.35)).toBe(true);
    for (const x of d) {
      expect(x.freq).toBeGreaterThanOrEqual(1800);
      expect(x.freq).toBeLessThanOrEqual(6500);
      expect(x.decay).toBeLessThan(0.04);
    }
  });
});

describe("crackles", () => {
  it("come in clusters with calm stretches between, and include dull pops", () => {
    const c = planCrackles({ t: 0, cluster: 0 }, 0, 120, mulberry32(11));
    const gaps = c.slice(1).map((x, i) => x.at - c[i].at);
    expect(gaps.some((g) => g < 0.12)).toBe(true); // inside a cluster
    expect(gaps.some((g) => g > 0.5)).toBe(true); // between clusters
    const pops = c.filter((x) => x.kind === "pop");
    expect(pops.length).toBeGreaterThan(0);
    expect(pops.length).toBeLessThan(c.length / 2);
    for (const p of pops) expect(p.freq).toBeLessThan(500);
    for (const s of c.filter((x) => x.kind === "snap")) expect(s.freq).toBeGreaterThan(1000);
  });
});

describe("keys", () => {
  it("type in bursts of 3-13 with human gaps, then pause", () => {
    const keys = planKeys({ t: 0, left: 0 }, 0, 300, mulberry32(21));
    const gaps = keys.slice(1).map((k, i) => k.at - keys[i].at);
    const fast = gaps.filter((g) => g < 0.3);
    const pauses = gaps.filter((g) => g >= 1.2);
    expect(fast.length).toBeGreaterThan(pauses.length * 2);
    expect(pauses.length).toBeGreaterThan(5);
    for (const g of fast) expect(g).toBeGreaterThanOrEqual(0.075);
    for (const g of pauses) expect(g).toBeLessThan(5.6);
    for (const k of keys) {
      expect(k.amp).toBeGreaterThanOrEqual(0.45);
      expect(k.amp).toBeLessThanOrEqual(1);
    }
    expect(keys.some((k) => k.space)).toBe(true);
  });
  it("only a burst's last key can be the space bar", () => {
    const keys = planKeys({ t: 0, left: 0 }, 0, 300, mulberry32(22));
    const gaps = keys.map((k, i) => (i < keys.length - 1 ? keys[i + 1].at - k.at : 0));
    keys.slice(0, -1).forEach((k, i) => {
      if (k.space) expect(gaps[i]).toBeGreaterThanOrEqual(1.4);
    });
  });
});

describe("piano", () => {
  it("only plays notes of the pentatonic scale (and a low octave under them)", () => {
    const notes = planPiano({ t: 0, degree: 3 }, 0, 600, mulberry32(33));
    const allowed = new Set<number>([...PENTATONIC, ...PENTATONIC.map((m) => m - 12)]);
    for (const n of notes) {
      expect(allowed.has(n.midi)).toBe(true);
      expect(n.vel).toBeGreaterThan(0.2);
      expect(n.vel).toBeLessThan(0.9);
      expect(n.dur).toBeGreaterThan(2);
    }
  });
  it("is sparse: well under two notes a second, with some long rests", () => {
    const notes = planPiano({ t: 0, degree: 3 }, 0, 300, mulberry32(34));
    expect(notes.length / 300).toBeLessThan(1);
    const gaps = notes.slice(1).map((n, i) => n.at - notes[i].at);
    expect(gaps.some((g) => g > 3.4)).toBe(true);
  });
  it("wanders: it does not play one note forever", () => {
    const notes = planPiano({ t: 0, degree: 3 }, 0, 120, mulberry32(35));
    expect(new Set(notes.map((n) => n.midi)).size).toBeGreaterThan(4);
  });
  it("converts MIDI to Hz (A4 = 440, an octave doubles)", () => {
    expect(midiToHz(69)).toBeCloseTo(440, 5);
    expect(midiToHz(81)).toBeCloseTo(880, 5);
    expect(midiToHz(60)).toBeCloseTo(261.63, 1);
  });
});

describe("voice", () => {
  it("alternates between talking and listening", () => {
    const s = planVoice({ t: 0, speakingUntil: 3 }, 0, 120, mulberry32(44));
    const quiet = s.filter((x) => x.level === 0);
    const talking = s.filter((x) => x.level > 0);
    expect(quiet.length).toBeGreaterThan(5);
    expect(talking.length).toBeGreaterThan(quiet.length * 3);
    for (const t of talking) {
      expect(t.f1).toBeGreaterThanOrEqual(300);
      expect(t.f1).toBeLessThanOrEqual(780);
      expect(t.f2).toBeGreaterThanOrEqual(900);
      expect(t.f2).toBeLessThanOrEqual(2300);
    }
  });
});

describe("clinks", () => {
  it("are rare and ceramic-bright", () => {
    const c = planClinks({ t: 0 }, 0, 300, mulberry32(55));
    expect(c.length).toBeGreaterThan(15);
    expect(c.length).toBeLessThan(80);
    for (const x of c) {
      expect(x.freq).toBeGreaterThanOrEqual(2600);
      expect(x.freq).toBeLessThanOrEqual(4300);
    }
  });
});

describe("gusts", () => {
  it("keep the rain bed between 65 and 100 percent", () => {
    for (const g of planGusts({ t: 0 }, 0, 300, mulberry32(66))) {
      expect(g.level).toBeGreaterThanOrEqual(0.65);
      expect(g.level).toBeLessThanOrEqual(1);
    }
  });
});
