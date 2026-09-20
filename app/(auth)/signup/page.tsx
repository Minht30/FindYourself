import Link from "next/link";
import { signup } from "../actions";

type Props = { searchParams: { error?: string; sent?: string } };

export default function SignupPage({ searchParams }: Props) {
  if (searchParams.sent) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-bg-elevated border border-[var(--border)] rounded-2xl p-8 shadow-card text-center">
          <div className="text-5xl mb-4">📮</div>
          <h1 className="font-display text-2xl font-semibold mb-2">Check your inbox.</h1>
          <p className="text-ink-secondary text-sm font-ui mb-6">
            We sent a confirmation link to{" "}
            <span className="text-ink-primary font-semibold">{searchParams.sent}</span>. Click it to
            finish signing up.
          </p>
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 rounded-lg bg-accent text-cat-ink font-ui font-semibold text-sm shadow-glow hover:brightness-105 transition"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-bg-elevated border border-[var(--border)] rounded-2xl p-8 shadow-card">
        <h1 className="font-display text-3xl font-semibold mb-2">Make it yours.</h1>
        <p className="text-ink-secondary mb-6 text-sm font-ui">Create your quiet corner.</p>

        {searchParams.error && (
          <div className="mb-4 p-3 rounded-lg bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] border border-[color-mix(in_srgb,var(--danger)_40%,transparent)] text-danger text-sm font-ui">
            {searchParams.error}
          </div>
        )}

        <form action={signup} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-ui font-semibold text-ink-secondary uppercase tracking-wider">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              className="px-4 py-2.5 rounded-lg bg-bg-alt border border-[var(--border-strong)] text-ink-primary font-ui text-sm focus:border-accent focus:outline-none transition"
              placeholder="you@example.com"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-ui font-semibold text-ink-secondary uppercase tracking-wider">Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="px-4 py-2.5 rounded-lg bg-bg-alt border border-[var(--border-strong)] text-ink-primary font-ui text-sm focus:border-accent focus:outline-none transition"
              placeholder="At least 8 characters"
            />
          </label>
          <button
            type="submit"
            className="mt-2 px-4 py-2.5 rounded-lg bg-accent text-cat-ink font-ui font-semibold text-sm shadow-glow hover:brightness-105 transition"
          >
            Create account
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[var(--border)] text-center text-sm font-ui text-ink-secondary">
          Already have one?{" "}
          <Link href="/login" className="text-accent-strong font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
