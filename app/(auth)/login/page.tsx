import Link from "next/link";
import { login } from "../actions";

type Props = { searchParams: { error?: string; next?: string } };

export default function LoginPage({ searchParams }: Props) {
  return (
    <div className="w-full max-w-md">
      <div className="bg-bg-elevated border border-[var(--border)] rounded-2xl p-8 shadow-card">
        <h1 className="font-display text-3xl font-semibold mb-2">Welcome back.</h1>
        <p className="text-ink-secondary mb-6 text-sm font-ui">Sign in to your quiet corner.</p>

        {searchParams.error && (
          <div className="mb-4 p-3 rounded-lg bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] border border-[color-mix(in_srgb,var(--danger)_40%,transparent)] text-danger text-sm font-ui">
            {searchParams.error}
          </div>
        )}

        <form action={login} className="flex flex-col gap-4">
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
              autoComplete="current-password"
              className="px-4 py-2.5 rounded-lg bg-bg-alt border border-[var(--border-strong)] text-ink-primary font-ui text-sm focus:border-accent focus:outline-none transition"
              placeholder="••••••••"
            />
          </label>
          <button
            type="submit"
            className="mt-2 px-4 py-2.5 rounded-lg bg-accent text-cat-ink font-ui font-semibold text-sm shadow-glow hover:brightness-105 transition"
          >
            Sign in →
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[var(--border)] text-center text-sm font-ui text-ink-secondary">
          New here?{" "}
          <Link href="/signup" className="text-accent-strong font-semibold hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
