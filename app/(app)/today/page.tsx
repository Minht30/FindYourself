import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import WeekGrid, { CategoryDTO, TimeBlockDTO } from "@/components/timetable/WeekGrid";
import CopyYesterdayButton from "@/components/timetable/CopyYesterdayButton";
import { TasksShell, TasksToggle, DRAWER_COOKIE } from "@/components/tasks/TasksShell";
import TaskBoard from "@/components/tasks/TaskBoard";
import { TASK_COLUMNS, type TaskDTO } from "@/lib/tasks";
import { getNow, getUserTimeZone } from "@/lib/today";
import { STREAK_COLUMNS, streakView, toStoredStreak } from "@/lib/streak";
import StreakChip from "@/components/motivation/StreakChip";
import QuoteCard from "@/components/motivation/QuoteCard";
import WeeklyWinsCard from "@/components/motivation/WeeklyWinsCard";
import WinsClock from "@/components/motivation/WinsClock";
import { winsWindowOpen } from "@/lib/wins";
import { loadWeekWins } from "@/lib/winsData";
import ProgressRings from "@/components/motivation/ProgressRings";
import { diaryRing, diaryWritten, focusRing, sanitizeFocusGoal, sumFocusSeconds, taskRing } from "@/lib/rings";
import { QUOTE_COLUMNS, quoteForDate, toQuote } from "@/lib/quotes";
import {
  addDays,
  formatWeekRange,
  parseWeekParam,
  shiftISODate,
  toISODateOnly,
  todayInTimeZone,
  zonedDayStartUTC,
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

  // "Done today" = completed between the user's local midnights.
  const timeZone = getUserTimeZone();
  const now = getNow();
  const today = todayInTimeZone(timeZone, now);
  const dayStart = zonedDayStartUTC(today, timeZone).toISOString();
  const dayEnd = zonedDayStartUTC(shiftISODate(today, 1), timeZone).toISOString();

  const [{ data: categories }, { data: blocks }, { data: openTasks }, { data: doneTasks }, { data: profile }, { data: quoteRows }, { data: todayFocus }, { data: todayDiary }] = await Promise.all([
    supabase.from("categories").select("id, name, color").order("sort_order"),
    supabase
      .from("time_blocks")
      .select("id, title, starts_at, ends_at, category_id, notes")
      .gte("starts_at", weekStart.toISOString())
      .lt("starts_at", weekEnd.toISOString())
      .order("starts_at"),
    supabase
      .from("tasks")
      .select(TASK_COLUMNS)
      .eq("user_id", user.id)
      .is("completed_at", null)
      .returns<TaskDTO[]>(),
    supabase
      .from("tasks")
      .select(TASK_COLUMNS)
      .eq("user_id", user.id)
      .gte("completed_at", dayStart)
      .lt("completed_at", dayEnd)
      .order("completed_at", { ascending: false })
      .returns<TaskDTO[]>(),
    // Written only by the database (see lib/streak.ts); read here to show it.
    supabase.from("profiles").select(`${STREAK_COLUMNS}, daily_focus_goal_minutes`).eq("id", user.id).maybeSingle(),
    // Global, read-only; which one shows today is a pure function of the date.
    supabase.from("quotes").select(QUOTE_COLUMNS).order("id"),
    // The rings: today's focus time and today's diary row.
    supabase
      .from("focus_sessions")
      .select("duration_seconds")
      .eq("user_id", user.id)
      .gte("started_at", dayStart)
      .lt("started_at", dayEnd)
      .limit(500)
      .returns<{ duration_seconds: number }[]>(),
    supabase
      .from("diary_entries")
      .select("content_chars, mood")
      .eq("user_id", user.id)
      .eq("entry_date", today)
      .maybeSingle(),
  ]);
  const quote = quoteForDate(
    today,
    (quoteRows ?? []).map(toQuote).filter((q): q is NonNullable<typeof q> => q !== null),
  );
  const streak = streakView(toStoredStreak(profile), today);

  // "Your week" opens on Sunday at 18:00 where the person is; WinsClock asks
  // for a fresh render if the page is left open across that moment.
  const winsOpen = winsWindowOpen(now.getTime(), timeZone);
  const wins = winsOpen ? await loadWeekWins(supabase, user.id, today, timeZone, streak) : null;
  const tasks = openTasks ?? [];

  // Rings: today's plan is what is still open for today (or overdue) plus what
  // was finished today; the goal is the person's own (a profile setting).
  const goalMinutes = sanitizeFocusGoal(profile?.daily_focus_goal_minutes);
  const openForToday = tasks.filter((t) => t.scheduled_for !== null && t.scheduled_for <= today).length;
  const rings = [
    taskRing((doneTasks ?? []).length, openForToday),
    focusRing(sumFocusSeconds(todayFocus ?? []), goalMinutes),
    diaryRing(diaryWritten(todayDiary)),
  ];
  // Drawer defaults to open; the cookie remembers a user who closed it.
  const drawerOpen = cookies().get(DRAWER_COOKIE)?.value !== "0";

  const prev = toISODateOnly(addDays(weekStart, -7));
  const next = toISODateOnly(addDays(weekStart, 7));
  const thisWeek = toISODateOnly(weekStart);

  return (
    <TasksShell
      initialOpen={drawerOpen}
      // The timetable is the main thing; the day's rings, streak and quote sit in the
      // side column (plain placement: the real layout is the Figma stage).
      side={
        <>
          {wins ? <WeeklyWinsCard wins={wins} /> : null}
          <ProgressRings rings={rings} goalMinutes={goalMinutes} />
          <StreakChip view={streak} />
          <QuoteCard quote={quote} />
        </>
      }
      drawer={
        <TaskBoard
          tasks={tasks}
          doneToday={doneTasks ?? []}
          categories={categories ?? []}
          today={today}
          timeZone={timeZone}
        />
      }
    >
      <div className="flex items-baseline gap-4 flex-wrap">
        <h1 className="font-display text-3xl">Timetable</h1>
        <span className="font-mono text-sm text-ink-muted">{formatWeekRange(weekStart)}</span>
        <div className="ml-auto flex items-center gap-2 font-ui text-sm flex-wrap">
          <TasksToggle openCount={tasks.length} />
          <CopyYesterdayButton />
          <nav className="flex items-center gap-2">
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
      </div>

      <WinsClock timeZone={timeZone} open={winsOpen} />
      {(blocks ?? []).length === 0 ? (
        <p data-empty-week className="font-ui text-sm text-ink-secondary">
          Nothing scheduled this week. Drag on the grid to add your first block.
        </p>
      ) : null}

      <WeekGrid
        weekStart={thisWeek}
        blocks={(blocks ?? []) as TimeBlockDTO[]}
        categories={(categories ?? []) as CategoryDTO[]}
      />

      <p className="text-ink-muted text-xs font-ui">
        <strong>Drag empty space</strong> to create · <strong>click a block</strong> to edit ·{" "}
        <strong>drag the body</strong> to move · <strong>drag top/bottom edges</strong> to resize ·{" "}
        <kbd className="font-mono border border-[var(--border)] px-1 rounded">Esc</kbd> cancels
      </p>
    </TasksShell>
  );
}
