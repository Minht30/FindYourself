"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { updateTask } from "@/app/(app)/today/task-actions";
import type { TaskDTO, TaskPriority } from "@/lib/tasks";

type Category = { id: string; name: string; color: string };

type Props = {
  task: TaskDTO;
  anchor: DOMRect;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
};

const POPOVER_WIDTH = 320;
const APPROX_HEIGHT = 560;
const GAP = 8;

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "med", label: "Medium" },
  { value: "high", label: "High" },
];

const ERROR_COPY: Record<string, string> = {
  unauthenticated: "You're signed out. Sign in again to save.",
  empty_title: "Give the task a name first.",
  title_too_long: "Keep the title under 200 characters.",
  description_too_long: "Keep the description under 5,000 characters.",
  invalid_deadline: "That deadline isn't a valid date and time.",
  not_found: "This task no longer exists. It may have been deleted elsewhere.",
};

// <input type="datetime-local"> speaks the browser's wall-clock time, which is
// the same zone the app's "today" comes from (fy-tz cookie).
const pad = (n: number) => String(n).padStart(2, "0");
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const fieldLabel = "block text-[11px] font-semibold text-ink-secondary mb-1 uppercase tracking-wider";
const fieldInput =
  "w-full px-3 py-2 rounded-lg bg-bg-alt border border-[var(--border)] text-ink-primary text-sm focus:outline-none focus:border-accent";

export default function TaskPopover({ task, anchor, categories, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [deadline, setDeadline] = useState(toLocalInput(task.deadline));
  const [categoryId, setCategoryId] = useState<string | null>(task.category_id);
  const [isRestriction, setIsRestriction] = useState(task.is_restriction);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await updateTask({
      id: task.id,
      title,
      description,
      priority,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      categoryId,
      isRestriction,
    }).catch(() => ({ ok: false, error: "network" }) as const);
    setSaving(false);
    if (!res.ok) {
      setError(
        res.error === "network"
          ? "Couldn't reach the server. Your changes are still here; try again."
          : ERROR_COPY[res.error] ?? `Couldn't save (${res.error}).`
      );
      return;
    }
    onSaved();
  }

  if (!mounted) return null;
  const { top, left } = computePosition(anchor);

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-labelledby={headingId}
      className="fixed z-[100] rounded-2xl bg-bg-elevated border border-[var(--border-strong)] shadow-card p-4 font-ui max-h-[calc(100vh-16px)] overflow-y-auto"
      style={{ top, left, width: `${POPOVER_WIDTH}px` }}
    >
      <form onSubmit={onSubmit}>
        <div className="flex items-center justify-between mb-3">
          <h2 id={headingId} className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
            Edit task
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-full flex items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink transition"
          >
            <X size={14} />
          </button>
        </div>

        <label className="block mb-3">
          <span className={fieldLabel}>Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
            autoFocus
            className={fieldInput}
          />
        </label>

        <label className="block mb-3">
          <span className={fieldLabel}>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={5000}
            rows={3}
            placeholder="Optional"
            className={`${fieldInput} resize-none`}
          />
        </label>

        <fieldset className="mb-3">
          <legend className={fieldLabel}>Priority</legend>
          <div className="flex gap-1.5">
            {PRIORITY_OPTIONS.map((o) => (
              <label key={o.value} className="flex-1">
                <input
                  type="radio"
                  name={`priority-${task.id}`}
                  value={o.value}
                  checked={priority === o.value}
                  onChange={() => setPriority(o.value)}
                  className="peer sr-only"
                />
                <span className="block text-center px-2 py-1.5 rounded-full border border-[var(--border-strong)] text-xs text-ink-secondary cursor-pointer transition peer-checked:bg-accent-soft peer-checked:border-accent peer-checked:text-cat-ink peer-checked:font-semibold peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                  {o.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mb-3 grid grid-cols-1 gap-3">
          <label className="block">
            <span className={fieldLabel}>Deadline</span>
            <div className="flex gap-1.5">
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={fieldInput}
              />
              {deadline && (
                <button
                  type="button"
                  onClick={() => setDeadline("")}
                  aria-label="Clear deadline"
                  className="shrink-0 w-9 rounded-lg border border-[var(--border)] text-ink-muted hover:text-ink-primary hover:bg-bg-alt transition flex items-center justify-center"
                >
                  <X size={13} aria-hidden />
                </button>
              )}
            </div>
          </label>

          <label className="block">
            <span className={fieldLabel}>Category</span>
            <select
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className={fieldInput}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mb-4 flex items-start gap-2.5 rounded-xl border border-[var(--border)] bg-bg-alt px-3 py-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isRestriction}
            onChange={(e) => setIsRestriction(e.target.checked)}
            className="mt-0.5 w-4 h-4 shrink-0 accent-[var(--accent-strong)]"
          />
          <span className="text-sm text-ink-primary">
            🔒 Focus first
            <span className="block text-[11px] text-ink-muted mt-0.5">
              Keep a gentle reminder in the header until this is done. Nothing gets blocked.
            </span>
          </span>
        </label>

        {error && (
          <p role="alert" className="mb-3 text-xs text-[var(--danger)]">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-full text-ink-secondary text-xs hover:bg-bg-alt transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-1.5 rounded-full bg-accent text-cat-ink text-xs font-semibold hover:bg-accent-soft disabled:opacity-60 transition"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

// Prefer the left of the card (the drawer hugs the right edge), then the
// right, then clamp; vertically clamp into the viewport.
function computePosition(anchor: DOMRect): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left: number;
  if (anchor.left >= POPOVER_WIDTH + GAP) left = anchor.left - POPOVER_WIDTH - GAP;
  else if (vw - anchor.right >= POPOVER_WIDTH + GAP) left = anchor.right + GAP;
  else left = Math.max(GAP, Math.min(vw - POPOVER_WIDTH - GAP, anchor.left));
  const top = Math.max(GAP, Math.min(vh - APPROX_HEIGHT - GAP, anchor.top));
  return { top, left };
}
