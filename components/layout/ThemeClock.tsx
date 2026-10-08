"use client";

import { useEffect } from "react";
import { applyTheme } from "@/lib/themeClient";

// In Auto the theme follows the clock, so a page left open flips at 18:00 and at
// 06:00 without a reload. Checked every minute, and the moment the tab comes
// back (a sleeping laptop wakes after the hour has passed). A fixed mode simply
// resolves to the same theme each time. Renders nothing.
export default function ThemeClock() {
  useEffect(() => {
    const check = () => {
      applyTheme();
    };
    const id = window.setInterval(check, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return null;
}
