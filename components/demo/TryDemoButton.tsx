"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { startDemo } from "@/app/demo-actions";
import { DEMO_MESSAGES, type DemoReason } from "@/lib/demo";

// "Try the demo" on the landing page: a guest account with sample data. If you
// are signed in to your own account it says so and lets you choose, instead of
// quietly taking you back to that account.
export default function TryDemoButton() {
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
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(false)}
        className="px-6 py-3 rounded-xl border border-accent text-ink-primary font-ui font-semibold hover:bg-accent-soft transition disabled:opacity-60"
      >
        {pending ? "Setting up your demo…" : "Try the demo"}
      </button>
      {reason === "signed_in" ? (
        <div role="alert" data-reason={reason} className="max-w-sm font-ui text-sm text-ink-secondary">
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
        <p role="alert" data-reason={reason} className="max-w-xs font-ui text-sm text-[var(--danger)]">
          {DEMO_MESSAGES[reason]}
        </p>
      ) : null}
    </div>
  );
}
