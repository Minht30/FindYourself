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

## 2026-09-20 — Session 5: Phase 1 complete (deployed + auth)

**What landed:**
- Vercel deployment green at **https://findyourself-mu.vercel.app** (custom slug because plain `findyourself` was taken). Aliases: `findyourself-git-main-citlali-simple.vercel.app` (main-branch alias) and `findyourself-{hash}-citlali-simple.vercel.app` (per-deployment).
- Vercel env vars set for all 3 environments: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL=https://findyourself-mu.vercel.app`.
- Supabase URL Configuration set with Site URL + 4 redirect URLs (localhost, prod, main-branch alias, wildcard `*-citlali-simple.vercel.app`).
- **Build fixes shipped along the way** (commits `6c40570`, `923c214`, `02e3d35`):
  - Typed `options: CookieOptions` in `lib/supabase/server.ts` (was implicit `any`, tsc --strict failed on Vercel).
  - Switched fonts from raw `<link>` tags to `next/font/google` (Lora, Space Grotesk, Inter, JetBrains Mono) — silences `no-page-custom-font` warning and self-hosts. `globals.css` now references `var(--font-lora)`, `var(--font-space-grotesk)`, `var(--font-inter)`, `var(--font-jetbrains-mono)`.
- **Auth built** (`923c214`):
  - `middleware.ts` + `lib/supabase/middleware.ts` — refreshes session cookies on every request; redirects unauth users from `/today`, `/diary`, `/focus`, `/chill` to `/login?next=<original>`; redirects auth'd users away from `/login` and `/signup` to `/today`.
  - `app/(auth)/{login,signup}/page.tsx` — cozy cards styled with Sunny Cafe tokens (Lora headings, honey CTA, warm error banners). Signup shows a "check your inbox" confirmation state.
  - `app/(auth)/actions.ts` — server actions `login`, `signup`, `signOut`. Uses `NEXT_PUBLIC_SITE_URL` / `VERCEL_URL` / `localhost` for signup `emailRedirectTo`.
  - `app/auth/callback/route.ts` — handles PKCE (`?code=`) AND verifyOtp (`?token_hash=&type=`) flows, plus gracefully lets users in if they already have a valid session (fix in `02e3d35` — was surfacing `auth_callback_failed` when signup had auto-issued a session before the confirmation click).
  - Sidebar has a `Sign out` button pinned to the bottom.

**Local build status:** 11 routes, middleware bundled 86 KB. `npm run build` clean.

**Author preferences learned this session:**
- Bright bold seasonal decorations preferred (subtle wash was rejected → replaced with rich autumn top+bottom bands with maple leaves, latte mug, pumpkin, gourd, wheat sheaf, berries, acorns). Reference: pastel unicorn PDF calendar.
- Coffee mug on the LEFT, pumpkin on the RIGHT (they were swapped).
- Cost-conscious: prefers branching to a new window when a phase completes, to shrink context cost.

**Phase 2 — Timetable MVP — starts next.** From ROADMAP.md:
1. Supabase migration: `categories` + `time_blocks` tables with RLS policies (`auth.uid() = user_id` shape). See `docs/ERD.md` §`categories`, §`time_blocks`.
2. Signup trigger: seed default categories (Deep Work, Meetings, Learning, Rest, Personal) per new user.
3. Replace the `/today` placeholder with a week view grid — Google-Cal style, `time-axis` on left, 7 `day-column`s. Reference structure lives in `docs/mockup/index.html` (the `.week-header` + `.week-grid` sections).
4. Click-drag to create a block, drag body to move (15-min snap), drag edges to resize.
5. Block editor popover (title, category picker, notes).
6. "Copy yesterday" button.
7. Persist to Supabase via server actions or route handlers; read via RSC.

**Blocked on:** nothing. All external accounts (Supabase, GitHub, Vercel) are wired. `.env.local` and Vercel env vars are complete.

**Handoff pointer for next session:**
- Read this file + `docs/ROADMAP.md` + `docs/ERD.md` (§categories, §time_blocks, §RLS example) first.
- MCP `supabase` server is now available — use `mcp__supabase__list_tables`, `mcp__supabase__apply_migration`, `mcp__supabase__execute_sql` to manage the schema directly instead of asking the user to run SQL manually.
- MCP `github` server is available too (Minht30/FindYourself) for PRs if the user prefers PR-based workflow over pushing to main.
- Repo: https://github.com/Minht30/FindYourself · Prod: https://findyourself-mu.vercel.app

---

## 2026-09-20 — Session 6: Phase 2 schema landed

