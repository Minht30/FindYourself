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
            className="px-3 py-1.5 rounded-full border border-[var(--border-strong)] text-ink-primary hover:bg-bg-alt transition"
          >
            ‹ Prev
          </a>
          <a
            href="/today"
            className="px-3 py-1.5 rounded-full border border-[var(--border-strong)] text-ink-primary hover:bg-bg-alt transition"
          >
            This week
          </a>
          <a
            href={`/today?week=${next}`}
            className="px-3 py-1.5 rounded-full border border-[var(--border-strong)] text-ink-primary hover:bg-bg-alt transition"
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

      {(!blocks || blocks.length === 0) && (
        <p className="text-ink-muted text-sm font-ui">
          No blocks yet this week. Click-drag to create will land next session — for now the grid
          is read-only.
        </p>
      )}
    </div>
  );
}
