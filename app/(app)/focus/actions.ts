"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateSession, type SessionRow } from "@/lib/focus/validate";

export type SaveResult =
  | { ok: true; saved: string[]; rejected: { id: string; reason: string }[] }
  | { ok: false; error: string };

const MAX_BATCH = 50;

// Saves finished / abandoned focus sessions from the browser's outbox.
//
// * Every record is validated first (lib/focus/validate.ts); the ones that can
//   never be valid come back as `rejected` so the browser drops them instead of
//   retrying forever.
// * The insert is idempotent (the browser generated the id), so a replay from a
//   retry or a second tab is a no-op.
// * A task or block that was deleted since the session started is unlinked
//   rather than failing the insert on its foreign key; the label snapshot keeps
//   the name.
// * RLS still decides who may write: user_id is set here from the session, and
//   the table's own policy checks the task / block belong to the caller.
export async function saveFocusSessions(input: unknown): Promise<SaveResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_BATCH) {
    return { ok: false, error: "invalid_batch" };
  }

  const now = Date.now();
  const rows: SessionRow[] = [];
  const rejected: { id: string; reason: string }[] = [];
  for (const raw of input) {
    const v = validateSession(raw, now);
    if (v.ok) rows.push(v.row);
    else rejected.push({ id: idOf(raw), reason: v.reason });
  }

  if (rows.length > 0) {
    const [taskIds, blockIds] = [unique(rows.map((r) => r.task_id)), unique(rows.map((r) => r.time_block_id))];
    const [tasks, blocks] = await Promise.all([
      taskIds.length
        ? supabase.from("tasks").select("id").eq("user_id", user.id).in("id", taskIds)
        : Promise.resolve({ data: [] as { id: string }[], error: null }),
      blockIds.length
        ? supabase.from("time_blocks").select("id").eq("user_id", user.id).in("id", blockIds)
        : Promise.resolve({ data: [] as { id: string }[], error: null }),
    ]);
    if (tasks.error) return { ok: false, error: tasks.error.message };
    if (blocks.error) return { ok: false, error: blocks.error.message };
    const liveTasks = new Set((tasks.data ?? []).map((t) => t.id));
    const liveBlocks = new Set((blocks.data ?? []).map((b) => b.id));
    for (const r of rows) {
      if (r.task_id && !liveTasks.has(r.task_id)) r.task_id = null;
      if (r.time_block_id && !liveBlocks.has(r.time_block_id)) r.time_block_id = null;
    }

    const withUser = rows.map((r) => ({ ...r, user_id: user.id }));
    const batch = await supabase.from("focus_sessions").upsert(withUser, { onConflict: "id", ignoreDuplicates: true });
    if (batch.error) {
      // One bad row must not hold the rest hostage: retry them one at a time,
      // and only treat integrity / policy errors as "never going to work".
      const saved: string[] = [];
      for (const row of withUser) {
        const one = await supabase.from("focus_sessions").upsert(row, { onConflict: "id", ignoreDuplicates: true });
        if (!one.error) saved.push(row.id);
        else if (isPermanent(one.error.code)) rejected.push({ id: row.id, reason: `db_${one.error.code}` });
        else return { ok: false, error: one.error.message };
      }
      revalidatePath("/focus");
      return { ok: true, saved, rejected };
    }
  }

  revalidatePath("/focus");
  return { ok: true, saved: rows.map((r) => r.id), rejected };
}

function idOf(raw: unknown): string {
  return raw && typeof raw === "object" && typeof (raw as { id?: unknown }).id === "string"
    ? (raw as { id: string }).id
    : "unknown";
}

function unique(list: (string | null)[]): string[] {
  return [...new Set(list.filter((v): v is string => v !== null))];
}

// Postgres classes 23 (integrity constraint) and 42501 (RLS / privilege).
function isPermanent(code: string | undefined): boolean {
  return code !== undefined && (code.startsWith("23") || code === "42501");
}
