"use client";

import { useEffect, useRef, useState } from "react";
import { useFocusStore } from "@/lib/focus/store";

const CHEER_MS = 4500;

// True for a few seconds after a focus session finishes while you are looking
// (not when it finished while you were away). Drives the cat's celebration hop.
export function useCheer(): boolean {
  const lastFinished = useFocusStore((s) => s.lastFinished);
  const [cheer, setCheer] = useState(false);
  const seen = useRef(lastFinished?.seq ?? 0);

  useEffect(() => {
    if (!lastFinished || lastFinished.seq === seen.current) return;
    seen.current = lastFinished.seq;
    if (lastFinished.phase !== "focus" || lastFinished.away) return;
    setCheer(true);
    const t = window.setTimeout(() => setCheer(false), CHEER_MS);
    return () => window.clearTimeout(t);
  }, [lastFinished]);

  return cheer;
}
