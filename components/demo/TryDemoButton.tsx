"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { startDemo } from "@/app/demo-actions";
import { DEMO_MESSAGES, type DemoReason } from "@/lib/demo";

// "Try the demo" on the landing page: a guest account with sample data. If you
// are signed in to your own account it says so and lets you choose, instead of
// quietly taking you back to that account.
// `compact` is the small pill in the landing page's top bar; its messages open below it as a card.
export default function TryDemoButton({ compact = false }: { compact?: boolean }) {
  const [pending, start] = useTransition();
  const [reason, setReason] = useState<DemoReason | null>(null);

  function run(replaceSession: boolean) {
    setReason(null);
    start(async () => {
      const res = await startDemo(replaceSession);
      // A request that gets no answer has no result at all.
      if (!res) return setReason("demo_unavailable");
      if (!res.ok) return setReason(res.reason);
      // A full navigation, so the new session is picked up everywhere.
      window.location.assign("/today");
    });
  }

  return (
    <div className={compact ? "relative" : "flex flex-col items-center gap-2"}>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(false)}
        className={`border border-accent text-ink-primary font-ui font-semibold hover:bg-accent-soft hover:text-cat-ink transition disabled:opacity-60 ${
          compact ? "whitespace-nowrap px-4 py-1.5 rounded-full text-sm" : "px-6 py-3 rounded-xl"
        }`}
      >
        {pending ? "Setting up your demo…" : "Try the demo"}
      </button>
      {reason === "signed_in" ? (
        <div
          role="alert"
          data-reason={reason}
          className={`font-ui text-sm text-ink-secondary ${compact ? "absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-[var(--border)] bg-bg-elevated p-3 shadow-card" : "max-w-sm"}`}
        >
          <p>{DEMO_MESSAGES.signed_in}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(true)}
              className="px-4 py-1.5 rounded-full bg-accent text-cat-ink font-semibold disabled:opacity-60"
            >
              Sign out and start the demo
            </button>
            <Link href="/today" className="px-4 py-1.5 rounded-full border border-[var(--border-strong)] text-ink-primary font-medium">
              Go to my account
            </Link>
          </div>
        </div>
      ) : reason ? (
        <p
          role="alert"
          data-reason={reason}
          className={`font-ui text-sm text-[var(--danger)] ${compact ? "absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-[var(--border)] bg-bg-elevated p-3 shadow-card" : "max-w-xs"}`}
        >
          {DEMO_MESSAGES[reason]}
        </p>
      ) : null}
    </div>
  );
}
