"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2 } from "lucide-react";
import Immersive from "./Immersive";
import PaintedScene from "./PaintedScene";

// The Chill page's open scene and its "Chill mode" button. The living painting is the
// page's backdrop (the glass sections scroll over it); the button turns it into the
// whole room. Entering asks the browser for real fullscreen (best effort: it must come
// from this click, and a browser that refuses, such as iPhone Safari, still gets the
// scene filling the window). While the full-screen view is open the backdrop pauses, so
// only one copy of the scene is ever moving.
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
    <>
      {/* above the wallpaper stage (also z-index -1, earlier in the page), below everything else */}
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ zIndex: -1 }}>
        <PaintedScene variant="chill" active={!immersive} className="absolute inset-0" />
      </div>
      <button
        ref={openerRef}
        type="button"
        onClick={open}
        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--border-strong)] bg-bg-alt px-4 py-2 font-ui text-sm font-medium text-ink-primary hover:bg-accent-soft hover:text-cat-ink hover:border-accent transition"
      >
        <Maximize2 size={15} aria-hidden />
        Chill mode
      </button>
      {immersive && createPortal(<Immersive onClose={close} />, document.body)}
    </>
  );
}
