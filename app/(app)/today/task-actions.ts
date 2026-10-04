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

// Below this gap between neighbours, float midpoints stop being distinct
// (about 50 halvings at one spot); renumber the bucket first.
const MIN_GAP = 1e-9;

// Drag-and-drop: put a task into `bucket`, between `prevId` and `nextId`
// (either may be null at the ends). Neighbours are sent as ids, not sort
// values, so the server computes the position from what the DB holds now.
// Dropping into a bucket re-dates the task to that bucket's day, so dragging
// an overdue task within Today re-homes it to today.
export async function moveTask(
  id: string,
  bucket: Bucket,
  prevId: string | null,
  nextId: string | null
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };
  if (!isBucket(bucket)) return { ok: false, error: "invalid_bucket" };

  const scheduledFor = scheduledForBucket(bucket, getUserToday());

  async function neighbourOrders(): Promise<{ prev: number | null; next: number | null } | { error: string }> {
    const ids = [prevId, nextId].filter((x): x is string => typeof x === "string");
    if (ids.length === 0) return { prev: null, next: null };
    const { data, error } = await supabase
      .from("tasks")
      .select("id, sort_order, scheduled_for")
      .eq("user_id", user!.id)
      .is("completed_at", null)
      .in("id", ids);
    if (error) return { error: error.message };
    // A neighbour from a different day (stale tab) can't anchor the position.
    const byId = new Map(
      (data ?? []).filter((r) => r.scheduled_for === scheduledFor).map((r) => [r.id, r.sort_order as number])
    );
    return { prev: prevId ? byId.get(prevId) ?? null : null, next: nextId ? byId.get(nextId) ?? null : null };
  }

  let n = await neighbourOrders();
  if ("error" in n) return { ok: false, error: n.error };

  if (n.prev !== null && n.next !== null && n.next - n.prev < MIN_GAP) {
    // Renumber the target bucket 1..N (rare; keeps future midpoints distinct).
    let q = supabase
      .from("tasks")
      .select("id")
      .eq("user_id", user.id)
      .is("completed_at", null)
      .neq("id", id)
      .order("sort_order");
    q = scheduledFor === null ? q.is("scheduled_for", null) : q.eq("scheduled_for", scheduledFor);
    const { data: rows, error: listError } = await q;
    if (listError) return { ok: false, error: listError.message };
    for (const [i, row] of (rows ?? []).entries()) {
      const { error: renumberError } = await supabase
        .from("tasks")
        .update({ sort_order: i + 1 })
        .eq("id", row.id)
        .eq("user_id", user.id);
      if (renumberError) return { ok: false, error: renumberError.message };
    }
    n = await neighbourOrders();
    if ("error" in n) return { ok: false, error: n.error };
  }

  const sortOrder =
    n.prev !== null && n.next !== null
      ? (n.prev + n.next) / 2
      : n.prev !== null
        ? n.prev + 1
        : n.next !== null
          ? n.next - 1
          : 1;

  const { error } = await supabase
    .from("tasks")
    .update({ scheduled_for: scheduledFor, sort_order: sortOrder })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/today");
  return { ok: true };
}
