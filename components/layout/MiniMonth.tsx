"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { todayInTimeZone } from "@/lib/dates";
import {
  WEEKDAY_LETTERS,
  anchorMonth,
  dayHref,
  dayLabel,
  isDayDisabled,
  isInSelection,
  monthGrid,
  monthLabel,
  selectionFor,
  shiftMonth,
} from "@/lib/miniMonth";

// The visitor's calendar day, or null until the page has mounted: the server
// does not know the visitor's zone, so nothing date-dependent is rendered
// there (no hydration mismatch). Re-read on the minute, so the "today" mark
// moves at midnight.
function useToday(): string | null {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    const read = () => {
      try {
        setToday(todayInTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone));
      } catch {
        setToday(todayInTimeZone("UTC"));
      }
    };
    read();
    const t = window.setInterval(read, 60_000);
    document.addEventListener("visibilitychange", read);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", read);
    };
  }, []);
  return today;
}

// A month calendar in the sidebar: pick a day and the timetable opens that
// week (the diary opens that day). Shows the month of what you are looking at;
// the arrows browse other months without leaving the page.
export default function MiniMonth() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const today = useToday();

  const selection = selectionFor(pathname, searchParams?.get("week"), today);
  const anchor = anchorMonth(selection, today);

  // Browsing offset (months) from the anchor; going to another page or week
  // snaps back to the month that holds it.
  const [offset, setOffset] = useState(0);
  const selectionKey = `${pathname}|${searchParams?.get("week") ?? ""}`;
  useEffect(() => setOffset(0), [selectionKey]);

  if (!anchor) {
    // Reserve the space so nothing jumps when the calendar appears
    return <div aria-hidden className="h-[236px]" />;
  }

  const first = shiftMonth(anchor, offset);
  const grid = monthGrid(first);

  return (
    <section aria-label="Calendar" className="font-ui">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[13px] font-semibold text-ink-primary" aria-live="polite">
          {monthLabel(first)}
        </h2>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setOffset((o) => o - 1)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink transition"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setOffset((o) => o + 1)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink transition"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div role="grid" aria-label={monthLabel(first)} className="mt-1.5">
        <div role="row" className="grid grid-cols-7 text-center text-[10px] font-semibold text-ink-muted">
          {WEEKDAY_LETTERS.map((l, i) => (
            <div key={i} role="columnheader" className="py-1">
              {l}
            </div>
          ))}
        </div>
        {grid.map((week) => {
          const selectedRow = week.some((c) => isInSelection(selection, c.iso));
          return (
            <div
              key={week[0].iso}
              role="row"
              data-selected-row={selectedRow ? "true" : "false"}
              className={`grid grid-cols-7 rounded-full ${selectedRow ? "bg-accent-soft" : ""}`}
            >
              {week.map((c) => {
                const isToday = c.iso === today;
                const disabled = isDayDisabled(pathname, c.iso, today);
                const cell = `mx-auto my-px w-7 h-7 rounded-full flex items-center justify-center text-[12px] tabular-nums transition ${
                  isToday
                    ? "bg-accent text-cat-ink font-bold"
                    : c.inMonth
                      ? "text-ink-primary hover:bg-accent-soft"
                      : "text-ink-muted/70 hover:bg-accent-soft"
                } ${disabled ? "opacity-40 cursor-not-allowed hover:bg-transparent" : ""}`;
                return (
                  <div key={c.iso} role="gridcell">
                    {disabled ? (
                      <span aria-disabled="true" aria-label={dayLabel(c.iso)} className={cell}>
                        {c.day}
                      </span>
                    ) : (
                      <Link
                        href={dayHref(pathname, c.iso)}
                        prefetch={false}
                        aria-label={dayLabel(c.iso)}
                        aria-current={isToday ? "date" : undefined}
                        className={cell}
                      >
                        {c.day}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}
