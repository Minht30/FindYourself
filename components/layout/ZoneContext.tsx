"use client";

import { createContext, useContext } from "react";

// The time zone the app works in (the automatic one or the one the person
// chose), for client components that need "today" or the time of day without
// being handed it by a page: the clock in the top bar, the sidebar calendar.
// The server decides it (from the cookie) and passes it in, so the server and
// the browser can never disagree about which day it is.
const ZoneContext = createContext<string>("UTC");

export function ZoneProvider({ zone, children }: { zone: string; children: React.ReactNode }) {
  return <ZoneContext.Provider value={zone}>{children}</ZoneContext.Provider>;
}

export function useAppZone(): string {
  return useContext(ZoneContext);
}
