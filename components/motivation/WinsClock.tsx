"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { msUntilWinsWindow, winsWindowOpen } from "@/lib/wins";

const MAX_WAIT_MS = 24 * 60 * 60 * 1000;

// A page left open from Sunday afternoon would never show the card, because
// the server decided when the page was loaded. This renders nothing: it asks
// the server to render again the moment Sunday 18:00 arrives (or when the tab
// wakes up after it), and only if the card is not already showing.
export default function WinsClock({ timeZone, open }: { timeZone: string; open: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (open) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const check = () => {
      if (winsWindowOpen(Date.now(), timeZone)) {
        router.refresh();
        return;
      }
      const wait = msUntilWinsWindow(Date.now(), timeZone);
      if (wait !== null && wait <= MAX_WAIT_MS) timer = setTimeout(check, wait + 1000);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible" && winsWindowOpen(Date.now(), timeZone)) router.refresh();
    };

    check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [open, timeZone, router]);

  return null;
}
