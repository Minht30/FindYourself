import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LinkPicker, { type PickBlock, type PickTask } from "@/components/focus/LinkPicker";
import TimerCard from "@/components/focus/TimerCard";
import { shiftISODate, todayInTimeZone, zonedDayStartUTC } from "@/lib/dates";
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

  // What you could be focusing on: today's open tasks (overdue included, since
  // they sit under Today on the board too; Backlog has no date and is left out)
  // and today's timetable blocks.
  const [{ data: tasks }, { data: blocks }] = await Promise.all([
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
  ]);

  return (
    <div className="flex flex-col items-center gap-6">
      <header className="w-full max-w-[460px]">
        <h1 className="font-display text-3xl">Focus</h1>
        <p className="text-ink-secondary text-[15px] mt-1">
          One thing at a time. The timer keeps going while you move around the app.
        </p>
      </header>
      <TimerCard linkSlot={<LinkPicker tasks={tasks ?? []} blocks={blocks ?? []} timeZone={timeZone} />} />
    </div>
  );
}
