"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Moon, Settings, Sun } from "lucide-react";
import TimerChip from "@/components/focus/TimerChip";
import SoundButton from "@/components/mixer/SoundButton";
import ClockLabel from "./ClockLabel";
import { useNav } from "./NavContext";
import { saveThemePrefs } from "@/app/(app)/profile-actions";
import { useTheme } from "@/components/scene/hooks";
import { THEME_LABELS, dayNightOf, toggledMode } from "@/lib/theme";
import { applyTheme, readPrefs, writePrefs } from "@/lib/themeClient";

// focusSlot: the "🔒 Focus first" reminder, rendered on the server by the
// layout. Hidden on /chill, which is deliberately free of tasks and timers.
export default function TopBar({ focusSlot }: { focusSlot?: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = useNav();

  // Prev / next live on the pages themselves (the timetable's week pills, the
  // diary's day pills); the top bar keeps only "Today" and the live clock.
  const isDiary = pathname === "/diary" || pathname?.startsWith("/diary/");
  function goToday() {
    router.push(isDiary ? "/diary" : "/today");
  }

  // What is showing (read from <html>, so it follows Auto's clock too). The chip flips
  // day and night by fixing the mode to the opposite; Settings puts it back to Auto.
  const theme = useTheme();
  const isNight = dayNightOf(theme) === "night";

  async function toggleTheme() {
    const before = readPrefs();
    const next = { ...before, mode: toggledMode(dayNightOf(theme)) };
    // Instant on this device, then saved on the profile so every device follows.
    writePrefs(next);
    applyTheme(next);
    // A session that ended underneath the page gives no result at all (or a thrown
    // call), not an { ok: false }: both count as "not saved".
    const saved = await saveThemePrefs(next).catch(() => undefined);
    if (!saved?.ok) {
      // Not saved: go back to what it was rather than show a choice that will not stick.
      writePrefs(before);
      applyTheme(before);
    }
  }
  // Chill is for being, not planning: no Today button, no search.
  const isChill = Boolean(pathname?.startsWith("/chill"));

  return (
    <header className="sticky top-0 z-50 flex items-center gap-3 px-4 md:px-5 py-2.5 min-h-[60px] bg-bg-elevated border-b border-[var(--border)] isolate">
      {/* Phones: opens the sidebar as a drawer. From 768 px up the sidebar is always visible, so no button. */}
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={nav.open}
        aria-controls="app-sidebar"
        onClick={nav.toggle}
        className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink transition"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2.5 font-display font-bold text-lg mr-2">
        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-cat-ink font-mono font-bold text-[13px] shadow-glow" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-soft))" }}>
          FY
        </div>
        <span className="hidden sm:inline">FindYourself</span>
      </div>

      {/* Chill is for being, not planning: no Today button there. Everywhere else the
          bar shows the current day and time, in the visitor's own zone and clock style. */}
      {!isChill && (
        <button
          onClick={goToday}
          className="px-4 py-1.5 rounded-full border border-[var(--border-strong)] text-ink-primary font-ui text-sm hover:bg-accent-soft hover:text-cat-ink hover:border-accent transition"
        >
          Today
        </button>
      )}
      <ClockLabel className="font-display text-lg md:text-xl truncate min-w-0 flex-shrink" />

      <div className="flex-1" />

      {/* /chill is free of tasks and timers; /focus already shows the full timer */}
      {!isChill && !pathname?.startsWith("/focus") && <TimerChip />}
      {!isChill && focusSlot}

      {/* Always visible, on every page and every width (DESIGN_SYSTEM section 7) */}
      <SoundButton />

      <Link href="/settings" aria-label="Settings" className="hidden md:flex w-9 h-9 rounded-full items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink transition">
        <Settings size={16} />
      </Link>

      {/* The scene showing now; one click fixes the opposite mode (Settings -> Appearance puts it back to Auto) */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`${THEME_LABELS[theme]}, ${isNight ? "night" : "day"}. Switch to ${isNight ? "day" : "night"}.`}
        title={`Switch to ${isNight ? "day" : "night"}`}
        className="px-3.5 py-2 rounded-full bg-bg-alt border border-[var(--border)] text-ink-primary text-[13px] font-ui flex items-center gap-1.5 hover:bg-accent-soft hover:text-cat-ink hover:border-accent transition"
      >
        {isNight ? <Moon size={15} aria-hidden /> : <Sun size={15} aria-hidden />}
        <span className="hidden md:inline">{THEME_LABELS[theme]}</span>
      </button>
    </header>
  );
}
