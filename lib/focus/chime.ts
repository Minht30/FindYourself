// A soft synthesized bell: a few sine partials with a quick attack and a long,
// exponential decay, through a gentle low-pass. No audio files to ship or load.
// Browsers only allow audio after a user gesture, so `primeAudio()` is called
// from the Start click; by the time a session ends the context is already awake.

type Debug = { chimes: number; lastKind: string | null; contextState: string | null };

declare global {
  interface Window {
    __fyFocusDebug?: Debug;
  }
}

let ctx: AudioContext | null = null;

function debug(): Debug | null {
  if (typeof window === "undefined" || process.env.NODE_ENV === "production") return null;
  return (window.__fyFocusDebug ??= { chimes: 0, lastKind: null, contextState: null });
}

export function primeAudio() {
  try {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();
    const d = debug();
    if (d) d.contextState = ctx.state;
  } catch {
    // no audio: the visual cue still happens
  }
}

export type ChimeKind = "focus-end" | "break-end";

// G5 B5 D6 for a finished focus (warm, rising); D5 A5 for the end of a break
// (lower and shorter, so it never sounds like a second alarm).
const NOTES: Record<ChimeKind, number[]> = {
  "focus-end": [784, 987.77, 1174.66],
  "break-end": [587.33, 880],
};

export function playChime(kind: ChimeKind, volume: number): boolean {
  const d = debug();
  if (d) {
    d.chimes += 1;
    d.lastKind = kind;
  }
  if (!ctx || ctx.state === "closed" || volume <= 0) return false;
  try {
    if (ctx.state === "suspended") void ctx.resume();
    const out = ctx.createGain();
    out.gain.value = Math.min(1, Math.max(0, volume)) * 0.28;
    const soften = ctx.createBiquadFilter();
    soften.type = "lowpass";
    soften.frequency.value = 3600;
    out.connect(soften).connect(ctx.destination);

    const t0 = ctx.currentTime + 0.03;
    NOTES[kind].forEach((freq, i) => {
      const at = t0 + i * 0.24;
      [
        { ratio: 1, amp: 1 },
        { ratio: 2.76, amp: 0.3 },
        { ratio: 5.4, amp: 0.1 },
      ].forEach(({ ratio, amp }) => {
        const osc = ctx!.createOscillator();
        const env = ctx!.createGain();
        osc.type = "sine";
        osc.frequency.value = freq * ratio;
        env.gain.setValueAtTime(0.0001, at);
        env.gain.exponentialRampToValueAtTime(amp, at + 0.012);
        env.gain.exponentialRampToValueAtTime(0.0001, at + 1.9);
        osc.connect(env).connect(out);
        osc.start(at);
        osc.stop(at + 2);
      });
    });
    return true;
  } catch {
    return false;
  }
}
