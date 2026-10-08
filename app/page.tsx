import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Accessibility, BookOpen, CalendarDays, ChevronDown, Flame, Headphones, ListChecks, Lock, Moon, Sparkles, Sun, Timer } from "lucide-react";
import TryDemoButton from "@/components/demo/TryDemoButton";
import HeroSpirit from "@/components/landing/HeroSpirit";
import PaintedScene from "@/components/scene/PaintedScene";
import DeletedNotice from "@/components/settings/DeletedNotice";
import { CARE, CARE_TITLE, CLOSING, FEATURES, FEATURES_TITLE, FOOTER, GITHUB_URL, HERO, SMALL_ITEMS, THEMES } from "@/lib/landingCopy";
import { REGION_CARDS } from "@/lib/themeText";

export const metadata: Metadata = {
  title: "FindYourself: plan your day, find yourself",
  description: "A calm place for your timetable, your diary, your focus sessions and the sound of rain on the window. Try the demo with sample data, no sign-up needed.",
};

const FEATURE_ICON = { timetable: CalendarDays, diary: BookOpen, focus: Timer } as const;
const SMALL_ICON = { tasks: ListChecks, chill: Headphones, streak: Flame } as const;
const CARE_ICON = { private: Lock, accessible: Accessibility, calm: Sparkles } as const;

const primary = "inline-flex items-center justify-center px-6 py-3 rounded-xl bg-accent text-cat-ink font-ui font-semibold shadow-glow hover:brightness-105 transition";
const secondary = "inline-flex items-center justify-center px-6 py-3 rounded-xl border border-[var(--border-strong)] bg-bg-elevated text-ink-primary font-ui font-medium hover:bg-accent-soft hover:text-cat-ink hover:border-accent transition";

function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 font-display text-lg font-bold text-ink-primary">
      <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-[10px] font-mono text-[13px] font-bold text-cat-ink shadow-glow" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-soft))" }}>
        FY
      </span>
      FindYourself
    </Link>
  );
}

