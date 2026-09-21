"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Menu, ChevronLeft, ChevronRight, Search, Settings } from "lucide-react";
import { addDays, parseWeekParam, toISODateOnly } from "@/lib/dates";

const VIEWS = ["Day", "Week", "Month"] as const;
type View = (typeof VIEWS)[number];

export default function TopBar() {
  const [view, setView] = useState<View>("Week");
  const [theme, setTheme] = useState<"sunny-cafe" | "netcafe-night">("sunny-cafe");

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // The topbar arrows navigate weeks when we're on /today. Other pages will
  // wire the same buttons to their own concept of "prev/next" (a day for
  // /diary, a session for /focus). Until those exist, the arrows short-circuit
  // to /today so the user is never staring at inert controls.
  const isTimetable = pathname?.startsWith("/today");

  function goWeek(deltaDays: number) {
    const current = parseWeekParam(searchParams?.get("week") ?? undefined);
    const target = toISODateOnly(addDays(current, deltaDays));
    router.push(`/today?week=${target}`);
  }
  function goToday() {
    router.push("/today");
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

      <button
        onClick={goToday}
        className="px-4 py-1.5 rounded-full border border-[var(--border-strong)] text-ink-primary font-ui text-sm hover:bg-accent-soft hover:text-cat-ink hover:border-accent transition"
      >
        Today
      </button>

      <div className="flex gap-1">
        <button
          onClick={() => goWeek(-7)}
          aria-label={isTimetable ? "Previous week" : "Previous"}
          className="w-9 h-9 rounded-full flex items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink transition"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => goWeek(7)}
          aria-label={isTimetable ? "Next week" : "Next"}
          className="w-9 h-9 rounded-full flex items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink transition"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="font-display text-lg md:text-xl truncate min-w-0 flex-shrink">Sep 14 – 20, 2026</div>

      <div className="flex-1" />

      <button aria-label="Search" className="hidden md:flex w-9 h-9 rounded-full items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink transition">
        <Search size={16} />
      </button>
      <button aria-label="Settings" className="hidden md:flex w-9 h-9 rounded-full items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink transition">
        <Settings size={16} />
      </button>

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

      <button onClick={toggleTheme} className="px-3.5 py-2 rounded-full bg-bg-alt border border-[var(--border)] text-ink-primary text-[13px] font-ui flex items-center gap-1.5 hover:bg-accent-soft hover:border-accent transition">
        <span>{isNight ? "🌃" : "☀️"}</span>
        <span className="hidden md:inline">{isNight ? "Netcafe" : "Sunny"}</span>
      </button>
    </header>
  );
}
