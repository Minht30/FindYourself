"use client";

import { useSearchParams } from "next/navigation";

// Shown on the home page right after an account was deleted (`/?deleted=1`).
// A client component, so the landing page itself stays static.
export default function DeletedNotice() {
  const params = useSearchParams();
  if (params?.get("deleted") !== "1") return null;
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
