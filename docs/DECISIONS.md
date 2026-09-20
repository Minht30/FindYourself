# Decision Log — FindYourself

Chronological log of decisions and the reasoning behind them. Every future session should read this first to pick up where we left off.

---

## 2026-09-19 — Session 1: Planning kickoff

**Decisions locked:**
- **Name:** FindYourself
- **Platform:** Responsive web app (Next.js 14 App Router)
- **Stack depth:** Full-stack with auth + DB (Supabase). No AI features — deliberate, "keep it human."
- **Theme:** Night Study Cafe as primary direction; theme tokens designed to allow future variants.
- **Environment scope:** Full mixer — ambient layers + user-uploaded music + curated recommendation list. Users can submit music suggestions via a form; author (admin) curates additions.
- **Audience:** Public signup at launch.
- **Music sourcing:** User uploads MP3s (private Supabase Storage bucket, 50 MB / 20 tracks cap per user). Author maintains a small curated "community picks" list built from submitted suggestions.
- **Deployment:** Vercel + Supabase, both free tier.
- **Cadence:** Day-by-day, no fixed deadline. Every session picks up from the roadmap's next unchecked box.
- **Deliverables (all confirmed):** PRD, user stories, architecture, ERD, design system, roadmap, README. Mockup shipped as a single interactive HTML artifact (token-efficient vs Figma frames).

**Non-decisions (open):**
- Do we ship guest demo mode? Proposed yes — read-only seeded account for portfolio reviewers.
- Light theme in v1 or v1.1? Currently parked for v1.1.
- Landing page copy / voice — not written yet.

**Author preferences noted:**
- Wants the project to read as CV-grade: real docs, real design, real deployment.
- Prefers pace over ambition: "day by day, testing stuff by stuff."
- Music, mixer, and cozy vibe are the *differentiator*, not the extras.
- Values the diary being *private and human* — no AI touching it.

**Next session should:**
1. Read this file and `docs/ROADMAP.md`.
2. Confirm phase 0 is complete (all docs + mockup artifact).
3. Start Phase 1 — Foundation: `create-next-app`, base layout, theme tokens, Supabase project.

---

## 2026-09-19 — Session 2: Design direction v2

Minh reviewed the v0.1 mockup against a Google Calendar screenshot and gave concrete design direction. Locked in:

**Dual theme system (both first-class, toggle in top bar):**
- ☀️ **Sunny Cafe** (day) — pastel, natural, warm honey/butter brights. Serif via **Lora** (fountain-pen feel). Cream bg `#FDF8EE`, honey accent `#F5C243` (brighter than v1 amber).
- 🌃 **Netcafe After Dark** (night) — metallic jewel tones, neon canary that keeps the yellow thread. **Space Grotesk + JetBrains Mono** for code/cyber vibe. Midnight bg `#0B0F1A`, neon accent `#F4D03F`. Subtle scanline overlay.
- Toggle persists in localStorage; system `prefers-color-scheme` used as first-load default.

**Layout — Google Calendar shell:**
- Top bar: menu, brand, Today button, ‹ › arrows, date title, search/settings icons, **Day/Week/Month view switcher**, theme toggle.
- Left sidebar 280px: `+ Create` button, mini month calendar, **animated coffee-cup illustration** (SVG with rising steam wisps — a differentiator that carries the "environment IS the product" promise), category legend, mini ambient mixer.
- Main: **Week view is the default** — 7 columns × hour rows, colored event blocks, "today" column highlighted with an accent tint and a red "now" line. Clicking a day zooms to Day view.
- Sidebar collapses below 900px; view switcher hides on mobile.

**Accessibility (WCAG 2.1 AA, stricter than 2.0):**
- Every color pair listed and verified with a contrast table in the mockup and in `docs/DESIGN_SYSTEM.md`.
- Body text meets 4.5:1 in both themes; category chips use dark ink `#2A2018` (sunny) / `#0B0F1A` (night) for 7–14:1 on all category backgrounds.
- `--accent` in sunny theme is decorative-only (2.3:1 on white); `--accent-strong` `#B87700` is the readable text version at 5.2:1.
- Visible 2px focus rings; `prefers-reduced-motion` disables steam, rain, scanline, glitch.
- Category color always paired with a text label — never color-only.

**Files updated:**
- `docs/DESIGN_SYSTEM.md` — full rewrite with dual-theme tokens, WCAG verification table, fonts, layout spec.
- `docs/mockup/index.html` — full rewrite; Google-Cal shell + week view + animated coffee cup + theme toggle. Republished to https://claude.ai/artifact/SEWFghq77XeewPe7Sqz69j.

