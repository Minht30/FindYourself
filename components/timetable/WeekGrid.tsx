"use client";

import { useEffect, useRef, useState } from "react";
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
import { createBlock, moveBlock } from "@/app/(app)/today/actions";
import BlockPopover from "./BlockPopover";

export type TimeBlockDTO = {
  id: string;
  title: string;
  starts_at: string; // ISO
  ends_at: string;   // ISO
  category_id: string | null;
  notes?: string | null;
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
// Pointer must travel this many pixels before we treat pointerdown as an
// intent to create a block. Prevents accidental blocks from stray clicks.
const DRAG_THRESHOLD_PX = 6;

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
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Popover-editor state
  const [editing, setEditing] = useState<{ block: TimeBlockDTO; anchor: DOMRect } | null>(null);

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
    const originClientY = e.clientY;
    const yPx = originClientY - colRect.top;
    const startMin = clamp(snap(pxToMinutes(yPx)), DAY_START_HOUR * 60, DAY_END_HOUR * 60 - SNAP_MIN);
    const endMin = Math.min(startMin + DEFAULT_DURATION_MIN, DAY_END_HOUR * 60);

    // Ghost is not shown yet — we're still deciding whether this is a drag or
    // a stray click. `armed` flips true once the pointer travels past
    // DRAG_THRESHOLD_PX, and only then do we render the preview + eventually
    // submit on pointerup.
    let armed = false;
    dragRef.current = { dayIndex, startMin, endMin, colRect };

    const onMove = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;

      if (!armed) {
        if (Math.abs(ev.clientY - originClientY) < DRAG_THRESHOLD_PX) return;
        armed = true;
        setDragPreview({ dayIndex: d.dayIndex, startMin: d.startMin, endMin: d.endMin });
      }

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
      cleanup();
      const d = dragRef.current;
      dragRef.current = null;
      setDragPreview(null);
      if (!d) return;

      // Stray click, not a real drag — do nothing so users can click around
      // without leaving accidental blocks everywhere.
      if (!armed) return;
      if (d.endMin - d.startMin < SNAP_MIN) return;

      const day = days[d.dayIndex];
      const startDate = minutesToDate(day, d.startMin);
      const endDate = minutesToDate(day, d.endMin);
      const defaultCategoryId = categories[0]?.id ?? null;

      void submitBlock({
        startsAt: startDate.toISOString(),
        endsAt: endDate.toISOString(),
        categoryId: defaultCategoryId,
        title: "New block",
      });
    };

    // Esc mid-drag cancels without creating anything.
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;
      cleanup();
      dragRef.current = null;
      setDragPreview(null);
    };

    function cleanup() {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      document.removeEventListener("keydown", onKey);
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
    document.addEventListener("keydown", onKey);
  }

  async function submitBlock(input: {
    startsAt: string;
    endsAt: string;
    categoryId: string | null;
    title: string;
  }) {
    setSaving(true);
    setErrorMsg(null);
    console.log("[WeekGrid] submitBlock →", input);
    try {
      const res = await createBlock(input);
      console.log("[WeekGrid] submitBlock ←", res);
      if ("error" in res) {
        setErrorMsg(res.error);
        return;
      }
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[WeekGrid] submitBlock threw:", err);
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
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
                  onOpen={(anchor) => setEditing({ block: b, anchor })}
                  onError={setErrorMsg}
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

      {saving && (
        <div className="px-4 py-2 text-[11px] font-mono text-ink-muted bg-bg-alt border-t border-[var(--border)]">
          Saving block...
        </div>
      )}
      {errorMsg && (
        <div className="px-4 py-2 text-[12px] font-ui text-danger bg-bg-alt border-t border-[var(--border)] flex items-center justify-between gap-4">
          <span>
            <strong className="font-mono uppercase text-[10px] tracking-wider mr-2">Error</strong>
            {errorMsg}
          </span>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-ink-muted hover:text-ink-primary text-[11px] font-ui"
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}

      {editing && (
        <BlockPopover
          block={editing.block}
          anchor={editing.anchor}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

const EDGE_HANDLE_PX = 8;

function BlockCard({
  block,
  day,
  category,
  onOpen,
  onError,
}: {
  block: TimeBlockDTO;
  day: Date;
  category: CategoryDTO | undefined;
  onOpen: (anchor: DOMRect) => void;
  onError: (msg: string | null) => void;
}) {
  const router = useRouter();

  const baseStartMin = minutesFromDayStart(new Date(block.starts_at), day);
  const baseEndMin = minutesFromDayStart(new Date(block.ends_at), day);

  // Optimistic offset shown while the user is dragging or the server call is
  // in flight. Cleared once the RSC refetch delivers the new times.
  const [dragOffset, setDragOffset] = useState<{ startMin: number; endMin: number } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // New authoritative times arrived — drop the optimistic offset.
    setDragOffset(null);
  }, [block.starts_at, block.ends_at]);

  const startMin = dragOffset?.startMin ?? baseStartMin;
  const endMin = dragOffset?.endMin ?? baseEndMin;
  const top = Math.max(minutesToPx(startMin), 0);
  const heightPx = Math.max(minutesToPx(endMin) - minutesToPx(startMin), 20);

  const colorVar =
    (category && CATEGORY_TOKEN[category.name]) || category?.color || "var(--cat-deep)";

  const timeLabel = `${fmtMin(startMin)} – ${fmtMin(endMin)}`;
  const canResize = heightPx >= 3 * EDGE_HANDLE_PX;

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    if (saving) return;
    e.stopPropagation();
    e.preventDefault();

    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const zone: "top" | "body" | "bottom" = !canResize
      ? "body"
      : offsetY < EDGE_HANDLE_PX
        ? "top"
        : offsetY > rect.height - EDGE_HANDLE_PX
          ? "bottom"
          : "body";

    const originClientY = e.clientY;
    let armed = false;
    let pendingStart = baseStartMin;
    let pendingEnd = baseEndMin;

    const onMove = (ev: PointerEvent) => {
      const dy = ev.clientY - originClientY;
      if (!armed) {
        if (Math.abs(dy) < DRAG_THRESHOLD_PX) return;
        armed = true;
      }
      // 15-min snap on delta
      const dMin = snap(Math.round((dy / HOUR_HEIGHT_PX) * 60));

      if (zone === "body") {
        pendingStart = baseStartMin + dMin;
        pendingEnd = baseEndMin + dMin;
        // clamp both ends inside view
        if (pendingStart < DAY_START_HOUR * 60) {
          const shift = DAY_START_HOUR * 60 - pendingStart;
          pendingStart += shift;
          pendingEnd += shift;
        }
        if (pendingEnd > DAY_END_HOUR * 60) {
          const shift = pendingEnd - DAY_END_HOUR * 60;
          pendingStart -= shift;
          pendingEnd -= shift;
        }
      } else if (zone === "top") {
        pendingStart = clamp(
          baseStartMin + dMin,
          DAY_START_HOUR * 60,
          baseEndMin - SNAP_MIN,
        );
        pendingEnd = baseEndMin;
      } else {
        pendingStart = baseStartMin;
        pendingEnd = clamp(
          baseEndMin + dMin,
          baseStartMin + SNAP_MIN,
          DAY_END_HOUR * 60,
        );
      }
      setDragOffset({ startMin: pendingStart, endMin: pendingEnd });
    };

    const onUp = () => {
      cleanup();
      if (!armed) {
        setDragOffset(null);
        onOpen(el.getBoundingClientRect());
        return;
      }
      // No-op if nothing changed
      if (pendingStart === baseStartMin && pendingEnd === baseEndMin) {
        setDragOffset(null);
        return;
      }

      const startDate = minutesToDate(day, pendingStart);
      const endDate = minutesToDate(day, pendingEnd);

      setSaving(true);
      onError(null);
      moveBlock({
        id: block.id,
        startsAt: startDate.toISOString(),
        endsAt: endDate.toISOString(),
      })
        .then((res) => {
          if (!res.ok) {
            onError(res.error);
            setDragOffset(null);
            return;
          }
          router.refresh();
        })
        .catch((err) => {
          onError(err instanceof Error ? err.message : String(err));
          setDragOffset(null);
        })
        .finally(() => setSaving(false));
    };

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;
      cleanup();
      setDragOffset(null);
    };

    function cleanup() {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      document.removeEventListener("keydown", onKey);
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
    document.addEventListener("keydown", onKey);
  }

  return (
    <div
      data-block
      onPointerDown={handlePointerDown}
      className={`absolute left-1 right-1 rounded-lg overflow-hidden text-cat-ink shadow-sm border-l-4 hover:brightness-105 transition ${
        dragOffset ? "cursor-grabbing ring-2 ring-accent/70" : "cursor-grab"
      } ${saving ? "opacity-70" : ""}`}
      style={{
        top: `${top}px`,
        height: `${heightPx}px`,
        background: colorVar,
        borderLeftColor: "rgba(0,0,0,0.25)",
      }}
      title={`${block.title}\n${timeLabel}`}
    >
      <div className="px-2 py-1.5">
        <div className="text-[12px] font-ui font-semibold leading-tight truncate">
          {block.title || "(untitled)"}
        </div>
        <div className="text-[10px] font-mono opacity-80 leading-tight">{timeLabel}</div>
      </div>
      {canResize && (
        <>
          <div
            className="absolute top-0 left-0 right-0 cursor-ns-resize"
            style={{ height: `${EDGE_HANDLE_PX}px` }}
            aria-hidden
          />
          <div
            className="absolute bottom-0 left-0 right-0 cursor-ns-resize"
            style={{ height: `${EDGE_HANDLE_PX}px` }}
            aria-hidden
          />
        </>
      )}
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
