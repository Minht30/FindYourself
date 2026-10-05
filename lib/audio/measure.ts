import { crestFactor, peak, quietFraction, rms, spectralCentroid } from "./analyze";
import type { LayerKey } from "./layers";
import { mulberry32 } from "./rng";
import { SYNTHS } from "./synth";

export type LayerStats = {
  key: LayerKey;
  seconds: number;
  sampleRate: number;
  rms: number;
  peak: number;
  crest: number;
  centroid: number;
  quiet: number; // fraction of 50 ms windows that are near-silent
  finite: boolean; // no NaN / Infinity anywhere
};

const SAMPLE_RATE = 44100;

// Renders a layer faster than real time into an OfflineAudioContext and
// measures the result. This is how "does the rain actually make sound, and is
// it bright?" is answered without a pair of ears. Deterministic for a seed.
export async function measureLayer(key: LayerKey, seconds = 12, seed = 7): Promise<LayerStats> {
  const ctx = new OfflineAudioContext(1, Math.floor(SAMPLE_RATE * seconds), SAMPLE_RATE);
  const source = SYNTHS[key](ctx, mulberry32(seed));
  source.output.connect(ctx.destination);
  source.start(0);
  source.schedule(seconds);
  const rendered = await ctx.startRendering();
  const data = rendered.getChannelData(0);
  // Skip the first half second: the layers fade in from silence.
  const body = data.subarray(Math.floor(SAMPLE_RATE * 0.5));
  let finite = true;
  for (let i = 0; i < data.length; i++) {
    if (!Number.isFinite(data[i])) {
      finite = false;
      break;
    }
  }
  const level = rms(body);
  return {
    key,
    seconds,
    sampleRate: SAMPLE_RATE,
    rms: level,
    peak: peak(body),
    crest: crestFactor(body),
    centroid: spectralCentroid(body, SAMPLE_RATE),
    quiet: quietFraction(body, SAMPLE_RATE, Math.max(1e-5, level * 0.1)),
    finite,
  };
}