**What landed** (three Supabase migrations, mirrored under `supabase/migrations/`):
- `20260920203829_phase2_profiles_categories_time_blocks.sql` — `profiles`, `categories`, `time_blocks` per `docs/ERD.md`. All three have RLS enabled with the `auth.uid() = user_id` shape (profiles uses `auth.uid() = id`). Indexes: `categories(user_id, sort_order)`, `time_blocks(user_id, starts_at)`. `time_blocks` has a `CHECK (ends_at > starts_at)` guard. `linked_task_id` is deferred to Phase 4 when `tasks` exists.
- `20260920203847_phase2_signup_trigger_seed_defaults.sql` — `handle_new_user()` (security definer, `search_path = public`) fires on `after insert on auth.users`: creates the `profiles` row (display_name falls back to raw_user_meta_data → email local-part) and seeds 5 default categories (Deep Work, Meetings, Learning, Rest, Personal) with tokens borrowed from the design system.
- `20260920203912_phase2_lock_down_handle_new_user.sql` — revokes EXECUTE from `public, anon, authenticated` so the function can't be called via `/rest/v1/rpc/handle_new_user` (fixed lints 0028 + 0029 from `get_advisors`). The trigger still runs because it executes as owner.

**Backfill:** Minh's existing `auth.users` row (qminh30k3@gmail.com) predates the trigger, so ran an idempotent backfill: inserted a matching `profiles` row and seeded the 5 categories. Verified counts: `profiles=1, categories=5, time_blocks=0`.

**Advisors:** only one remaining, and it isn't schema-related — `auth_leaked_password_protection` (WARN). It's a dashboard toggle: **Authentication → Providers → Email → "Prevent leaked passwords"**. Minh should flip it when convenient; not blocking.

**Design decisions worth remembering:**
- `profiles.id` = `auth.users.id` (FK with `on delete cascade`), matching ERD. All downstream tables FK `profiles(id)` not `auth.users(id)`, so cascading a user delete flows through the profile.
- Category seeds live in the trigger, not a separate seed script — new users get them atomically on signup with no round-trip.
- Migrations are stored in the repo under `supabase/migrations/` with Supabase's own timestamp format. Not wired to the CLI yet, but reproducible.

**Next session — write UI for the schema:**
1. Replace `app/(app)/today/page.tsx` with a real week-view grid (RSC): fetch categories + time_blocks for the current week from Supabase using the server client.
2. Column-per-day + hour rows; render existing blocks as absolute-positioned cards colored by category.
3. Click-drag on an empty slot creates a block; drag body to move; drag top/bottom edges to resize. 15-min snap.
4. Popover editor: title, category picker, notes. Server action persists.
5. "Copy yesterday" button.

Reference the mockup at `docs/mockup/index.html` for the `.week-header` + `.week-grid` structure — it's the shape we want.

**Blocked on:** nothing.

---

## 2026-09-20 — Session 7: Read-only week view lands

**What landed:**
- `lib/dates.ts` — pure helpers for week math. Monday-anchored `startOfWeekMonday`, `weekDays`, `formatHour`, `minutesFromDayStart`, `minutesToPx`, `formatWeekRange`, `parseWeekParam`, `toISODateOnly`. Constants: `HOUR_HEIGHT_PX=56`, `DAY_START_HOUR=6`, `DAY_END_HOUR=23` (view spans 6 AM–11 PM = 17 hour rows). Kept framework-free so the same helpers can drive Day/Month views later.
- `components/timetable/WeekGrid.tsx` — client component. Header row shows Mon–Sun with today's column tinted `accent-soft/40` and its number set in `accent-strong`. Body grid: 72px time axis + 7 day columns, dashed hour gridlines, blocks positioned absolutely by `top = minutesToPx(startMinutes)` and `height = duration/60 * HOUR_HEIGHT_PX`. NOW line is a red bar with a "NOW" pill; updates every 60s via `setInterval`. Category color maps by name → CSS variable (`--cat-deep`, etc.) so blocks re-color when you flip the theme; falls back to `category.color` (the DB hex) for user-renamed categories.
- `app/(app)/today/page.tsx` — replaced the placeholder. Async server component: fetches `categories` and `time_blocks` (this-week window, via `starts_at >= weekStart AND starts_at < weekEnd`) in parallel from the Supabase server client. RLS enforces user scoping. Header row has `formatWeekRange` label and Prev / This week / Next anchor links using `?week=YYYY-MM-DD`. Empty state message renders under the grid if no blocks exist.
- Seeded 8 demo `time_blocks` for Minh's account spanning Mon–Sun 2026-09-14→20 (Deep Work, Meetings, Learning, Rest, Personal). Marked "demo block" in notes — safe to delete once the block editor lands.

