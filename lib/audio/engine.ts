import { primeAudio } from "./context";
import { LAYERS, type LayerKey } from "./layers";
import { defaultSettings, targetsFor, type MixerSettings, type Targets } from "./state";
import { SYNTHS } from "./synth";
import type { LayerSource } from "./synth/types";
import { createTicker } from "./ticker";

// The live audio graph:
//
//   layer source -> layer gain ----\
//   layer source -> layer gain -----+-> master gain -> limiter -> destination
//   layer source -> layer gain ----/
//
// Nothing exists until `begin()` (which only ever runs from a click), and
// `halt()` tears it all down again, so a paused mixer costs nothing.

export type BeginResult = "running" | "blocked" | "unsupported" | "cancelled";

const TICK_MS = 250;
const LOOKAHEAD_S = 2.5; // how far ahead events are placed
const SLIDER_TC = 0.06; // time constant of level changes: fast, but never a click
const FADE_IN_TC = 0.35;
const FADE_OUT_TC = 0.09;
const TEARDOWN_MS = 700;
const RESUME_TIMEOUT_MS = 1500;

type Debug = {
  state: "idle" | "running";
  contextState: string | null;
  layerCount: number;
  ticks: number;
  targets: Targets | null;
  activeLayers: string[];
  // RMS of what the graph is outputting right now (0..1); dev-only tap.
  outputRms: () => number;
};

declare global {
  interface Window {
    __fyMixerDebug?: Debug;
  }
}

type Graph = {
  ctx: AudioContext;
  master: GainNode;
  limiter: DynamicsCompressorNode;
  layers: Map<LayerKey, { source: LayerSource; gain: GainNode }>;
  stopTicker: () => void;
  analyser: AnalyserNode | null;
};

export type Engine = ReturnType<typeof createEngine>;

function outputRms(a: AnalyserNode | null): number {
  if (!a) return 0;
  const buf = new Float32Array(a.fftSize);
  a.getFloatTimeDomainData(buf);
  let sum = 0;
  for (const v of buf) sum += v * v;
  return Math.sqrt(sum / buf.length);
}

export function createEngine() {
  let graph: Graph | null = null;
  let settings: MixerSettings = defaultSettings();
  let ticks = 0;
  let epoch = 0; // bumped by every begin() and halt(), so a stale await can tell it lost

  const isDev = typeof process !== "undefined" && process.env.NODE_ENV !== "production";

  function publish() {
    if (!isDev || typeof window === "undefined") return;
    window.__fyMixerDebug = {
      state: graph ? "running" : "idle",
      contextState: graph?.ctx.state ?? null,
      layerCount: graph?.layers.size ?? 0,
      ticks,
      targets: graph ? targetsFor(settings) : null,
      activeLayers: graph ? LAYERS.filter((l) => settings.levels[l.key] > 0).map((l) => l.key) : [],
      outputRms: () => outputRms(graph?.analyser ?? null),
    };
  }

  function applyTargets(tc: number) {
    if (!graph) return;
    const t = targetsFor(settings);
    const now = graph.ctx.currentTime;
    graph.master.gain.setTargetAtTime(t.master, now, tc);
    for (const [key, l] of graph.layers) l.gain.gain.setTargetAtTime(t.layers[key], now, SLIDER_TC);
    publish();
  }

  function tick() {
    if (!graph) return;
    ticks += 1;
    const until = graph.ctx.currentTime + LOOKAHEAD_S;
    for (const [key, l] of graph.layers) {
      // A layer at zero schedules nothing (no droplets nobody can hear); when
      // its slider comes back up the planners skip ahead to "now".
      if (settings.levels[key] > 0) l.source.schedule(until);
    }
    publish();
  }

  async function begin(next?: MixerSettings): Promise<BeginResult> {
    if (next) settings = next;
    if (graph) {
      applyTargets(SLIDER_TC);
      return "running";
    }
    const ctx = primeAudio();
    if (!ctx) return "unsupported";
    const mine = ++epoch;
    if (ctx.state !== "running") {
      // A blocked context leaves resume() pending forever, so do not wait for it.
      await Promise.race([
        ctx.resume().catch(() => undefined),
        new Promise((r) => setTimeout(r, RESUME_TIMEOUT_MS)),
      ]);
    }
    // Paused (or started again) while we were waiting: whoever came last wins.
    if (mine !== epoch) return "cancelled";
    if (ctx.state !== "running") return "blocked";

    const master = ctx.createGain();
    master.gain.value = 0; // fades up in applyTargets
    const limiter = ctx.createDynamicsCompressor();
    // Soft safety net for when every layer is high at once: a limiter, not a
    // sound effect, so it only acts near the top.
    limiter.threshold.value = -10;
    limiter.knee.value = 8;
    limiter.ratio.value = 6;
    limiter.attack.value = 0.01;
    limiter.release.value = 0.25;
    master.connect(limiter).connect(ctx.destination);

    const layers = new Map<LayerKey, { source: LayerSource; gain: GainNode }>();
    for (const meta of LAYERS) {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      const source = SYNTHS[meta.key](ctx);
      source.output.connect(gain).connect(master);
      layers.set(meta.key, { source, gain });
    }

    // Dev only: a listening post after the limiter, so tests can measure the
    // real output without ears. Not connected to the speakers.
    let analyser: AnalyserNode | null = null;
    if (isDev) {
      analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      limiter.connect(analyser);
    }

    graph = { ctx, master, limiter, layers, analyser, stopTicker: createTicker(tick, TICK_MS) };
    const t0 = ctx.currentTime + 0.02;
    for (const l of layers.values()) l.source.start(t0);
    applyTargets(FADE_IN_TC);
    // Place the first events straight away rather than after the first tick.
    tick();
    return "running";
  }

  function apply(next: MixerSettings) {
    settings = next;
    applyTargets(SLIDER_TC);
  }

  function halt() {
    epoch += 1;
    const g = graph;
    if (!g) return;
    graph = null;
    g.stopTicker();
    g.master.gain.setTargetAtTime(0, g.ctx.currentTime, FADE_OUT_TC);
    publish();
    setTimeout(() => {
      for (const l of g.layers.values()) {
        l.source.stop();
        l.gain.disconnect();
      }
      g.master.disconnect();
      g.limiter.disconnect();
    }, TEARDOWN_MS);
  }

  return { begin, apply, halt, isRunning: () => graph !== null };
}
