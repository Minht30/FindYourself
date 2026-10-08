import { Suspense } from "react";
import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/layout/Sidebar";
import FocusFirstSlot from "@/components/tasks/FocusFirstSlot";
import FocusProvider from "@/components/focus/FocusProvider";
import MixerProvider from "@/components/mixer/MixerProvider";
import TimeZoneSync from "@/components/layout/TimeZoneSync";
import ThemeSync from "@/components/layout/ThemeSync";
import WallpaperStage from "@/components/scene/WallpaperStage";
import { getServerTheme } from "@/lib/themeServer";
import PreloadWallpaper from "@/components/scene/PreloadWallpaper";
import { DEFAULT_THEME_PREFS, parseThemePrefs } from "@/lib/theme";
import { NavProvider } from "@/components/layout/NavContext";
import { ZoneProvider } from "@/components/layout/ZoneContext";
import { getUserTimeZone } from "@/lib/today";
import DemoBanner from "@/components/demo/DemoBanner";
import { isGuest } from "@/lib/demo";
import MiniPlayer from "@/components/music/MiniPlayer";
import MusicProvider from "@/components/music/MusicProvider";
import { TRACK_COLUMNS, toPlaylist, toTrack } from "@/lib/music/types";
import { mergeCatalogue } from "@/lib/audio/layers";
import { sanitizeSettings } from "@/lib/audio/state";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // The mixer's layer list (labels, order, default levels) lives in
  // `ambient_layers`. If the read fails for any reason the built-in list is
  // used, so the mixer never disappears over a database hiccup.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const guest = isGuest(user);
  const [layers, saved, music, lists, profile, cats] = await Promise.all([
    supabase.from("ambient_layers").select("key, label, kind, default_level, sort_order"),
    // The mix this user left (RLS returns only their own row, or none).
    supabase.from("mixer_state").select("levels, master_volume, muted, current_track_id").maybeSingle(),
    // Their music library (RLS: own rows only). A failed read is an empty library.
    supabase.from("music_tracks").select(TRACK_COLUMNS).order("created_at"),
    supabase.from("playlists").select("id, name, playlist_tracks(track_id, position)").order("created_at"),
    // The zone the database counts days in (the streak); kept equal to the browser's.
    supabase.from("profiles").select("timezone, timezone_manual, theme_mode, day_region, night_region").maybeSingle(),
    // The categories the sidebar lists (RLS: own rows only, in the person's order).
    supabase.from("categories").select("id, name, color").order("sort_order"),
  ]);
  const tracks = (music.data ?? []).map(toTrack);
  const known = new Set(tracks.map((t) => t.id));
  const playlists = (lists.data ?? []).map((p) => toPlaylist(p, known));
  const catalogue = mergeCatalogue(layers.data);
  // The painting for the theme the server is painting; the other one waits until it is shown.
  const theme = getServerTheme();
  // The appearance choice kept on the profile; the cookie copy is what the server reads.
  const themeParsed = parseThemePrefs({ mode: profile.data?.theme_mode, dayRegion: profile.data?.day_region, nightRegion: profile.data?.night_region });
  const savedTheme = themeParsed.ok ? themeParsed.prefs : DEFAULT_THEME_PREFS;
  // A row whose `levels` is empty exists only because the player remembered a
  // track (saveCurrentTrack); no mix was ever saved, so it is "no saved mix".
  const hasMix =
    !!saved.data && saved.data.levels !== null && typeof saved.data.levels === "object" && Object.keys(saved.data.levels).length > 0;
  const initial = saved.data && hasMix
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
      <MusicProvider tracks={tracks} playlists={playlists} initialTrackId={saved.data?.current_track_id ?? null}>
      <FocusProvider>
        {profile.data ? <ThemeSync saved={savedTheme} /> : null}
        {profile.data?.timezone ? <TimeZoneSync savedZone={profile.data.timezone} manual={profile.data.timezone_manual === true} /> : null}
        <WallpaperStage initial={theme} />
        <PreloadWallpaper theme={theme} />
        <ZoneProvider zone={getUserTimeZone()}>
        <NavProvider>
        <div className="min-h-screen flex flex-col">
          {/* TopBar reads searchParams for its week-nav arrows; Suspense keeps
              the surrounding shell static-renderable in Next.js 14. */}
          <Suspense fallback={<div className="mx-3 mt-3 min-h-[60px] rounded-2xl bg-glass-card border border-[var(--border)]" />}>
            <TopBar
              focusSlot={
                <Suspense fallback={null}>
                  <FocusFirstSlot />
                </Suspense>
              }
            />
          </Suspense>
          {guest ? <DemoBanner /> : null}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-3 p-3 min-h-0">
            <Sidebar categories={cats.data ?? []} />
            <main className="overflow-auto p-1 md:p-0 min-w-0">{children}</main>
          </div>
          {/* Sticks to the bottom of the window and takes its own space at the end
              of the page, so it never covers a page's own controls */}
          <MiniPlayer />
        </div>
        </NavProvider>
        </ZoneProvider>
      </FocusProvider>
      </MusicProvider>
    </MixerProvider>
  );
}
