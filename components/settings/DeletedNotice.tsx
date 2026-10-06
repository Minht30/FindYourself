"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

// Shown on the home page right after an account was deleted (`/?deleted=1`).
// A client component, so the landing page itself stays static.
//
// It also clears the data this app keeps in the browser (the `fy-*` keys): the
// delete button clears them too, but the page being left rewrites some of them
// as it unloads (the music queue is saved on the way out), so the last word is
// said here, on the page that follows, where nothing is left to rewrite them.
export default function DeletedNotice() {
  const params = useSearchParams();
  const deleted = params?.get("deleted") === "1";

  useEffect(() => {
    if (!deleted) return;
    try {
      for (const key of Object.keys(localStorage)) if (key.startsWith("fy-")) localStorage.removeItem(key);
    } catch {
      // storage unavailable: nothing to clear
    }
  }, [deleted]);

  if (!deleted) return null;
  return (
    <p
      role="status"
      data-deleted-notice
      className="mb-8 mx-auto max-w-md rounded-xl border border-[var(--border)] bg-bg-elevated px-4 py-3 font-ui text-sm text-ink-secondary"
    >
      Your account and everything in it have been deleted. Thank you for trying FindYourself.
    </p>
  );
}