export default function LandingPage() {
  const themeCards = REGION_CARDS;
  return (
    <>
      <header className="absolute inset-x-0 top-0 z-20 p-3">
        <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-glass-card px-4 py-2.5 shadow-card">
          <Logo />
          <div className="flex shrink-0 items-center gap-1 font-ui text-sm sm:gap-3">
            <Link href="/privacy" className="hidden rounded-full px-3 py-1.5 text-ink-secondary hover:bg-accent-soft hover:text-cat-ink sm:inline-block">
              {FOOTER.privacy}
            </Link>
            <Link href="/login" className="whitespace-nowrap rounded-full px-3 py-1.5 text-ink-primary hover:bg-accent-soft hover:text-cat-ink">
              Sign in
            </Link>
            <TryDemoButton compact />
          </div>
        </nav>
      </header>

      <main>
        <section aria-labelledby="hero-title" className="relative isolate h-[min(900px,100svh)] min-h-[640px] overflow-hidden">
          <div aria-hidden className="hero-bg absolute inset-0 -z-10" />
          <PaintedScene variant="hero" className="absolute inset-0 -z-10" />
          <div aria-hidden className="hero-fade pointer-events-none absolute inset-0 -z-10" />

          <div className="relative mx-auto flex h-full max-w-6xl items-center px-4 pb-24 pt-24 md:px-8">
            <div className="relative w-full max-w-[34rem] rounded-3xl border border-[var(--border)] bg-glass-card p-7 shadow-card md:p-9">
              <HeroSpirit />
              <Suspense fallback={null}>
                <DeletedNotice />
              </Suspense>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 font-ui text-xs font-semibold uppercase tracking-wider text-cat-ink">{HERO.badge}</p>
              <h1 id="hero-title" className="font-display text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
                {HERO.title}
                <br />
                <span className="italic text-accent-strong">{HERO.accent}</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg text-ink-secondary">{HERO.sub}</p>
              <div className="mt-7 flex flex-wrap items-start gap-3">
                <Link href="/today" className={primary}>
                  Enter →
                </Link>
                <Link href="/login" className={secondary}>
                  Sign in
                </Link>
                <TryDemoButton />
              </div>
              <p className="mt-4 font-ui text-sm text-ink-secondary">{HERO.smallPrint}</p>
            </div>
          </div>

          <a
            href="#features"
            className="absolute bottom-6 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-[var(--border)] bg-glass-card px-4 py-2 font-ui text-sm font-medium text-ink-primary shadow-card hover:bg-accent-soft hover:text-cat-ink"
          >
            {HERO.scroll} <ChevronDown size={16} aria-hidden />
          </a>
        </section>

        <section id="features" aria-labelledby="features-title" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-20 md:px-8">
          <h2 id="features-title" className="mx-auto max-w-2xl text-balance text-center font-display text-3xl md:text-4xl">
            {FEATURES_TITLE}
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = FEATURE_ICON[f.key];
              return (
                <article key={f.key} className="flex flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-bg-elevated shadow-card">
                  <div className="border-b border-[var(--border)] bg-bg-alt">
                    <Image src={`/assets/landing/${f.key}-day.webp`} alt={f.alt} width={720} height={455} sizes="(min-width: 768px) 360px, 100vw" className="for-monstadt block h-auto w-full" />
                    <Image src={`/assets/landing/${f.key}-night.webp`} alt={f.alt} width={720} height={455} sizes="(min-width: 768px) 360px, 100vw" className="for-nodkrai-night block h-auto w-full" />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-6">
                    <h3 className="flex items-center gap-2 font-display text-xl">
                      <Icon size={20} aria-hidden className="text-accent-strong" /> {f.title}
                    </h3>
                    <p className="font-ui text-[15px] leading-relaxed text-ink-secondary">{f.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {SMALL_ITEMS.map((i) => {
              const Icon = SMALL_ICON[i.key];
              return (
                <li key={i.key} className="flex gap-4 rounded-2xl border border-[var(--border)] bg-bg-elevated p-5 shadow-card">
                  <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-cat-ink">
                    <Icon size={18} />
                  </span>
                  <div>
                    <h3 className="font-display text-lg">{i.title}</h3>
                    <p className="mt-1 font-ui text-[14px] leading-relaxed text-ink-secondary">{i.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="themes-title" className="mx-auto max-w-6xl px-4 pb-20 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="themes-title" className="text-balance font-display text-3xl md:text-4xl">
              {THEMES.title}
            </h2>
            <p className="mt-4 font-ui text-[16px] leading-relaxed text-ink-secondary">{THEMES.text}</p>
            {/* an illustration of the switch in Settings; the real one is there */}
            <div aria-hidden className="mt-6 inline-flex rounded-full border border-[var(--border-input)] bg-bg-alt p-0.5 font-ui text-sm font-medium">
              {THEMES.switch.map((label) => (
                <span key={label} className={`rounded-full px-5 py-1.5 ${label === "Auto" ? "bg-accent font-semibold text-cat-ink" : "text-ink-primary"}`}>
                  {label}
                </span>
              ))}
            </div>
          </div>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {themeCards.map((c) => (
              <li key={c.region} className={`overflow-hidden rounded-3xl border bg-bg-elevated shadow-card ${c.available ? "border-[var(--border)] sm:col-span-1" : "border-dashed border-[var(--border-input)] shadow-none"}`}>
                {c.thumb ? <Image src={c.thumb} alt="" width={640} height={360} sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 100vw" className="aspect-video w-full object-cover" /> : <div aria-hidden className="aspect-video w-full bg-bg-alt" />}
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-xl">{c.label}</h3>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-strong)] px-2 py-0.5 font-ui text-[12px] text-ink-secondary">
                      {c.mode === "day" ? <Sun size={12} aria-hidden /> : <Moon size={12} aria-hidden />}
                      {c.mode === "day" ? "Day" : "Night"}
                    </span>
                  </div>
                  <p className="mt-2 font-ui text-[14px] leading-relaxed text-ink-secondary">{c.blurb}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="care-title" className="mx-auto max-w-6xl px-4 pb-20 md:px-8">
          <h2 id="care-title" className="text-center font-display text-3xl md:text-4xl">
            {CARE_TITLE}
          </h2>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {CARE.map((c) => {
              const Icon = CARE_ICON[c.key];
              return (
                <li key={c.key} className="rounded-3xl border border-[var(--border)] bg-bg-elevated p-6 shadow-card">
                  <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-cat-ink">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-4 font-display text-xl">{c.title}</h3>
                  <p className="mt-2 font-ui text-[15px] leading-relaxed text-ink-secondary">{c.text}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="closing-title" className="mx-auto max-w-3xl px-4 pb-24 md:px-8">
          <div className="rounded-3xl border border-[var(--border)] bg-bg-elevated px-6 py-12 text-center shadow-card">
            <h2 id="closing-title" className="font-display text-3xl md:text-4xl">
              {CLOSING.title}
            </h2>
            <p className="mx-auto mt-3 max-w-md font-ui text-[16px] text-ink-secondary">{CLOSING.text}</p>
            <div className="mt-7 flex flex-wrap items-start justify-center gap-3">
              <Link href="/today" className={primary}>
                Enter →
              </Link>
              <TryDemoButton />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] bg-bg-alt">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 font-ui text-sm text-ink-secondary md:px-8">
          <p>{FOOTER.made}</p>
          <nav aria-label="Footer" className="flex items-center gap-5">
            <Link href="/privacy" className="underline underline-offset-4 hover:no-underline">
              {FOOTER.privacy}
            </Link>
            <a href={GITHUB_URL} className="underline underline-offset-4 hover:no-underline" rel="noopener noreferrer">
              {FOOTER.source}
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
