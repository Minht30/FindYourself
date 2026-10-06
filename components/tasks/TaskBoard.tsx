"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, GripVertical, PawPrint, Plus, Timer, X } from "lucide-react";
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
import TaskPopover from "@/components/tasks/TaskPopover";
import EndOfDayRoll from "@/components/tasks/EndOfDayRoll";
import { createTask, deleteTask, moveTask, setTaskDone } from "@/app/(app)/today/task-actions";
import { useFocusStore } from "@/lib/focus/store";
import { categoryColor } from "@/lib/categories";
import {
  BUCKETS,
  BUCKET_EMPTY,
  BUCKET_LABELS,
  bucketOf,
  isBucket,
  isOverdue,
  scheduledForBucket,
  type Bucket,
  type TaskDTO,
} from "@/lib/tasks";
import { formatLongDate, shiftISODate, todayInTimeZone } from "@/lib/dates";

type Category = { id: string; name: string; color: string };
type Columns = Record<Bucket, TaskDTO[]>;

type Props = {
  tasks: TaskDTO[]; // open tasks only
  doneToday: TaskDTO[]; // completed within the user's today, newest first
  categories: Category[];
  today: string;
  timeZone: string;
};

// How long a checked card lingers, struck through, before it moves to
// "Done today" (0 under reduced motion).
const COMPLETE_LINGER_MS = 350;

const ERROR_COPY: Record<string, string> = {
  unauthenticated: "You're signed out. Sign in again to change tasks.",
  empty_title: "Give the task a name first.",
  title_too_long: "Keep the title under 200 characters.",
};

function errorText(code: string, doing: string): string {
  if (code === "network") return `Couldn't reach the server to ${doing}.`;
  return ERROR_COPY[code] ?? `Couldn't ${doing} (${code}).`;
}

const SHORT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const shortDate = (iso: string) => SHORT_DATE.format(new Date(`${iso}T00:00:00Z`));

// "Due 6:00 PM" today, "Due Oct 5, 6:00 PM" otherwise, in the user's zone.
function deadlineLabel(iso: string, timeZone: string, today: string): { text: string; past: boolean } {
  const at = new Date(iso);
  const day = todayInTimeZone(timeZone, at);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone }).format(at);
  const when = day === today ? time : `${shortDate(day)}, ${time}`;
  const past = at.getTime() < Date.now();
  return { text: `${past ? "Past due" : "Due"} ${when}`, past };
}

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

