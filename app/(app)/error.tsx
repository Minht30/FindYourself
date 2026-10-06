"use client";

import ErrorPanel from "@/components/layout/ErrorPanel";

// A page inside the app threw. Because this boundary sits below the app layout,
// the top bar, the sidebar, the focus timer and the music player all keep
// running: a broken page never stops the song or loses the countdown.
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPanel error={error} reset={reset} homeHref="/today" homeLabel="Back to the timetable" />;
}
