"use client";

import "./globals.css";

// The last resort: the root layout itself failed, so there is no app shell to
// keep. This replaces the whole document, so it brings its own <html> and
// <body>; it uses only the global stylesheet (no fonts or providers the broken
// layout would have supplied).
export default function GlobalError({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" data-theme="monstadt">
      <body>
        <main className="min-h-screen flex items-center justify-center px-6 py-16">
          <section
            role="alert"
            data-error-panel
            className="mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-bg-elevated shadow-card px-6 py-8 text-center"
          >
            <h1 className="text-2xl font-semibold mb-2">Something spilled.</h1>
            <p className="text-[15px] text-ink-secondary">
              FindYourself could not load. Anything you had already saved is untouched.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                // A full reload: the router (or the layout around it) is what failed
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl bg-accent text-cat-ink font-semibold shadow-glow"
              >
                Try again
              </button>
              {/* A plain link: the router itself may be what broke */}
              <a href="/" className="px-5 py-2.5 rounded-xl border border-[var(--border-strong)] text-ink-primary font-medium">
                Go home
              </a>
            </div>
            {error.digest ? (
              <p className="mt-5 font-mono text-[11px] text-ink-muted" data-error-digest>
                Reference: {error.digest}
              </p>
            ) : null}
          </section>
        </main>
      </body>
    </html>
  );
}
