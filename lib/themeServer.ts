import { cookies } from "next/headers";
import type { ThemeName } from "@/lib/theme";
import { THEME_COOKIE, THEME_PREF_COOKIE, serverTheme } from "@/lib/themeCookies";
import { TZ_COOKIE } from "@/lib/timezone";
import { getNow } from "@/lib/today";

// The theme the server paints for this request, from the person's cookies (their
// choice, and their time zone for Auto). The root layout puts it on <html>; the
// wallpaper stage asks for the same value so its first painting matches.
export function getServerTheme(): ThemeName {
  const jar = cookies();
  return serverTheme({
    pref: jar.get(THEME_PREF_COOKIE)?.value,
    theme: jar.get(THEME_COOKIE)?.value,
    zone: jar.get(TZ_COOKIE)?.value,
    nowMs: getNow().getTime(),
  });
}
