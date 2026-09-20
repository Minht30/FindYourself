"use client";

import { useEffect, useState } from "react";
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  HOUR_HEIGHT_PX,
  HOURS_IN_VIEW,
  formatHour,
  isSameDay,
  minutesFromDayStart,
  minutesToPx,
  weekDays,
} from "@/lib/dates";

export type TimeBlockDTO = {
  id: string;
  title: string;
  starts_at: string; // ISO
  ends_at: string;   // ISO
  category_id: string | null;
};

export type CategoryDTO = {
  id: string;
  name: string;
  color: string;
};

type Props = {
  weekStart: string;      // ISO date-only, e.g. "2026-09-14"
  blocks: TimeBlockDTO[];
  categories: CategoryDTO[];
};

// Map seeded category names to CSS-variable-backed Tailwind tokens so blocks
// re-color when the theme flips. Falls back to the DB `color` hex for anything
// the user has renamed.
const CATEGORY_TOKEN: Record<string, string> = {
  "Deep Work": "var(--cat-deep)",
  "Meetings": "var(--cat-meeting)",
  "Learning": "var(--cat-learn)",
  "Rest": "var(--cat-rest)",
  "Personal": "var(--cat-personal)",
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function WeekGrid({ weekStart, blocks, categories }: Props) {
  // weekStart comes in as "YYYY-MM-DD" — treat as local midnight so day column
  // math stays in the user's tz.
  const [y, m, d] = weekStart.split("-").map(Number);
  const ws = new Date(y, m - 1, d);
  const days = weekDays(ws);

  // Live-updating "now" — refresh once a minute so the NOW line drifts down.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const catById = new Map(categories.map((c) => [c.id, c]));

  const hourRows = Array.from({ length: HOURS_IN_VIEW + 1 }, (_, i) => DAY_START_HOUR + i);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated shadow-card overflow-hidden">
      {/* Header row: blank corner + 7 day labels */}
      <div
        className="grid border-b border-[var(--border)] bg-bg-alt"
        style={{ gridTemplateColumns: `72px repeat(7, minmax(0, 1fr))` }}
      >
        <div className="p-2 text-[11px] font-mono text-ink-muted uppercase tracking-wider">
          {tzAbbrev()}
        </div>
        {days.map((day, i) => {
          const today = now ? isSameDay(day, now) : false;
          return (
            <div
              key={i}
              className={`px-3 py-2 flex flex-col items-center gap-0.5 border-l border-[var(--border)] ${
                today ? "bg-accent-soft/40" : ""
              }`}
            >
              <span className="text-[11px] font-ui uppercase tracking-wider text-ink-muted">
                {DAY_NAMES[i]}
              </span>
              <span
                className={`font-display text-xl ${
                  today ? "text-accent-strong font-bold" : "text-ink-primary"
                }`}
              >
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Grid body */}
      <div
        className="grid relative"
        style={{ gridTemplateColumns: `72px repeat(7, minmax(0, 1fr))` }}
      >
        {/* Time axis */}
        <div className="border-r border-[var(--border)]">
          {hourRows.map((h) => (
            <div
              key={h}
              className="text-[11px] font-mono text-ink-muted pr-2 text-right leading-none pt-1"
              style={{ height: `${HOUR_HEIGHT_PX}px` }}
            >
              {h === DAY_START_HOUR ? "" : formatHour(h)}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day, i) => {
          const today = now ? isSameDay(day, now) : false;
          const dayBlocks = blocks.filter((b) => {
            const s = new Date(b.starts_at);
            return isSameDay(s, day);
          });

          const nowMinutes = today && now ? minutesFromDayStart(now, day) : null;
          const showNowLine =
            nowMinutes !== null &&
            nowMinutes >= DAY_START_HOUR * 60 &&
            nowMinutes <= DAY_END_HOUR * 60;

          return (
            <div
              key={i}
              className={`relative border-l border-[var(--border)] ${
                today ? "bg-accent-soft/10" : ""
              }`}
              style={{ height: `${HOURS_IN_VIEW * HOUR_HEIGHT_PX}px` }}
            >
              {/* hour gridlines */}
              {hourRows.slice(1).map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-dashed border-[var(--border)]"
                  style={{ top: `${(h - DAY_START_HOUR) * HOUR_HEIGHT_PX}px` }}
                />
              ))}

              {/* time blocks */}
              {dayBlocks.map((b) => (
                <BlockCard key={b.id} block={b} day={day} category={b.category_id ? catById.get(b.category_id) : undefined} />
              ))}

              {/* NOW line */}
              {showNowLine && nowMinutes !== null && (
                <div
                  className="absolute left-0 right-0 flex items-center pointer-events-none z-20"
                  style={{ top: `${minutesToPx(nowMinutes)}px` }}
                  aria-label="Current time"
                >
                  <span className="absolute -left-1 w-2 h-2 rounded-full bg-danger" />
                  <span className="w-full border-t-2 border-danger" />
                  <span className="absolute -top-2.5 left-2 text-[10px] font-mono font-bold uppercase tracking-wider text-danger bg-bg-elevated px-1 rounded">
                    Now
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BlockCard({
  block,
  day,
  category,
}: {
  block: TimeBlockDTO;
  day: Date;
  category: CategoryDTO | undefined;
}) {
  const start = new Date(block.starts_at);
  const end = new Date(block.ends_at);
  const startMin = minutesFromDayStart(start, day);
  const endMin = minutesFromDayStart(end, day);
  const top = Math.max(minutesToPx(startMin), 0);
  const heightPx = Math.max(minutesToPx(endMin) - minutesToPx(startMin), 20);

  const colorVar =
    (category && CATEGORY_TOKEN[category.name]) || category?.color || "var(--cat-deep)";

  const timeLabel = `${fmtClock(start)} – ${fmtClock(end)}`;

  return (
    <div
      className="absolute left-1 right-1 rounded-lg px-2 py-1.5 overflow-hidden text-cat-ink shadow-sm border-l-4"
      style={{
        top: `${top}px`,
        height: `${heightPx}px`,
        background: colorVar,
        borderLeftColor: "rgba(0,0,0,0.25)",
      }}
      title={`${block.title}\n${timeLabel}`}
    >
      <div className="text-[12px] font-ui font-semibold leading-tight truncate">
        {block.title || "(untitled)"}
      </div>
      <div className="text-[10px] font-mono opacity-80 leading-tight">{timeLabel}</div>
    </div>
  );
}

function fmtClock(d: Date): string {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function tzAbbrev(): string {
  try {
    const parts = new Intl.DateTimeFormat([], { timeZoneName: "short" }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}
