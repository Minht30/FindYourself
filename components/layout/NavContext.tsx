"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

// Whether the sidebar is open as a drawer. Only meaningful below the `md`
// breakpoint: from 768 px up the sidebar is always on screen and the top bar's
// Menu button is hidden. The top bar toggles it; the sidebar reads it.
type Nav = { open: boolean; toggle: () => void; close: () => void };

const NavContext = createContext<Nav | null>(null);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Going to another page closes the drawer.
  useEffect(() => setOpen(false), [pathname]);

  // Escape closes it, and a drawer left open when the window grows into the
  // desktop layout closes too (it is no longer a drawer there).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const mq = window.matchMedia("(min-width: 768px)");
    const onWide = () => {
      if (mq.matches) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onWide);
    };
  }, [open]);

  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ open, toggle, close }), [open, toggle, close]);
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): Nav {
  const ctx = useContext(NavContext);
  // Outside a provider (a test, a storybook) the drawer is simply closed.
  return ctx ?? { open: false, toggle: () => {}, close: () => {} };
}
