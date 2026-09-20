"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export type CreateBlockInput = {
  startsAt: string; // ISO
  endsAt: string;   // ISO
  categoryId: string | null;
  title: string;
};

export async function createBlock(input: CreateBlockInput): Promise<{ id: string } | { error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  const startMs = Date.parse(input.startsAt);
  const endMs = Date.parse(input.endsAt);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return { error: "invalid_dates" };
  if (endMs - startMs < 15 * 60 * 1000) return { error: "too_short" };

  const { data, error } = await supabase
    .from("time_blocks")
    .insert({
      user_id: user.id,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      category_id: input.categoryId,
      title: input.title,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/today");
  return { id: data.id };
}

export type UpdateBlockInput = {
  id: string;
  title: string;
  categoryId: string | null;
  notes: string | null;
};

export async function updateBlock(input: UpdateBlockInput): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { error } = await supabase
    .from("time_blocks")
    .update({
      title: input.title,
      category_id: input.categoryId,
      notes: input.notes,
    })
    .eq("id", input.id);
  // RLS keeps this scoped to the caller — no need for a user_id filter.

  if (error) return { ok: false, error: error.message };
  revalidatePath("/today");
  return { ok: true };
}

export type MoveBlockInput = {
  id: string;
  startsAt: string;
  endsAt: string;
};

export async function moveBlock(input: MoveBlockInput): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const startMs = Date.parse(input.startsAt);
  const endMs = Date.parse(input.endsAt);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return { ok: false, error: "invalid_dates" };
  if (endMs - startMs < 15 * 60 * 1000) return { ok: false, error: "too_short" };

  const { error } = await supabase
    .from("time_blocks")
    .update({ starts_at: input.startsAt, ends_at: input.endsAt })
    .eq("id", input.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/today");
  return { ok: true };
}

export type CopyDayInput = {
  // Client-computed range in ISO UTC covering the source day in the user's tz.
  sourceStart: string;
  sourceEnd: string;
  // Milliseconds to shift each cloned block by. Typically +24h to copy
  // "yesterday" onto "today"; kept generic so we can reuse for other shifts.
  offsetMs: number;
};

export async function copyDayBlocks(
  input: CopyDayInput,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  if (!Number.isFinite(input.offsetMs)) return { ok: false, error: "invalid_offset" };
  const sourceStartMs = Date.parse(input.sourceStart);
  const sourceEndMs = Date.parse(input.sourceEnd);
  if (!Number.isFinite(sourceStartMs) || !Number.isFinite(sourceEndMs)) {
    return { ok: false, error: "invalid_dates" };
  }

  const { data: source, error: readErr } = await supabase
    .from("time_blocks")
    .select("title, notes, category_id, starts_at, ends_at")
    .gte("starts_at", input.sourceStart)
    .lt("starts_at", input.sourceEnd);

  if (readErr) return { ok: false, error: readErr.message };
  if (!source || source.length === 0) return { ok: true, count: 0 };

  const clones = source.map((b) => ({
    user_id: user.id,
    title: b.title,
    notes: b.notes,
    category_id: b.category_id,
    starts_at: new Date(Date.parse(b.starts_at) + input.offsetMs).toISOString(),
    ends_at: new Date(Date.parse(b.ends_at) + input.offsetMs).toISOString(),
  }));

  const { data: inserted, error } = await supabase
    .from("time_blocks")
    .insert(clones)
    .select("id");

  if (error) return { ok: false, error: error.message };
  revalidatePath("/today");
  return { ok: true, count: inserted?.length ?? 0 };
}

export async function deleteBlock(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { error } = await supabase.from("time_blocks").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/today");
  return { ok: true };
}
