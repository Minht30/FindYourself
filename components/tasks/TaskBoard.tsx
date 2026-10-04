"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, PawPrint, Plus, X } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createTask, deleteTask, moveTask } from "@/app/(app)/today/task-actions";
import { categoryColor } from "@/lib/categories";
import {
  BUCKETS,
  BUCKET_LABELS,
  bucketOf,
  isBucket,
  isOverdue,
  scheduledForBucket,
  type Bucket,
  type TaskDTO,
} from "@/lib/tasks";
import { formatLongDate, shiftISODate } from "@/lib/dates";

type Category = { id: string; name: string; color: string };
type Columns = Record<Bucket, TaskDTO[]>;

type Props = {
  tasks: TaskDTO[]; // open tasks only
  categories: Category[];
  today: string;
};

const ERROR_COPY: Record<string, string> = {
  unauthenticated: "You're signed out. Sign in again to change tasks.",
  empty_title: "Give the task a name first.",
  title_too_long: "Keep the title under 200 characters.",
};

const SHORT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const shortDate = (iso: string) => SHORT_DATE.format(new Date(`${iso}T00:00:00Z`));

function groupTasks(tasks: TaskDTO[], today: string): Columns {
  const cols: Columns = { today: [], tomorrow: [], backlog: [] };
  for (const t of tasks) cols[bucketOf(t.scheduled_for, today)].push(t);
  // Oldest date first (overdue on top of Today), then manual order.
  for (const b of BUCKETS) {
    cols[b].sort(
      (a, z) => (a.scheduled_for ?? "").localeCompare(z.scheduled_for ?? "") || a.sort_order - z.sort_order
    );
  }
  return cols;
}

