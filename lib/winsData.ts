import type { SupabaseClient } from "@supabase/supabase-js";
import { summarizeWeek, weekBounds, type WeekSession } from "@/lib/focus/week";
import type { StreakView } from "@/lib/streak";
import { buildWins, countDiaryDays, type DiaryRow, type WeekWins } from "@/lib/wins";

// The reads behind the weekly wins card. Row-level security scopes every query
// to the signed-in person; the explicit user filter documents it.
export async function loadWeekWins(
  supabase: SupabaseClient,
  userId: string,
  today: string,
  timeZone: string,
  streak: StreakView,
): Promise<WeekWins> {
  const bounds = weekBounds(today, timeZone);
  const startIso = new Date(bounds.startMs).toISOString();
  const endIso = new Date(bounds.endMs).toISOString();
  const sundayISO = bounds.days[6].iso;

  const [sessions, done, diary] = await Promise.all([
    supabase
      .from("focus_sessions")
      .select("started_at, duration_seconds, completed")
      .eq("user_id", userId)
      .gte("started_at", startIso)
      .lt("started_at", endIso)
      .limit(2000)
      .returns<WeekSession[]>(),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("completed_at", startIso)
      .lt("completed_at", endIso),
    supabase
      .from("diary_entries")
      .select("entry_date, content_chars, mood")
      .eq("user_id", userId)
      .gte("entry_date", bounds.mondayISO)
      .lte("entry_date", sundayISO)
      .returns<DiaryRow[]>(),
  ]);

  return buildWins({
    mondayISO: bounds.mondayISO,
    week: summarizeWeek(sessions.data ?? [], bounds, today),
    tasksCompleted: done.count ?? 0,
    diaryDays: countDiaryDays(diary.data ?? [], bounds.mondayISO, sundayISO),
    streak,
  });
}
