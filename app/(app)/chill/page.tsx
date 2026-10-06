import MixerPanel from "@/components/mixer/MixerPanel";
import MusicLibrary from "@/components/music/MusicLibrary";
import { AdminReview, CommunityPicks, type CommunityPick, type PendingSuggestion } from "@/components/music/Picks";
import Playlists from "@/components/music/Playlists";
import Suggestions, { type MySuggestion } from "@/components/music/Suggestions";
import ChillStage from "@/components/scene/ChillStage";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Chill — FindYourself" };

// Chill is for being, not doing: no tasks, no timers (the top bar hides both
// here). A window onto a rainy cafe that follows the mixer, then the mixer, then
// your music. The scene art is a placeholder until the Figma design stage.
export default async function ChillPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Am I an admin? A user can read only their own row of `admins`.
  const { data: adminRow } = user ? await supabase.from("admins").select("user_id").maybeSingle() : { data: null };
  const isAdmin = !!adminRow;

  const [mine, picks, pending] = await Promise.all([
    // "Mine" is filtered by user on purpose: RLS also lets an admin read everyone's
    // suggestions, and this list must never show those. A failed read is an empty list.
    user
      ? supabase
          .from("track_suggestions")
          .select("id, title, artist, link, reason, status, created_at")
          .eq("suggested_by", user.id)
          .order("created_at", { ascending: false })
          .limit(50)
          .returns<MySuggestion[]>()
      : { data: null },
    supabase
      .from("community_picks")
      .select("id, title, artist, link, note")
      .order("sort_order")
      .order("created_at")
      .limit(200)
      .returns<CommunityPick[]>(),
    // The review queue is only fetched for an admin: everyone else's suggestions
    // never reach another user's page (RLS would refuse them anyway).
    isAdmin
      ? supabase
          .from("track_suggestions")
          .select("id, title, artist, link, reason, created_at")
          .eq("status", "pending")
          .order("created_at")
          .limit(100)
          .returns<PendingSuggestion[]>()
      : { data: null },
  ]);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Chill</h1>
        <p className="text-ink-secondary mt-1">Rain on the window, a quiet cafe. Leave it running.</p>
      </header>
      <ChillStage />
      <MixerPanel />
      <MusicLibrary />
      <Playlists />
      <CommunityPicks picks={picks.data ?? []} isAdmin={isAdmin} />
      <Suggestions mine={mine.data ?? []} />
      {isAdmin && <AdminReview pending={pending.data ?? []} />}
    </div>
  );
}
