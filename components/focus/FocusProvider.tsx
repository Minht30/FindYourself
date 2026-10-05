"use client";

import { useEffect, useRef, useState } from "react";
import { primeAudio, playChime } from "@/lib/focus/chime";
import { showNotification } from "@/lib/focus/notify";
import { syncClock, useClock, useFocusStore } from "@/lib/focus/store";
import { PHASE_LABELS, formatClock } from "@/lib/focus/timer";
import FocusMode from "./FocusMode";

const CHIMED_KEY = "fy-focus-chimed";
const TITLE_PREFIX = /^(⏸ )?\d+:\d\d · (Break · )?/;

// Owns everything with a side effect: restoring the persisted timer, the one
// ticker, the chime and notification, the tab title, and the screen-reader
// announcements. Mounted once in the app layout, so a running timer keeps
// going while you move between pages.
export default function FocusProvider({ children }: { children: React.ReactNode }) {
  const [announcement, setAnnouncement] = useState("");
  const status = useFocusStore((s) => s.timer.status);
  const phase = useFocusStore((s) => s.timer.phase);
  const hydrated = useFocusStore((s) => s.hydrated);
  const lastFinished = useFocusStore((s) => s.lastFinished);
  const focusMode = useFocusStore((s) => s.focusMode);
  const shellRef = useRef<HTMLDivElement>(null);
  const secondsLeft = useClock((s) => s.secondsLeft);
  const seenSeq = useRef(0);

  // Restore on the client only (the store skips hydration), then settle: if the
  // deadline passed while the tab was closed, the phase completes as of then.
  useEffect(() => {
    void Promise.resolve(useFocusStore.persist.rehydrate()).then(() => {
      useFocusStore.getState().tick(Date.now(), { away: true });
      syncClock();
    });
    const unsub = useFocusStore.subscribe(() => syncClock());

    // Another tab changed the timer: pick it up instead of fighting it.
    const onStorage = (e: StorageEvent) => {
      if (e.key === "fy-focus") {
        void Promise.resolve(useFocusStore.persist.rehydrate()).then(() => syncClock());
      }
    };
    window.addEventListener("storage", onStorage);

    // Browsers keep audio locked until a gesture. The first click anywhere
    // unlocks it, so even a timer restored after a refresh can chime.
    const unlock = () => primeAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      unsub();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // The single ticker. 250 ms keeps the deadline check tight while the
  // seconds-resolution clock store keeps re-renders to one per second.
  useEffect(() => {
    if (status !== "running") return;
    const run = () => {
      useFocusStore.getState().tick(Date.now());
      syncClock();
    };
    run();
    const id = window.setInterval(run, 250);
    const onVisible = () => {
      if (!document.hidden) run();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [status]);

  // A phase just ended: chime, notify, announce. Not for "away" completions,
  // and not twice when two tabs are open.
  useEffect(() => {
    if (!lastFinished || lastFinished.seq === seenSeq.current) return;
    seenSeq.current = lastFinished.seq;
    const { settings } = useFocusStore.getState();
    const next = useFocusStore.getState().timer.phase;
    const focusDone = lastFinished.phase === "focus";

    if (lastFinished.away) {
      setAnnouncement(
        focusDone
          ? "Your focus session finished while you were away."
          : "Your break finished while you were away.",
      );
      return;
    }

    setAnnouncement(
      focusDone
        ? `Focus session complete. ${PHASE_LABELS[next]} next.`
        : "Break over. Ready to focus.",
    );

    let fresh = true;
    try {
      const key = `${lastFinished.phase}@${lastFinished.at}`;
      if (localStorage.getItem(CHIMED_KEY) === key) fresh = false;
      else localStorage.setItem(CHIMED_KEY, key);
    } catch {}
    if (!fresh) return;

    if (settings.chime) playChime(focusDone ? "focus-end" : "break-end", settings.volume);
    if (settings.notifications) {
      showNotification(
        focusDone ? "Session complete" : "Break over",
        focusDone ? `Nice work. ${PHASE_LABELS[next]} is next.` : "Ready when you are.",
      );
    }
  }, [lastFinished]);

  // While Focus Mode is open the page behind it is inert: no focus, no clicks,
  // and hidden from screen readers.
  useEffect(() => {
    shellRef.current?.toggleAttribute("inert", focusMode);
  }, [focusMode]);

  // Tab title shows the countdown while a timer is live. The page's own title
  // is recovered by stripping our prefix, because Next rewrites it on navigation.
  useEffect(() => {
    const base = document.title.replace(TITLE_PREFIX, "");
    if (!hydrated || status === "idle") {
      if (base !== document.title) document.title = base;
      return;
    }
    const mark = status === "paused" ? "⏸ " : "";
    document.title = `${mark}${formatClock(secondsLeft * 1000)} · ${phase === "focus" ? "" : "Break · "}${base}`;
  }, [hydrated, status, phase, secondsLeft]);

  return (
    <>
      <div ref={shellRef} className="contents">
        {children}
      </div>
      <FocusMode />
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </>
  );
}
