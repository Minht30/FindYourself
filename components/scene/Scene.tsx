"use client";

import { useCallback, useEffect, useRef, type CSSProperties } from "react";
import { useMixerStore } from "@/lib/audio/store";
import { sceneVars } from "@/lib/scene/intensity";
import { layerOffset, pointerToUnit } from "@/lib/scene/parallax";
import { useReducedMotion, useTheme } from "./hooks";
import { SCENES } from "./scenes";
import { SCENE_H, SCENE_W, type SceneDef } from "./types";

// The animated scene. It reads the rain and fire levels from the mixer, the
// theme from <html>, and the pointer for a gentle parallax; everything it draws
// comes from a SceneDef.
//
//  * theme-aware: Sunny Cafe shows the day scene, Netcafe the night one;
//  * the rain slider sets how much rain is on the glass, the fire slider how
//    warm the room is (CSS variables, so no re-render per animation frame);
//  * parallax only follows a mouse / pen (never touch) and never with
//    prefers-reduced-motion; reduced motion also freezes every CSS animation
//    on its first frame (see globals.css), so the scene is a still picture.
export default function Scene({
  scene,
  fill = false,
  className = "",
}: {
  scene?: SceneDef;
  // Cover the whole parent (the full-screen view) instead of keeping 16:9. The
  // layers use "slice", so a screen of any shape is filled; the edges crop.
  fill?: boolean;
  className?: string;
}) {
  const theme = useTheme();
  const def = scene ?? SCENES[theme];
  const reduced = useReducedMotion();

  const rain = useMixerStore((s) => s.settings.levels.rain);
  const fire = useMixerStore((s) => s.settings.levels.fire);
  const vars = sceneVars({ rain, fire });

  const stageRef = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  const shift = useCallback((ux: number, uy: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    for (const el of stage.querySelectorAll<HTMLElement>("[data-depth]")) {
      const o = layerOffset({ x: ux, y: uy }, Number(el.dataset.depth));
      el.style.setProperty("--ox", `${o.x.toFixed(2)}px`);
      el.style.setProperty("--oy", `${o.y.toFixed(2)}px`);
    }
  }, []);

  // Back to rest when parallax stops being allowed (reduced motion switched on).
  useEffect(() => {
    if (reduced) shift(0, 0);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [reduced, shift]);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduced || e.pointerType === "touch") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const u = pointerToUnit(e.clientX, e.clientY, rect);
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => shift(u.x, u.y));
  }

  return (
    <div
      ref={stageRef}
      aria-hidden
      data-scene={def.id}
      data-rain={vars.rain}
      data-glow={vars.glow}
      onPointerMove={onPointerMove}
      onPointerLeave={() => shift(0, 0)}
      className={`sc-stage ${fill ? "absolute inset-0" : "rounded-lg border border-[var(--border-strong)] shadow-card"} ${className}`}
      style={
        {
          "--rain": vars.rain,
          "--glow": vars.glow,
          ...(fill ? { height: "100%" } : { aspectRatio: `${SCENE_W} / ${SCENE_H}` }),
        } as unknown as CSSProperties
      }
    >
      {def.layers.map((layer) => (
        <div key={layer.id} className="sc-layer" data-depth={layer.depth} data-layer={layer.id}>
          <svg viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} preserveAspectRatio="xMidYMid slice" focusable="false">
            {layer.node}
          </svg>
        </div>
      ))}
    </div>
  );
}
