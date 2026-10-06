"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Menu, ChevronLeft, ChevronRight, Search, Settings } from "lucide-react";
import TimerChip from "@/components/focus/TimerChip";
import SoundButton from "@/components/mixer/SoundButton";
import ClockLabel from "./ClockLabel";
import { addDays, isValidISODate, parseWeekParam, shiftISODate, toISODateOnly } from "@/lib/dates";

const VIEWS = ["Day", "Week", "Month"] as const;
type View = (typeof VIEWS)[number];

// focusSlot: the "🔒 Focus first" reminder, rendered on the server by the
// layout. Hidden on /chill, which is deliberately free of tasks and timers.
export default function TopBar({ focusSlot }: { focusSlot?: React.ReactNode }) {
  const [view, setView] = useState<View>("Week");
  const [theme, setTheme] = useState<"sunny-cafe" | "netcafe-night">("sunny-cafe");

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // The topbar arrows step weeks on /today and days on /diary. Pages without
  // their own prev/next yet (/focus, /chill) short-circuit to /today so the
  // user is never staring at inert controls.
  const isTimetable = pathname?.startsWith("/today");
  const isDiary = pathname === "/diary" || pathname?.startsWith("/diary/");

  function goWeek(deltaDays: number) {
    const current = parseWeekParam(searchParams?.get("week") ?? undefined);
    const target = toISODateOnly(addDays(current, deltaDays));
    router.push(`/today?week=${target}`);
  }
  function goDay(delta: number) {
    const fromPath = pathname?.split("/")[2];
    const current = isValidISODate(fromPath) ? fromPath : toISODateOnly(new Date());
    router.push(`/diary/${shiftISODate(current, delta)}`);
  }
  function goPrev() {
    if (isDiary) goDay(-1);
    else goWeek(-7);
  }
  function goNext() {
    if (isDiary) goDay(1);
    else goWeek(7);
  }
  function goToday() {
    router.push(isDiary ? "/diary" : "/today");
  }

  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-theme") as typeof theme) || "sunny-cafe";
    setTheme(current);
  }, []);

  function toggleTheme() {
    const next = theme === "netcafe-night" ? "sunny-cafe" : "netcafe-night";
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
    try {
      localStorage.setItem("fy-theme", next);
    } catch {}
  }

  const isNight = theme === "netcafe-night";
  // Chill is for being, not planning: no week navigation, no search, just the day and time.
  const isChill = Boolean(pathname?.startsWith("/chill"));

  return (
    <header className="sticky top-0 z-50 flex items-center gap-3 px-4 md:px-5 py-2.5 min-h-[60px] bg-bg-elevated border-b border-[var(--border)] isolate">
      <button aria-label="Menu" className="w-10 h-10 rounded-full flex items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink transition">
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2.5 font-display font-bold text-lg mr-2">
        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-cat-ink font-mono font-bold text-[13px] shadow-glow" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-soft))" }}>
          FY
        </div>
        <span className="hidden sm:inline">FindYourself</span>
      </div>

      {isChill ? (
        // Chill: just the day and time, like a clock on the cafe wall.
        <ClockLabel className="font-display text-lg md:text-xl truncate min-w-0 flex-shrink" />
      ) : (
        <>
          <button
            onClick={goToday}
            className="px-4 py-1.5 rounded-full border border-[var(--border-strong)] text-ink-primary font-ui text-sm hover:bg-accent-soft hover:text-cat-ink hover:border-accent transition"
          >
            Today
          </button>

          {/* Phones: the pages carry their own prev / next, and the sound button needs the room */}
          <div className="hidden sm:flex gap-1">
            <button
              onClick={goPrev}
              aria-label={isTimetable ? "Previous week" : isDiary ? "Previous day" : "Previous"}
              className="w-9 h-9 rounded-full flex items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goNext}
              aria-label={isTimetable ? "Next week" : isDiary ? "Next day" : "Next"}
              className="w-9 h-9 rounded-full flex items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="font-display text-lg md:text-xl truncate min-w-0 flex-shrink">Sep 14 – 20, 2026</div>
        </>
      )}

      <div className="flex-1" />

      {/* /chill is free of tasks and timers; /focus already shows the full timer */}
      {!isChill && !pathname?.startsWith("/focus") && <TimerChip />}
      {!isChill && focusSlot}

      {/* Always visible, on every page and every width (DESIGN_SYSTEM section 7) */}
      <SoundButton />

      {!isChill && (
        <button aria-label="Search" className="hidden md:flex w-9 h-9 rounded-full items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink transition">
          <Search size={16} />
        </button>
      )}
      <button aria-label="Settings" className="hidden md:flex w-9 h-9 rounded-full items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink transition">
        <Settings size={16} />
      </button>

      {/* Day / Week / Month is a timetable control: Chill has nothing to switch */}
      {!isChill && (
      <div className="hidden md:flex bg-bg-alt rounded-full p-[3px]" role="tablist" aria-label="View">
        {VIEWS.map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-ui font-medium transition ${
              view === v ? "bg-bg-elevated text-ink-primary shadow-card" : "text-ink-secondary"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      )}

      <button onClick={toggleTheme} className="px-3.5 py-2 rounded-full bg-bg-alt border border-[var(--border)] text-ink-primary text-[13px] font-ui flex items-center gap-1.5 hover:bg-accent-soft hover:border-accent transition">
        <span>{isNight ? "🌃" : "☀️"}</span>
        <span className="hidden md:inline">{isNight ? "Netcafe" : "Sunny"}</span>
      </button>
    </header>
  );
}
