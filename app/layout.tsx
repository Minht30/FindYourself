import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Lora, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ThemeClock from "@/components/layout/ThemeClock";
import { THEME_COOKIE, THEME_PREF_COOKIE, serverTheme } from "@/lib/themeCookies";
import { themeInitScript } from "@/lib/themeScript";
import { TZ_COOKIE } from "@/lib/timezone";
import { getNow } from "@/lib/today";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FindYourself — Cozy productivity, day & night",
  description:
    "A cozy personal productivity sanctuary. Timetable, diary, tasks, focus, and a custom ambient environment.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // The theme is painted on the server from the person's cookies (their choice, and
  // their time zone for Auto), so there is no flash of the wrong one. On a very first
  // visit the zone is not known yet; the script in the head corrects it before paint.
  const jar = cookies();
  const theme = serverTheme({
    pref: jar.get(THEME_PREF_COOKIE)?.value,
    theme: jar.get(THEME_COOKIE)?.value,
    zone: jar.get(TZ_COOKIE)?.value,
    nowMs: getNow().getTime(),
  });
  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${lora.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Tell the server the browser's timezone so it can resolve "today" (see lib/today.ts) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var z=Intl.DateTimeFormat().resolvedOptions().timeZone;var m=document.cookie.match(/(?:^|; )fy-tz-manual=([^;]*)/);if(m){try{var c=decodeURIComponent(m[1]);Intl.DateTimeFormat(undefined,{timeZone:c});z=c;}catch(e){}}if(z){document.cookie='fy-tz='+encodeURIComponent(z)+';path=/;max-age=31536000;samesite=lax';}}catch(e){}})();`,
          }}
        />
        {/* Resolve the theme before the first paint, once the zone is known (see lib/themeScript.ts) */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body>
        {children}
        <ThemeClock />
      </body>
    </html>
  );
}
