// Deleting an account: the rules, with no network. The action does the work;
// these decide whether it may start and which stored files it may remove.

export const DELETE_PHRASE = "DELETE";

export type DeleteReason =
  | "unauthenticated"
  | "confirmation_mismatch"
  | "not_configured"
  | "storage_error"
  | "delete_failed";

export const DELETE_MESSAGES: Record<DeleteReason, string> = {
  unauthenticated: "Sign in again to delete your account.",
  confirmation_mismatch: `Type ${DELETE_PHRASE} in capital letters to confirm.`,
  not_configured: "Deleting accounts is not available right now. Nothing was deleted.",
  storage_error: "Your music files could not be removed, so nothing was deleted. Try again.",
  delete_failed: "Your account could not be deleted. Your data is still there; try again.",
};

// Typing the word on purpose is the second step of the confirmation. Exact, so
// "delete" or " DELETE " do not count: a deliberate act, not a slip.
export function confirmationOk(input: unknown): boolean {
  return input === DELETE_PHRASE;
}

// A stored file may be removed only if it sits directly in the person's own
// folder (`{user_id}/{file}`). A name with a slash, a dot-dot or an empty name
// is never touched, whatever the listing returned.
export function ownObjectPaths(userId: string, names: readonly string[]): string[] {
  return names
    .filter((n) => typeof n === "string" && n.length > 0 && !n.includes("/") && !n.includes("..") && !n.includes("\\"))
    .map((n) => `${userId}/${n}`);
}
