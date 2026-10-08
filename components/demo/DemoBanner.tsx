"use client";

import { useState, useTransition } from "react";
import { upgradeDemo } from "@/app/demo-actions";
import { MIN_PASSWORD, UPGRADE_MESSAGES, validateUpgrade, type UpgradeReason } from "@/lib/demo";

// Shown to guests (the demo) under the top bar. It says what the demo is and
// offers to keep it by creating an account: the data comes along.
export default function DemoBanner() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState<UpgradeReason | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  function submit() {
    const checked = validateUpgrade(email, password);
    if (!checked.ok) return setReason(checked.reason);
    setReason(null);
    start(async () => {
      const res = await upgradeDemo(email, password);
      if (!res) return setReason("unauthenticated");
      if (!res.ok) return setReason(res.reason);
      setSent(true);
    });
  }

  return (
    <aside
      role="region"
      aria-label="Demo"
      data-demo-banner
      className="border-b border-[var(--border)] bg-accent-soft px-4 md:px-6 py-2.5 font-ui text-[14px] text-cat-ink"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <p>
          <strong>You are trying the demo.</strong> It comes with sample data, and everything you change is deleted
          after 24 hours.
        </p>
        {!sent ? (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="px-3 py-1 rounded-full bg-cat-ink text-accent-soft font-semibold hover:opacity-90"
          >
            {open ? "Not now" : "Create an account to keep it"}
          </button>
        ) : null}
      </div>

      {sent ? (
        <p role="status" data-demo-sent className="mt-2">
          Check your inbox: we sent a link to confirm your email. Once you click it your demo becomes your account, with
          everything in it.
        </p>
      ) : open ? (
        <form
          noValidate
          className="mt-2 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label className="flex flex-col text-[12px]">
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-0.5 rounded-md border border-[var(--border-strong)] bg-bg-elevated px-2 py-1 text-[14px] text-ink-primary"
            />
          </label>
          <label className="flex flex-col text-[12px]">
            Password ({MIN_PASSWORD}+ characters)
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-0.5 rounded-md border border-[var(--border-strong)] bg-bg-elevated px-2 py-1 text-[14px] text-ink-primary"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-1.5 rounded-full bg-cat-ink text-accent-soft font-semibold disabled:opacity-60"
          >
            {pending ? "Creating…" : "Create account"}
          </button>
          {reason ? (
            <p role="alert" data-reason={reason} className="basis-full text-[13px] font-semibold">
              {UPGRADE_MESSAGES[reason]}
            </p>
          ) : null}
        </form>
      ) : null}
    </aside>
  );
}
