"use client";

import { Volume2, VolumeX } from "lucide-react";
import { soundStatus, useMixerStore } from "@/lib/audio/store";

// The always-visible sound control in the top bar (DESIGN_SYSTEM section 7).
// One button, three honest states, so it can never mean two things at once:
//   nothing playing -> "Start ambient sound" (this click is the user gesture)
//   playing         -> "Mute ambient sound"
//   muted           -> "Unmute ambient sound"
export default function SoundButton() {
  const status = useMixerStore(soundStatus);
  const toggle = useMixerStore((s) => s.toggleSound);

  const label =
    status === "off" ? "Start ambient sound" : status === "muted" ? "Unmute ambient sound" : "Mute ambient sound";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={status === "off" ? undefined : status === "muted"}
      title={label}
      data-sound={status}
      className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
        status === "on"
          ? "bg-accent-soft text-cat-ink hover:bg-accent"
          : "text-ink-secondary hover:bg-accent-soft hover:text-cat-ink"
      }`}
    >
      {status === "on" ? <Volume2 size={17} /> : <VolumeX size={17} />}
    </button>
  );
}
