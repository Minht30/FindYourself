"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, BookOpen, Timer, Music, Settings, LogOut, PanelLeftClose, PanelLeftOpen, Flower2, Leaf, Moon, Tag, Users } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import MiniMixer from "@/components/mixer/MiniMixer";
import { categoryColor } from "@/lib/categories";
import { categoryIconKey, type CategoryIconKey } from "@/lib/categoryIcons";
import MiniMonth from "./MiniMonth";
import { useNav } from "./NavContext";

const PAGES = [
  { href: "/today", label: "Timetable", Icon: Calendar },
  { href: "/diary", label: "Diary", Icon: BookOpen },
  { href: "/focus", label: "Focus", Icon: Timer },
  { href: "/chill", label: "Chill", Icon: Music },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export type SidebarCategory = { id: string; name: string; color: string };

const CATEGORY_ICONS: Record<CategoryIconKey, typeof Leaf> = { leaf: Leaf, people: Users, book: BookOpen, moon: Moon, flower: Flower2, tag: Tag };

// The categories list belongs to the pages that work with blocks: the Timetable and Focus. Chill,
// the Diary and Settings (where categories are edited) do not show it.
const SHOWS_CATEGORIES = ["/today", "/focus"];

// On a desktop the person can fold the sidebar into a slim rail of icons (the
// wallpaper gets the room). Everything stays mounted, only hidden, so the mini
// mixer and the month keep their state. Phones never fold: there it is a drawer.
export default function Sidebar({ categories }: { categories: SidebarCategory[] }) {
  const pathname = usePathname();
  const { open, close, collapsed, toggleCollapsed } = useNav();
  // Applies to the folded desktop rail only (the `md:` prefix keeps the phone drawer whole).
  const hideInRail = collapsed ? "md:hidden" : "";
  const showCategories = SHOWS_CATEGORIES.some((p) => pathname === p || pathname?.startsWith(p + "/"));

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
        } md:flex md:relative md:z-auto md:w-auto md:max-w-none flex-col gap-5 ${
          collapsed ? "p-4 md:p-2 md:items-center" : "p-4"
        } max-md:bg-bg-elevated max-md:border-r max-md:border-[var(--border)] max-md:shadow-2xl md:chrome md:chrome-marks overflow-y-auto overflow-x-hidden`}
      >
        {/* Desktop only: the logo, and the button that folds the sidebar into the rail (or opens it again) */}
        <div className={`hidden md:flex items-center ${collapsed ? "justify-center" : "justify-between pl-1"}`}>
          {collapsed ? null : (
            <span className="flex items-center gap-2.5 font-display text-[25px] leading-none text-[color:var(--logo-ink)]">
              <svg aria-hidden viewBox="0 0 36 36" width="34" height="34" className="shrink-0">
                <path fill="currentColor" d="M18 1.5L21.2 14.8L34.5 18L21.2 21.2L18 34.5L14.8 21.2L1.5 18L14.8 14.8Z" />
              </svg>
              FindYourself
            </span>
          )}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar"
          title={collapsed ? "Show sidebar" : "Hide sidebar"}
          className="flex items-center justify-center w-9 h-9 rounded-full text-ink-secondary hover:bg-bg-alt hover:text-ink-primary transition"
        >
          {collapsed ? <PanelLeftOpen size={18} aria-hidden /> : <PanelLeftClose size={18} aria-hidden />}
        </button>
        </div>

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
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-full font-ui text-sm font-medium transition ${
                  collapsed ? "md:justify-center md:w-11 md:h-11 md:p-0" : ""
                } ${
                  active
                    ? "nav-on font-semibold"
                    : "text-ink-secondary hover:bg-bg-alt hover:text-ink-primary"
                }`}
              >
                <Icon size={18} aria-hidden />
                <span className={hideInRail}>{label}</span>
                {active ? <i aria-hidden className={`nav-mark ${hideInRail}`} /> : null}
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

        {showCategories && categories.length > 0 ? (
          <section aria-label="My categories" data-testid="sidebar-categories" className={`font-ui ${hideInRail}`}>
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">My categories</h2>
              <Link href="/settings#categories" className="text-[11px] text-ink-muted hover:text-ink-primary underline-offset-4 hover:underline">
                Edit
              </Link>
            </div>
            <ul className="mt-1.5 flex flex-col gap-0.5">
              {categories.map((c) => {
                const Icon = CATEGORY_ICONS[categoryIconKey(c)];
                return (
                  <li key={c.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-ink-primary hover:bg-bg-alt">
                    <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-cat-ink" style={{ background: categoryColor(c) }}>
                      <Icon size={11} strokeWidth={2} aria-hidden />
                    </span>
                    <span className="truncate">{c.name}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

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
