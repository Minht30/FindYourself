import { ringStroke, type Ring } from "@/lib/rings";
import FocusGoalSelect from "./FocusGoalSelect";

const SIZE = 76;
const STROKE = 8;
const R = (SIZE - STROKE) / 2;
const CENTER = SIZE / 2;

function RingFigure({ ring }: { ring: Ring }) {
  const { circumference, dashOffset } = ringStroke(ring.fraction, R);
  const arc = ring.complete ? "var(--success)" : "var(--accent-strong)";
  return (
    <figure
      data-ring={ring.key}
      data-fraction={ring.fraction.toFixed(3)}
      data-complete={ring.complete ? "true" : "false"}
      className="flex w-[7.5rem] flex-col items-center gap-1 text-center"
    >
      <svg role="img" aria-label={ring.aria} width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={CENTER} cy={CENTER} r={R} fill="none" stroke="var(--border)" strokeWidth={STROKE} />
        {ring.fraction > 0 ? (
          <circle
            cx={CENTER}
            cy={CENTER}
            r={R}
            fill="none"
            stroke={arc}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
          />
        ) : null}
      </svg>
      <figcaption>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{ring.label}</div>
        <div className="font-mono text-[13px] text-ink-primary tabular-nums" data-ring-value>
          {ring.value}
        </div>
        <div className="text-[12px] text-ink-secondary">{ring.detail}</div>
      </figcaption>
    </figure>
  );
}

// Today at a glance: tasks done, focus time against the daily goal, the diary.
// Server-rendered and presentational (the picker is the only client piece);
// the real design comes with the Figma stage.
export default function ProgressRings({ rings, goalMinutes }: { rings: Ring[]; goalMinutes: number }) {
  return (
    <section
      aria-label="Today's progress"
      className="rounded-2xl border border-[var(--border)] bg-bg-elevated px-4 py-3 font-ui"
    >
      <h2 className="text-[12px] font-semibold uppercase tracking-wider text-ink-muted">Today</h2>
      <div className="mt-2 flex flex-wrap items-start justify-start gap-x-4 gap-y-3">
        {rings.map((r) => (
          <RingFigure key={r.key} ring={r} />
        ))}
      </div>
      <div className="mt-3">
        <FocusGoalSelect goalMinutes={goalMinutes} />
      </div>
    </section>
  );
}
