"use client";

import { useRef, useState } from "react";
import { MOODS, type DiaryMood } from "@/lib/moods";
import { setDiaryMood } from "@/app/(app)/diary/actions";

type Props = {
  date: string;
  initialMood: DiaryMood | null;
};

// Six toggle pills. Click one to set it; click the active one again to clear.
// Optimistic: the pill lights up immediately and saves in the background.
export default function MoodPicker({ date, initialMood }: Props) {
  const [mood, setMood] = useState<DiaryMood | null>(initialMood);
  const [error, setError] = useState(false);

  // Last value the server confirmed, to roll back to on failure.
  const confirmed = useRef<DiaryMood | null>(initialMood);
  // Same ordering guarantee as the editor: requests land one after another,
  // so rapid clicking can't leave the server on an older choice.
  const chain = useRef<Promise<void>>(Promise.resolve());
  const latest = useRef(0);

  function choose(next: DiaryMood) {
    const target = mood === next ? null : next;
    setMood(target);
    setError(false);
    const mine = ++latest.current;

    chain.current = chain.current.then(async () => {
      const res = await setDiaryMood(date, target).catch(() => ({ ok: false }) as const);
      if (res.ok) {
        confirmed.current = target;
        return;
      }
      // Only the newest click decides what the UI shows after a failure.
      if (mine === latest.current) {
        setMood(confirmed.current);
        setError(true);
      }
    });
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span id={`mood-label-${date}`} className="font-ui text-xs min-[1400px]:text-sm uppercase tracking-wider text-ink-muted">
        Mood
      </span>
      <div role="group" aria-labelledby={`mood-label-${date}`} className="flex flex-wrap gap-2">
        {MOODS.map((m) => {
          const active = mood === m.value;
          return (
            <button
              key={m.value}
              type="button"
              aria-pressed={active}
              title={active ? `${m.label} (click again to clear)` : m.label}
              onClick={() => choose(m.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 min-[1400px]:px-4 min-[1400px]:py-2 rounded-full border font-ui text-sm min-[1400px]:text-base transition ${
                active
                  ? "bg-accent-soft border-accent text-cat-ink shadow-glow"
                  : "border-[var(--border-strong)] text-ink-secondary hover:bg-accent-soft/60 hover:text-cat-ink hover:border-accent/60"
              }`}
            >
              <span aria-hidden className={`text-base leading-none transition-transform ${active ? "scale-110" : ""}`}>
                {m.emoji}
              </span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>
      {error && (
        <span role="alert" className="font-ui text-xs text-[var(--danger)]">
          Couldn&apos;t save mood. Try again.
        </span>
      )}
    </div>
  );
}
