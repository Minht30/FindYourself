"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/music/filename";
import type { MusicReason } from "@/lib/music/limits";
import { validateSuggestion } from "@/lib/music/suggest";

type Fail = { ok: false; reason: MusicReason; detail?: string };
export type SuggestResult = { ok: true; id?: string } | Fail;

const fail = (reason: MusicReason, detail?: string): Fail => ({ ok: false, reason, ...(detail ? { detail } : {}) });

async function authed() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

// Suggest a track by link. Nothing is hosted or embedded: the link is stored and
// later shown as text with a button that opens it in a new tab.
//
// Every field is validated (lib/music/suggest.ts) with a named reason for each
// refusal, only the four fields are ever copied (so a client cannot choose the
// status or the reviewer), the link is stored in its canonical form, and the
// database re-checks the link's host, the lengths, the status, and the cap of 5
// suggestions waiting for review. `suggested_by` comes from the session.
export async function suggestTrack(input: unknown): Promise<SuggestResult> {
  const a = await authed();
  if (!a) return fail("unauthenticated");
  const v = validateSuggestion(input);
  if (!v.ok) return fail(v.reason);

  const { data, error } = await a.supabase
    .from("track_suggestions")
    .insert({ title: v.value.title, artist: v.value.artist, link: v.value.link, reason: v.value.reason })
    .select("id")
    .single();
  if (error) return fail(error.message === "too_many_pending" ? "too_many_pending" : "db_error", error.code);
  revalidatePath("/chill");
  return { ok: true, id: data.id };
}

// Take back one of your own suggestions while it is still waiting for review.
export async function withdrawSuggestion(input: unknown): Promise<SuggestResult> {
  const a = await authed();
  if (!a) return fail("unauthenticated");
  const id = input && typeof input === "object" ? (input as Record<string, unknown>).id : undefined;
  if (!isUuid(id)) return fail("bad_id");
  const { data, error } = await a.supabase.from("track_suggestions").delete().eq("id", id).select("id");
  if (error) return fail("db_error", error.code);
  // not yours, already reviewed, or gone: all the same to the caller
  if (!data?.length) return fail("not_found");
  revalidatePath("/chill");
  return { ok: true };
}
