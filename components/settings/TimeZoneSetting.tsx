"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveTimeZoneSetting } from "@/app/(app)/profile-actions";
import { formatDayLabel, formatTimeLabel } from "@/lib/clock";
import { groupZones, isKnownTimeZone, zoneLabel } from "@/lib/timezone";

const REASONS: Record<string, string> = {
  unauthenticated: "Sign in again to change your time zone.",
  bad_timezone: "That is not a time zone this app can use. Pick one from the list.",
  bad_mode: "That choice was not understood. Try again.",
  db_error: "Could not save your time zone. Try again.",
};

// Automatic (follow this device) or a zone of your own choosing. Every page,
// the clock, the calendar and the streak's idea of "a day" follow the choice,
// on every device you sign in on.
export default function TimeZoneSetting({ savedZone, manual }: { savedZone: string; manual: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"auto" | "manual">(manual ? "manual" : "auto");
  const [zone, setZone] = useState(savedZone);
  const [browserZone, setBrowserZone] = useState<string | null>(null);
  const [all, setAll] = useState<string[]>([]);
  const [now, setNow] = useState<Date | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  // Browser-only facts (this device's zone, the list of zones, the clock) are read
  // after mount, so the server's page and the browser's first render agree.
  useEffect(() => {
    try {
      setBrowserZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
      setAll(Intl.supportedValuesOf("timeZone"));
    } catch {
      // an old browser: the picker falls back to the saved zone alone
    }
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  // A new saved zone (after saving, or from another tab) replaces what is shown.
  useEffect(() => {
    setMode(manual ? "manual" : "auto");
    setZone(savedZone);
  }, [savedZone, manual]);

  const groups = useMemo(() => groupZones(all.includes(zone) || !isKnownTimeZone(zone) ? all : [...all, zone]), [all, zone]);

  const shownZone = mode === "auto" ? browserZone ?? savedZone : zone;
  const unchanged = mode === "auto" ? !manual && (browserZone === null || browserZone === savedZone) : manual && zone === savedZone;

  function save() {
    setProblem(null);
    setSaved(null);
    start(async () => {
      const res =
        mode === "auto"
          ? await saveTimeZoneSetting({ mode: "auto", browserZone: browserZone ?? savedZone })
          : await saveTimeZoneSetting({ mode: "manual", zone });
      // A request that gets no answer (signed out in another tab) has no result.
      if (!res) return setProblem("unauthenticated");
      if (!res.ok) return setProblem(res.error);
      setSaved(res.mode === "auto" ? "Following this device again." : `Your days now start and end in ${zoneLabel(res.zone)}.`);
      router.refresh();
    });
  }

  return (
    <div data-timezone-setting className="space-y-3">
      <fieldset className="space-y-2">
        <legend className="sr-only">How the app knows your time zone</legend>
        <label className="flex items-start gap-2 text-[15px] text-ink-primary">
          <input type="radio" name="tz-mode" checked={mode === "auto"} onChange={() => setMode("auto")} className="mt-1" />
          <span>
            Detect it automatically
            <span className="block text-[13px] text-ink-secondary">
              Follows this device{browserZone ? `: ${browserZone}` : ""}.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-[15px] text-ink-primary">
          <input type="radio" name="tz-mode" checked={mode === "manual"} onChange={() => setMode("manual")} className="mt-1" />
          <span>
            Choose a time zone
            <span className="block text-[13px] text-ink-secondary">For when your device is set wrong, or you want to keep one zone while travelling.</span>
          </span>
        </label>
      </fieldset>

      {mode === "manual" ? (
        <label className="block text-[13px] text-ink-secondary">
          Time zone
          <select
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="mt-1 block w-full max-w-sm rounded-md border border-[var(--border-strong)] bg-bg-elevated px-2 py-1.5 text-[15px] text-ink-primary"
          >
            {groups.length === 0 ? <option value={zone}>{zone}</option> : null}
            {groups.map((g) => (
              <optgroup key={g.region} label={g.region}>
                {g.zones.map((z) => (
                  <option key={z.value} value={z.value}>
                    {z.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      ) : null}

      {now && isKnownTimeZone(shownZone) ? (
        <p data-timezone-preview className="text-[13px] text-ink-secondary">
          It is <strong className="text-ink-primary">{formatDayLabel(now, "en-US", shownZone)} · {formatTimeLabel(now, "en-US", shownZone)}</strong> in{" "}
          {shownZone}.
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending || unchanged}
          className="px-4 py-1.5 rounded-full bg-accent text-cat-ink font-ui font-semibold disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save time zone"}
        </button>
        {saved ? (
          <span role="status" data-timezone-saved className="text-[13px] text-ink-secondary">
            {saved}
          </span>
        ) : null}
      </div>
      {problem ? (
        <p role="alert" data-reason={problem} className="text-[13px] text-[var(--danger)]">
          {REASONS[problem] ?? REASONS.db_error}
        </p>
      ) : null}
    </div>
  );
}
