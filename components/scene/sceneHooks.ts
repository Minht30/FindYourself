"use client";

import { useEffect, useLayoutEffect, useRef, type MutableRefObject, type RefObject } from "react";
import { layerOffset, pointerToUnit } from "@/lib/scene/parallax";
import { STAGES, stageFor, stageTransform } from "@/lib/scene/stage";
import { GUST_MS, endGust, gustDelay, startGust, type WindState } from "@/lib/scene/wind";

// Fits the painting's stage to the scene's own box (not the window: the scene may be a
// full-screen overlay or the page backdrop) and keeps it fitted as the box resizes.
export function useStageFit(theme: keyof typeof STAGES, root: RefObject<HTMLElement | null>, stage: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = root.current;
    const st = stage.current;
    if (!el || !st) return;
    const fit = () => {
      const r = el.getBoundingClientRect();
      st.style.transform = stageTransform(stageFor(theme, r.width || window.innerWidth, r.height || window.innerHeight));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [theme, root, stage]);
}

// Pointer parallax: every [data-depth] layer shifts a little against the pointer, the
// near ones more. Mouse and pen only (never touch), and never when motion is reduced.
export function useParallax(root: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = root.current;
    if (!el || !enabled || !window.matchMedia("(pointer: fine)").matches) return;
    const layers = Array.from(el.querySelectorAll<HTMLElement>("[data-depth]"));
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const rect = el.getBoundingClientRect();
      const u = pointerToUnit(e.clientX, e.clientY, rect);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        for (const l of layers) {
          const o = layerOffset(u, Number(l.dataset.depth) / 28, 14, 8.4);
          l.style.transform = `translate(${o.x.toFixed(1)}px, ${o.y.toFixed(1)}px)`;
        }
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
      for (const l of layers) l.style.transform = "";
    };
  }, [root, enabled]);
}

// One animation loop for the scene: called once a frame with the time in seconds and
// the (capped) time since the last frame. Stops when `enabled` is false and while the
// tab is hidden.
export function useFrameLoop(enabled: boolean, frame: (tSec: number, dt: number) => void) {
  const cb = useRef(frame);
  cb.current = frame;
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (!document.hidden) {
        const dt = Math.min(0.05, (now - last) / 1000);
        cb.current(now / 1000, dt);
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);
}

// Gusts: the first one soon after the scene opens, then one every 8 to 15 s. The wind
// state is a ref the frame loop eases; `onGust` lets a scene throw some leaves.
export function useGusts(enabled: boolean, night: boolean, wind: MutableRefObject<WindState>, calm: number, strength: number, onGust?: () => void) {
  const strengthRef = useRef(strength);
  strengthRef.current = strength;
  const onGustRef = useRef(onGust);
  onGustRef.current = onGust;
  useEffect(() => {
    if (!enabled) return;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };
    const gust = () => {
      if (!document.hidden) {
        wind.current = startGust(wind.current, strengthRef.current);
        onGustRef.current?.();
        later(() => {
          wind.current = endGust(wind.current, calm);
        }, GUST_MS);
      }
      later(gust, gustDelay(Math.random, night));
    };
    later(gust, 2500);
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      wind.current = endGust(wind.current, calm);
    };
  }, [enabled, night, wind, calm]);
}
