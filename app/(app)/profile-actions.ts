"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidFocusGoal } from "@/lib/rings";
import { isKnownTimeZone } from "@/lib/timezone";

export type SaveTimeZoneResult = { ok: true } | { ok: false; error: "unauthenticated" | "bad_timezone" | "db_error" };

// The database decides which calendar day a diary entry or a finished task
// belongs to (the streak, Phase 8), so it needs the person's zone. The browser
// reports it; this saves it on the profile. A new zone makes the database
// recompute the streak (trigger `profiles_streak_tz`).
export async function saveTimeZone(zone: string): Promise<SaveTimeZoneResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  if (!isKnownTimeZone(zone)) return { ok: false, error: "bad_timezone" };

  const { error } = await supabase.from("profiles").update({ timezone: zone }).eq("id", user.id);
  if (error) return { ok: false, error: error.code === "22023" ? "bad_timezone" : "db_error" };

  revalidatePath("/", "layout");
  return { ok: true };
}

export type SaveFocusGoalResult = { ok: true } | { ok: false; error: "unauthenticated" | "bad_goal" | "db_error" };

// The daily focus goal behind the focus ring on /today: whole minutes, 15 to
// 720 in steps of 5. Checked here for a named reason, and again by the
// database (`profiles_focus_goal_range`).
export async function saveFocusGoal(minutes: number): Promise<SaveFocusGoalResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  if (!isValidFocusGoal(minutes)) return { ok: false, error: "bad_goal" };

  const { error } = await supabase.from("profiles").update({ daily_focus_goal_minutes: minutes }).eq("id", user.id);
  if (error) return { ok: false, error: error.code === "23514" ? "bad_goal" : "db_error" };

  revalidatePath("/today");
  return { ok: true };
}
