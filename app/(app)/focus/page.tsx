import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LinkPicker, { type PickBlock, type PickTask } from "@/components/focus/LinkPicker";
import TimerCard from "@/components/focus/TimerCard";
import TimerSettings from "@/components/focus/TimerSettings";
import WeekTile, { type RecentSession } from "@/components/focus/WeekTile";
import { shiftISODate, todayInTimeZone, zonedDayStartUTC } from "@/lib/dates";
import { summarizeWeek, weekBounds, type WeekSession } from "@/lib/focus/week";
import { createClient } from "@/lib/supabase/server";
import { getUserTimeZone } from "@/lib/today";

export const metadata: Metadata = { title: "Focus — FindYourself" };
export const dynamic = "force-dynamic";

export default async function FocusPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/focus");

  const timeZone = getUserTimeZone();
  const today = todayInTimeZone(timeZone);
  const dayStart = zonedDayStartUTC(today, timeZone).toISOString();
  const dayEnd = zonedDayStartUTC(shiftISODate(today, 1), timeZone).toISOString();
  const bounds = weekBounds(today, timeZone);

  // What you could be focusing on: today's open tasks (overdue included, since
  // they sit under Today on the board too; Backlog has no date and is left out)
  // and today's timetable blocks. Plus this week's sessions for the tile and
  // the latest few for the list.
  const [{ data: tasks }, { data: blocks }, { data: weekRows }, { data: recent }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, is_restriction")
      .eq("user_id", user.id)
      .is("completed_at", null)
      .lte("scheduled_for", today)
      .order("is_restriction", { ascending: false })
      .order("sort_order")
      .limit(50)
      .returns<PickTask[]>(),
    supabase
      .from("time_blocks")
      .select("id, title, starts_at, ends_at")
      .eq("user_id", user.id)
      .gte("starts_at", dayStart)
      .lt("starts_at", dayEnd)
      .order("starts_at")
      .limit(50)
      .returns<PickBlock[]>(),
    supabase
      .from("focus_sessions")
      .select("started_at, duration_seconds, completed")
      .eq("user_id", user.id)
      .gte("started_at", new Date(bounds.startMs).toISOString())
      .lt("started_at", new Date(bounds.endMs).toISOString())
      .limit(2000)
      .returns<WeekSession[]>(),
    supabase
      .from("focus_sessions")
      .select("id, started_at, duration_seconds, planned_seconds, completed, label")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(8)
      .returns<RecentSession[]>(),
  ]);

  const week = summarizeWeek(weekRows ?? [], bounds, today);

  return (
    <div className="flex flex-col gap-3 pb-10">
      <header className="plate w-full">
        <h1 className="font-display text-3xl">Focus</h1>
        <p className="text-ink-secondary text-[15px] mt-1">
          One thing at a time. The timer keeps going while you move around the app.
        </p>
      </header>
      {/* One column on a phone (timer, week, settings); timer and week side by side from
          1024 px, settings under the timer; settings, timer and week as three columns on a
          wide screen (the Figma layout). */}
      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] min-[1400px]:grid-cols-[330px_440px_330px] min-[1400px]:justify-center">
        <TimerCard linkSlot={<LinkPicker tasks={tasks ?? []} blocks={blocks ?? []} timeZone={timeZone} />} />
        <WeekTile week={week} recent={recent ?? []} timeZone={timeZone} />
        <div className="min-[1400px]:order-first">
          <TimerSettings />
        </div>
      </div>
    </div>
  );
}
