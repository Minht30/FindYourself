import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

// A client with the service-role key: it bypasses row-level security, so it is
// for server code only and for the few things a signed-in person cannot do for
// themselves (today: deleting their own account and stored files). Never import
// this from a client component. Returns null when the key is not configured, so
// callers can refuse by name instead of crashing.
export function createAdminClient(env: Record<string, string | undefined> = process.env): SupabaseClient | null {
  if (typeof window !== "undefined") throw new Error("The admin client must never run in the browser.");
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
