"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ThemePrefs } from "@/lib/theme";
import { serializePrefs } from "@/lib/themeCookies";
import { applyTheme, readPrefs, writePrefs } from "@/lib/themeClient";

// The choice lives on the profile so it follows a person to every device; the
// cookie is what the server and the head script read. A device that has never
// seen the choice (a new browser, cleared cookies) gets the cookie written from
// the profile, the theme applied, and the page asked to render again. Renders nothing.
export default function ThemeSync({ saved }: { saved: ThemePrefs }) {
  const router = useRouter();
  const savedKey = serializePrefs(saved);

  useEffect(() => {
    if (serializePrefs(readPrefs()) === savedKey) return;
    writePrefs(saved);
    applyTheme(saved);
    router.refresh();
    // `saved` is derived from savedKey, which is what changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey, router]);

  return null;
}
