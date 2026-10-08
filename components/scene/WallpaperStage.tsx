"use client";

import { useEffect, useRef } from "react";
import { THEME_NAMES, type ThemeName } from "@/lib/theme";

const FADE_MS = 1300; // the 1.2 s painting fade, plus a little

// The painted wallpaper behind the whole app: one fixed layer per theme (the
// pictures and the crossfade are CSS, see "Wallpaper stage" in globals.css) and a
// veil that darkens the painting while a "Focus first" restriction is active.
//
// Only the theme the server painted gets its picture straight away (data-seen); the
// other one is requested the first time that theme is shown. The page's own
// <html data-theme> is the single source of truth, so this follows the toggle, the
// clock and the profile without being told.
export default function WallpaperStage({ initial }: { initial: ThemeName }) {
  const layers = useRef<Partial<Record<ThemeName, HTMLDivElement | null>>>({});

  useEffect(() => {
    const root = document.documentElement;
    let shown = root.getAttribute("data-theme");
    let timer: number | undefined;
    const show = (t: string | null) => {
      if ((THEME_NAMES as readonly string[]).includes(t ?? "")) layers.current[t as ThemeName]?.setAttribute("data-seen", "");
    };
    // The head script may have corrected the server's guess before first paint.
    show(shown);

    const mo = new MutationObserver(() => {
      const next = root.getAttribute("data-theme");
      if (next === shown) return;
      shown = next;
      show(next);
      // Panels recolour over 300 ms while the painting fades; none of it under reduced motion.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      root.classList.add("theme-fade");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => root.classList.remove("theme-fade"), FADE_MS);
    });
    mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      mo.disconnect();
      window.clearTimeout(timer);
      root.classList.remove("theme-fade");
    };
  }, []);

  return (
    <div aria-hidden className="wp-stage">
      {THEME_NAMES.map((t) => (
        <div key={t} ref={(el) => void (layers.current[t] = el)} data-wp={t} {...(t === initial ? { "data-seen": "" } : {})} className="wp-layer" />
      ))}
      <div className="wp-veil" />
    </div>
  );
}
