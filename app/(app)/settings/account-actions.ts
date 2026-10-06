"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { confirmationOk, ownObjectPaths, type DeleteReason } from "@/lib/accountDeletion";

export type DeleteAccountResult = { ok: true } | { ok: false; reason: DeleteReason };

const MUSIC_BUCKET = "music";

// Delete the signed-in person's account and everything in it. Their rows go by
// cascade when the auth user is deleted; the stored music files do not, so they
// are removed first (a failure there stops everything: nothing is deleted).
// The service-role key is used only for the two things the person cannot do for
// themselves, and only ever with the id of the person who is signed in here.
export async function deleteAccount(confirmation: string): Promise<DeleteAccountResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  if (!confirmationOk(confirmation)) return { ok: false, reason: "confirmation_mismatch" };

  const admin = createAdminClient();
  if (!admin) return { ok: false, reason: "not_configured" };

  // 1. The stored files, only inside this person's own folder.
  const bucket = admin.storage.from(MUSIC_BUCKET);
  for (let pass = 0; pass < 5; pass++) {
    const { data: listed, error: listError } = await bucket.list(user.id, { limit: 1000 });
    if (listError) return { ok: false, reason: "storage_error" };
    const paths = ownObjectPaths(user.id, (listed ?? []).map((o) => o.name));
    if (paths.length === 0) break;
    const { error: removeError } = await bucket.remove(paths);
    if (removeError) return { ok: false, reason: "storage_error" };
  }
  const { data: left, error: leftError } = await bucket.list(user.id, { limit: 1 });
  if (leftError || (left ?? []).length > 0) return { ok: false, reason: "storage_error" };

  // 2. The account: every table that refers to the person cascades from here.
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return { ok: false, reason: "delete_failed" };

  // 3. End this browser's session (the token no longer matches anyone).
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return { ok: true };
}
