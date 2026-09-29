"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createTask, deleteTask } from "@/app/(app)/today/task-actions";
import { categoryColor } from "@/lib/categories";
import { BUCKETS, BUCKET_LABELS, bucketOf, isOverdue, type Bucket, type TaskDTO } from "@/lib/tasks";
import { formatLongDate, shiftISODate } from "@/lib/dates";

type Category = { id: string; name: string; color: string };

type Props = {
  tasks: TaskDTO[]; // open tasks only
  categories: Category[];
  today: string;
};

const ERROR_COPY: Record<string, string> = {
  unauthenticated: "You're signed out. Sign in again to add tasks.",
  empty_title: "Give the task a name first.",
  title_too_long: "Keep the title under 200 characters.",
};

const SHORT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const shortDate = (iso: string) => SHORT_DATE.format(new Date(`${iso}T00:00:00Z`));

export default function TaskBoard({ tasks, categories, today }: Props) {
  const byBucket: Record<Bucket, TaskDTO[]> = { today: [], tomorrow: [], backlog: [] };
  for (const t of tasks) byBucket[bucketOf(t.scheduled_for, today)].push(t);
  // Oldest date first (overdue on top of Today), then manual order.
  for (const b of BUCKETS) {
    byBucket[b].sort(
      (a, z) => (a.scheduled_for ?? "").localeCompare(z.scheduled_for ?? "") || a.sort_order - z.sort_order
    );
  }
  const catById = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="space-y-5 font-ui">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl">Tasks</h2>
        <span className="font-mono text-xs text-ink-muted">{tasks.length} open</span>
      </div>
      {BUCKETS.map((b) => (
        <BucketSection key={b} bucket={b} tasks={byBucket[b]} today={today} catById={catById} />
      ))}
    </div>
  );
}

function BucketSection({
  bucket,
  tasks,
  today,
  catById,
}: {
  bucket: Bucket;
  tasks: TaskDTO[];
  today: string;
  catById: Map<string, Category>;
}) {
  const headingId = `bucket-${bucket}`;
  return (
    <section aria-labelledby={headingId} className="space-y-2">
      <h3 id={headingId} className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        {BUCKET_LABELS[bucket]}
        <span className="font-mono normal-case tracking-normal">{tasks.length}</span>
      </h3>
      <ul className="space-y-1.5">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} today={today} category={t.category_id ? catById.get(t.category_id) : undefined} />
        ))}
      </ul>
      <AddTaskRow bucket={bucket} />
    </section>
  );
}

function TaskCard({ task, today, category }: { task: TaskDTO; today: string; category: Category | undefined }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const overdue = isOverdue(task, today);
  const later = task.scheduled_for !== null && task.scheduled_for > shiftISODate(today, 1);

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
      className={`group relative rounded-xl border border-[var(--border)] bg-bg-base px-3 py-2 transition hover:border-[var(--border-strong)] ${
        busy ? "opacity-50" : ""
      }`}
      onMouseLeave={() => setConfirming(false)}
    >
      <p className="text-sm text-ink-primary pr-7 break-words">{task.title}</p>
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
      <button
        type="button"
        onClick={onDelete}
        onBlur={() => setConfirming(false)}
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
        <div key={`${p}-${i}`} className="rounded-xl border border-dashed border-[var(--border-strong)] px-3 py-2 text-sm text-ink-muted">
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
