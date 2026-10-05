"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, Maximize2, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { setTaskDone } from "@/app/(app)/today/task-actions";
import { primeAudio } from "@/lib/focus/chime";
import { useSync } from "@/lib/focus/flush";
import { useClock, useFocusStore } from "@/lib/focus/store";
import { PHASE_LABELS, cupsFilled, formatClock, type Phase } from "@/lib/focus/timer";
import { openFocusMode } from "./focusModeControls";
import PixelSprite from "./pixel/PixelSprite";
import TimerRing from "./pixel/TimerRing";
import { CUP, CUP_PALETTE } from "./pixel/sprites";
import TimerSettings from "./TimerSettings";
import { useCheer } from "./useCheer";

const PHASES: Phase[] = ["focus", "short", "long"];

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  return t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(t.tagName);
}

export default function TimerCard({ linkSlot }: { linkSlot?: ReactNode }) {
  const router = useRouter();
  const timer = useFocusStore((s) => s.timer);
  const settings = useFocusStore((s) => s.settings);
  const hydrated = useFocusStore((s) => s.hydrated);
  const lastFinished = useFocusStore((s) => s.lastFinished);
  const { startOrResume, pause, reset, skip } = useFocusStore.getState();
  const secondsLeft = useClock((s) => s.secondsLeft);
  const progress = useClock((s) => s.progress);

  const sync = useSync();
  const cheer = useCheer(); // a short hop when a session you were watching completes
  // After a finished focus session that was linked to a task: "Done with it?"
  const [offer, setOffer] = useState<{ id: string; title: string } | null>(null);
  const [offerBusy, setOfferBusy] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);
  const seen = useRef(lastFinished?.seq ?? 0);

  useEffect(() => {
    if (!lastFinished || lastFinished.seq === seen.current) return;
    seen.current = lastFinished.seq;
    if (lastFinished.phase !== "focus" || lastFinished.away) return;
    const taskId = lastFinished.record?.taskId;
    if (taskId) {
      setOffer({ id: taskId, title: lastFinished.record?.label ?? "this task" });
      setOfferError(null);
    }
  }, [lastFinished]);

  const running = timer.status === "running";
  const isBreak = timer.phase !== "focus";
  const cups = cupsFilled(timer, settings);
  const left = Math.max(0, settings.cyclesBeforeLong - cups);

  async function markDone() {
    if (!offer) return;
    setOfferBusy(true);
    setOfferError(null);
    const res = await setTaskDone(offer.id, true);
    setOfferBusy(false);
    if (res.ok) {
      if (useFocusStore.getState().timer.link?.id === offer.id) useFocusStore.getState().setLink(null);
      setOffer(null);
      router.refresh();
    } else {
      // A deleted task must not stay linked: the next session would carry it.
      if (res.error === "not_found" && useFocusStore.getState().timer.link?.id === offer.id) {
        useFocusStore.getState().setLink(null);
      }
      setOfferError(
        res.error === "unauthenticated"
          ? "You're signed out. Sign in again to mark it done."
          : res.error === "not_found"
            ? "That task is already gone."
            : "Could not mark it done. Try again.",
      );
    }
  }

  function toggle() {
    if (running) pause();
    else {
      primeAudio(); // audio is only allowed after a gesture, so unlock it here
      startOrResume();
    }
  }

  // Space starts / pauses and F opens Focus Mode, unless the user is typing or
  // on a control that already uses the key. Focus Mode handles its own keys.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code !== "Space" && e.code !== "KeyF") return;
      if (isTypingTarget(e.target) || useFocusStore.getState().focusMode) return;
      e.preventDefault();
      if (e.code === "KeyF") return openFocusMode();
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
      className="relative rounded-3xl border border-[var(--border)] bg-bg-elevated shadow-card px-4 sm:px-8 pt-6 pb-7 w-full max-w-[460px]"
    >
      <button
        type="button"
        onClick={openFocusMode}
        aria-label="Enter Focus Mode"
        title="Focus Mode (F)"
        className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full flex items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink transition"
      >
        <Maximize2 size={16} aria-hidden />
      </button>
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
        {timer.link && !isBreak && (
          <div
            title={timer.link.title}
            className="mt-1.5 mx-auto max-w-[11rem] truncate rounded-full bg-accent-soft/60 px-2.5 py-0.5 font-ui text-[11px] text-cat-ink"
          >
            {timer.link.title}
          </div>
        )}
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

      {offer && !(running && !isBreak) && (
        <div
          role="group"
          aria-label="Mark the linked task done?"
          className="mt-5 rounded-2xl border border-accent bg-accent-soft/40 px-4 py-3 font-ui text-[13px] text-ink-primary"
        >
          <p>
            Nice work. Done with <span className="font-semibold">{offer.title}</span>?
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={markDone}
              disabled={offerBusy}
              className="flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-cat-ink hover:brightness-105 disabled:opacity-60 transition"
            >
              <Check size={14} aria-hidden /> {offerBusy ? "Saving…" : "Mark done"}
            </button>
            <button
              type="button"
              onClick={() => setOffer(null)}
              className="rounded-full px-3 py-1.5 text-[13px] text-ink-secondary hover:bg-bg-alt transition"
            >
              Not yet
            </button>
          </div>
          {offerError && (
            <p role="alert" className="mt-2 text-[12px] text-[var(--danger)]">
              {offerError}
            </p>
          )}
        </div>
      )}

      {linkSlot}

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
        {sync.pending > 0 && (
          <p role="status" className="font-ui text-[12px] text-ink-muted text-center">
            {sync.pending} session{sync.pending === 1 ? "" : "s"} waiting to save.{" "}
            {sync.lastError === "unauthenticated" || sync.lastError === "no_response"
              ? "Sign in again to save your focus sessions."
              : sync.lastError === "network"
                ? "You look offline; it will retry."
                : sync.syncing
                  ? "Saving…"
                  : sync.lastError
                    ? "Could not save yet; it will retry."
                    : ""}
          </p>
        )}
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
