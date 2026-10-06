"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// What a visitor sees when a page throws. Plain on purpose (the real design is
// the Figma stage): a calm message, a way to retry, a way out, and the error's
// short reference so a bug report can name it. Nothing about the error itself
// (message, stack) is shown: that can contain internals, and the person cannot
// act on it.
export default function ErrorPanel({
  error,
  reset,
  homeHref,
  homeLabel,
  standalone = false,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref: string;
  homeLabel: string;
  /** Outside the app shell (landing, sign-in): the panel owns the whole screen. */
  standalone?: boolean;
}) {
  const router = useRouter();
  const [retrying, startRetry] = useTransition();

  // A page that failed on the server needs its data fetched again, not just
  // re-rendered with what it already has: refresh the route, then reset.
  function retry() {
    startRetry(() => {
      router.refresh();
      reset();
    });
  }

  useEffect(() => {
    // Server-side the error is already logged by Next; this keeps it in the
    // browser console for whoever is debugging.
    console.error(error);
  }, [error]);

  const body = (
    <section
      role="alert"
      data-error-panel
      className="mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-bg-elevated shadow-card px-6 py-8 text-center font-ui"
    >
      <div aria-hidden className="text-3xl mb-3">
        🫖
      </div>
      <h1 className="font-display text-2xl mb-2">Something spilled.</h1>
      <p className="text-[15px] text-ink-secondary">
        This page hit a problem and could not finish loading. Anything you had already saved is untouched.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={retry}
          disabled={retrying}
          className="px-5 py-2.5 rounded-xl bg-accent text-cat-ink font-semibold shadow-glow hover:brightness-105 transition disabled:opacity-60"
        >
          Try again
        </button>
        <Link
          href={homeHref}
          className="px-5 py-2.5 rounded-xl border border-[var(--border-strong)] text-ink-primary font-medium hover:bg-bg-alt transition"
        >
          {homeLabel}
        </Link>
      </div>
      {error.digest ? (
        <p className="mt-5 font-mono text-[11px] text-ink-muted" data-error-digest>
          Reference: {error.digest}
        </p>
      ) : null}
    </section>
  );

  return standalone ? <main className="min-h-screen flex items-center justify-center px-6 py-16">{body}</main> : body;
}
