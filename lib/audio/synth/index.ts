import type { LayerKey } from "../layers";
import { createCafe } from "./cafe";
import { createFire } from "./fire";
import { createKeyboard } from "./keyboard";
import { createPiano } from "./piano";
import { createRain } from "./rain";
import type { SynthFactory } from "./types";

// `ambient_layers.key` -> generator. A layer whose key is not here cannot play.
export const SYNTHS: Record<LayerKey, SynthFactory> = {
  rain: createRain,
  fire: createFire,
  keyboard: createKeyboard,
  cafe: createCafe,
  piano: createPiano,
};

export type { LayerSource, SynthFactory } from "./types";
