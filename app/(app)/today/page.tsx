import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WeekGrid, { CategoryDTO, TimeBlockDTO } from "@/components/timetable/WeekGrid";
import {
  addDays,
  formatWeekRange,
  parseWeekParam,
  toISODateOnly,
} from "@/lib/dates";

// Always fresh — reflects newly-created blocks immediately.
export const dynamic = "force-dynamic";

type Props = { searchParams: { week?: string } };

export default async function TodayPage({ searchParams }: Props) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/today");

  const weekStart = parseWeekParam(searchParams.week);
  const weekEnd = addDays(weekStart, 7);

  const [{ data: categories }, { data: blocks }] = await Promise.all([
    supabase.from("categories").select("id, name, color").order("sort_order"),
    supabase
      .from("time_blocks")
      .select("id, title, starts_at, ends_at, category_id")
      .gte("starts_at", weekStart.toISOString())
      .lt("starts_at", weekEnd.toISOString())
      .order("starts_at"),
  ]);

  const prev = toISODateOnly(addDays(weekStart, -7));
  const next = toISODateOnly(addDays(weekStart, 7));
  const thisWeek = toISODateOnly(weekStart);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-4 flex-wrap">
        <h1 className="font-display text-3xl">Timetable</h1>
        <span className="font-mono text-sm text-ink-muted">{formatWeekRange(weekStart)}</span>
        <nav className="ml-auto flex items-center gap-2 font-ui text-sm">
          <a
            href={`/today?week=${prev}`}
            className="px-3 py-1.5 rounded-full border border-accent/60 text-ink-primary hover:bg-accent-soft hover:text-cat-ink hover:border-accent transition"
          >
            ‹ Prev
          </a>
          <a
            href="/today"
            className="px-3 py-1.5 rounded-full border border-accent/60 text-ink-primary hover:bg-accent-soft hover:text-cat-ink hover:border-accent transition"
          >
            This week
          </a>
          <a
            href={`/today?week=${next}`}
            className="px-3 py-1.5 rounded-full border border-accent/60 text-ink-primary hover:bg-accent-soft hover:text-cat-ink hover:border-accent transition"
          >
            Next ›
          </a>
        </nav>
      </div>

      <WeekGrid
        weekStart={thisWeek}
        blocks={(blocks ?? []) as TimeBlockDTO[]}
        categories={(categories ?? []) as CategoryDTO[]}
      />

      <p className="text-ink-muted text-xs font-ui">
        Tip: <strong>click and drag</strong> on any empty slot to create a block. A stray click
        won&apos;t create anything — press <kbd className="font-mono border border-[var(--border)] px-1 rounded">Esc</kbd> mid-drag to cancel. Rename & delete land in Session 9.
      </p>
    </div>
  );
}
