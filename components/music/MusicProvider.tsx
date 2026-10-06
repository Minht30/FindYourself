"use client";

import { createContext, useContext, useMemo } from "react";
import type { Usage } from "@/lib/music/quota";
import type { Track } from "@/lib/music/types";

type MusicContextValue = {
  tracks: readonly Track[];
  usage: Usage;
};

const MusicContext = createContext<MusicContextValue>({ tracks: [], usage: { count: 0, totalBytes: 0 } });
export const useMusic = () => useContext(MusicContext);

// The signed-in user's library, read on the server by the app layout and handed
// down so the server HTML and the first client render agree. Actions revalidate
// the layout, so this refreshes after every upload / rename / delete.
// (The playback engine joins this provider in Box 3.)
export default function MusicProvider({ tracks, children }: { tracks: readonly Track[]; children: React.ReactNode }) {
  const value = useMemo<MusicContextValue>(
    () => ({ tracks, usage: { count: tracks.length, totalBytes: tracks.reduce((n, t) => n + t.sizeBytes, 0) } }),
    [tracks],
  );
  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}
