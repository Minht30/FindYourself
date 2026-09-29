"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserToday } from "@/lib/today";
import { isBucket, scheduledForBucket, type Bucket } from "@/lib/tasks";

type ActionResult = { ok: true } | { ok: false; error: string };

const MAX_TITLE = 200;

// Quick-add from a bucket's "+ Add task" row. The client names the bucket;
// the server turns it into a date with the user's own "today", so a stale tab
// open across midnight can't schedule into the wrong day.
export async function createTask(bucket: Bucket, rawTitle: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  if (!isBucket(bucket)) return { ok: false, error: "invalid_bucket" };
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  if (!title) return { ok: false, error: "empty_title" };
  if (title.length > MAX_TITLE) return { ok: false, error: "title_too_long" };

  const scheduledFor = scheduledForBucket(bucket, getUserToday());

  // Append: one past the current last open task in this bucket.
  let last = supabase
    .from("tasks")
    .select("sort_order")
    .eq("user_id", user.id)
    .is("completed_at", null)
    .order("sort_order", { ascending: false })
    .limit(1);
  last = scheduledFor === null ? last.is("scheduled_for", null) : last.eq("scheduled_for", scheduledFor);
  const { data: lastRow, error: lastError } = await last.maybeSingle();
  if (lastError) return { ok: false, error: lastError.message };

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title,
    scheduled_for: scheduledFor,
    sort_order: (lastRow?.sort_order ?? 0) + 1,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/today");
  return { ok: true };
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  // RLS scopes the delete to the caller; the explicit filter documents it.
  const { error } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/today");
  return { ok: true };
}