export default function TaskBoard({ tasks, doneToday, categories, today, timeZone }: Props) {
  const router = useRouter();
  const serverColumns = useMemo(() => groupTasks(tasks, today), [tasks, today]);
  const [columns, setColumns] = useState<Columns>(serverColumns);
  const [done, setDone] = useState<TaskDTO[]>(doneToday);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [boardError, setBoardError] = useState<string | null>(null);
  const origin = useRef<{ bucket: Bucket; index: number } | null>(null);
  const [editing, setEditing] = useState<{ task: TaskDTO; anchor: DOMRect; trigger: HTMLElement } | null>(null);
  // A drop can be followed by a stray click on whatever is under the pointer;
  // don't let it open the editor.
  const lastDragEnd = useRef(0);

  function openEditor(task: TaskDTO, trigger: HTMLElement) {
    if (performance.now() - lastDragEnd.current < 250) return;
    const card = trigger.closest("li") ?? trigger;
    setEditing({ task, anchor: card.getBoundingClientRect(), trigger });
  }
  function closeEditor(saved: boolean) {
    const trigger = editing?.trigger;
    setEditing(null);
    if (saved) router.refresh();
    // Return focus to the title that opened the editor.
    window.setTimeout(() => trigger?.isConnected && trigger.focus(), 0);
  }
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
  useEffect(() => setDone(doneToday), [doneToday]);

  // Checkbox → "Done today". Optimistic: the card leaves its bucket right
  // away (after the strike-through linger) and the request runs behind it;
  // a failure puts both lists back as the server has them.
  async function complete(task: TaskDTO) {
    setBoardError(null);
    setColumns((cols) => {
      const b = bucketOf(task.scheduled_for, today);
      return { ...cols, [b]: cols[b].filter((t) => t.id !== task.id) };
    });
    setDone((d) => [{ ...task, completed_at: new Date().toISOString() }, ...d]);
    const res = await setTaskDone(task.id, true).catch(() => ({ ok: false, error: "network" }) as const);
    if (res.ok) router.refresh();
    else {
      setColumns(serverColumns);
      setDone(doneToday);
      setBoardError(errorText(res.error, "complete the task"));
    }
  }

  // Unchecking returns the task to the bucket its date still names.
  async function uncomplete(task: TaskDTO) {
    setBoardError(null);
    const back = { ...task, completed_at: null };
    setDone((d) => d.filter((t) => t.id !== task.id));
    setColumns((cols) => {
      const b = bucketOf(task.scheduled_for, today);
      return { ...cols, [b]: groupTasks([...cols[b], back], today)[b] };
    });
    const res = await setTaskDone(task.id, false).catch(() => ({ ok: false, error: "network" }) as const);
    if (res.ok) router.refresh();
    else {
      setColumns(serverColumns);
      setDone(doneToday);
      setBoardError(errorText(res.error, "reopen the task"));
    }
  }

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
    setBoardError(null);
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
    lastDragEnd.current = performance.now();
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
      setBoardError(`${errorText(res.error, "move the task")} The task is back where it was.`);
    }
  }

  function onDragCancel() {
    lastDragEnd.current = performance.now();
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
      {boardError && (
        <p role="alert" className="text-[11px] text-[var(--danger)]">
          {boardError}
        </p>
      )}
      <DndContext
        // Stable id: dnd-kit otherwise numbers its a11y ids from a module
        // counter that keeps counting across server requests, so the SSR'd
        // aria-describedby stops matching the client after the first render.
        id="task-board"
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
          <BucketSection
            key={b}
            bucket={b}
            tasks={columns[b]}
            today={today}
            catById={catById}
            dragging={dragging}
            timeZone={timeZone}
            lingerMs={reduceMotion ? 0 : COMPLETE_LINGER_MS}
            onComplete={complete}
            onEdit={openEditor}
          />
        ))}
        <DragOverlay dropAnimation={reduceMotion ? null : { duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
          {active ? (
            <div className="relative rotate-[1.5deg] rounded-xl shadow-[0_0_0_4px_var(--accent-soft)]">
              <TaskCardBody
                task={active}
                today={today}
                timeZone={timeZone}
                category={active.category_id ? catById.get(active.category_id) : undefined}
              />
              <PawPrint size={12} aria-hidden className="absolute -top-1.5 -right-1.5 text-accent-strong" />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <DoneSection tasks={done} timeZone={timeZone} onUncomplete={uncomplete} />
      <EndOfDayRoll tasks={tasks} today={today} timeZone={timeZone} />
      {editing && (
        <TaskPopover
          key={editing.task.id}
          task={editing.task}
          anchor={editing.anchor}
          categories={categories}
          timeZone={timeZone}
          onClose={() => closeEditor(false)}
          onSaved={() => closeEditor(true)}
        />
      )}
    </div>
  );
}

// Collapsed by default (US-4.3): the count says "you did things" without the
// list competing with what's still open.
function DoneSection({
  tasks,
  timeZone,
  onUncomplete,
}: {
  tasks: TaskDTO[];
  timeZone: string;
  onUncomplete: (task: TaskDTO) => void;
}) {
  const [open, setOpen] = useState(false);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone });
  if (tasks.length === 0) return null;
  return (
    <section aria-labelledby="bucket-done" className="pt-3 border-t border-dashed border-[var(--border-strong)]">
      <h3 id="bucket-done">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="done-today-list"
          className="w-full flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted hover:text-ink-primary transition"
        >
          Done today
          <span className="font-mono normal-case tracking-normal">{tasks.length}</span>
          <ChevronDown size={13} aria-hidden className={`ml-auto transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </h3>
      {open && (
        <ul id="done-today-list" className="mt-2 space-y-1">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-bg-alt transition">
              <input
                type="checkbox"
                checked
                onChange={() => onUncomplete(t)}
                aria-label={`Mark not done: ${t.title}`}
                className="w-4 h-4 shrink-0 cursor-pointer accent-[var(--accent-strong)]"
              />
              <span className="flex-1 min-w-0 text-sm text-ink-muted line-through decoration-[var(--ink-muted)] break-words">
                {t.title}
              </span>
              {t.completed_at && (
                <time dateTime={t.completed_at} className="font-mono text-[10px] text-ink-muted shrink-0">
                  {time.format(new Date(t.completed_at))}
                </time>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BucketSection({
  bucket,
  tasks,
  today,
  catById,
  dragging,
  timeZone,
  lingerMs,
  onComplete,
  onEdit,
}: {
  bucket: Bucket;
  tasks: TaskDTO[];
  today: string;
  catById: Map<string, Category>;
  dragging: boolean;
  timeZone: string;
  lingerMs: number;
  onComplete: (task: TaskDTO) => void;
  onEdit: (task: TaskDTO, trigger: HTMLElement) => void;
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
              timeZone={timeZone}
              lingerMs={lingerMs}
              onComplete={onComplete}
              onEdit={onEdit}
            />
          ))}
        </ul>
      </SortableContext>
      {empty && !dragging ? (
        <p data-empty-bucket={bucket} className="px-1 text-[12px] text-ink-muted">
          {BUCKET_EMPTY[bucket]}
        </p>
      ) : null}
      <AddTaskRow bucket={bucket} />
    </section>
  );
}

function SortableTaskCard({
  task,
  today,
  category,
  timeZone,
  lingerMs,
  onComplete,
  onEdit,
}: {
  task: TaskDTO;
  today: string;
  category: Category | undefined;
  timeZone: string;
  lingerMs: number;
  onComplete: (task: TaskDTO) => void;
  onEdit: (task: TaskDTO, trigger: HTMLElement) => void;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Strike through first, then hand off to the board, which moves the card
  // into "Done today".
  function onCheck() {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => onComplete(task), lingerMs);
  }
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
      <TaskCardBody
        task={task}
        today={today}
        category={category}
        timeZone={timeZone}
        onEdit={(trigger) => onEdit(task, trigger)}
        leaving={leaving}
        leading={
          <input
            type="checkbox"
            checked={leaving}
            onChange={onCheck}
            // A press on the checkbox must never become a drag.
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            aria-label={`Mark done: ${task.title}`}
            className="mt-0.5 w-4 h-4 shrink-0 cursor-pointer accent-[var(--accent-strong)]"
          />
        }
      />
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
        onClick={() => {
          useFocusStore.getState().setLink({ kind: "task", id: task.id, title: task.title });
          router.push("/focus");
        }}
        // Never start a drag from this button.
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        aria-label={`Focus on: ${task.title}`}
        title="Focus on this"
        className="absolute top-1.5 right-8 w-6 h-6 flex items-center justify-center rounded-full text-ink-muted hover:text-ink-primary hover:bg-bg-alt opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition"
      >
        <Timer size={13} aria-hidden />
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
function TaskCardBody({
  task,
  today,
  category,
  timeZone,
  onEdit,
  leading,
  leaving = false,
}: {
  task: TaskDTO;
  today: string;
  category: Category | undefined;
  timeZone: string;
  onEdit?: (trigger: HTMLElement) => void; // absent in the drag overlay
  leading?: React.ReactNode;
  leaving?: boolean;
}) {
  const overdue = isOverdue(task, today);
  const later = task.scheduled_for !== null && task.scheduled_for > shiftISODate(today, 1);
  const due = task.deadline ? deadlineLabel(task.deadline, timeZone, today) : null;
  const titleClass = `text-sm pr-6 break-words text-left ${
    leaving ? "line-through text-ink-muted decoration-[var(--ink-muted)]" : "text-ink-primary"
  }`;
  return (
    <div
      className={`flex items-start gap-2 rounded-xl border border-[var(--border)] bg-bg-base pl-5 pr-3 py-2 transition-opacity duration-300 group-hover:border-[var(--border-strong)] ${
        leaving ? "opacity-50" : ""
      }`}
    >
      {leading ?? (
        // Static stand-in for the drag overlay, so the preview matches the card.
        <span aria-hidden className="mt-0.5 w-4 h-4 shrink-0 rounded-[4px] border border-[var(--border-strong)]" />
      )}
      <div className="min-w-0 flex-1">
        {onEdit ? (
          // The title is the way into the editor, for mouse and keyboard alike.
          <button
            type="button"
            // Drags still start here (6 px threshold); a plain click opens.
            onClick={(e) => onEdit(e.currentTarget)}
            aria-label={`Edit task: ${task.title}`}
            className={`${titleClass} block w-full hover:underline decoration-[var(--border-strong)] underline-offset-2 rounded`}
          >
            {task.title}
          </button>
        ) : (
          <p className={titleClass}>{task.title}</p>
        )}
        {(overdue || later || due || task.is_restriction || task.priority !== "med" || category) && (
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-muted">
            {task.is_restriction && (
              <span className="px-1.5 py-px rounded-full bg-accent-soft text-cat-ink font-medium">🔒 Focus first</span>
            )}
            {overdue && (
              <span className="font-medium text-[var(--danger)]">Overdue · {shortDate(task.scheduled_for!)}</span>
            )}
            {later && <span title={formatLongDate(task.scheduled_for!)}>{shortDate(task.scheduled_for!)}</span>}
            {due && (
              <span className={due.past ? "font-medium text-[var(--danger)]" : "text-ink-secondary"}>{due.text}</span>
            )}
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
