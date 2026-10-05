// One AudioContext for the whole app. The focus chime and the ambient mixer
// share it, so the browser's "unlock audio on a user gesture" step happens
// once, and there is a single place that knows whether sound can play.

type Debug = { contextState: string | null };

declare global {
  interface Window {
    __fyAudioDebug?: Debug;
  }
}

let ctx: AudioContext | null = null;

function debug(): Debug | null {
  if (typeof window === "undefined" || process.env.NODE_ENV === "production") return null;
  return (window.__fyAudioDebug ??= { contextState: null });
}

function sync() {
  const d = debug();
  if (d) d.contextState = ctx?.state ?? null;
}

// The context if one exists (never creates one: creating it is what needs a gesture).
export function currentContext(): AudioContext | null {
  return ctx && ctx.state !== "closed" ? ctx : null;
}

// Creates the context if needed and asks it to run. Call this from a click or
// key handler; browsers refuse to start audio any other way. Returns null when
// the browser has no Web Audio at all.
export function primeAudio(): AudioContext | null {
  try {
    if (ctx?.state === "closed") ctx = null;
    if (!ctx) {
      const AC: typeof AudioContext | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      // Ambient sound runs for hours: ask for the power-friendly mode.
      ctx = new AC({ latencyHint: "playback" });
      ctx.addEventListener("statechange", sync);
    }
    if (ctx.state === "suspended") void ctx.resume().then(sync, sync);
    sync();
    return ctx;
  } catch {
    return null;
  }
}
