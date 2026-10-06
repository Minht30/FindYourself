"use client";

import Link from "next/link";
import { useClock, useFocusStore } from "@/lib/focus/store";
import { PHASE_LABELS, formatClock } from "@/lib/focus/timer";
import PixelClock from "./pixel/PixelClock";
import PixelSprite from "./pixel/PixelSprite";
import { CAT_PALETTE, HEAD_ONLY, HEAD_ONLY_CLOSED } from "./pixel/sprites";

// The header's view of a live timer: a tiny cat head, the clock and a state
// dot. It only exists while a timer is running or paused, so an idle app has
// no extra chrome. Click to open /focus.
export default function TimerChip() {
  const status = useFocusStore((s) => s.timer.status);
  const phase = useFocusStore((s) => s.timer.phase);
  const hydrated = useFocusStore((s) => s.hydrated);
  const secondsLeft = useClock((s) => s.secondsLeft);
  if (!hydrated || status === "idle") return null;

  const clock = formatClock(secondsLeft * 1000);
  const label = `${PHASE_LABELS[phase]} timer, ${clock} remaining${status === "paused" ? ", paused" : ""}`;
  const isBreak = phase !== "focus";
  return (
    <Link
      href="/focus"
      aria-label={`${label}. Open Focus`}
      title={label}
      className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border border-[var(--border-strong)] bg-bg-alt text-ink-primary hover:bg-accent-soft hover:text-cat-ink hover:border-accent transition"
    >
      <PixelSprite frames={[isBreak ? HEAD_ONLY_CLOSED : HEAD_ONLY]} palette={CAT_PALETTE} px={2} className="pix-cat" />
      <PixelClock text={clock} unit="2px" />
      <span
        aria-hidden
        className={`w-2 h-2 rounded-full ${status === "paused" ? "bg-ink-muted" : isBreak ? "bg-[var(--pix-break)]" : "bg-accent animate-pulse motion-reduce:animate-none"}`}
      />
    </Link>
  );
}
