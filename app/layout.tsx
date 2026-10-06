import type { Metadata } from "next";
import { Lora, Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
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
  return (
    <html
      lang="en"
      data-theme="sunny-cafe"
      className={`${lora.variable} ${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Restore theme + set system default before paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('fy-theme');if(t){document.documentElement.setAttribute('data-theme',t);}else if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.setAttribute('data-theme','netcafe-night');}}catch(e){}})();`,
          }}
        />
        {/* Tell the server the browser's timezone so it can resolve "today" (see lib/today.ts) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var z=Intl.DateTimeFormat().resolvedOptions().timeZone;var m=document.cookie.match(/(?:^|; )fy-tz-manual=([^;]*)/);if(m){try{var c=decodeURIComponent(m[1]);Intl.DateTimeFormat(undefined,{timeZone:c});z=c;}catch(e){}}if(z){document.cookie='fy-tz='+encodeURIComponent(z)+';path=/;max-age=31536000;samesite=lax';}}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
