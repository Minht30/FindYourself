import { formatDuration } from "@/lib/focus/week";
import { streakLine, weekRangeLabel, winsHeadline, type WeekWins } from "@/lib/wins";

// "Your week", shown on Sunday evening (the page decides when). Presentational
// and server-rendered; the real design comes with the Figma stage.
export default function WeeklyWinsCard({ wins }: { wins: WeekWins }) {
  const stats: { key: string; label: string; value: string }[] = [
    { key: "focus", label: "Focus", value: formatDuration(wins.focusSeconds) },
    { key: "tasks", label: "Tasks done", value: String(wins.tasksCompleted) },
    { key: "diary", label: "Diary days", value: `${wins.diaryDays} of 7` },
    { key: "streak", label: "Streak", value: streakLine(wins) },
  ];
  return (
    <section
      aria-label="Your week"
      data-testid="weekly-wins"
      className="rounded-2xl border border-accent/60 bg-bg-elevated px-4 py-4 font-ui"
    >
      <div className="flex items-baseline gap-2 flex-wrap">
        <h2 className="font-display text-xl">Your week</h2>
        <span className="font-mono text-[12px] text-ink-muted">{weekRangeLabel(wins.mondayISO)}</span>
      </div>
      <p className="mt-1 text-[14px] text-ink-secondary">{winsHeadline(wins)}</p>
      <dl className="mt-3 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.key} data-stat={s.key}>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{s.label}</dt>
            <dd className="mt-0.5 font-mono text-[15px] text-ink-primary tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
