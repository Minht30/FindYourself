"use client";

import { useEffect, useState } from "react";
import { formatDayLabel, formatTimeLabel, msToNextMinute } from "@/lib/clock";
import { useAppZone } from "./ZoneContext";

// The current time, or null until the page has mounted. The server cannot
// know the visitor's clock or zone, so it renders nothing and the browser
// fills it in (no hydration mismatch). Updates on the minute, and again when a
// background tab comes back (throttled timers drift).
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    let timer: number;
    const tick = () => {
      window.clearTimeout(timer);
      setNow(new Date());
      timer = window.setTimeout(tick, msToNextMinute(Date.now()));
    };
    const onVisible = () => {
      if (!document.hidden) tick();
    };
    tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return now;
}

// "Mon, Oct 5 · 8:42 PM" in the top bar of Chill.
export default function ClockLabel({ className = "" }: { className?: string }) {
  const now = useNow();
  // The day and time in the app's zone (the browser's, or the one chosen in Settings)
  const timeZone = useAppZone();
  return (
    <div className={className} data-clock>
      {now && (
        <time dateTime={now.toISOString()}>
          {formatDayLabel(now, undefined, timeZone)} <span aria-hidden>·</span> {formatTimeLabel(now, undefined, timeZone)}
        </time>
      )}
    </div>
  );
}
