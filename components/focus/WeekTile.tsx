import { Check, CircleDashed } from "lucide-react";
import { formatDuration, type WeekSummary } from "@/lib/focus/week";
import PixelSprite from "./pixel/PixelSprite";
import { CAT_PALETTE, CAT_SLEEP } from "./pixel/sprites";

export type RecentSession = {
  id: string;
  started_at: string;
  duration_seconds: number;
  planned_seconds: number;
  completed: boolean;
  label: string | null;
};

// One pixel block = 15 minutes; a column stops at 16 blocks (4 h) however much
// more was focused (the label and the aria text still carry the real number).
const BLOCK_SECONDS = 15 * 60;
const MAX_BLOCKS = 16;
const BLOCK = 10;
const GAP = 3;
const COL_W = BLOCK;
const COL_H = MAX_BLOCKS * (BLOCK + GAP) - GAP;

// This week's focus time (US-5.3) and the latest sessions. Server-rendered and
// presentational on purpose: Phase 8's dashboard can lift the tile unchanged.
export default function WeekTile({
  week,
  recent,
  timeZone,
}: {
  week: WeekSummary;
  recent: RecentSession[];
  timeZone: string;
}) {
  const when = new Intl.DateTimeFormat("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone });
  const empty = week.sessions === 0 && recent.length === 0;

  return (
    <section
      aria-label="Focus this week"
      className="w-full max-w-[460px] rounded-3xl border border-[var(--border)] bg-bg-elevated shadow-card px-4 sm:px-8 py-6"
    >
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl">This week</h2>
          <p className="mt-0.5 font-ui text-[13px] text-ink-secondary">
            {week.sessions === 0
              ? "No sessions yet"
              : `${week.sessions} session${week.sessions === 1 ? "" : "s"}, ${week.completed} finished${
                  week.sessions - week.completed > 0 ? ` and ${week.sessions - week.completed} stopped early` : ""
                }`}
          </p>
        </div>
        <p
          className="shrink-0 whitespace-nowrap font-mono font-semibold text-[26px] sm:text-[30px] leading-none text-ink-primary tabular-nums"
          aria-label={`Total focus time this week: ${formatDuration(week.totalSeconds)}`}
        >
          {formatDuration(week.totalSeconds)}
        </p>
      </div>

      <div role="group" aria-label="Focus time per day this week" className="mt-5 grid grid-cols-7 gap-1.5">
        {week.days.map((d) => {
          const lit = Math.min(MAX_BLOCKS, Math.ceil(d.seconds / BLOCK_SECONDS));
          const text = `${d.label}: ${formatDuration(d.seconds)}, ${d.sessions} session${d.sessions === 1 ? "" : "s"}${
            d.isToday ? " (today)" : ""
          }`;
          return (
            <div key={d.iso} className="flex flex-col items-center gap-1.5" role="img" aria-label={text} title={text}>
              <svg
                width={COL_W}
                height={COL_H}
                viewBox={`0 0 ${COL_W} ${COL_H}`}
                shapeRendering="crispEdges"
                aria-hidden
                className={d.isFuture ? "opacity-50" : ""}
              >
                {Array.from({ length: MAX_BLOCKS }, (_, i) => {
                  // row 0 is the top of the column; lit blocks grow upward from the bottom
                  const fromBottom = MAX_BLOCKS - 1 - i;
                  const on = fromBottom < lit;
                  return (
                    <rect
                      key={i}
                      x={0}
                      y={i * (BLOCK + GAP)}
                      width={BLOCK}
                      height={BLOCK}
                      style={{ fill: on ? (d.isToday ? "var(--accent-strong)" : "var(--accent)") : "var(--pix-track)" }}
                    />
                  );
                })}
              </svg>
              <span
                className={`font-ui text-[11px] ${d.isToday ? "font-semibold text-ink-primary" : "text-ink-muted"}`}
                aria-hidden
              >
                {d.label}
              </span>
              <span
                className={`h-[3px] w-4 rounded-full ${d.isToday ? "bg-[var(--accent-strong)]" : "bg-transparent"}`}
                aria-hidden
              />
            </div>
          );
        })}
      </div>
      <p className="mt-1 font-ui text-[11px] text-ink-muted text-center">One block is 15 minutes.</p>

      {week.todaySessions > 0 && (
        <p className="mt-3 font-ui text-[13px] text-ink-secondary text-center">
          Today: {week.todaySessions} session{week.todaySessions === 1 ? "" : "s"}
        </p>
      )}

      <div className="mt-6 pt-4 border-t border-[var(--border)]">
        <h3 className="text-[12px] font-ui font-semibold uppercase tracking-wider text-ink-muted">Recent sessions</h3>
        {empty ? (
          <div className="mt-4 flex flex-col items-center gap-3 text-center">
            <PixelSprite frames={[CAT_SLEEP[0]]} palette={CAT_PALETTE} px={3} className="pix-cat" />
            <p className="font-ui text-[14px] text-ink-secondary max-w-[18rem]">
              Nothing here yet. Your first session will light up the first block.
            </p>
          </div>
        ) : (
          // flex column, not grid: a grid track grows to a long label and pushes the row past the card
          <ul className="mt-3 flex flex-col gap-1.5">
            {recent.map((r) => (
              <li
                key={r.id}
                className="flex min-w-0 items-center gap-3 rounded-xl px-3 py-2 font-ui text-[13px] hover:bg-bg-alt transition"
              >
                <span
                  className={`shrink-0 ${r.completed ? "text-[var(--success)]" : "text-ink-muted"}`}
                  role="img"
                  aria-label={r.completed ? "Finished" : "Stopped early"}
                >
                  {r.completed ? <Check size={15} aria-hidden /> : <CircleDashed size={15} aria-hidden />}
                </span>
                <span className="min-w-0 flex-1 truncate text-ink-primary">
                  {r.label ?? <span className="text-ink-secondary">Focus session</span>}
                </span>
                {/* phone: duration over time, so the label keeps room; wider: one line */}
                <span className="shrink-0 flex flex-col items-end leading-tight sm:flex-row sm:items-center sm:gap-3">
                  <span className="text-ink-secondary tabular-nums">
                    {r.completed
                      ? formatDuration(r.duration_seconds)
                      : `${formatDuration(r.duration_seconds)} of ${formatDuration(r.planned_seconds)}`}
                  </span>
                  <time
                    dateTime={r.started_at}
                    className="text-[11px] sm:text-[13px] sm:w-[5.5rem] sm:text-right text-ink-muted tabular-nums"
                  >
                    {when.format(new Date(r.started_at))}
                  </time>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
