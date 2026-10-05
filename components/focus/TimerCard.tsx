"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { primeAudio } from "@/lib/focus/chime";
import { useClock, useFocusStore } from "@/lib/focus/store";
import { PHASE_LABELS, cupsFilled, formatClock, type Phase } from "@/lib/focus/timer";
import PixelSprite from "./pixel/PixelSprite";
import TimerRing from "./pixel/TimerRing";
import { CUP, CUP_PALETTE } from "./pixel/sprites";
import TimerSettings from "./TimerSettings";

const PHASES: Phase[] = ["focus", "short", "long"];
const CHEER_MS = 4500;

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  return t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(t.tagName);
}

export default function TimerCard() {
  const timer = useFocusStore((s) => s.timer);
  const settings = useFocusStore((s) => s.settings);
  const hydrated = useFocusStore((s) => s.hydrated);
  const lastFinished = useFocusStore((s) => s.lastFinished);
  const { startOrResume, pause, reset, skip } = useFocusStore.getState();
  const secondsLeft = useClock((s) => s.secondsLeft);
  const progress = useClock((s) => s.progress);

  const [cheer, setCheer] = useState(false);
  const seen = useRef(lastFinished?.seq ?? 0);

  // A short hop when a focus session you were watching completes.
  useEffect(() => {
    if (!lastFinished || lastFinished.seq === seen.current) return;
    seen.current = lastFinished.seq;
    if (lastFinished.phase !== "focus" || lastFinished.away) return;
    setCheer(true);
    const t = window.setTimeout(() => setCheer(false), CHEER_MS);
    return () => window.clearTimeout(t);
  }, [lastFinished]);

  const running = timer.status === "running";
  const isBreak = timer.phase !== "focus";
  const cups = cupsFilled(timer, settings);
  const left = Math.max(0, settings.cyclesBeforeLong - cups);

  function toggle() {
    if (running) pause();
    else {
      primeAudio(); // audio is only allowed after a gesture, so unlock it here
      startOrResume();
    }
  }

  // Space starts / pauses, unless the user is typing or on a control that
  // already uses Space.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      const s = useFocusStore.getState();
      if (s.timer.status === "running") s.pause();
      else {
        primeAudio();
        s.startOrResume();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const startLabel =
    timer.status === "paused" ? "Resume" : isBreak ? `Start ${timer.phase === "long" ? "long " : ""}break` : "Start focus";

  return (
    <section
      aria-label="Pomodoro timer"
      className="rounded-3xl border border-[var(--border)] bg-bg-elevated shadow-card px-4 sm:px-8 pt-6 pb-7 w-full max-w-[460px]"
    >
      <div role="group" aria-label="Timer phase" className="flex justify-center gap-1.5 mb-5">
        {PHASES.map((p) => (
          <span
            key={p}
            aria-current={timer.phase === p ? "step" : undefined}
            className={`px-3 py-1 rounded-full text-[12px] font-ui font-semibold ${
              timer.phase === p ? "bg-accent-soft text-cat-ink" : "text-ink-muted"
            }`}
          >
            {PHASE_LABELS[p]}
          </span>
        ))}
      </div>

      <TimerRing phase={timer.phase} status={timer.status} progress={progress} cheer={cheer}>
        <div
          role="timer"
          aria-label={`${PHASE_LABELS[timer.phase]}, ${formatClock(secondsLeft * 1000)} remaining`}
          className="font-pixel font-medium text-ink-primary tabular-nums leading-none text-[17cqw]"
          style={{ visibility: hydrated ? "visible" : "hidden" }}
        >
          {formatClock(secondsLeft * 1000)}
        </div>
        <div className="mt-2 font-ui text-[12px] text-ink-secondary h-4" aria-hidden>
          {timer.status === "paused" ? "paused" : running ? (isBreak ? "rest up" : "stay with it") : "ready when you are"}
        </div>
      </TimerRing>

      <div className="mt-5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          aria-label={`Reset ${PHASE_LABELS[timer.phase].toLowerCase()}`}
          title="Reset"
          disabled={timer.status === "idle"}
          className="w-11 h-11 rounded-full flex items-center justify-center border border-[var(--border-strong)] text-ink-secondary hover:bg-accent-soft hover:text-cat-ink hover:border-accent transition disabled:opacity-40 disabled:pointer-events-none"
        >
          <RotateCcw size={18} />
        </button>

        <button
          type="button"
          onClick={toggle}
          className="min-w-[168px] h-12 px-6 rounded-full bg-accent text-cat-ink font-ui font-semibold text-[15px] shadow-glow hover:brightness-105 active:translate-y-px transition flex items-center justify-center gap-2"
        >
          {running ? <Pause size={18} /> : <Play size={18} />}
          {running ? "Pause" : startLabel}
        </button>

        <button
          type="button"
          onClick={skip}
          aria-label="Skip break"
          title={isBreak ? "Skip break" : "Skipping is for breaks. Reset to abandon a focus session."}
          disabled={!isBreak}
          className="w-11 h-11 rounded-full flex items-center justify-center border border-[var(--border-strong)] text-ink-secondary hover:bg-accent-soft hover:text-cat-ink hover:border-accent transition disabled:opacity-40 disabled:pointer-events-none"
        >
          <SkipForward size={18} />
        </button>
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <div role="img" aria-label={`${cups} of ${settings.cyclesBeforeLong} focus sessions done this round`} className="flex gap-2">
          {Array.from({ length: settings.cyclesBeforeLong }, (_, i) => (
            <PixelSprite key={i} frames={[i < cups ? CUP.full : CUP.empty]} palette={CUP_PALETTE} px={3} className="pix-cat" />
          ))}
        </div>
        <p className="font-ui text-[13px] text-ink-secondary">
          {timer.phase === "long"
            ? `${cups} down. Long break earned.`
            : `${cups} down, ${left} to go${left === 1 ? " before a long break" : ""}`}
        </p>
        {lastFinished?.away && (
          <p role="status" className="font-ui text-[12px] text-ink-muted">
            {lastFinished.phase === "focus" ? "A focus session finished while you were away." : "A break finished while you were away."}
          </p>
        )}
      </div>

      <TimerSettings />
    </section>
  );
}
