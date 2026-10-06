import Link from "next/link";

// Any address the app does not have. Plain on purpose (design is Stage 2).
export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <section
        data-not-found
        className="mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-bg-elevated shadow-card px-6 py-8 text-center font-ui"
      >
        <div aria-hidden className="text-3xl mb-3">
          🍂
        </div>
        <h1 className="font-display text-2xl mb-2">This page wandered off.</h1>
        <p className="text-[15px] text-ink-secondary">There is nothing at this address. It may have moved, or never existed.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/today"
            className="px-5 py-2.5 rounded-xl bg-accent text-cat-ink font-semibold shadow-glow hover:brightness-105 transition"
          >
            Back to the timetable
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl border border-[var(--border-strong)] text-ink-primary font-medium hover:bg-bg-alt transition"
          >
            Go home
          </Link>
        </div>
      </section>
    </main>
  );
}
