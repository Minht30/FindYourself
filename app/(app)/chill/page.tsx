import MixerPanel from "@/components/mixer/MixerPanel";

export const metadata = { title: "Chill — FindYourself" };

// Chill is for being, not doing: no tasks, no timers (the top bar hides both
// here). The scene arrives in the next step; for now this is the mixer.
export default function ChillPage() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Chill</h1>
        <p className="text-ink-secondary mt-1">Rain on the window, a quiet cafe. Leave it running.</p>
      </header>
      <MixerPanel />
    </div>
  );
}