**Decisions worth remembering:**
- Week starts Monday, not Sunday. Matches the mockup and the `1 - day` math in `startOfWeekMonday`.
- View window is 6 AM–11 PM (17 rows). Full 24h was too tall; earliest realistic waking hour lands near the top. Revisit if diary/nightlife use cases need it wider.
- NOW line lives inside the day column (not floated across the grid) so it doesn't leak into other days when the browser tab is left open past midnight.
- Category color path is name-based → CSS var by default. This preserves the dual-theme story: the same "Deep Work" block reads `--cat-deep = #A8C4A2` in Sunny Cafe and `#7DD3FC` in Netcafe After Dark. Renamed categories fall back to the hex stored in `categories.color` — good enough for MVP.
- Week nav uses plain `<a>` links (no client state) so back/forward and the browser URL both work naturally. `dynamic = "force-dynamic"` on the page — no caching to fight with when blocks change.

**Verification:**
- `npm run build` green. `/today` is a 1.85 kB dynamic route.
- Middleware still redirects unauth → `/login?next=/today` (confirmed in a preview).
- **Visual check pending Minh's login.** Log in at prod (`https://findyourself-mu.vercel.app/login`) or locally after `npm run dev`, then hit `/today`. You should see the 8 demo blocks spread across the week with today's column tinted and a NOW line on it.

**Next session — Session 8 unchecked box:**
- Click-drag on an empty slot in a day column to create a block.
- Server action `createTimeBlock({ starts_at, ends_at, category_id, title })` with RLS-safe insert.
- 15-min snap. Default title "New block", default category = first sort_order.
- After that: drag body to move, drag edges to resize, then the popover editor.

**Blocked on:** nothing.

---

## 2026-09-20 — Session 7.1: Small hover fix + deferred design asks

**Fixed now (accessibility bug, not design):**
- TopBar icon buttons (Menu, ‹ ›, Search, Settings) used `hover:bg-bg-alt` which in netcafe is `#10141F` — nearly identical to the `#0B0F1A` topbar bg. Hover state was invisible. Swapped all four to `hover:bg-accent-soft hover:text-cat-ink` so they read as the yellow through-line in both themes.

**Explicitly deferred to Phase 9 (Polish & launch) — do NOT touch until Phase 2 interactivity ships:**
- **Block visual richness.** Current blocks are a flat colored rectangle with title + time label. Minh finds them "a bit simple." Phase 9 will add: subtle inner border refraction, category-tinted shadow, hover lift with spring physics, maybe a small category icon glyph. Sunny gets a paper/notebook feel; netcafe gets a soft neon inner-glow. Reference the design-taste-frontend-v1 skill's "Materiality" + "Perpetual Micro-Interactions" sections when doing this pass.
- **Netcafe palette review.** Minh finds the current netcafe category colors (pastel neons) unimpressive. Phase 9 will re-tune toward richer jewel tones (deeper cyan/magenta/violet with higher saturation but same contrast targets) while keeping the canary yellow through-line. Verify WCAG 2.1 AA on every category chip pairing.
- **Week-grid materiality.** Right now it's a flat 1px-bordered card. Phase 9 candidates: subtle inner shadow tinted to bg, soft column dividers instead of hard `--border`, maybe a tiny grain overlay in sunny theme (respects reduced-motion).

**Why deferring is the right call:**
Minh explicitly asked "finish core functions first then go to full design later." That matches the pace preference (day-by-day, one demoable box per session) and the ROADMAP's Phase 9 charter. Doing polish before create/drag/edit works would mean redoing the polish once the interactive components change shape.

---

## 2026-09-20 — Session 8: Click-drag to create a block

