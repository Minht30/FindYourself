"use client";

import { useEffect, useRef, useState } from "react";
import type { ThemeName } from "@/lib/theme";
import DayScene from "./DayScene";
import NightScene from "./NightScene";
import { useReducedMotion, useTheme } from "./hooks";

export type SceneVariant = "chill" | "focus" | "hero";

// The living painting behind the Chill page, Chill mode and Focus Mode: the day or the
// night scene for the theme that is showing, with its own wallpaper in the painting's
// coordinate space so everything attached to it lines up. It decorates; it is hidden from
// assistive technology.
//
//  * `variant="chill"`: the full scene (the moth, the seeds and the birds too).
//  * `variant="focus"`: the same scene without the creatures, so the timer's spirit is the
//    one that moves.
//  * `variant="hero"`: the light version for the landing page: the painting with its CSS-only
//    motion (clouds or aurora, moon, stars, lights), no foreground, no loops.
//  * `active={false}` pauses every loop and timer (a second copy of the scene is open over
//    this one, or the tab is not showing it).
//  * reduced motion: the first frame, still; the loops never start.
//
// It draws nothing on the server: the wallpaper stage behind it already shows the painting,
// and the scene fades in over it once the page is ready, so there is no mismatch to repair.
export default function PaintedScene({ variant = "chill", active = true, className = "" }: { variant?: SceneVariant; active?: boolean; className?: string }) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  // the theme actually drawn: it follows `theme` after a short fade-out, so a change of
  // theme is a dissolve and not a pop
  const [shown, setShown] = useState<ThemeName | null>(null);

  useEffect(() => {
    if (shown === theme) return;
    const wait = shown === null ? 0 : reduced ? 0 : 350;
    const id = window.setTimeout(() => setShown(theme), wait);
    return () => window.clearTimeout(id);
  }, [theme, shown, reduced]);

  const ready = shown !== null && shown === theme;
  return (
    <div ref={root} aria-hidden className={`ps-root ${className}`} data-scene={shown ?? theme} data-ready={ready ? "" : undefined}>
      {shown === "nodkrai-night" ? <NightScene key="night" root={root} variant={variant} active={active} reduced={reduced} /> : null}
      {shown === "monstadt" ? <DayScene key="day" root={root} variant={variant} active={active} reduced={reduced} /> : null}
    </div>
  );
}
