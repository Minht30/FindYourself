// Whether the desktop sidebar is folded into a slim icon rail. Kept in a cookie
// (like the task drawer) so the server paints the right layout on the first
// frame and the page never jumps. Phones are unaffected: there the sidebar is a
// drawer behind the Menu button.
export const SIDEBAR_COOKIE = "fy-sidebar";

/** "min" means folded; anything else (missing, "full", a stray value) means open. */
export function parseSidebarCollapsed(value: string | undefined | null): boolean {
  return value === "min";
}

/** The cookie string for the browser; lasts a year, like the other layout cookies. */
export function sidebarCookie(collapsed: boolean): string {
  return `${SIDEBAR_COOKIE}=${collapsed ? "min" : "full"};path=/;max-age=31536000;samesite=lax`;
}
