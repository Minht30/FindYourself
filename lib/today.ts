import { cookies } from "next/headers";
import { todayInTimeZone } from "@/lib/dates";
import { NOW_COOKIE, parseNowOverride } from "@/lib/nowOverride";
import { TZ_COOKIE } from "@/lib/timezone";

// The server runs in UTC, but "today" belongs to the user. The root layout's
// inline script writes the browser's IANA zone into the `fy-tz` cookie, so
// server components can resolve the user's calendar day. Before that cookie
// exists (very first request) we fall back to UTC.
export { TZ_COOKIE };

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

// The server's idea of "now". Always the real clock in production; in
// development a `fy-now` cookie can pretend it is another moment (see
// lib/nowOverride.ts), which is how a Sunday-evening feature gets tested.
export function getNow(): Date {
  return parseNowOverride(cookies().get(NOW_COOKIE)?.value, process.env.NODE_ENV) ?? new Date();
}
