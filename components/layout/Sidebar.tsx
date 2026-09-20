"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, BookOpen, Timer, Music, Plus, LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";

const PAGES = [
  { href: "/today", label: "Timetable", Icon: Calendar },
  { href: "/diary", label: "Diary", Icon: BookOpen },
  { href: "/focus", label: "Focus", Icon: Timer },
  { href: "/chill", label: "Chill", Icon: Music },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col gap-5 p-4 bg-bg-elevated border-r border-[var(--border)] overflow-y-auto">
      <nav aria-label="Pages" className="flex flex-col gap-0.5 pb-3 border-b border-[var(--border)]">
        {PAGES.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full font-ui text-sm font-medium transition ${
                active
                  ? "bg-accent-soft text-cat-ink font-semibold"
                  : "text-ink-secondary hover:bg-bg-alt hover:text-ink-primary"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <button className="self-start flex items-center gap-2.5 px-4 py-3 rounded-full bg-bg-elevated border border-[var(--border-strong)] text-ink-primary font-ui text-sm font-medium shadow-card hover:bg-accent-soft hover:border-accent transition">
        <span className="w-5 h-5 rounded-full bg-accent text-cat-ink flex items-center justify-center font-bold text-sm">
          <Plus size={14} strokeWidth={2.5} />
        </span>
        Create
      </button>

      <div className="text-[11px] font-ui font-semibold text-ink-muted uppercase tracking-wider px-2">
        My categories
      </div>
      <div className="flex flex-col gap-0.5 -mt-3">
        {[
          { label: "Deep Work", token: "var(--cat-deep)" },
          { label: "Meetings", token: "var(--cat-meeting)" },
          { label: "Learning", token: "var(--cat-learn)" },
          { label: "Rest", token: "var(--cat-rest)" },
          { label: "Personal", token: "var(--cat-personal)" },
        ].map(({ label, token }) => (
          <div key={label} className="flex items-center gap-2.5 px-2 py-1.5 rounded text-sm font-ui text-ink-primary hover:bg-bg-alt">
            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: token }} />
            {label}
          </div>
        ))}
      </div>

      {/* Sign out — pushed to the bottom */}
      <form action={signOut} className="mt-auto pt-4 border-t border-[var(--border)]">
        <button
          type="submit"
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full font-ui text-sm text-ink-secondary hover:bg-bg-alt hover:text-ink-primary transition"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </form>
    </aside>
  );
}
