import { streakLabel, streakMessage, type StreakView } from "@/lib/streak";

// The streak, as the database computed it and lib/streak.ts read it for today.
// Presentational and server-rendered; the real design comes with the Figma stage.
export default function StreakChip({ view }: { view: StreakView }) {
  const state = view.broken ? "broken" : view.current === 0 ? "none" : view.doneToday ? "done" : "at-risk";
  return (
    <section
      aria-label="Streak"
      data-streak-state={state}
      data-streak-current={view.current}
      className="rounded-2xl border border-[var(--border)] bg-bg-elevated px-4 py-3 font-ui"
    >
      <div className="flex items-baseline gap-2">
        <span aria-hidden="true">🔥</span>
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-ink-muted">Streak</h2>
        <span className="font-mono text-lg font-semibold text-ink-primary tabular-nums" data-testid="streak-number">
          {streakLabel(view.current)}
        </span>
        {view.best > view.current && view.best > 1 ? (
          <span className="ml-auto text-[12px] text-ink-muted tabular-nums">best {streakLabel(view.best)}</span>
        ) : null}
      </div>
      <p className="mt-1 text-[13px] text-ink-secondary">{streakMessage(view)}</p>
    </section>
  );
}
