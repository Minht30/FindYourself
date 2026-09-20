"use client";

import { useEffect, useState } from "react";
import { Menu, ChevronLeft, ChevronRight, Search, Settings } from "lucide-react";

const VIEWS = ["Day", "Week", "Month"] as const;
type View = (typeof VIEWS)[number];

export default function TopBar() {
  const [view, setView] = useState<View>("Week");
  const [theme, setTheme] = useState<"sunny-cafe" | "netcafe-night">("sunny-cafe");

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
      <button aria-label="Menu" className="w-10 h-10 rounded-full flex items-center justify-center text-ink-secondary hover:bg-bg-alt hover:text-ink-primary transition">
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2.5 font-display font-bold text-lg mr-2">
        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-cat-ink font-mono font-bold text-[13px] shadow-glow" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-soft))" }}>
          FY
        </div>
        <span className="hidden sm:inline">FindYourself</span>
      </div>

      <button className="px-4 py-1.5 rounded-full border border-[var(--border-strong)] text-ink-primary font-ui text-sm hover:bg-bg-alt transition">
        Today
      </button>

      <div className="flex gap-1">
        <button aria-label="Previous" className="w-9 h-9 rounded-full flex items-center justify-center text-ink-secondary hover:bg-bg-alt hover:text-ink-primary transition">
          <ChevronLeft size={16} />
        </button>
        <button aria-label="Next" className="w-9 h-9 rounded-full flex items-center justify-center text-ink-secondary hover:bg-bg-alt hover:text-ink-primary transition">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="font-display text-lg md:text-xl truncate min-w-0 flex-shrink">Sep 14 – 20, 2026</div>

      <div className="flex-1" />

      <button aria-label="Search" className="hidden md:flex w-9 h-9 rounded-full items-center justify-center text-ink-secondary hover:bg-bg-alt hover:text-ink-primary transition">
        <Search size={16} />
      </button>
      <button aria-label="Settings" className="hidden md:flex w-9 h-9 rounded-full items-center justify-center text-ink-secondary hover:bg-bg-alt hover:text-ink-primary transition">
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
