"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { saveFocusGoal } from "@/app/(app)/profile-actions";
import { FOCUS_GOAL_PRESETS } from "@/lib/rings";

const REASONS: Record<string, string> = {
  unauthenticated: "Sign in again to change your goal.",
  bad_goal: "That goal is not allowed. Pick one from the list.",
  db_error: "Could not save your goal. Try again.",
};

function label(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${m} min`;
}

// A plain picker for the daily focus goal. The saved goal is the source of
// truth: on a refusal the select goes back to it and says why.
export default function FocusGoalSelect({ goalMinutes }: { goalMinutes: number }) {
  const id = useId();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [shown, setShown] = useState(goalMinutes);

  // A new saved goal (after a save, or from another tab) replaces what is shown.
  useEffect(() => setShown(goalMinutes), [goalMinutes]);

  const options: number[] = (FOCUS_GOAL_PRESETS as readonly number[]).includes(goalMinutes)
    ? [...FOCUS_GOAL_PRESETS]
    : [...FOCUS_GOAL_PRESETS, goalMinutes].sort((a, b) => a - b);

  return (
    <div className="flex items-center gap-2 font-ui text-[12px] text-ink-muted">
      <label htmlFor={id}>Daily focus goal</label>
      <select
        id={id}
        value={shown}
        disabled={pending}
        onChange={(e) => {
          const next = Number(e.target.value);
          setError(null);
          setShown(next);
          start(async () => {
            const res = await saveFocusGoal(next);
            // A request that gets no answer (signed out mid-session) has no result at all.
            if (res && res.ok) return;
            setShown(goalMinutes);
            setError(res ? res.error : "unauthenticated");
          });
        }}
        className="rounded-md border border-[var(--border)] bg-bg-elevated px-2 py-1 text-ink-primary"
      >
        {options.map((m) => (
          <option key={m} value={m}>
            {label(m)}
          </option>
        ))}
      </select>
      {error ? (
        <span role="alert" data-reason={error} className="text-[var(--danger,#b3261e)]">
          {REASONS[error] ?? REASONS.db_error}
        </span>
      ) : null}
    </div>
  );
}
