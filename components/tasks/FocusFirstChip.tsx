"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type FocusFirst = { title: string; deadline: string | null; others: number };

// US-4.5 / PRD §6.6: a persistent, gentle reminder of the open restricted
// task. It never blocks anything; it just stays in view until the task is done.
export default function FocusFirstChip({ focus }: { focus: FocusFirst }) {
  const due = useCountdown(focus.deadline);
  const label = [
    `Focus first: ${focus.title}`,
    due?.text,
    focus.others > 0 ? `plus ${focus.others} more` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Link
      href="/today"
      aria-label={`${label}. Open tasks`}
      title={label}
      // the marker the page-wide veil keys on (globals.css, ".wp-veil")
      data-restriction-active
      className="flex items-center gap-1.5 min-w-0 max-w-[340px] px-3 py-1.5 rounded-full border border-accent bg-accent-soft/50 text-cat-ink font-ui text-[13px] hover:bg-accent-soft transition"
    >
      <span aria-hidden>🔒</span>
      <span className="hidden lg:inline truncate">
        <span className="font-semibold">Focus first:</span> {focus.title}
      </span>
      {due && (
        <span
          className={`hidden md:inline shrink-0 font-mono text-[11px] ${due.past ? "text-[var(--danger)] font-semibold" : "text-ink-secondary"}`}
        >
          · {due.text}
        </span>
      )}
      {focus.others > 0 && <span className="hidden lg:inline shrink-0 font-mono text-[11px] text-ink-secondary">+{focus.others}</span>}
    </Link>
  );
}

// "due in 2h 15m", re-rendered every 30 s; "past due" once it passes.
function useCountdown(deadline: string | null): { text: string; past: boolean } | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return;
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, [deadline]);
  if (!deadline) return null;
  const ms = Date.parse(deadline) - now;
  if (ms <= 0) return { text: "past due", past: true };
  const mins = Math.ceil(ms / 60_000);
  if (mins < 60) return { text: `due in ${mins}m`, past: false };
  const hours = Math.floor(mins / 60);
  if (hours < 24) return { text: `due in ${hours}h ${mins % 60}m`, past: false };
  const days = Math.round(hours / 24);
  return { text: `due in ${days} day${days === 1 ? "" : "s"}`, past: false };
}
