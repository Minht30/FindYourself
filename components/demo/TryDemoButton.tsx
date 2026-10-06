"use client";

import { useState, useTransition } from "react";
import { startDemo } from "@/app/demo-actions";
import { DEMO_MESSAGES, type DemoReason } from "@/lib/demo";

// "Try the demo" on the landing page: a guest account with sample data.
export default function TryDemoButton() {
  const [pending, start] = useTransition();
  const [reason, setReason] = useState<DemoReason | null>(null);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setReason(null);
          start(async () => {
            const res = await startDemo();
            // A request that gets no answer has no result at all.
            if (!res) return setReason("demo_unavailable");
            if (!res.ok) return setReason(res.reason);
            // A full navigation, so the new session is picked up everywhere.
            window.location.assign("/today");
          });
        }}
        className="px-6 py-3 rounded-xl border border-accent text-ink-primary font-ui font-semibold hover:bg-accent-soft transition disabled:opacity-60"
      >
        {pending ? "Setting up your demo…" : "Try the demo"}
      </button>
      {reason ? (
        <p role="alert" data-reason={reason} className="max-w-xs font-ui text-sm text-[var(--danger)]">
          {DEMO_MESSAGES[reason]}
        </p>
      ) : null}
    </div>
  );
}
