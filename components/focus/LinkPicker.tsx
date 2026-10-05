"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Check, ChevronDown, ListChecks, CalendarClock, X } from "lucide-react";
import { useFocusStore } from "@/lib/focus/store";
import type { FocusLink } from "@/lib/focus/timer";

export type PickTask = { id: string; title: string; is_restriction: boolean };
export type PickBlock = { id: string; title: string; starts_at: string; ends_at: string };

// "I am focusing on X" (US-5.1). The list is today's open tasks and today's
// timetable blocks; the choice is stored with the timer, so it survives a
// refresh and is written onto the session when it ends.
export default function LinkPicker({
  tasks,
  blocks,
  timeZone,
}: {
  tasks: PickTask[];
  blocks: PickBlock[];
  timeZone: string;
}) {
  const link = useFocusStore((s) => s.timer.link);
  const setLink = useFocusStore((s) => s.setLink);
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone });
  const range = (b: PickBlock) => `${time.format(new Date(b.starts_at))} – ${time.format(new Date(b.ends_at))}`;

  function pick(next: FocusLink | null) {
    setLink(next);
    setOpen(false);
  }

  const empty = tasks.length === 0 && blocks.length === 0;
  const linkIsListed = link && [...tasks.map((t) => t.id), ...blocks.map((b) => b.id)].includes(link.id);

  return (
    <div className="mt-5 pt-4 border-t border-[var(--border)] font-ui">
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-ink-muted shrink-0">Focusing on</span>
        {link ? (
          <span className="flex items-center gap-1.5 min-w-0 rounded-full bg-accent-soft/60 border border-accent px-2.5 py-1 text-[13px] text-cat-ink">
            {link.kind === "task" ? <ListChecks size={13} aria-hidden /> : <CalendarClock size={13} aria-hidden />}
            <span className="truncate">{link.title}</span>
            <button
              type="button"
              onClick={() => pick(null)}
              aria-label={`Stop focusing on ${link.title}`}
              className="shrink-0 rounded-full hover:bg-bg-alt p-0.5"
            >
              <X size={12} aria-hidden />
            </button>
          </span>
        ) : (
          <span className="text-[13px] text-ink-secondary">nothing in particular</span>
        )}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="ml-auto shrink-0 flex items-center gap-1 text-[13px] font-medium text-ink-secondary hover:text-ink-primary transition"
        >
          {link ? "Change" : "Choose"}
          <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </div>

      {open && (
        <div id={panelId} className="mt-3 grid gap-3 text-[13px]">
          {empty && (
            <p className="text-ink-secondary">
              Nothing planned for today yet. Add a task or a block on{" "}
              <Link href="/today" className="underline underline-offset-2 text-accent-strong">
                Timetable
              </Link>
              , then pick it here.
            </p>
          )}

          {tasks.length > 0 && (
            <Group label="Today's tasks">
              {tasks.map((t) => (
                <Option
                  key={t.id}
                  selected={link?.id === t.id}
                  onPick={() => pick({ kind: "task", id: t.id, title: t.title })}
                  icon={<ListChecks size={14} aria-hidden />}
                  label={t.title}
                  hint={t.is_restriction ? "🔒 Focus first" : undefined}
                />
              ))}
            </Group>
          )}

          {blocks.length > 0 && (
            <Group label="Today's blocks">
              {blocks.map((b) => (
                <Option
                  key={b.id}
                  selected={link?.id === b.id}
                  onPick={() => pick({ kind: "block", id: b.id, title: b.title.trim() || "Untitled block" })}
                  icon={<CalendarClock size={14} aria-hidden />}
                  label={b.title.trim() || "Untitled block"}
                  hint={range(b)}
                />
              ))}
            </Group>
          )}

          {link && !linkIsListed && (
            <p className="text-[12px] text-ink-muted">
              “{link.title}” is not on today&apos;s list, but it stays linked until you clear it.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1">{label}</div>
      <ul className="grid gap-1">{children}</ul>
    </div>
  );
}

function Option({
  selected,
  onPick,
  icon,
  label,
  hint,
}: {
  selected: boolean;
  onPick: () => void;
  icon: React.ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        aria-pressed={selected}
        className={`w-full flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
          selected
            ? "border-accent bg-accent-soft/60 text-cat-ink"
            : "border-[var(--border)] text-ink-primary hover:bg-bg-alt hover:border-[var(--border-strong)]"
        }`}
      >
        <span className="shrink-0 text-ink-secondary">{icon}</span>
        <span className="truncate flex-1">{label}</span>
        {hint && <span className="shrink-0 font-mono text-[11px] text-ink-secondary">{hint}</span>}
        {selected && <Check size={14} className="shrink-0" aria-hidden />}
      </button>
    </li>
  );
}
