"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { useNow } from "@/components/layout/ClockLabel";
import { formatDayLabel, formatTimeLabel } from "@/lib/clock";
import { levelText, percent } from "@/lib/audio/state";
import { useMixerStore } from "@/lib/audio/store";
import Scene from "./Scene";

const IDLE_MS = 3500;
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

// The scene as a whole room: it fills the screen (the browser's real
// fullscreen is requested by the caller, this fills the window either way),
// with a clock and a few controls that fade away after a few quiet seconds so
// it can be left running like a screensaver. A move, a tap or Tab brings them
// back. Esc (or the browser's own fullscreen exit) leaves; the sound keeps going.
export default function Immersive({ onClose }: { onClose: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [idle, setIdle] = useState(false);
  const idleRef = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  // True when the press that is about to become a click is the one that woke
  // the controls: on a touch screen that tap must not also hit a button that
  // was invisible a moment ago.
  const swallow = useRef(false);

  const now = useNow();
  const playing = useMixerStore((s) => s.playing);
  const muted = useMixerStore((s) => s.settings.muted);
  const master = useMixerStore((s) => s.settings.master);
  const problem = useMixerStore((s) => s.problem);
  const play = useMixerStore((s) => s.play);
  const pause = useMixerStore((s) => s.pause);
  const setMuted = useMixerStore((s) => s.setMuted);
  const setMaster = useMixerStore((s) => s.setMaster);

  const wake = useCallback(() => {
    idleRef.current = false;
    setIdle(false);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      idleRef.current = true;
      setIdle(true);
    }, IDLE_MS);
  }, []);

  // Take focus, stop the page behind scrolling, and make everything else
  // inert (no focus, no clicks, hidden from screen readers) while this is open.
  useEffect(() => {
    const root = rootRef.current;
    const inerted: Element[] = [];
    for (const el of Array.from(document.body.children)) {
      if (el !== root && !el.hasAttribute("inert")) {
        el.setAttribute("inert", "");
        inerted.push(el);
      }
    }
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus the dialog itself, not a button: Space then means play / pause, and
    // the first Tab reaches the controls.
    root?.focus();
    wake();
    return () => {
      window.clearTimeout(timer.current);
      document.body.style.overflow = overflow;
      for (const el of inerted) el.removeAttribute("inert");
    };
  }, [wake]);

  // Esc leaves; Space plays / pauses; Tab stays inside. The browser's own Esc
  // exits real fullscreen without a keydown, so fullscreenchange covers that.
  useEffect(() => {
    let wasFullscreen = false;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const nodes = rootRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (!nodes || nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === rootRef.current || !rootRef.current?.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !rootRef.current?.contains(active))) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      if (e.code === "Space" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const t = e.target;
        const onControl = t instanceof HTMLElement && (t.tagName === "BUTTON" || t.tagName === "INPUT");
        if (!onControl && !e.repeat) {
          e.preventDefault();
          const s = useMixerStore.getState();
          if (s.playing) s.pause();
          else s.play();
        }
      }
    };
    const onFullscreen = () => {
      if (document.fullscreenElement) wasFullscreen = true;
      else if (wasFullscreen) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, [onClose]);

  const interactive = idle ? "pointer-events-none" : "pointer-events-auto";
  const btn =
    "w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition";
  // The slider reads theme tokens; give it a track and thumb that work on a dark pill.
  const pillVars = { "--border-strong": "rgba(255,255,255,0.4)", "--bg-elevated": "#ffffff" } as CSSProperties;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Full screen scene"
      tabIndex={-1}
      data-immersive
      data-idle={idle}
      className={`fixed inset-0 z-[80] bg-black overflow-hidden outline-none ${idle ? "cursor-none" : ""}`}
      onPointerMove={wake}
      onPointerDownCapture={() => {
        swallow.current = idleRef.current;
        wake();
      }}
      onClickCapture={(e) => {
        if (swallow.current) {
          swallow.current = false;
          e.stopPropagation();
          e.preventDefault();
        }
      }}
      onKeyDown={wake}
    >
      <Scene fill />

      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
          idle ? "opacity-0" : "opacity-100"
        } has-[:focus-visible]:opacity-100`}
      >
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute top-4 left-5 text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
          {now && (
            <time dateTime={now.toISOString()} className="block">
              <span className="block font-display text-4xl sm:text-5xl leading-none">{formatTimeLabel(now)}</span>
              <span className="block mt-1 font-ui text-sm opacity-90">{formatDayLabel(now)}</span>
            </time>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Exit full screen"
          className={`absolute top-4 right-4 inline-flex items-center gap-2 rounded-full bg-black/55 backdrop-blur px-4 py-2 text-sm font-ui text-white hover:bg-black/75 transition ${interactive}`}
        >
          <X size={16} /> Exit
        </button>

        <div
          className={`absolute bottom-6 left-1/2 -translate-x-1/2 max-w-[calc(100vw-2rem)] rounded-full bg-black/60 backdrop-blur text-white px-3 py-2 flex items-center gap-2 ${interactive}`}
          style={pillVars}
        >
          {playing ? (
            <>
              <button type="button" onClick={pause} aria-label="Pause ambient sound" className={btn}>
                <Pause size={18} />
              </button>
              <button
                type="button"
                onClick={() => setMuted(!muted)}
                aria-pressed={muted}
                aria-label={muted ? "Unmute ambient sound" : "Mute ambient sound"}
                className={btn}
              >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <label htmlFor="immersive-master" className="sr-only">
                Master volume
              </label>
              <input
                id="immersive-master"
                type="range"
                min={0}
                max={100}
                step={1}
                value={percent(master)}
                onChange={(e) => setMaster(Number(e.target.value) / 100)}
                aria-valuetext={levelText("Master volume", master)}
                className="fy-range w-28 sm:w-40"
                style={{ "--fill": `${muted ? 0 : percent(master)}%` } as CSSProperties}
              />
            </>
          ) : (
            <button
              type="button"
              onClick={play}
              className="inline-flex items-center gap-2 rounded-full bg-accent text-cat-ink font-ui font-semibold px-5 py-2 hover:bg-accent-soft transition"
            >
              <Play size={16} /> Play sound
            </button>
          )}
        </div>

        {problem && (
          <p
            role="status"
            className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full bg-black/70 text-white text-xs px-3 py-1.5"
          >
            {problem === "blocked" ? "Your browser blocked sound. Press play again." : "This browser cannot play ambient sound."}
          </p>
        )}
      </div>
    </div>
  );
}
