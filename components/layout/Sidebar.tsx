"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, BookOpen, Timer, Music, Settings, LogOut } from "lucide-react";
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

export default function Sidebar() {
  const pathname = usePathname();
  const { open, close } = useNav();

  return (
    <>
      {/* Phones: a dimmed backdrop behind the open drawer; tapping it closes it */}
      {open ? <div aria-hidden data-nav-backdrop onClick={close} className="md:hidden fixed inset-0 z-[55] bg-black/40" /> : null}
      <aside
        id="app-sidebar"
        aria-label="Sidebar"
        className={`${
          open ? "flex fixed inset-y-0 left-0 z-[60] w-[290px] max-w-[85vw] shadow-2xl" : "hidden"
        } md:flex md:static md:z-auto md:w-auto md:max-w-none md:shadow-none flex-col gap-5 p-4 bg-bg-elevated md:bg-glass-panel border-r md:border md:rounded-2xl border-[var(--border)] overflow-y-auto`}
      >
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

      {/* Reads the URL (?week=), hence the Suspense boundary */}
      <Suspense fallback={<div aria-hidden className="h-[236px]" />}>
        <MiniMonth />
      </Suspense>

      <MiniMixer />

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
      <Link href="/privacy" className="px-3.5 -mt-3 font-ui text-[12px] text-ink-muted hover:text-ink-primary underline-offset-4 hover:underline">
        Privacy
      </Link>
    </aside>
    </>
  );
}
