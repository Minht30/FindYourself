import type { ReactNode } from "react";

// A scene is a stack of layers, back to front. The engine (Scene.tsx) knows
// nothing about what is drawn: it stacks the layers, shifts each by its depth
// for parallax, feeds the mixer's levels in as CSS variables (--rain, --glow),
// and honours reduced motion. Stage 2 (the Figma design pass) drops the real
// Monstadt and Liyue art in as new SceneDefs without touching the engine.

export type SceneLayer = {
  id: string;
  // 0 = static backdrop, 1 = nearest. Near layers shift more with the pointer.
  depth: number;
  // SVG content in a 960 x 540 coordinate space (the layer's own <svg> scales it).
  node: ReactNode;
};

export type SceneDef = {
  id: string;
  label: string;
  layers: SceneLayer[];
};

export const SCENE_W = 960;
export const SCENE_H = 540;
