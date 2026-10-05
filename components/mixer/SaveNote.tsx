"use client";

import { useMixerStore } from "@/lib/audio/store";

// Says where the mix is: saved to the account, saving, or kept on this device
// with the reason it could not be saved. Quiet when there is nothing to say.
export default function SaveNote({ className = "" }: { className?: string }) {
  const status = useMixerStore((s) => s.saveStatus);
  const pending = useMixerStore((s) => s.pending);

  let text = "";
  let tone = "text-ink-muted";
  if (status.kind === "saving") text = "Saving your mix…";
  else if (status.kind === "saved" && !pending) text = "Mix saved to your account";
  else if (status.kind === "failed") {
    tone = "text-danger";
    text =
      status.reason === "unauthenticated"
        ? "Sign in again to save your mix. It is kept on this device for now."
        : status.reason === "network"
          ? "Offline: your mix is kept on this device and will save when you are back online."
          : `Could not save your mix (${status.reason}). It is kept on this device.`;
  }

  return (
    <p role="status" aria-live="polite" data-save={status.kind} className={`text-xs ${tone} min-h-[1rem] ${className}`}>
      {text}
    </p>
  );
}
