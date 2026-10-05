import type { Rng } from "../rng";

// One synthesized layer. `output` is a node the engine connects to the layer's
// gain. Steady parts (the rain bed, the fire rumble) run from `start` on their
// own; discrete events (droplets, crackles, key clicks, piano notes) are placed
// ahead of time by `schedule(until)`, which the engine calls every few hundred
// milliseconds with a horizon of a couple of seconds. An offline render calls
// it once for the whole clip, which is how tests hear a layer without ears.
export type LayerSource = {
  output: AudioNode;
  start(at?: number): void;
  schedule(until: number): void;
  stop(): void;
};

export type SynthFactory = (ctx: BaseAudioContext, rng?: Rng) => LayerSource;

// Where the next event of a stream falls. `schedule` advances it past `until`.
export type Cursor = { t: number };

// If the scheduler stalled (a hidden tab, a long frame) and the cursor is in
// the past, skip ahead instead of firing a burst of stale events at once.
export function catchUp(cursor: Cursor, now: number): void {
  if (cursor.t < now) cursor.t = now + 0.02;
}
