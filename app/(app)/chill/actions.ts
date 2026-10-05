"use server";

import { createClient } from "@/lib/supabase/server";
import { validateMixer } from "@/lib/audio/validate";

export type SaveMixerResult = { ok: true; updatedAt: string } | { ok: false; error: string };

// Saves the ambient mix for the signed-in user: one row, last write wins.
//
// * The input is validated field by field (lib/audio/validate.ts) and a failure
//   names its reason (`bad_level`, `unknown_layer`, ...).
// * user_id always comes from the session, never from the client; the table's
//   RLS policies agree (own row only) and its CHECK constraints re-validate.
// * An upsert, so the first save creates the row and later ones replace it.
//   `updated_at` is set by a database trigger.
//
// Signed out, the middleware answers this action's POST with a redirect, so
// the browser may get *no result at all*; the caller treats that as "not signed in".
export async function saveMixerState(input: unknown): Promise<SaveMixerResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const v = validateMixer(input);
  if (!v.ok) return { ok: false, error: v.reason };

  const { data, error } = await supabase
    .from("mixer_state")
    .upsert({ user_id: user.id, ...v.row }, { onConflict: "user_id" })
    .select("updated_at")
    .single();
  if (error) return { ok: false, error: `db_${error.code ?? "error"}` };
  return { ok: true, updatedAt: data.updated_at };
}