**Author preferences noted (added to session memory):**
- Wants the environment/UI to *carry* the product identity, not just be decoration.
- Bright yellow is the through-line color across both themes.
- Male-leaning / strong-personality vibe for night theme is welcome (cyber/code feel).
- Accessibility is non-negotiable — check contrast before shipping.

**Next session should:**
1. Confirm Phase 0 is fully wrapped (all docs + mockup v2).
2. Start Phase 1 — Foundation.

---

## 2026-09-19 — Session 3: Page architecture + calendar decorations

**Feedback resolved:**
- "Now line" (red horizontal bar on today's column) was ambiguous → now has a "NOW" pill label, and glows canary-yellow in night theme.
- Standalone coffee-cup sidebar widget removed — Minh preferred decorations *woven into the calendar itself* (reference: unicorn pastel timetable image).
- **New:** small coffee cup + steam SVG lives in the top-left corner of the week header (near GMT-04); tiny sparkle motif in a blank Sunday area. Minimal, one per zone, easy on the eye — never a whole illustration block.
- Decorations are decorative only (aria-hidden), respect reduced-motion, use theme tokens so they morph between sunny and night automatically.

**Four-page architecture locked:**
| Page | Route | What it is |
|---|---|---|
| 📅 Timetable | `/today` `/week` `/month` | Main. Google-Cal shell with tasks drawer + mini-mixer in sidebar. |
| 📓 Diary | `/diary/[date]` | Daily entry, mood, prompts. |
| 🎯 Focus | `/focus` | Pomodoro + focus mode. |
| 🎵 Chill | `/chill` | Music + animated scene, zero productivity UI, "just here" screensaver-vibe. |

Nav is a rail at the top of the left sidebar (icon + label), active state uses accent-soft background. Tasks stay inside Timetable page as a right drawer — they belong next to time, not on their own.

**Files updated:**
- `docs/PRD.md` — added §6.0 App structure — four pages.
- `docs/mockup/index.html` — sidebar has 4-page nav, calendar has minimal decorations, now-line labeled "NOW", added Chill mode preview + Page-architecture section. Republished v4.

**Next session should:**
1. Confirm decorations feel right in both themes (Minh to review).
2. Start Phase 1 — Foundation, or iterate on Chill scene composition first if Minh wants.

---

## 2026-09-19 — Session 4: Phase 1 scaffold + rich autumn decoration

**Mockup polish:**
- Rich autumn decorations added to mini-month: top band (leaves + berries + acorn) and bottom band (leaves + latte mug + green gourd + pumpkin + wheat sheaf + berries). Radial gradient wash on the mini-month card. `.sway` animations respect reduced-motion. Republished as v9 → v10.
- Fixed: coffee mug was on the right and pumpkin on the left — swapped so mug is on the LEFT and pumpkin on the RIGHT per Minh's preference.

**Phase 1 scaffold complete (files, not yet installed):**
- Next.js 14 App Router, React 18, TypeScript strict, Tailwind CSS. Manually scaffolded (not `create-next-app`) to avoid overwriting `docs/`.
- Design tokens live in `app/globals.css`, mapped in `tailwind.config.ts` to `bg-*`, `ink-*`, `accent-*`, `cat-*` classes.
- Root layout has no-flash theme restore inline script (reads `localStorage['fy-theme']` before paint).
- `components/layout/TopBar.tsx` — sticky top bar, brand, Today, arrows, date, view switcher, theme toggle.
- `components/layout/Sidebar.tsx` — 4-page rail (Timetable / Diary / Focus / Chill) with active state from `usePathname`, Create button, category legend.
- Four page routes stubbed under `app/(app)/`: today, diary, focus, chill. Landing at `app/page.tsx`.
- Supabase client factories written (`@supabase/ssr`, both browser and server). Dormant until env vars supplied.
- `.env.local.example`, `.gitignore`, `.eslintrc.json`, `tsconfig.json` present.
- `GETTING_STARTED.md` added with install/run + Supabase/GitHub setup steps for Minh.
- Node 24, npm 11, git 2.50 confirmed on this machine.

**Blocked-on-Minh (external accounts):**
1. Supabase project + env vars (URL + anon key + service_role key)
2. GitHub repo URL
3. Vercel account link (deploy step)

**Next session should:**
1. Confirm `npm install` succeeded and `npm run dev` renders the landing → app shell.
2. If Minh has Supabase creds ready → wire login/signup pages, add auth callback route, protect `(app)` routes with middleware.
3. Otherwise: keep building the shell (mini-month, categories management page) with mock data.

---

<!-- New entries append below with date + session number -->
