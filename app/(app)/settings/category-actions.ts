"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  isUuid,
  normalizeColor,
  reasonFromDb,
  validateCategoryColor,
  validateCategoryName,
  type CategoryReason,
} from "@/lib/categoryRules";

export type CategoryResult = { ok: true } | { ok: false; reason: CategoryReason };

const fail = (reason: CategoryReason): CategoryResult => ({ ok: false, reason });

async function signedIn() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// Categories show in the sidebar, the timetable and the task editor, so every
// change refreshes the whole layout.
function refresh() {
  revalidatePath("/", "layout");
}

export async function createCategory(rawName: string, rawColor: string): Promise<CategoryResult> {
  const { supabase, user } = await signedIn();
  if (!user) return fail("unauthenticated");

  const name = validateCategoryName(rawName);
  if (!name.ok) return fail(name.reason);
  if (!validateCategoryColor(rawColor)) return fail("bad_color");

  // A new category goes last.
  const { data: last, error: lastError } = await supabase
    .from("categories")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastError) return fail("db_error");

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name: name.value,
    color: normalizeColor(rawColor),
    sort_order: Math.min(1000, (last?.sort_order ?? -1) + 1),
  });
  if (error) return fail(reasonFromDb(error));

  refresh();
  return { ok: true };
}

export async function updateCategory(id: string, patch: { name?: string; color?: string }): Promise<CategoryResult> {
  const { supabase, user } = await signedIn();
  if (!user) return fail("unauthenticated");
  if (!isUuid(id)) return fail("bad_id");

  // Only name and colour can change here, whatever else the caller sends.
  const update: { name?: string; color?: string } = {};
  if (patch && patch.name !== undefined) {
    const name = validateCategoryName(patch.name);
    if (!name.ok) return fail(name.reason);
    update.name = name.value;
  }
  if (patch && patch.color !== undefined) {
    if (!validateCategoryColor(patch.color)) return fail("bad_color");
    update.color = normalizeColor(patch.color);
  }
  if (Object.keys(update).length === 0) return fail("bad_name");

  const { data, error } = await supabase.from("categories").update(update).eq("id", id).eq("user_id", user.id).select("id");
  if (error) return fail(reasonFromDb(error));
  if (!data || data.length === 0) return fail("not_found");

  refresh();
  return { ok: true };
}

// Delete a category, optionally moving the blocks and tasks that use it to
// another one first (one database function: all or nothing).
export async function deleteCategory(id: string, moveTo: string | null): Promise<CategoryResult> {
  const { supabase, user } = await signedIn();
  if (!user) return fail("unauthenticated");
  if (!isUuid(id)) return fail("bad_id");
  if (moveTo !== null && !isUuid(moveTo)) return fail("bad_id");

  const { error } = await supabase.rpc("delete_category", { p_id: id, p_to: moveTo });
  if (error) return fail(reasonFromDb(error));

  refresh();
  return { ok: true };
}

export async function reorderCategories(ids: string[]): Promise<CategoryResult> {
  const { supabase, user } = await signedIn();
  if (!user) return fail("unauthenticated");
  if (!Array.isArray(ids) || ids.length === 0 || !ids.every(isUuid)) return fail("bad_order");

  const { error } = await supabase.rpc("reorder_categories", { p_ids: ids });
  if (error) return fail(reasonFromDb(error));

  refresh();
  return { ok: true };
}
