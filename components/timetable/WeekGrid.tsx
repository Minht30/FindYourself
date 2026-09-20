"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { createBlock } from "@/app/(app)/today/actions";

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

// Map seeded category names to CSS-variable-backed tokens so blocks re-color
// when the theme flips. Falls back to the DB `color` hex for anything the user
// has renamed.
const CATEGORY_TOKEN: Record<string, string> = {
  "Deep Work": "var(--cat-deep)",
  "Meetings": "var(--cat-meeting)",
  "Learning": "var(--cat-learn)",
  "Rest": "var(--cat-rest)",
  "Personal": "var(--cat-personal)",
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SNAP_MIN = 15;
const DEFAULT_DURATION_MIN = 30;

function snap(min: number): number {
  return Math.round(min / SNAP_MIN) * SNAP_MIN;
}
function pxToMinutes(y: number): number {
  return DAY_START_HOUR * 60 + Math.round((y / HOUR_HEIGHT_PX) * 60);
}
function minutesToDate(day: Date, min: number): Date {
  const d = new Date(day);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(min);
  return d;
}
function fmtRange(startMin: number, endMin: number): string {
  return `${fmtMin(startMin)} – ${fmtMin(endMin)}`;
}
function fmtMin(m: number): string {
  const h24 = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, "0");
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const suffix = h24 < 12 ? "AM" : "PM";
  return `${h12}:${mm} ${suffix}`;
}

export default function WeekGrid({ weekStart, blocks, categories }: Props) {
  const [y, m, d] = weekStart.split("-").map(Number);
  const ws = new Date(y, m - 1, d);
  const days = weekDays(ws);
  const catById = new Map(categories.map((c) => [c.id, c]));

  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Drag-to-create state. Preview is the ghost the user sees; ref tracks the
  // authoritative values across pointermove closures.
  type DragPreview = { dayIndex: number; startMin: number; endMin: number };
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const dragRef = useRef<(DragPreview & { colRect: DOMRect }) | null>(null);

  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const hourRows = Array.from({ length: HOURS_IN_VIEW + 1 }, (_, i) => DAY_START_HOUR + i);

  function beginDrag(e: React.PointerEvent<HTMLDivElement>, dayIndex: number) {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-block]")) return;
    e.preventDefault();

    const col = e.currentTarget;
    const colRect = col.getBoundingClientRect();
    const yPx = e.clientY - colRect.top;
    const startMin = clamp(snap(pxToMinutes(yPx)), DAY_START_HOUR * 60, DAY_END_HOUR * 60 - SNAP_MIN);
    const endMin = Math.min(startMin + DEFAULT_DURATION_MIN, DAY_END_HOUR * 60);

    dragRef.current = { dayIndex, startMin, endMin, colRect };
    setDragPreview({ dayIndex, startMin, endMin });

    const onMove = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const yPx = ev.clientY - d.colRect.top;
      const rawMin = pxToMinutes(yPx);
      const snapped = clamp(snap(rawMin), DAY_START_HOUR * 60, DAY_END_HOUR * 60);
      const newEnd = Math.max(snapped, d.startMin + SNAP_MIN);
      if (newEnd !== d.endMin) {
        d.endMin = newEnd;
        setDragPreview({ dayIndex: d.dayIndex, startMin: d.startMin, endMin: newEnd });
      }
    };

    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);

      const d = dragRef.current;
      dragRef.current = null;
      setDragPreview(null);
      if (!d) return;
      if (d.endMin - d.startMin < SNAP_MIN) return;

      const day = days[d.dayIndex];
      const startDate = minutesToDate(day, d.startMin);
      const endDate = minutesToDate(day, d.endMin);
      const defaultCategoryId = categories[0]?.id ?? null;

      startTransition(async () => {
        const res = await createBlock({
          startsAt: startDate.toISOString(),
          endsAt: endDate.toISOString(),
          categoryId: defaultCategoryId,
          title: "New block",
        });
        if ("error" in res) {
          console.error("createBlock failed:", res.error);
          return;
        }
        router.refresh();
      });
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated shadow-card overflow-hidden select-none">
      {/* Header row */}
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

      {/* Body */}
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
              {formatHour(h)}
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

          const preview = dragPreview && dragPreview.dayIndex === i ? dragPreview : null;

          return (
            <div
              key={i}
              onPointerDown={(e) => beginDrag(e, i)}
              className={`relative border-l border-[var(--border)] cursor-crosshair ${
                today ? "bg-accent-soft/10" : ""
              }`}
              style={{ height: `${HOURS_IN_VIEW * HOUR_HEIGHT_PX}px` }}
            >
              {/* hour gridlines */}
              {hourRows.slice(1).map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-dashed border-[var(--border)] pointer-events-none"
                  style={{ top: `${(h - DAY_START_HOUR) * HOUR_HEIGHT_PX}px` }}
                />
              ))}

              {/* time blocks */}
              {dayBlocks.map((b) => (
                <BlockCard
                  key={b.id}
                  block={b}
                  day={day}
                  category={b.category_id ? catById.get(b.category_id) : undefined}
                />
              ))}

              {/* drag ghost */}
              {preview && (
                <div
                  className="absolute left-1 right-1 rounded-lg border-2 border-dashed border-accent bg-accent-soft/60 pointer-events-none flex items-center justify-center z-10"
                  style={{
                    top: `${minutesToPx(preview.startMin)}px`,
                    height: `${minutesToPx(preview.endMin) - minutesToPx(preview.startMin)}px`,
                  }}
                >
                  <span className="text-[10px] font-mono font-semibold text-accent-strong px-1.5 py-0.5 rounded bg-bg-elevated/80">
                    {fmtRange(preview.startMin, preview.endMin)}
                  </span>
                </div>
              )}

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

      {pending && (
        <div className="px-4 py-2 text-[11px] font-mono text-ink-muted bg-bg-alt border-t border-[var(--border)]">
          Saving block...
        </div>
      )}
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
      data-block
      className="absolute left-1 right-1 rounded-lg px-2 py-1.5 overflow-hidden text-cat-ink shadow-sm border-l-4 cursor-pointer"
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

function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x));
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
