"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { Moon, Sun } from "lucide-react";
import { saveThemePrefs } from "@/app/(app)/profile-actions";
import { NIGHT_ENDS_AT, NIGHT_STARTS_AT, type DayNight, type ThemeMode, type ThemePrefs } from "@/lib/theme";
import { serializePrefs } from "@/lib/themeCookies";
import { applyTheme, writePrefs } from "@/lib/themeClient";
import { MODE_OPTIONS, REGION_CARDS, modeMessage, reasonText, regionMessage, type RegionCard } from "@/lib/themeText";
import type { ThemeName } from "@/lib/theme";

const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

// The ring around whatever has keyboard focus. The page-wide ring is the accent
// yellow, which is too pale on the Monstadt cream (1.35:1); accent-strong holds 5:1.
const FOCUS = "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--accent-strong)]";

// Settings -> Appearance. Choosing anything applies it at once on this device,
// saves it on the profile (so every device follows), and says what happened in a
// polite live region. A save that does not happen puts the old choice back and
// says why.
export default function AppearanceCard({ saved }: { saved: ThemePrefs }) {
  const [pending, start] = useTransition();
  const [prefs, setPrefs] = useState(saved);
  const [message, setMessage] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  // A new saved choice (after saving, or made on another device) replaces what is shown.
  const savedKey = serializePrefs(saved);
  useEffect(() => {
    setPrefs(saved);
    // `saved` is derived from savedKey, which is what changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey]);

  function choose(next: ThemePrefs, announce: (showing: ThemeName) => string) {
    // One save at a time. The controls stay enabled (a disabled radio would drop the
    // keyboard focus mid-arrow); a pick during a save is ignored and they snap back.
    if (pending) return;
    const before = prefs;
    setProblem(null);
    setMessage("");
    setPrefs(next);
    writePrefs(next);
    const showing = applyTheme(next);
    start(async () => {
      // A request that gets no answer (signed out in another tab) has no result.
      const res = await saveThemePrefs(next).catch(() => undefined);
      if (!res?.ok) {
        setPrefs(before);
        writePrefs(before);
        applyTheme(before);
        setProblem(res ? res.error : "unauthenticated");
        return;
      }
      setMessage(announce(showing));
    });
  }

  const pickMode = (mode: ThemeMode) => choose({ ...prefs, mode }, (showing) => modeMessage(mode, showing));
  const pickRegion = (c: RegionCard) =>
    choose(c.mode === "day" ? { ...prefs, dayRegion: c.region as ThemePrefs["dayRegion"] } : { ...prefs, nightRegion: c.region as ThemePrefs["nightRegion"] }, (showing) =>
      regionMessage(c.mode, c.region, showing),
    );

  const chosen = (c: RegionCard) => (c.mode === "day" ? prefs.dayRegion : prefs.nightRegion) === c.region;

  return (
    <div data-appearance className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">Mode</legend>
        <div className="inline-flex rounded-full border border-[var(--border-input)] bg-bg-alt p-0.5" role="presentation">
          {MODE_OPTIONS.map((o) => (
            <label key={o.value} className="relative">
              <input
                type="radio"
                name="theme-mode"
                value={o.value}
                checked={prefs.mode === o.value}
                onChange={() => pickMode(o.value)}
                aria-describedby="theme-mode-help"
                className="peer sr-only"
              />
              <span
                className={`block cursor-pointer select-none rounded-full px-4 py-1.5 font-ui text-[14px] font-medium text-ink-primary transition peer-checked:bg-accent peer-checked:text-cat-ink peer-checked:font-semibold ${FOCUS}`}
              >
                {o.label}
              </span>
            </label>
          ))}
        </div>
        <p id="theme-mode-help" className="text-[13px] text-ink-secondary">
          Auto follows your clock. Night runs from {hh(NIGHT_STARTS_AT)} to {hh(NIGHT_ENDS_AT)} in your{" "}
          <a href="#timezone" className="underline underline-offset-4 hover:no-underline">
            time zone
          </a>
          .
        </p>
      </fieldset>

      {(["day", "night"] as const).map((mode) => (
        <RegionGroup key={mode} mode={mode} cards={REGION_CARDS.filter((c) => c.mode === mode)} chosen={chosen} onPick={pickRegion} />
      ))}

      <p role="status" aria-live="polite" data-appearance-status className="min-h-[1.25rem] text-[13px] text-ink-secondary">
        {pending ? "Saving…" : message}
      </p>
      {problem ? (
        <p role="alert" data-reason={problem} className="-mt-3 text-[13px] text-[var(--danger)]">
          {reasonText(problem)}
        </p>
      ) : null}
    </div>
  );
}

function RegionGroup({
  mode,
  cards,
  chosen,
  onPick,
}: {
  mode: DayNight;
  cards: readonly RegionCard[];
  chosen: (c: RegionCard) => boolean;
  onPick: (c: RegionCard) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
        {mode === "day" ? <Sun size={14} aria-hidden /> : <Moon size={14} aria-hidden />}
        {mode === "day" ? "Day scene" : "Night scene"}
      </legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <label key={c.region} className={`relative block ${c.available ? "cursor-pointer" : "cursor-not-allowed"}`}>
            <input
              type="radio"
              name={`theme-${mode}-region`}
              value={c.region}
              checked={c.available && chosen(c)}
              disabled={!c.available}
              onChange={() => onPick(c)}
              aria-describedby={`region-${c.region}-blurb`}
              className="peer sr-only"
            />
            <div
              className={`overflow-hidden rounded-xl border bg-bg-overlay transition ${
                c.available
                  ? "border-[var(--border-strong)] hover:border-[var(--border-input)] peer-checked:border-[var(--accent-strong)] peer-checked:ring-2 peer-checked:ring-[var(--accent-strong)]"
                  : "border-dashed border-[var(--border-input)]"
              } ${FOCUS}`}
            >
              {c.thumb ? (
                <Image src={c.thumb} alt="" width={640} height={360} sizes="(min-width: 640px) 280px, 100vw" className="aspect-video w-full object-cover" />
              ) : (
                <div aria-hidden className="aspect-video w-full bg-bg-alt" />
              )}
              <div className="space-y-1 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-lg text-ink-primary">{c.label}</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-strong)] px-2 py-0.5 text-[12px] text-ink-secondary">
                    {c.mode === "day" ? <Sun size={12} aria-hidden /> : <Moon size={12} aria-hidden />}
                    {c.mode === "day" ? "Day" : "Night"}
                  </span>
                </div>
                <p id={`region-${c.region}-blurb`} className="text-[13px] text-ink-secondary">
                  {c.blurb}
                </p>
              </div>
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
