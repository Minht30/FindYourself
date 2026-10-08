"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pause, Play, RotateCcw, Smartphone, SkipForward, X } from "lucide-react";
import { primeAudio } from "@/lib/audio/context";
import { useClock, useFocusStore } from "@/lib/focus/store";
import { PHASE_LABELS, cupsFilled, formatClock } from "@/lib/focus/timer";
import ClockDigits from "./ClockDigits";
import { closeFocusMode } from "./focusModeControls";
import SessionFlowers from "./SessionFlowers";
import TimerRing from "./TimerRing";
import { useCheer } from "./useCheer";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Dimmed full-screen view: the timer, what you are focusing on, and nothing
// else. It is a view over the same running timer, so leaving it (Esc, the X, or
// the browser's own fullscreen exit) never touches the timer. The margins stay
// empty on purpose: Phase 6 decides what lives there.
export default function FocusMode() {
  const on = useFocusStore((s) => s.focusMode);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !on) return null;
  return createPortal(<Overlay />, document.body);
}

function Overlay() {
  const timer = useFocusStore((s) => s.timer);
  const settings = useFocusStore((s) => s.settings);
  const secondsLeft = useClock((s) => s.secondsLeft);
  const progress = useClock((s) => s.progress);
  const cheer = useCheer();
  const { startOrResume, pause, reset, skip } = useFocusStore.getState();

  const rootRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  // The ring fills the room there is, between the page size and a comfortable maximum.
  const [ringMax, setRingMax] = useState(300);

  const running = timer.status === "running";
  const isBreak = timer.phase !== "focus";
  const cups = cupsFilled(timer, settings);
  // Before a focus session begins, a gentle "phone away" note (can be turned off).
  const reminder = settings.phoneReminder && timer.status === "idle" && timer.phase === "focus";
  const clock = formatClock(secondsLeft * 1000);

  // Take focus on open, give it back on close; stop the page behind scrolling.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    primaryRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      // One tick later: the provider lifts `inert` from the page in the same
      // commit, and an inert element cannot take focus.
      window.setTimeout(() => {
        if (opener && document.contains(opener)) opener.focus();
      }, 0);
    };
  }, []);

  useEffect(() => {
    const fit = () => setRingMax(Math.round(Math.min(440, Math.max(240, Math.min(window.innerWidth - 32, window.innerHeight - 380)))));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Esc (or F) leaves; Space starts / pauses; Tab stays inside the overlay.
  // The browser's own Esc exits real fullscreen without sending a keydown, so
  // fullscreenchange covers that route: either way the timer is untouched.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeFocusMode();
        return;
      }
      if (e.key === "Tab") {
        const nodes = rootRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (!nodes || nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !rootRef.current?.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !rootRef.current?.contains(active))) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const onControl = e.target instanceof HTMLElement && e.target.tagName === "BUTTON";
      if (e.code === "KeyF") {
        e.preventDefault();
        closeFocusMode();
      } else if (e.code === "Space" && !e.repeat && !onControl) {
        e.preventDefault();
        const s = useFocusStore.getState();
        if (s.timer.status === "running") s.pause();
        else {
          primeAudio();
          s.startOrResume();
        }
      }
    };
    const onFullscreen = () => {
      if (!document.fullscreenElement) closeFocusMode();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, []);

  function toggle() {
    if (running) pause();
    else {
      primeAudio();
      startOrResume();
    }
  }

  const status = cheer
    ? "nice work. rest now."
    : timer.status === "paused"
      ? "paused"
      : running
        ? isBreak
          ? "rest up"
          : "stay with it"
        : "ready when you are";

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Focus Mode"
      data-focus-surface
      className="fm-in fixed inset-0 z-[200] flex flex-col items-center justify-center px-4 py-6 text-ink-primary overflow-y-auto"
      style={{ background: "var(--fm-bg)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.45) 100%)" }}
      />

      <button
        type="button"
        onClick={closeFocusMode}
        aria-label="Leave Focus Mode"
        title="Leave Focus Mode (Esc)"
        className="fixed top-4 right-4 z-10 flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] px-3.5 py-2 font-ui text-[13px] text-ink-secondary hover:bg-accent-soft hover:text-cat-ink hover:border-accent transition"
      >
        <X size={15} aria-hidden /> <span className="hidden sm:inline">Leave</span>
      </button>

      <div className="relative z-[1] w-full flex flex-col items-center gap-5">
        <p className="font-ui text-[13px] font-semibold uppercase tracking-[0.18em] text-ink-secondary">
          {PHASE_LABELS[timer.phase]}
        </p>

        {/* the spirit rides half above the ring: room for it under the label */}
        <div className="mt-6 w-full">
          <TimerRing phase={timer.phase} status={timer.status} progress={progress} cheer={cheer} max={ringMax} spiritSize={68}>
          <div
            role="timer"
            aria-label={`${PHASE_LABELS[timer.phase]}, ${clock} remaining`}
            className="flex justify-center text-ink-primary"
          >
            <ClockDigits text={clock} big />
          </div>
          <div className="mt-2 font-ui text-[13px] text-ink-secondary h-5" aria-hidden>
            {status}
          </div>
  </TimerRing>
        </div>

        <div className="min-h-[2rem] max-w-[min(36rem,90vw)] text-center">
          {timer.link && (
            <p className="font-display text-xl sm:text-2xl text-ink-primary">
              <span className="font-ui text-[12px] uppercase tracking-[0.18em] text-ink-secondary block mb-1">
                Focusing on
              </span>
              {timer.link.title}
            </p>
          )}
        </div>

        {reminder && (
          <div
            role="note"
            className="max-w-[26rem] rounded-2xl border border-accent/60 bg-accent-soft/10 px-4 py-3 text-center font-ui text-[13px]"
          >
            <p className="flex items-center justify-center gap-2 font-semibold text-ink-primary">
              <Smartphone size={16} aria-hidden /> Stay away from your phone
            </p>
            <p className="mt-1 text-ink-secondary">
              Put it out of reach and silence notifications. When you are ready, start.
            </p>
            <button
              type="button"
              onClick={() => useFocusStore.getState().setSettings({ phoneReminder: false })}
              className="mt-2 text-[12px] text-ink-muted underline underline-offset-2 hover:text-ink-primary"
            >
              Do not remind me again
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            aria-label={`Reset ${PHASE_LABELS[timer.phase].toLowerCase()}`}
            title="Reset"
            disabled={timer.status === "idle"}
            className="w-11 h-11 rounded-full flex items-center justify-center border border-[var(--border-strong)] text-ink-secondary hover:bg-accent-soft hover:text-cat-ink hover:border-accent transition disabled:opacity-40 disabled:pointer-events-none"
          >
            <RotateCcw size={18} aria-hidden />
          </button>
          <button
            ref={primaryRef}
            type="button"
            onClick={toggle}
            className="min-w-[168px] h-12 px-6 rounded-full bg-accent text-cat-ink font-ui font-semibold text-[15px] shadow-glow hover:brightness-105 active:translate-y-px transition flex items-center justify-center gap-2"
          >
            {running ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}
            {running
              ? "Pause"
              : timer.status === "paused"
                ? "Resume"
                : isBreak
                  ? "Start break"
                  : reminder
                    ? "I am ready, start"
                    : "Start focus"}
          </button>
          <button
            type="button"
            onClick={skip}
            aria-label="Skip break"
            title={isBreak ? "Skip break" : "Skipping is for breaks. Reset to abandon a focus session."}
            disabled={!isBreak}
            className="w-11 h-11 rounded-full flex items-center justify-center border border-[var(--border-strong)] text-ink-secondary hover:bg-accent-soft hover:text-cat-ink hover:border-accent transition disabled:opacity-40 disabled:pointer-events-none"
          >
            <SkipForward size={18} aria-hidden />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <SessionFlowers done={cups} total={settings.cyclesBeforeLong} size={36} />
          <p className="font-ui text-[12px] text-ink-muted">Esc to leave. The timer keeps running.</p>
        </div>
      </div>
    </div>
  );
}
