import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-24">
      <div className="max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-accent-soft text-cat-ink text-xs font-ui font-semibold uppercase tracking-wider">
          <span>☕</span> A cozy sanctuary
        </div>
        <h1 className="font-display text-5xl md:text-6xl font-semibold leading-tight tracking-tight mb-6">
          Plan your day.
          <br />
          <span className="text-accent-strong italic">Find yourself.</span>
        </h1>
        <p className="text-lg text-ink-secondary mb-10 max-w-lg mx-auto">
          A single, calm place for your timetable, your diary, your focus sessions, and the sound
          of rain on the window.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/today"
            className="px-6 py-3 rounded-xl bg-accent text-cat-ink font-ui font-semibold shadow-glow hover:brightness-105 transition"
          >
            Enter →
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 rounded-xl border border-[var(--border-strong)] text-ink-primary font-ui font-medium hover:bg-bg-alt transition"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
