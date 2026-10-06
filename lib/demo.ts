// The guest demo: the rules, with no network. The actions in app/demo/actions.ts
// and app/demo-actions.ts do the work; these decide what a failure means
// and whether an upgrade form is acceptable.

export type DemoReason =
  | "demo_disabled" // anonymous sign-ins are switched off in the project
  | "demo_full" // the cap on guest accounts was reached
  | "demo_unavailable"
  | "seed_failed"
  | "rate_limited"
  | "signed_in"; // someone is signed in to a real account: ask before replacing the session

export const DEMO_MESSAGES: Record<DemoReason, string> = {
  demo_disabled: "The demo is not available right now. You can still create an account.",
  demo_full: "The demo is full at the moment. Please try again a little later, or create an account.",
  demo_unavailable: "The demo could not start. Please try again in a moment.",
  seed_failed: "The demo could not be set up. Please try again in a moment.",
  rate_limited: "Too many demos were started just now. Please try again in a few minutes.",
  signed_in: "You are signed in to your own account. The demo is a separate, temporary account, so starting it signs you out here first.",
};

// What the sign-in service said, in words. `message` is the service's own text
// and may change; `status` and `code` are the stable parts when present.
export function demoReasonFromAuthError(error: { message?: string; status?: number; code?: string } | null | undefined): DemoReason {
  const text = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
  if (text.includes("anonymous") && (text.includes("disabled") || text.includes("not enabled") || text.includes("provider"))) return "demo_disabled";
  if (text.includes("demo_full")) return "demo_full";
  if (error?.status === 429 || text.includes("rate limit") || text.includes("too many")) return "rate_limited";
  return "demo_unavailable";
}

export type UpgradeReason =
  | "unauthenticated"
  | "not_demo"
  | "bad_email"
  | "weak_password"
  | "email_taken"
  | "failed";

export const UPGRADE_MESSAGES: Record<UpgradeReason, string> = {
  unauthenticated: "Your demo ended. Start a new one or sign in.",
  not_demo: "This account is already a full account.",
  bad_email: "Enter a valid email address.",
  weak_password: "Use a password of at least 8 characters.",
  email_taken: "That email already has an account. Sign in with it instead.",
  failed: "Could not create your account. Try again.",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 72; // the hashing function ignores anything longer

export function validateUpgrade(email: unknown, password: unknown): { ok: true; email: string } | { ok: false; reason: "bad_email" | "weak_password" } {
  if (typeof email !== "string") return { ok: false, reason: "bad_email" };
  const trimmed = email.trim();
  if (trimmed.length > 254 || !EMAIL.test(trimmed)) return { ok: false, reason: "bad_email" };
  if (typeof password !== "string" || password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) return { ok: false, reason: "weak_password" };
  return { ok: true, email: trimmed };
}

export function upgradeReasonFromAuthError(error: { message?: string; status?: number; code?: string } | null | undefined): UpgradeReason {
  const text = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
  if (text.includes("already") && (text.includes("registered") || text.includes("exists") || text.includes("been registered"))) return "email_taken";
  if (text.includes("email_exists") || text.includes("user_already_exists")) return "email_taken";
  if (text.includes("weak") || text.includes("password")) return "weak_password";
  if (text.includes("invalid") && text.includes("email")) return "bad_email";
  return "failed";
}

// A guest session, from the user object the sign-in service returns.
export function isGuest(user: { is_anonymous?: boolean } | null | undefined): boolean {
  return !!user && user.is_anonymous === true;
}
