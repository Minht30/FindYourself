"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/music/filename";
import { MAX_NOTE, type MusicReason } from "@/lib/music/limits";

type Fail = { ok: false; reason: MusicReason; detail?: string };
export type AdminResult = { ok: true; pickId?: string | null } | Fail;

const fail = (reason: MusicReason, detail?: string): Fail => ({ ok: false, reason, ...(detail ? { detail } : {}) });
const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

async function authed() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

// The `admins` table is the single source of truth. A user can read only their
// own row there, so this is "am I an admin?" and nothing more.
async function isAdmin({ supabase }: NonNullable<Awaited<ReturnType<typeof authed>>>) {
  const { data } = await supabase.from("admins").select("user_id").maybeSingle();
  return !!data;
}

const DB_REASONS: Record<string, MusicReason> = {
  not_admin: "not_admin",
  not_found: "not_found",
  already_reviewed: "already_reviewed",
  bad_action: "bad_action",
  bad_note: "bad_note",
};

// Approve or reject a pending suggestion. All of it happens in one database
// function (`review_suggestion`): approving sets the status and creates the
// community pick together or not at all, an admin check sits inside it, and the
// row is locked while it is reviewed. This action also refuses a non-admin
// before calling it, and refuses a malformed request without a round trip.
export async function reviewSuggestion(input: unknown): Promise<AdminResult> {
  const a = await authed();
  if (!a) return fail("unauthenticated");
  const o = obj(input);
  if (!isUuid(o.id)) return fail("bad_id");
  if (o.action !== "approve" && o.action !== "reject") return fail("bad_action");
  const note = o.note === undefined || o.note === null ? "" : o.note;
  if (typeof note !== "string" || note.trim().length > MAX_NOTE) return fail("bad_note");
  if (!(await isAdmin(a))) return fail("not_admin");

  const { data, error } = await a.supabase.rpc("review_suggestion", { p_id: o.id, p_action: o.action, p_note: note });
  if (error) return fail(DB_REASONS[error.message] ?? "db_error", error.code);
  revalidatePath("/chill");
  return { ok: true, pickId: (data as string | null) ?? null };
}

// Take a track off the community picks.
export async function removePick(input: unknown): Promise<AdminResult> {
  const a = await authed();
  if (!a) return fail("unauthenticated");
  const id = obj(input).id;
  if (!isUuid(id)) return fail("bad_id");
  if (!(await isAdmin(a))) return fail("not_admin");
  const { data, error } = await a.supabase.from("community_picks").delete().eq("id", id).select("id");
  if (error) return fail("db_error", error.code);
  if (!data?.length) return fail("not_found");
  revalidatePath("/chill");
  return { ok: true };
}
