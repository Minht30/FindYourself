"use client";

import { createContext, useContext, useState } from "react";
import { ListTodo } from "lucide-react";

// The Timetable's right-side task drawer (PRD §6.0). Open/closed lives in a
// cookie so the server renders the right layout on first paint (no flash),
// and this context lets the header toggle and the drawer share it.
export const DRAWER_COOKIE = "fy-tasks-drawer";
const DRAWER_ID = "task-drawer";

const DrawerContext = createContext<{ open: boolean; toggle: () => void } | null>(null);

export function TasksShell({
  initialOpen,
  drawer,
  side,
  children,
}: {
  initialOpen: boolean;
  drawer: React.ReactNode;
  /** Always-visible side panel above the drawer (the day's rings, streak and quote). */
  side?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(initialOpen);

  function toggle() {
    const next = !open;
    setOpen(next);
    document.cookie = `${DRAWER_COOKIE}=${next ? "1" : "0"};path=/;max-age=31536000;samesite=lax`;
  }

  return (
    <DrawerContext.Provider value={{ open, toggle }}>
      <div className="flex flex-col lg:flex-row lg:items-start gap-5">
        <div className="flex-1 min-w-0 space-y-4">{children}</div>
        {(side || open) && (
          <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-3 lg:sticky lg:top-[76px] lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto">
            {side}
            {open && (
              <aside
                id={DRAWER_ID}
                aria-label="Tasks"
                className="rounded-2xl bg-bg-elevated border border-[var(--border)] shadow-card p-4"
              >
                {drawer}
              </aside>
            )}
          </div>
        )}
      </div>
    </DrawerContext.Provider>
  );
}

export function TasksToggle({ openCount }: { openCount: number }) {
  const ctx = useContext(DrawerContext);
  if (!ctx) return null;
  const { open, toggle } = ctx;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-controls={open ? DRAWER_ID : undefined}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition ${
        open
          ? "bg-accent-soft border-accent text-cat-ink"
          : "border-accent/60 text-ink-primary hover:bg-accent-soft hover:text-cat-ink hover:border-accent"
      }`}
    >
      <ListTodo size={15} aria-hidden />
      Tasks
      {openCount > 0 && (
        <span className="min-w-[1.25rem] px-1 rounded-full bg-bg-elevated/80 font-mono text-[11px] leading-5 text-center">
          {openCount}
        </span>
      )}
    </button>
  );
}
