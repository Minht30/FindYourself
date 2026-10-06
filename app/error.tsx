"use client";

import ErrorPanel from "@/components/layout/ErrorPanel";

// A page outside the app shell (landing, sign in, sign up) threw.
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPanel error={error} reset={reset} homeHref="/" homeLabel="Go home" standalone />;
}
