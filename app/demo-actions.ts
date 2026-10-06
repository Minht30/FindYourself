"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserTimeZone, getUserToday } from "@/lib/today";
import {
  demoReasonFromAuthError,
  isGuest,
  upgradeReasonFromAuthError,
  validateUpgrade,
  type DemoReason,
  type UpgradeReason,
} from "@/lib/demo";

export type StartDemoResult = { ok: true } | { ok: false; reason: DemoReason };
export type UpgradeResult = { ok: true; needsConfirmation: boolean } | { ok: false; reason: UpgradeReason };

// "Try the demo": a temporary guest account with sample data, one per visitor.
// If the visitor is already signed in to a REAL account the demo would replace
// their session, so it asks first (`signed_in`); with `replaceSession` it signs
// them out of this browser and starts the demo. A visitor already in a demo just
// carries on with it.
// The sample data is written by a database function that runs AS the visitor
// (so row-level security applies to every row), placed relative to their own
// day and time zone. A guest account that cannot be seeded is signed out again
// at once (the hourly purge removes the leftover).
export async function startDemo(replaceSession = false): Promise<StartDemoResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    if (isGuest(user)) return { ok: true };
    if (replaceSession !== true) return { ok: false, reason: "signed_in" };
    await supabase.auth.signOut();
  }

  const { error: signInError } = await supabase.auth.signInAnonymously();
  if (signInError) return { ok: false, reason: demoReasonFromAuthError(signInError) };

  const { error: seedError } = await supabase.rpc("seed_demo", { p_today: getUserToday(), p_tz: getUserTimeZone() });
  if (seedError) {
    await supabase.auth.signOut();
    return { ok: false, reason: "seed_failed" };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// Turn the guest account into a real one: the data comes along. With email
// confirmation switched on (it is), the account becomes permanent once the
// person clicks the link in the email, so the answer says so.
export async function upgradeDemo(email: string, password: string): Promise<UpgradeResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };
  if (!isGuest(user)) return { ok: false, reason: "not_demo" };

  const checked = validateUpgrade(email, password);
  if (!checked.ok) return { ok: false, reason: checked.reason };

  const { error } = await supabase.auth.updateUser({ email: checked.email, password });
  if (error) return { ok: false, reason: upgradeReasonFromAuthError(error) };

  revalidatePath("/", "layout");
  return { ok: true, needsConfirmation: true };
}
