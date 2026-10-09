"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, BookOpen, Timer, Music, Settings, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import MiniMixer from "@/components/mixer/MiniMixer";
import MiniMonth from "./MiniMonth";
import { useNav } from "./NavContext";

const PAGES = [
  { href: "/today", label: "Timetable", Icon: Calendar },
  { href: "/diary", label: "Diary", Icon: BookOpen },
  { href: "/focus", label: "Focus", Icon: Timer },
  { href: "/chill", label: "Chill", Icon: Music },
  { href: "/settings", label: "Settings", Icon: Settings },
];

// On a desktop the person can fold the sidebar into a slim rail of icons (the
// wallpaper gets the room). Everything stays mounted, only hidden, so the mini
// mixer and the month keep their state. Phones never fold: there it is a drawer.
export default function Sidebar() {
  const pathname = usePathname();
  const { open, close, collapsed, toggleCollapsed } = useNav();
  // Applies to the folded desktop rail only (the `md:` prefix keeps the phone drawer whole).
  const hideInRail = collapsed ? "md:hidden" : "";

  return (
    <>
      {/* Phones: a dimmed backdrop behind the open drawer; tapping it closes it */}
      {open ? <div aria-hidden data-nav-backdrop onClick={close} className="md:hidden fixed inset-0 z-[55] bg-black/40" /> : null}
      <aside
        id="app-sidebar"
        aria-label="Sidebar"
        data-collapsed={collapsed ? "true" : undefined}
        className={`${
          open ? "flex fixed inset-y-0 left-0 z-[60] w-[290px] max-w-[85vw] shadow-2xl" : "hidden"
        } md:flex md:static md:z-auto md:w-auto md:max-w-none md:shadow-none flex-col gap-5 ${
          collapsed ? "p-4 md:p-2 md:items-center" : "p-4"
        } bg-bg-elevated md:bg-glass-panel border-r md:border md:rounded-2xl border-[var(--border)] overflow-y-auto overflow-x-hidden`}
      >
        {/* Desktop only: fold the sidebar into the rail, or open it again */}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar"
          title={collapsed ? "Show sidebar" : "Hide sidebar"}
          className={`hidden md:flex items-center justify-center w-9 h-9 rounded-full text-ink-secondary hover:bg-accent-soft hover:text-cat-ink transition ${
            collapsed ? "" : "self-end -mb-3"
          }`}
        >
          {collapsed ? <PanelLeftOpen size={18} aria-hidden /> : <PanelLeftClose size={18} aria-hidden />}
        </button>

        <nav
          aria-label="Pages"
          className={`flex flex-col gap-0.5 pb-3 border-b border-[var(--border)] ${collapsed ? "md:items-center" : ""}`}
        >
          {PAGES.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full font-ui text-sm font-medium transition ${
                  collapsed ? "md:justify-center md:w-11 md:h-11 md:p-0" : ""
                } ${
                  active
                    ? "bg-accent-soft text-cat-ink font-semibold"
                    : "text-ink-secondary hover:bg-bg-alt hover:text-ink-primary"
                }`}
              >
                <Icon size={18} aria-hidden />
                <span className={hideInRail}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Reads the URL (?week=), hence the Suspense boundary */}
        <div className={hideInRail}>
          <Suspense fallback={<div aria-hidden className="h-[236px]" />}>
            <MiniMonth />
          </Suspense>
        </div>

        <div className={hideInRail}>
          <MiniMixer />
        </div>

        {/* Sign out — pushed to the bottom */}
        <form action={signOut} className={`mt-auto pt-4 border-t border-[var(--border)] ${collapsed ? "md:flex md:justify-center" : ""}`}>
          <button
            type="submit"
            aria-label="Sign out"
            title={collapsed ? "Sign out" : undefined}
            className={`flex items-center gap-3 rounded-full font-ui text-sm text-ink-secondary hover:bg-bg-alt hover:text-ink-primary transition px-3.5 py-2.5 ${
              collapsed ? "md:w-11 md:h-11 md:p-0 md:justify-center" : "w-full"
            }`}
          >
            <LogOut size={16} aria-hidden />
            <span className={hideInRail}>Sign out</span>
          </button>
        </form>
        <Link
          href="/privacy"
          className={`px-3.5 -mt-3 font-ui text-[12px] text-ink-muted hover:text-ink-primary underline-offset-4 hover:underline ${hideInRail}`}
        >
          Privacy
        </Link>
      </aside>
    </>
  );
}
