import { Suspense } from "react";
import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/layout/Sidebar";
import FocusFirstSlot from "@/components/tasks/FocusFirstSlot";
import FocusProvider from "@/components/focus/FocusProvider";
import MixerProvider from "@/components/mixer/MixerProvider";
import MusicProvider from "@/components/music/MusicProvider";
import { TRACK_COLUMNS, toTrack } from "@/lib/music/types";
import { mergeCatalogue } from "@/lib/audio/layers";
import { sanitizeSettings } from "@/lib/audio/state";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // The mixer's layer list (labels, order, default levels) lives in
  // `ambient_layers`. If the read fails for any reason the built-in list is
  // used, so the mixer never disappears over a database hiccup.
  const supabase = createClient();
  const [layers, saved, music] = await Promise.all([
    supabase.from("ambient_layers").select("key, label, kind, default_level, sort_order"),
    // The mix this user left (RLS returns only their own row, or none).
    supabase.from("mixer_state").select("levels, master_volume, muted").maybeSingle(),
    // Their music library (RLS: own rows only). A failed read is an empty library.
    supabase.from("music_tracks").select(TRACK_COLUMNS).order("created_at"),
  ]);
  const tracks = (music.data ?? []).map(toTrack);
  const catalogue = mergeCatalogue(layers.data);
  const initial = saved.data
    ? sanitizeSettings({
        levels: saved.data.levels,
        master: Number(saved.data.master_volume),
        muted: saved.data.muted,
      })
    : null;

  return (
    // FocusProvider lives here, above every page, so a running timer keeps
    // ticking (and can chime) while you move between Timetable, Diary and Focus.
    // MixerProvider does the same for the ambient sound.
    <MixerProvider catalogue={catalogue} initial={initial}>
      <MusicProvider tracks={tracks}>
      <FocusProvider>
        <div className="min-h-screen flex flex-col">
          {/* TopBar reads searchParams for its week-nav arrows; Suspense keeps
              the surrounding shell static-renderable in Next.js 14. */}
          <Suspense fallback={<div className="min-h-[60px] bg-bg-elevated border-b border-[var(--border)]" />}>
            <TopBar
              focusSlot={
                <Suspense fallback={null}>
                  <FocusFirstSlot />
                </Suspense>
              }
            />
          </Suspense>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-0">
            <Sidebar />
            <main className="overflow-auto p-6">{children}</main>
          </div>
        </div>
      </FocusProvider>
      </MusicProvider>
    </MixerProvider>
  );
}
