"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { angleDeg, arcOffset, circumference, ringLabel, shouldSnap, spiritProgress, spiritState } from "@/lib/focus/arc";
import type { Phase, Status } from "@/lib/focus/timer";
import Spirit from "./Spirit";

// The round timer: a track, an arc that fills clockwise from the top as the phase
// goes on, and the spirit riding the end of the arc (it waits at the top while idle,
// hovers when paused, sleeps through a break, sparkles when a session ends).
// `children` is the clock, centred inside. The ring is drawn 260 units wide and
// scales to its container; `max` caps it (the page uses 260, Focus Mode more).
const SIZE = 260;
const CENTRE = SIZE / 2;
const RADIUS = 118;
const STROKE = 8;
const LENGTH = circumference(RADIUS);

export default function TimerRing({
  phase,
  status,
  progress,
  cheer = false,
  max = 260,
  spiritSize = 62,
  children,
}: {
  phase: Phase;
  status: Status;
  progress: number;
  cheer?: boolean;
  max?: number;
  spiritSize?: number;
  children?: ReactNode;
}) {
  const state = spiritState(phase, status, cheer);
  const where = spiritProgress(state, progress);
  const angle = angleDeg(where);
  const isBreak = phase !== "focus";

  // Between two ticks the arc and the spirit glide; a big step (reset, a new phase,
  // a page opened part-way through) makes them jump instead of sweeping round.
  const last = useRef({ arc: progress, spirit: where });
  const snap = shouldSnap(last.current.arc, progress) || shouldSnap(last.current.spirit, where);
  useEffect(() => {
    last.current = { arc: progress, spirit: where };
  }, [progress, where]);

  return (
    <div className="timer-ring" data-snap={snap ? "" : undefined} style={{ "--ring-max": `${max}px` } as CSSProperties}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="block h-full w-full overflow-visible" role="img" aria-label={ringLabel(phase, progress)}>
        <circle cx={CENTRE} cy={CENTRE} r={RADIUS} fill="none" stroke="var(--border-strong)" strokeWidth={STROKE} />
        <circle
          className="ring-arc"
          cx={CENTRE}
          cy={CENTRE}
          r={RADIUS}
          fill="none"
          // accent-strong: the day yellow is too pale on the cream glass to count as a graphic (3:1)
          stroke={isBreak ? "var(--success)" : "var(--accent-strong)"}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${LENGTH} ${LENGTH}`}
          strokeDashoffset={arcOffset(progress, RADIUS)}
          transform={`rotate(-90 ${CENTRE} ${CENTRE})`}
          opacity={progress > 0 ? 1 : 0}
        />
      </svg>

      <div className="ring-orbit" style={{ transform: `rotate(${angle}deg)` }}>
        <div className="ring-seat">
          <div className="ring-upright" style={{ transform: `rotate(${-angle}deg)` }}>
            <Spirit state={state} size={spiritSize} />
          </div>
        </div>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <div className="pointer-events-auto">{children}</div>
      </div>
    </div>
  );
}