**What landed:**
- `app/(app)/today/actions.ts` — `createBlock` server action. Auth-checks via `supabase.auth.getUser()`, validates dates + a 15-min minimum, inserts a row (RLS enforces user_id = auth.uid()), then `revalidatePath("/today")`. Returns `{ id }` on success or `{ error }` so the client can log without throwing.
- `components/timetable/WeekGrid.tsx` — pointer-based drag-to-create.
  - `SNAP_MIN = 15`, `DEFAULT_DURATION_MIN = 30`.
  - `beginDrag()` fires on `pointerdown` in an empty part of a day column (`e.target.closest("[data-block]")` short-circuits so clicks on existing cards don't start a drag). Captures the column's `getBoundingClientRect()` once and stores it in a `useRef` — closure-safe across pointermove events, no state churn.
  - Attaches `pointermove` / `pointerup` / `pointercancel` listeners to `document` for the duration of the drag; cleans up in `pointerup`. Ghost element shows in the column with a dashed accent border and a live time-range label ("8:00 AM – 9:30 AM").
  - On `pointerup`: submits via `useTransition` → server action → `router.refresh()` picks up the new row. A tiny "Saving block…" footer shows while `pending`.
  - Snap: `snap(min) = Math.round(min / 15) * 15`. Clamped to `[6:00, 23:00]` so blocks can't extend outside the view window.
  - `select-none` on the grid so drag doesn't select text; `cursor-crosshair` on empty column area signals draggability.
- BlockCard now carries `data-block` + `cursor-pointer` (cursor hints at the popover-edit landing in Session 9).

**Design decisions worth remembering:**
- Ref + state split: `dragRef` holds the source-of-truth for the drag geometry across the `pointermove` closure, `dragPreview` state drives the ghost render. This avoids the classic "stale closure captures old state" trap without re-attaching document listeners each render.
- Default title is literally "New block" (not empty), so users can see and click it in the list before the popover editor exists. Category defaults to the first sort_order row (Deep Work for seeded accounts).
- Server-side validation is intentionally thin (auth + valid ISO + min 15-min). The `time_blocks_time_range` CHECK constraint in the DB is the real backstop.
- View window clamping (`DAY_START_HOUR`, `DAY_END_HOUR`) is enforced client-side in `beginDrag`; if we later widen the view, we don't need to worry about existing blocks — they render at their actual time regardless.

**Verified:**
- `npm run build` green. `/today` route grew from 1.85 kB → 2.87 kB with the drag + server-action wiring.

**Next session — Session 9:**
Popover editor. Click an existing block → edit title, pick category, optionally add notes, delete. `updateBlock` + `deleteBlock` server actions. Then Session 10: drag body to move + drag edges to resize.

**Blocked on:** nothing.

---

## 2026-09-20 — Session 8.1 + Session 9: Drag threshold + block editor popover

**Session 8.1 (mini-fix from feedback):**
- Click-drag felt too sensitive — a stray click created a block. Added `DRAG_THRESHOLD_PX = 6`: the pointer must travel 6px vertically before we treat pointerdown as a create-block intent. The ghost preview only appears once armed, and pointerup only submits if armed. Esc mid-drag cancels via a document keydown listener.
- Cleaned up 13 accidental "New block" test rows for Minh's account via SQL.

**Session 9 (Phase 2 — block editor popover):**
- `updateBlock` + `deleteBlock` server actions in `app/(app)/today/actions.ts`. Both auth-check, both filter by `id` only (RLS scopes to the caller), both `revalidatePath("/today")`. `ActionResult` discriminated union: `{ ok: true } | { ok: false; error }` (initial generic version collapsed to `never` at compile time — fixed).
- `components/timetable/BlockPopover.tsx` — portal-rendered dialog (`createPortal` into `document.body`). Fields: title (autofocus), category select (dropdown of user's categories with "— No category —" option), notes textarea. Save / two-step Delete / Cancel. Two-step delete = first click reveals a red "Confirm delete" button, second click actually deletes. Prevents mis-clicks without a modal.
- Positioning: `computePosition(anchor)` places the popover to the right of the clicked block when there's room, else to the left, else clamps into the viewport. `position: fixed`, `z-100`.
- Closing: outside `mousedown` OR Esc → `onClose`. Save/delete success → `onSaved` (parent closes + `router.refresh()`).
- WeekGrid: `BlockCard` now takes an `onOpen(anchor)` prop; onClick calls `e.stopPropagation()` (so the click doesn't leak into the day column's pointerdown-for-drag path) and passes `e.currentTarget.getBoundingClientRect()` as the anchor. Hover state: `hover:brightness-105`.
- `/today` page now selects `notes` too so the editor prefills them.

**Decisions worth remembering:**
- Two-step delete instead of a modal or native `confirm()`. Modals were overkill for a block; `confirm()` looks unprofessional and doesn't theme.
- Portal is important — the popover must escape the WeekGrid's `overflow-hidden` container. Rendered into `document.body` with `z-100`.
- `stopPropagation` on the block click is essential so clicking a block never accidentally starts a drag on the parent column.
- Empty title falls back to "Untitled" on save. The `time_blocks.title` column is NOT NULL with `default ''`; setting it to whitespace-trimmed empty string would be legal but "Untitled" is friendlier.

**Verified:** `npm run build` green. `/today` route 1.85 → 2.87 → **5.06 kB** across Sessions 7-8-9 as the client-side surface grew.

**Next session — Session 10:** drag body to move + drag top/bottom edges to resize. Same 15-min snap. Server action `moveBlock(id, {startsAt, endsAt})` — or extend `updateBlock` to accept optional time fields.

**Blocked on:** nothing.

---

<!-- New entries append below with date + session number -->
