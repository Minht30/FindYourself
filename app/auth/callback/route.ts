import { NextResponse, type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles Supabase auth redirects from email confirmations and OAuth.
 *
 * Supabase can send users here with different query params depending on
 * project settings and email template version:
 *   - PKCE flow:      ?code=<code>
 *   - verifyOtp flow: ?token_hash=<hash>&type=<signup|email|recovery|...>
 *
 * We try each in order, and if all fail but the user already has a valid
 * session cookie (e.g. from signup auto-session), we still let them in.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/today";

  const supabase = createClient();
  let lastError: string | null = null;

  // 1) PKCE flow — modern default
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    lastError = `code exchange: ${error.message}`;
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
  }

  // 2) verifyOtp flow — older / alternative email template
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    lastError = `verifyOtp: ${error.message}`;
    console.error("[auth/callback] verifyOtp failed:", error.message);
  }

  // 3) Already signed in? (signup auto-session, or the same code was consumed
  //    on a previous click / server prefetch). Let them in gracefully.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const msg =
    lastError ?? "No auth code or token in callback URL. Try signing in again.";
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`);
}
