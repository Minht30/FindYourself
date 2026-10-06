import MixerPanel from "@/components/mixer/MixerPanel";
import MusicLibrary from "@/components/music/MusicLibrary";
import Playlists from "@/components/music/Playlists";
import ChillStage from "@/components/scene/ChillStage";

export const metadata = { title: "Chill — FindYourself" };

// Chill is for being, not doing: no tasks, no timers (the top bar hides both
// here). A window onto a rainy cafe that follows the mixer, then the mixer.
// The scene art is a placeholder until the Figma design stage.
export default function ChillPage() {
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
    </div>
  );
}
