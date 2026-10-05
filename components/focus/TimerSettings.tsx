"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { notifyState, requestNotifications } from "@/lib/focus/notify";
import { useFocusStore } from "@/lib/focus/store";
import { LIMITS, type Settings } from "@/lib/focus/timer";

// Cycle lengths, chime and notification preferences. They live in localStorage
// for now (decision for Phase 5); a settings page can move them to the profile.
export default function TimerSettings() {
  const settings = useFocusStore((s) => s.settings);
  const setSettings = useFocusStore((s) => s.setSettings);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const panelId = useId();

  async function onNotifications(on: boolean) {
    setNote(null);
    if (!on) return setSettings({ notifications: false });
    const result = await requestNotifications();
    if (result === "granted") setSettings({ notifications: true });
    else {
      setSettings({ notifications: false });
      setNote(
        result === "unsupported"
          ? "This browser does not support notifications."
          : "Notifications are blocked for this site. Allow them in your browser's site settings, then try again.",
      );
    }
  }

  return (
    <div className="mt-6 pt-4 border-t border-[var(--border)]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between font-ui text-[13px] font-medium text-ink-secondary hover:text-ink-primary transition"
      >
        Timer settings
        <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div id={panelId} className="mt-4 grid gap-4 font-ui text-[13px]">
          <div className="grid grid-cols-3 gap-3">
            <Minutes label="Focus" field="focusMin" value={settings.focusMin} onChange={setSettings} />
            <Minutes label="Short break" field="shortMin" value={settings.shortMin} onChange={setSettings} />
            <Minutes label="Long break" field="longMin" value={settings.longMin} onChange={setSettings} />
          </div>

          <label className="flex items-center justify-between gap-3">
            <span className="text-ink-primary">Long break every</span>
            <span className="flex items-center gap-2">
              <NumberField
                label="Sessions before a long break"
                min={LIMITS.cycles.min}
                max={LIMITS.cycles.max}
                value={settings.cyclesBeforeLong}
                onCommit={(n) => setSettings({ cyclesBeforeLong: n })}
                className="w-16"
              />
              <span className="text-ink-secondary">sessions</span>
            </span>
          </label>

          <Toggle label="Soft chime when a session ends" checked={settings.chime} onChange={(chime) => setSettings({ chime })} />
          {settings.chime && (
            <label className="flex items-center justify-between gap-3 -mt-2">
              <span className="text-ink-secondary">Volume</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.volume}
                aria-label="Chime volume"
                onChange={(e) => setSettings({ volume: Number(e.target.value) })}
                className="w-40 accent-[var(--accent-strong)]"
              />
            </label>
          )}
          <Toggle
            label="Notify me when the tab is in the background"
            checked={settings.notifications && notifyState() === "granted"}
            onChange={onNotifications}
          />
          {note && (
            <p role="alert" className="text-[12px] text-[var(--danger)] -mt-2">
              {note}
            </p>
          )}
          <Toggle
            label="Start the next phase automatically"
            checked={settings.autoStart}
            onChange={(autoStart) => setSettings({ autoStart })}
          />
          <p className="text-[12px] text-ink-muted">
            Changes apply to the next phase. A running timer keeps the length it started with.
          </p>
        </div>
      )}
    </div>
  );
}

function Minutes({
  label,
  field,
  value,
  onChange,
}: {
  label: string;
  field: "focusMin" | "shortMin" | "longMin";
  value: number;
  onChange: (patch: Partial<Settings>) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-ink-secondary">{label}</span>
      <span className="flex items-center gap-1.5">
        <NumberField
          label={label + " minutes"}
          min={LIMITS.minutes.min}
          max={LIMITS.minutes.max}
          value={value}
          onCommit={(n) => onChange({ [field]: n })}
          className="w-full min-w-0"
        />
        <span className="text-ink-muted">min</span>
      </span>
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-ink-primary">{label}</span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 accent-[var(--accent-strong)]"
      />
    </label>
  );
}

// A number field that keeps what you type until you leave it. Clamping on every
// keystroke would turn clearing "25" to type "50" into "1" halfway through.
function NumberField({
  label,
  value,
  min,
  max,
  onCommit,
  className,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (n: number) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = Number(draft);
    if (draft.trim() === "" || !Number.isFinite(n)) return setDraft(String(value));
    onCommit(n);
    setDraft(String(Math.min(max, Math.max(min, Math.round(n)))));
  };
  return (
    <input
      type="number"
      inputMode="numeric"
      aria-label={label}
      min={min}
      max={max}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      className={`${className ?? ""} rounded-lg border border-[var(--border-strong)] bg-bg-base px-2 py-1.5 text-center text-ink-primary`}
    />
  );
}