export default function TaskBoard({ tasks, categories, today }: Props) {
  const router = useRouter();
  const serverColumns = useMemo(() => groupTasks(tasks, today), [tasks, today]);
  const [columns, setColumns] = useState<Columns>(serverColumns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const origin = useRef<{ bucket: Bucket; index: number } | null>(null);
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // The settle-into-place animation is decoration: skip it for users who
  // prefer reduced motion. (dnd-kit keeps the source card hidden until it
  // finishes, so nothing about board state may depend on it.)
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Adopt the server's list whenever it changes (after a refresh), except
  // mid-drag, when the local columns are the source of truth.
  const dragging = activeId !== null;
  useEffect(() => {
    if (!dragging) setColumns(serverColumns);
  }, [serverColumns, dragging]);

  const sensors = useSensors(
    // 6 px, like every other drag in the app: a click still clicks.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Long-press on touch so a swipe still scrolls the drawer.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function bucketOfId(id: UniqueIdentifier, cols: Columns = columns): Bucket | null {
    if (isBucket(id)) return id;
    return BUCKETS.find((b) => cols[b].some((t) => t.id === id)) ?? null;
  }
  function taskById(id: UniqueIdentifier): TaskDTO | undefined {
    for (const b of BUCKETS) {
      const t = columns[b].find((x) => x.id === id);
      if (t) return t;
    }
    return undefined;
  }

  function onDragStart({ active }: DragStartEvent) {
    const b = bucketOfId(active.id);
    if (!b) return;
    origin.current = { bucket: b, index: columns[b].findIndex((t) => t.id === active.id) };
    setActiveId(String(active.id));
    setMoveError(null);
  }

  // Crossing into another bucket: move the card there live, at the hovered
  // position (or the end, when hovering the bucket itself).
  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    setColumns((cols) => {
      const from = bucketOfId(active.id, cols);
      const to = bucketOfId(over.id, cols);
      if (!from || !to || from === to) return cols;
      const moving = cols[from].find((t) => t.id === active.id);
      if (!moving) return cols;
      const overIndex = cols[to].findIndex((t) => t.id === over.id);
      const insertAt = overIndex === -1 ? cols[to].length : overIndex;
      return {
        ...cols,
        [from]: cols[from].filter((t) => t.id !== active.id),
        [to]: [...cols[to].slice(0, insertAt), moving, ...cols[to].slice(insertAt)],
      };
    });
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    const start = origin.current;
    origin.current = null;
    const to = bucketOfId(active.id);
    if (!over || !to || !start) {
      setActiveId(null);
      setColumns(serverColumns);
      return;
    }

    // Reorder within the final bucket.
    let list = columns[to];
    const from = list.findIndex((t) => t.id === active.id);
    const overIndex = list.findIndex((t) => t.id === over.id);
    if (overIndex !== -1 && overIndex !== from) list = arrayMove(list, from, overIndex);
    const index = list.findIndex((t) => t.id === active.id);

    if (to === start.bucket && index === start.index) {
      setActiveId(null);
      return; // dropped where it started
    }

    // The card takes the bucket's date; its neighbours for ordering are the
    // nearest cards that share that date (overdue cards sort by date anyway).
    const newDate = scheduledForBucket(to, today);
    const moved = { ...list[index], scheduled_for: newDate };
    list = [...list.slice(0, index), moved, ...list.slice(index + 1)];
    const sameDay = (t: TaskDTO) => t.id !== moved.id && t.scheduled_for === newDate;
    const prev = list.slice(0, index).reverse().find(sameDay) ?? null;
    const next = list.slice(index + 1).find(sameDay) ?? null;

    setColumns((cols) => ({ ...cols, [to]: list }));
    setActiveId(null);

    const res = await moveTask(moved.id, to, prev?.id ?? null, next?.id ?? null).catch(
      () => ({ ok: false, error: "network" }) as const
    );
    if (res.ok) {
      router.refresh();
    } else {
      setColumns(serverColumns);
      setMoveError(
        res.error === "network"
          ? "Couldn't reach the server. The task is back where it was."
          : `${ERROR_COPY[res.error] ?? `Couldn't move the task (${res.error}).`} The task is back where it was.`
      );
    }
  }

  function onDragCancel() {
    origin.current = null;
    setActiveId(null);
    setColumns(serverColumns);
  }

  // Screen-reader narration in words, with titles and bucket names.
  function where(id: UniqueIdentifier): string {
    const b = bucketOfId(id);
    if (!b) return "nowhere";
    if (isBucket(id)) return BUCKET_LABELS[b];
    return `position ${columns[b].findIndex((t) => t.id === id) + 1} in ${BUCKET_LABELS[b]}`;
  }
  const title = (id: UniqueIdentifier) => taskById(id)?.title ?? "task";
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${title(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${title(active.id)} is over ${where(over.id)}.` : `${title(active.id)} is not over a bucket.`,
    onDragEnd: ({ active, over }) =>
      over ? `Dropped ${title(active.id)} at ${where(active.id)}.` : `Dropped ${title(active.id)}.`,
    onDragCancel: ({ active }) => `Move cancelled. ${title(active.id)} is back where it was.`,
  };

  const active = activeId ? taskById(activeId) : undefined;
  const openCount = BUCKETS.reduce((n, b) => n + columns[b].length, 0);

  return (
    <div className="space-y-5 font-ui">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl">Tasks</h2>
        <span className="font-mono text-xs text-ink-muted">{openCount} open</span>
      </div>
      {moveError && (
        <p role="alert" className="text-[11px] text-[var(--danger)]">
          {moveError}
        </p>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              "To move a task, press space or enter on its grip. Use the arrow keys to move it within or between Today, Tomorrow and Backlog, space or enter to drop, escape to cancel.",
          },
        }}
      >
        {BUCKETS.map((b) => (
          <BucketSection key={b} bucket={b} tasks={columns[b]} today={today} catById={catById} dragging={dragging} />
        ))}
        <DragOverlay dropAnimation={reduceMotion ? null : { duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
          {active ? (
            <div className="relative rotate-[1.5deg] rounded-xl shadow-[0_0_0_4px_var(--accent-soft)]">
              <TaskCardBody
                task={active}
                today={today}
                category={active.category_id ? catById.get(active.category_id) : undefined}
              />
              <PawPrint size={12} aria-hidden className="absolute -top-1.5 -right-1.5 text-accent-strong" />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function BucketSection({
  bucket,
  tasks,
  today,
  catById,
  dragging,
}: {
  bucket: Bucket;
  tasks: TaskDTO[];
  today: string;
  catById: Map<string, Category>;
  dragging: boolean;
}) {
  const headingId = `bucket-${bucket}`;
  // The list itself is a drop target, so an empty bucket still accepts cards.
  const { setNodeRef, isOver } = useDroppable({ id: bucket });
  const empty = tasks.length === 0;
  return (
    <section aria-labelledby={headingId} className="space-y-2">
      <h3
        id={headingId}
        className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted"
      >
        {BUCKET_LABELS[bucket]}
        <span className="font-mono normal-case tracking-normal">{tasks.length}</span>
      </h3>
      <SortableContext id={bucket} items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          className={`space-y-1.5 rounded-xl border transition ${
            dragging && empty ? "min-h-[44px] border-dashed border-[var(--border-strong)]" : "min-h-[4px] border-transparent"
          } ${isOver && empty ? "bg-accent-soft/40 border-accent" : ""}`}
        >
          {tasks.map((t) => (
            <SortableTaskCard
              key={t.id}
              task={t}
              today={today}
              category={t.category_id ? catById.get(t.category_id) : undefined}
            />
          ))}
        </ul>
      </SortableContext>
      <AddTaskRow bucket={bucket} />
    </section>
  );
}

function SortableTaskCard({ task, today, category }: { task: TaskDTO; today: string; category: Category | undefined }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });
  // Mouse/touch drag from anywhere on the card; keyboard pick-up only from the
  // grip, so Space/Enter on the delete button keeps meaning "delete".
  const { onKeyDown, ...pointerListeners } = listeners ?? {};

  async function onDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    const res = await deleteTask(task.id);
    if (res.ok) router.refresh();
    else {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...pointerListeners}
      className={`group relative cursor-grab active:cursor-grabbing ${isDragging ? "opacity-40" : ""} ${
        busy ? "opacity-50" : ""
      }`}
      onMouseLeave={() => setConfirming(false)}
    >
      <TaskCardBody task={task} today={today} category={category} />
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        onKeyDown={onKeyDown as React.KeyboardEventHandler<HTMLButtonElement> | undefined}
        aria-label={`Move task: ${task.title}`}
        className="absolute left-0.5 top-1/2 -translate-y-1/2 w-4 h-6 flex items-center justify-center rounded text-ink-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition cursor-grab"
      >
        <GripVertical size={12} aria-hidden />
      </button>
      <button
        type="button"
        onClick={onDelete}
        onBlur={() => setConfirming(false)}
        // Never start a drag from the delete button.
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        disabled={busy}
        aria-label={confirming ? `Confirm delete: ${task.title}` : `Delete task: ${task.title}`}
        className={`absolute top-1.5 right-1.5 rounded-full transition focus-visible:opacity-100 ${
          confirming
            ? "px-2 py-0.5 text-[11px] font-medium bg-[var(--danger)] text-[var(--bg-base)] opacity-100"
            : "w-6 h-6 flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-bg-alt opacity-0 group-hover:opacity-100"
        }`}
      >
        {confirming ? "Delete?" : <X size={13} aria-hidden />}
      </button>
    </li>
  );
}

// Presentational card, shared by the list item and the drag overlay.
function TaskCardBody({ task, today, category }: { task: TaskDTO; today: string; category: Category | undefined }) {
  const overdue = isOverdue(task, today);
  const later = task.scheduled_for !== null && task.scheduled_for > shiftISODate(today, 1);
  return (
    <div className="rounded-xl border border-[var(--border)] bg-bg-base pl-5 pr-3 py-2 transition group-hover:border-[var(--border-strong)]">
      <p className="text-sm text-ink-primary pr-6 break-words">{task.title}</p>
      {(overdue || later || task.priority !== "med" || category) && (
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-muted">
          {overdue && (
            <span className="font-medium text-[var(--danger)]">Overdue · {shortDate(task.scheduled_for!)}</span>
          )}
          {later && <span title={formatLongDate(task.scheduled_for!)}>{shortDate(task.scheduled_for!)}</span>}
          {task.priority === "high" && <span className="font-semibold text-ink-secondary">↑ High</span>}
          {task.priority === "low" && <span>Low</span>}
          {category && (
            <span className="flex items-center gap-1">
              <span aria-hidden className="w-2 h-2 rounded-full" style={{ background: categoryColor(category) }} />
              {category.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function AddTaskRow({ bucket }: { bucket: Bucket }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit() {
    const value = title.trim();
    if (!value) return;
    setTitle("");
    setError(null);
    // Optimistic row until the refreshed server list arrives.
    setPending((p) => [...p, value]);
    const res = await createTask(bucket, value);
    if (res.ok) router.refresh();
    else {
      setError(ERROR_COPY[res.error] ?? `Couldn't add the task (${res.error}).`);
      setTitle(value); // give the words back
    }
    setPending((p) => {
      const i = p.indexOf(value);
      return i === -1 ? p : [...p.slice(0, i), ...p.slice(i + 1)];
    });
    inputRef.current?.focus();
  }

  return (
    <div className="space-y-1.5">
      {pending.map((p, i) => (
        <div
          key={`${p}-${i}`}
          className="rounded-xl border border-dashed border-[var(--border-strong)] px-3 py-2 text-sm text-ink-muted"
        >
          {p} <span className="font-mono text-[10px]">Adding…</span>
        </div>
      ))}
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <input
            ref={inputRef}
            autoFocus
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setEditing(false);
                setTitle("");
                setError(null);
              }
            }}
            onBlur={() => {
              if (!title.trim()) setEditing(false);
            }}
            placeholder={`New task for ${BUCKET_LABELS[bucket].toLowerCase()}…`}
            aria-label={`New task in ${BUCKET_LABELS[bucket]}`}
            className="w-full rounded-xl border border-accent bg-bg-elevated px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/60"
          />
          <p className="mt-1 text-[11px] text-ink-muted">Enter to add · Esc to close</p>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="w-full flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm text-ink-secondary hover:bg-accent-soft/60 hover:text-cat-ink transition"
        >
          <Plus size={14} aria-hidden /> Add task
        </button>
      )}
      {error && (
        <p role="alert" className="text-[11px] text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
