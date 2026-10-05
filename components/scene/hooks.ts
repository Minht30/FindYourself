"use client";

import { useSyncExternalStore } from "react";

export type ThemeName = "sunny-cafe" | "netcafe-night";

// The theme lives on <html data-theme>. useSyncExternalStore gives the server
// (and the hydrating client) "sunny-cafe", then switches to the real value, so
// there is no hydration mismatch and it follows the toggle live.
function subscribeTheme(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}
const themeSnapshot = (): ThemeName =>
  document.documentElement.getAttribute("data-theme") === "netcafe-night" ? "netcafe-night" : "sunny-cafe";

export function useTheme(): ThemeName {
  return useSyncExternalStore(subscribeTheme, themeSnapshot, () => "sunny-cafe");
}

const REDUCED = "(prefers-reduced-motion: reduce)";
function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

// True when the user asked for less motion. Server: false (CSS handles the
// first paint, so there is no flash of movement either way).
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeMotion, () => window.matchMedia(REDUCED).matches, () => false);
}
