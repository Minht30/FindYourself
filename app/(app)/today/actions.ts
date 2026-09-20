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
