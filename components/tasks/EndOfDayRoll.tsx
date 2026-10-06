"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RollModal, { type RollMode } from "@/components/tasks/RollModal";
import { isOverdue, type TaskDTO } from "@/lib/tasks";
import { hourInZone } from "@/lib/zoned";

const EVENING_HOUR = 23;

// Decides when to offer the end-of-day roll (US-4.4):
// - "overdue" whenever open tasks are dated before today (first visit of a
//   new day, in practice), which takes precedence;
// - "evening" from 23:00 local while tasks are still open on today.
// Each mode is offered at most once per day per device: "Decide later" and
// "Done" both mark it handled (localStorage, a per-device convenience).
export default function EndOfDayRoll({ tasks, today, timeZone }: { tasks: TaskDTO[]; today: string; timeZone: string }) {
  const router = useRouter();
  const [hour, setHour] = useState<number | null>(null); // null until mounted
  const [open, setOpen] = useState<{ mode: RollMode; tasks: TaskDTO[] } | null>(null);

  useEffect(() => {
    // The hour on the clock in the app's zone, not the browser's
    setHour(hourInZone(Date.now(), timeZone));
    const t = window.setInterval(() => setHour(hourInZone(Date.now(), timeZone)), 60_000);
    return () => window.clearInterval(t);
  }, [timeZone]);

  useEffect(() => {
    if (hour === null || open) return;
    // Same order as the board: by date, then manual order.
    const ordered = [...tasks].sort(
      (a, z) => (a.scheduled_for ?? "").localeCompare(z.scheduled_for ?? "") || a.sort_order - z.sort_order
    );
    const overdue = ordered.filter((t) => isOverdue(t, today));
    const tonight = ordered.filter((t) => t.scheduled_for === today);
    const candidate: { mode: RollMode; tasks: TaskDTO[] } | null =
      overdue.length > 0
        ? { mode: "overdue", tasks: overdue }
        : hour >= EVENING_HOUR && tonight.length > 0
          ? { mode: "evening", tasks: tonight }
          : null;
    // Snapshot the list so it can't shift under the user while deciding.
    if (candidate && !handled(today, candidate.mode)) setOpen(candidate);
  }, [hour, tasks, today, open]);

  if (!open) return null;
  return (
    <RollModal
      mode={open.mode}
      tasks={open.tasks}
      onDone={() => {
        markHandled(today, open.mode);
        setOpen(null);
        router.refresh();
      }}
      onLater={() => {
        markHandled(today, open.mode);
        setOpen(null);
      }}
    />
  );
}

const key = (today: string, mode: RollMode) => `fy-roll-handled:${today}:${mode}`;
function handled(today: string, mode: RollMode): boolean {
  try {
    return localStorage.getItem(key(today, mode)) === "1";
  } catch {
    return false;
  }
}
function markHandled(today: string, mode: RollMode) {
  try {
    localStorage.setItem(key(today, mode), "1");
  } catch {}
}
