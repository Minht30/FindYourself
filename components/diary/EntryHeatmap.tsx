"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatLongDate, isoWeekdayMon0, shiftISODate } from "@/lib/dates";
import { MOODS, type DiaryMood } from "@/lib/moods";

export type HeatmapDay = { mood: DiaryMood | null; chars: number };

type Props = {
  today: string;    // YYYY-MM-DD in the user's tz
  selected: string; // the day currently open in the diary
  entries: Record<string, HeatmapDay>;
};

const WEEKS = 53;
// The year grid: a label column, then one column per week. It stretches to the
// card, and below 720 px it keeps a floor of 10 px a square and scrolls instead.
const GRID_WIDTH = "min-w-[720px]";
const GRID_ROW = `${GRID_WIDTH} grid grid-cols-[28px_repeat(53,minmax(0,1fr))] min-[1400px]:grid-cols-[36px_repeat(53,minmax(0,1fr))] gap-[3px]`;
const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];
const MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });

// Intensity from entry length: 0 = nothing written.
function level(chars: number): 0 | 1 | 2 | 3 | 4 {
  if (chars <= 0) return 0;
  if (chars < 200) return 1;
  if (chars < 600) return 2;
  if (chars < 1500) return 3;
  return 4;
}

// The steps are theme tokens (--heat-1 to --heat-max in globals.css): day mixes
// the accent toward the surface, night is a ramp from dim blue to moon yellow.
const LEVEL_BG = [
  "var(--bg-alt)",
  "var(--heat-1)",
  "var(--heat-2)",
  "var(--heat-3)",
  "var(--heat-max)",
];

function describe(date: string, day: HeatmapDay | undefined): string {
  const when = formatLongDate(date);
  if (!day || (day.chars <= 0 && !day.mood)) return `${when}: no entry`;
  const mood = day.mood ? MOODS.find((m) => m.value === day.mood) : null;
  const words = day.chars > 0 ? `about ${Math.max(1, Math.round(day.chars / 6))} words` : "no words yet";
  return `${when}: ${mood ? `${mood.emoji} ${mood.label}, ` : ""}${words}`;
}

// GitHub-style year grid: columns are weeks (Monday first), rows weekdays.
// One tab stop; arrow keys walk days (↑↓) and weeks (←→), Enter opens.
export default function EntryHeatmap({ today, selected, entries }: Props) {
  const start = shiftISODate(today, -isoWeekdayMon0(today) - (WEEKS - 1) * 7);
  const inRange = (d: string) => d >= start && d <= today;

  const [focusDate, setFocusDate] = useState(inRange(selected) ? selected : today);
  const moved = useRef(false);
  const cells = useRef(new Map<string, HTMLAnchorElement>());
  const scroller = useRef<HTMLDivElement>(null);

  // Keep the roving tab stop on the open day as the user navigates.
  useEffect(() => {
    if (inRange(selected)) setFocusDate(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // Only move DOM focus after a key press, never on page load.
  useEffect(() => {
    if (moved.current) {
      cells.current.get(focusDate)?.focus();
      moved.current = false;
    }
  }, [focusDate]);

  // Narrow screens scroll the grid; start at the recent end.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  function onKeyDown(e: React.KeyboardEvent) {
    const delta = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 }[e.key];
    if (delta === undefined) return;
    e.preventDefault();
    const next = shiftISODate(focusDate, delta);
    if (!inRange(next)) return;
    moved.current = true;
    setFocusDate(next);
  }

  const weekStarts = Array.from({ length: WEEKS }, (_, w) => shiftISODate(start, w * 7));
  // Label each column where a month starts. The first column is a partial
  // month; drop its label if the next month starts within 3 columns, or the
  // two collide (months are otherwise always >= 4 columns apart).
  const monthLabels = weekStarts.map((ws, w) =>
    w === 0 || ws.slice(5, 7) !== weekStarts[w - 1].slice(5, 7)
      ? MONTH_FMT.format(new Date(`${ws}T00:00:00Z`))
      : null
  );
  const secondLabelAt = monthLabels.findIndex((l, w) => w > 0 && l !== null);
  if (secondLabelAt !== -1 && secondLabelAt < 3) monthLabels[0] = null;
  const written = Object.entries(entries).filter(([d, v]) => inRange(d) && v.chars > 0).length;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="font-display text-xl min-[1400px]:text-2xl">Your year in pages</h2>
        <span className="font-mono text-xs min-[1400px]:text-sm text-ink-muted">
          {written === 0
            ? "No pages yet. Your first entry will colour the first square."
            : `${written} ${written === 1 ? "day" : "days"} written in the last 12 months`}
        </span>
      </div>

      <div ref={scroller} className="overflow-x-auto pb-1 pr-8">
        {/* Month labels (decorative; every cell carries its full date). */}
        <div aria-hidden className={`${GRID_ROW} mb-[3px]`}>
          <span />
          {weekStarts.map((ws, w) => (
            <span key={ws} className="relative h-4 min-[1400px]:h-5">
              {monthLabels[w] && (
                <span className="absolute left-0 bottom-0 font-mono text-[10px] min-[1400px]:text-xs text-ink-muted whitespace-nowrap">
                  {monthLabels[w]}
                </span>
              )}
            </span>
          ))}
        </div>

        <div
          role="grid"
          aria-label="Diary entries over the last 12 months"
          onKeyDown={onKeyDown}
          className={`${GRID_WIDTH} flex flex-col gap-[3px]`}
        >
          {WEEKDAY_LABELS.map((label, d) => (
            <div key={d} role="row" className={GRID_ROW}>
              <span aria-hidden className="self-center font-mono text-[10px] min-[1400px]:text-xs text-ink-muted">
                {label}
              </span>
              {weekStarts.map((ws) => {
                const date = shiftISODate(ws, d);
                if (date > today) {
                  return <span key={date} role="gridcell" aria-hidden />;
                }
                const day = entries[date];
                const lvl = level(day?.chars ?? 0);
                const isSelected = date === selected;
                const label = describe(date, day);
                return (
                  <span key={date} role="gridcell" aria-selected={isSelected}>
                    <Link
                      ref={(el) => {
                        if (el) cells.current.set(date, el);
                        else cells.current.delete(date);
                      }}
                      href={`/diary/${date}`}
                      prefetch={false}
                      tabIndex={date === focusDate ? 0 : -1}
                      onFocus={() => setFocusDate(date)}
                      aria-label={label}
                      title={label}
                      className={`block w-full aspect-square rounded-[3px] min-[1400px]:rounded-[4px] transition hover:scale-110 ${
                        lvl === 0 ? "border border-[var(--border)]" : ""
                      } ${
                        isSelected
                          ? "outline outline-2 outline-offset-1 outline-[var(--ink-primary)]"
                          : date === today
                            ? "outline outline-1 outline-offset-1 outline-[var(--ink-muted)]"
                            : ""
                      }`}
                      style={{ background: LEVEL_BG[lvl] }}
                    />
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 font-mono text-[10px] min-[1400px]:text-xs text-ink-muted" aria-hidden>
        <span className="mr-1">Less</span>
        {LEVEL_BG.map((bg, i) => (
          <span
            key={i}
            className={`w-[10px] h-[10px] min-[1400px]:w-[14px] min-[1400px]:h-[14px] rounded-[3px] ${i === 0 ? "border border-[var(--border)]" : ""}`}
            style={{ background: bg }}
          />
        ))}
        <span className="ml-1">More</span>
      </div>
    </div>
  );
}
