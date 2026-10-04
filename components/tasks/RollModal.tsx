"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { rollTasks } from "@/app/(app)/today/task-actions";
import type { Bucket, TaskDTO } from "@/lib/tasks";

// "overdue": first visit of a new day, open tasks dated before today.
// "evening": 23:00 or later, open tasks still on today.
export type RollMode = "overdue" | "evening";

// What "keep" writes: overdue tasks are re-dated to today; tonight's tasks
// simply stay where they are (no write).
type Choice = Bucket | "keep";

const COPY: Record<RollMode, { title: string; body: string; keep: string }> = {
  overdue: {
    title: "A few things carried over",
    body: "These didn't get done on their day. Where should they go now?",
    keep: "Today",
  },
  evening: {
    title: "Winding down",
    body: "It's getting late. Anything to move off today before you rest?",
    keep: "Keep",
  },
};

const SHORT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

type Props = {
  mode: RollMode;
  tasks: TaskDTO[];
  onDone: () => void;  // choices saved
  onLater: () => void; // dismissed for today
};

export default function RollModal({ mode, tasks, onDone, onLater }: Props) {
  const copy = COPY[mode];
  const [choices, setChoices] = useState<Record<string, Choice>>(() =>
    Object.fromEntries(tasks.map((t) => [t.id, "tomorrow" as Choice]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => setMounted(true), []);
  // Latest callback without re-running the focus effect on every render.
  const onLaterRef = useRef(onLater);
  onLaterRef.current = onLater;

  // Modal behaviour: remember who had focus, move it inside, keep Tab inside,
  // Esc = "Decide later", and give focus back on the way out.
  useEffect(() => {
    if (!mounted) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLElement>("input:checked, button")?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onLaterRef.current();
        return;
      }
      if (e.key !== "Tab" || !dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>("button, input")].filter(
        (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previous?.isConnected) previous.focus();
    };
  }, [mounted]);

  function setAll(choice: Choice) {
    setChoices(Object.fromEntries(tasks.map((t) => [t.id, choice])));
  }

  async function apply() {
    setSaving(true);
    setError(null);
    // Keep the list's order; "keep" in the evening means no write at all.
    const writes = tasks
      .map((t) => ({ id: t.id, choice: choices[t.id] }))
      .filter((c) => !(mode === "evening" && c.choice === "keep"))
      .map((c) => ({ id: c.id, to: (c.choice === "keep" ? "today" : c.choice) as Bucket }));
    if (writes.length === 0) {
      // Everything kept tonight: nothing to save.
      setSaving(false);
      onDone();
      return;
    }
    const res = await rollTasks(writes).catch(() => ({ ok: false, error: "network" }) as const);
    setSaving(false);
    if (res.ok) onDone();
    else
      setError(
        res.error === "unauthenticated"
          ? "You're signed out. Sign in again to move these."
          : res.error === "network"
            ? "Couldn't reach the server. Nothing was moved; try again."
            : `Couldn't move the tasks (${res.error}).`
      );
  }

  if (!mounted) return null;

  const options: { value: Choice; label: string }[] = [
    { value: "tomorrow", label: "Tomorrow" },
    { value: "backlog", label: "Backlog" },
    { value: "keep", label: copy.keep },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div aria-hidden className="absolute inset-0 bg-ink-primary/30 backdrop-blur-[2px]" onClick={onLater} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="relative w-full max-w-md max-h-[calc(100vh-32px)] overflow-y-auto rounded-2xl bg-bg-elevated border border-[var(--border-strong)] shadow-card p-5 font-ui"
      >
        <h2 id={titleId} className="font-display text-xl text-ink-primary">
          {copy.title}
        </h2>
        <p id={bodyId} className="mt-1 text-sm text-ink-secondary">
          {copy.body}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
          <span className="text-ink-muted self-center mr-1">Everything to:</span>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setAll(o.value)}
              className="px-2.5 py-1 rounded-full border border-[var(--border-strong)] text-ink-secondary hover:bg-accent-soft hover:text-cat-ink hover:border-accent transition"
            >
              {o.label}
            </button>
          ))}
        </div>

        <ul className="mt-4 space-y-2">
          {tasks.map((t) => (
            <li key={t.id} className="rounded-xl border border-[var(--border)] bg-bg-base px-3 py-2.5">
              <fieldset>
                <legend className="text-sm text-ink-primary break-words">
                  {t.title}
                  {mode === "overdue" && t.scheduled_for && (
                    <span className="ml-2 font-mono text-[11px] text-ink-muted">
                      from {SHORT_DATE.format(new Date(`${t.scheduled_for}T00:00:00Z`))}
                    </span>
                  )}
                </legend>
                <div className="mt-2 flex gap-1.5">
                  {options.map((o) => (
                    <label key={o.value} className="flex-1">
                      <input
                        type="radio"
                        name={`roll-${t.id}`}
                        value={o.value}
                        checked={choices[t.id] === o.value}
                        onChange={() => setChoices((c) => ({ ...c, [t.id]: o.value }))}
                        className="peer sr-only"
                      />
                      <span className="block text-center px-2 py-1 rounded-full border border-[var(--border-strong)] text-xs text-ink-secondary cursor-pointer transition peer-checked:bg-accent-soft peer-checked:border-accent peer-checked:text-cat-ink peer-checked:font-semibold peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                        {o.label}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </li>
          ))}
        </ul>

        {error && (
          <p role="alert" className="mt-3 text-xs text-[var(--danger)]">
            {error}
          </p>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onLater}
            className="px-3 py-1.5 rounded-full text-ink-secondary text-xs hover:bg-bg-alt transition"
          >
            Decide later
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={saving}
            className="px-4 py-1.5 rounded-full bg-accent text-cat-ink text-xs font-semibold hover:bg-accent-soft disabled:opacity-60 transition"
          >
            {saving ? "Moving…" : "Done"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
