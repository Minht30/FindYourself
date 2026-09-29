import { cookies } from "next/headers";
import { todayInTimeZone } from "@/lib/dates";

// The server runs in UTC, but "today" belongs to the user. The root layout's
// inline script writes the browser's IANA zone into the `fy-tz` cookie, so
// server components can resolve the user's calendar day. Before that cookie
// exists (very first request) we fall back to UTC.
export const TZ_COOKIE = "fy-tz";

export function getUserTimeZone(): string {
  const raw = cookies().get(TZ_COOKIE)?.value;
  if (!raw) return "UTC";
  try {
    // The script writes an encoded value ("Asia%2FHo_Chi_Minh"); decoding an
    // already-decoded zone name is a no-op, so this is safe either way.
    const zone = decodeURIComponent(raw);
    // Cookie is user-controlled: throw (→ UTC) on anything Intl doesn't know.
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return zone;
  } catch {
    return "UTC";
  }
}

export function getUserToday(): string {
  return todayInTimeZone(getUserTimeZone());
}
