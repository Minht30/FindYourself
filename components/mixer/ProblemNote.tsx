"use client";

import { useMixerStore } from "@/lib/audio/store";

// Says why sound is not coming out when the browser refused it. Silent when all
// is well; a polite live region so a screen reader hears it too.
export default function ProblemNote({ className = "" }: { className?: string }) {
  const problem = useMixerStore((s) => s.problem);
  return (
    <p role="status" aria-live="polite" className={`text-xs text-danger ${className}`}>
      {problem === "blocked" && "Your browser blocked sound. Press Play again."}
      {problem === "unsupported" && "This browser cannot play ambient sound."}
    </p>
  );
}
