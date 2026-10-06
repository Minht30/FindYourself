// A test hook for time-of-week features (the weekly wins card only appears on
// Sunday evening, and a test cannot wait for one). In development only, a
// `fy-now` cookie holding an ISO instant ("2026-10-11T23:30:00Z") replaces the
// server's clock for the page that asks for it. In a production build this
// always answers null, so the cookie does nothing there.
export const NOW_COOKIE = "fy-now";

export function parseNowOverride(raw: string | undefined, nodeEnv: string | undefined): Date | null {
  if (nodeEnv === "production") return null;
  if (!raw) return null;
  let text = raw;
  try {
    text = decodeURIComponent(raw);
  } catch {
    return null;
  }
  // Strict ISO instant with a zone designator: no guessing at local time.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(text)) return null;
  const ms = Date.parse(text);
  return Number.isFinite(ms) ? new Date(ms) : null;
}
