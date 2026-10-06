"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveTimeZone } from "@/app/(app)/profile-actions";
import { TZ_COOKIE, TZ_MANUAL_COOKIE, isKnownTimeZone } from "@/lib/timezone";

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return null;
  }
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=31536000;samesite=lax`;
}

// Keeps the zone the app works in consistent between the browser, the profile
// and the cookies the server reads. Renders nothing.
//
// Automatic: the profile follows the browser (saved once per zone per page load).
// Manual (the person chose a zone in Settings): the profile is the truth. A
// device that has never seen the choice (a new browser, cleared cookies) gets
// the cookies written from it and the page asked to render again; an automatic
// device that still holds a stale choice drops it the same way.
export default function TimeZoneSync({ savedZone, manual }: { savedZone: string; manual: boolean }) {
  const router = useRouter();
  const tried = useRef<string | null>(null);

  useEffect(() => {
    let browserZone: string | undefined;
    try {
      browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      browserZone = undefined;
    }

    if (manual) {
      if (!isKnownTimeZone(savedZone)) return;
      if (readCookie(TZ_MANUAL_COOKIE) !== savedZone || readCookie(TZ_COOKIE) !== savedZone) {
        writeCookie(TZ_MANUAL_COOKIE, savedZone);
        writeCookie(TZ_COOKIE, savedZone);
        router.refresh();
      }
      return;
    }

    if (readCookie(TZ_MANUAL_COOKIE) !== null) {
      document.cookie = `${TZ_MANUAL_COOKIE}=;path=/;max-age=0`;
      if (isKnownTimeZone(browserZone)) writeCookie(TZ_COOKIE, browserZone);
      router.refresh();
    }

    if (!browserZone || browserZone === savedZone || tried.current === browserZone) return;
    tried.current = browserZone;
    void saveTimeZone(browserZone);
  }, [savedZone, manual, router]);

  return null;
}
