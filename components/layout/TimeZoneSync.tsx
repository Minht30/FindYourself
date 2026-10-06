"use client";

import { useEffect, useRef } from "react";
import { saveTimeZone } from "@/app/(app)/profile-actions";

// Keeps the zone saved on the profile equal to the browser's. Renders nothing.
// It asks once per zone per page load: a refused zone is not retried in a loop,
// and the layout re-renders with the new saved zone once the save revalidates.
export default function TimeZoneSync({ savedZone }: { savedZone: string }) {
  const tried = useRef<string | null>(null);

  useEffect(() => {
    let zone: string | undefined;
    try {
      zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }
    if (!zone || zone === savedZone || tried.current === zone) return;
    tried.current = zone;
    void saveTimeZone(zone);
  }, [savedZone]);

  return null;
}
