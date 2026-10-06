"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2 } from "lucide-react";
import Immersive from "./Immersive";
import Scene from "./Scene";
import { SCENE_H, SCENE_W } from "./types";

// The scene on /chill, with a "Full screen" button that turns it into the
// whole room. Entering asks the browser for real fullscreen (best effort: it
// must come from this click, and a browser that refuses, such as iPhone Safari,
// still gets the scene filling the window).
export default function ChillStage() {
  const [immersive, setImmersive] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);

  const open = useCallback(() => {
    setImmersive(true);
    try {
      void document.documentElement.requestFullscreen?.().catch(() => {});
    } catch {
      // no fullscreen: the full-window view alone is fine
    }
  }, []);

  const close = useCallback(() => {
    setImmersive(false);
    try {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    } catch {}
    // One tick later: the page behind is inert until this commit lands, and an
    // inert element cannot take focus.
    window.setTimeout(() => openerRef.current?.focus(), 0);
  }, []);

  // If the component goes away while full screen (navigation), let go of it.
  useEffect(
    () => () => {
      try {
        if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
      } catch {}
    },
    [],
  );

  return (
    <div className="relative">
      {/* While full screen the one live scene is the big one; this keeps the
          page from jumping, and avoids two copies of the same SVG ids. */}
      {immersive ? (
        <div
          aria-hidden
          className="rounded-lg border border-[var(--border-strong)] bg-bg-window"
          style={{ aspectRatio: `${SCENE_W} / ${SCENE_H}` }}
        />
      ) : (
        <Scene />
      )}
      <button
        ref={openerRef}
        type="button"
        onClick={open}
        aria-label="Full screen"
        className="absolute top-3 right-3 inline-flex items-center gap-2 rounded-full bg-black/50 backdrop-blur px-3.5 py-2 text-xs sm:text-sm font-ui text-white hover:bg-black/70 transition"
      >
        <Maximize2 size={15} />
        <span className="hidden sm:inline">Full screen</span>
      </button>
      {immersive && createPortal(<Immersive onClose={close} />, document.body)}
    </div>
  );
}
