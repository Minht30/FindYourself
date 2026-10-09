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

## 2026-09-20 — Session 10: Drag to move + edge-resize existing blocks

**What landed:**
- `moveBlock` server action in `app/(app)/today/actions.ts` — auth check, ISO validate, 15-min minimum, updates `starts_at` + `ends_at` scoped by id (RLS enforces user), `revalidatePath("/today")`. Kept separate from `updateBlock` (title/category/notes) so time-only edits don't touch content fields.
- `BlockCard` rewritten with pointer-based drag:
  - Zone detection on pointerdown: top 8px = resize-start, bottom 8px = resize-end, middle = move.
  - Same 6-px drag threshold as create-drag — a click that doesn't cross threshold falls through to `onOpen` (popover). So click-to-edit still works even though the card is now a drag surface.
  - Same-day only for now. Cross-day move needs day-column hit-testing during drag — deferring to a small Session 10.5.
  - 15-min snap applied to the delta (not the target), so drag origin is respected. Body-move clamps the whole block inside the view window; edge-resize clamps each edge and enforces a 15-min minimum duration.
  - Optimistic UI: `dragOffset` overrides `baseStartMin/baseEndMin` while dragging + while `moveBlock` is in flight. `useEffect` on `[block.starts_at, block.ends_at]` clears the offset once the RSC refetch delivers the new times — avoids the snap-back flash.
  - Cursor: `cursor-grab` at rest, `cursor-grabbing` while dragging (via `dragOffset` state), `cursor-ns-resize` on the two edge handles. Small blocks (< 24 px = 3 × handle) skip resize handles so top/bottom don't collide with body.
  - Esc mid-drag cancels the visual offset without submitting.
  - `stopPropagation` on the block's pointerdown so the day-column's create-drag doesn't fire at the same time.
- Tip line under the grid updated: create · edit · move · resize · Esc.
- Server-side error surfaced via the parent grid's existing errorMsg banner (BlockCard calls `onError`).

**Decisions worth remembering:**
- The delta approach (snap the pixel delta, add to the original start/end) is more forgiving than snap-the-target — the block moves in exact 15-min increments regardless of where the pointer started inside the block.
- Two server actions (`updateBlock` for content, `moveBlock` for time) beat one big action with optional fields — clearer intent, smaller payload, easier to reason about which fields the DB touches.
- Edge handles are just 8-px absolute divs overlaid on the block; cursor styling per handle. Handler stays on the parent card and uses `e.currentTarget.getBoundingClientRect()` for zone math — no separate handlers, no re-composition on resize.
- Cross-day move deferred: it needs `document.elementFromPoint` (or a pointer-over check against each day-column ref) during pointermove to pick the new day, plus rendering the block outside its parent day column. Worthwhile but distinct scope.

**Verified:** `npm run build` green. `/today` route 5.06 → **5.59 kB**.

**Next session — Session 11:** "Copy yesterday" button. Server action `copyYesterday()` selects all of yesterday's blocks for the user, inserts clones shifted +24h. Placed at the top-right of the grid header. Then Phase 2 is complete and we move to Phase 3 — Diary.

**Blocked on:** nothing.

---

## 2026-09-20 — Session 11: Paw button + Phase 3 schema lands

**Design touches:**
- Sidebar `+ Create` swapped to a **paw-print icon** (`PawPrint` from lucide-react — no new deps). Minh found the plus sign hard to aim at and asked for something cute. Added a small `group-hover:rotate-[-8deg]` micro-tilt so the paw prints its way when you hover the button.

**Phase 3 schema (Diary):**
- `20260920215755_phase3_diary_entries.sql` — table + RLS + updated_at trigger.
  - `mood` uses a Postgres enum `diary_mood` with the six values from `docs/DESIGN_SYSTEM.md` (radiant / calm / focused / tired / low / stormy).
  - `content_json` (jsonb, default `'{}'`) holds the Tiptap document; `content_text` (text, default `''`) mirrors the plaintext extract for search + heatmap intensity.
  - `unique (user_id, entry_date)` enforces one row per user per day — writes will use upsert with `on_conflict: 'user_id,entry_date'`.
  - Index `(user_id, entry_date desc)` for fast day-nav queries and heatmap ranges.
  - RLS `auth.uid() = user_id` for both select and modify.
- `20260920215806_phase3_diary_touch_search_path.sql` — recreates the `touch_diary_entries_updated_at` function with `set search_path = public` to clear advisor 0011 (mutable search_path). All migrations mirrored under `supabase/migrations/`.

**Advisors:** clean except the standing `auth_leaked_password_protection` warning (dashboard toggle, not blocking).

**Deferred (parked, do not forget):**
- **Copy Yesterday** — last Phase 2 box. A `copyYesterday()` server action that clones yesterday's blocks shifted +24h, wired to a button on the /today header. Small — pick up when Minh flags it.
- **Mini-month calendar in sidebar** — was in the v10 mockup with autumn decorations. Split into two pieces: (a) the *functional* mini-month day-picker that navigates the week view — deferrable to a Phase-2 cleanup session; (b) the *decorated* version (leaves + latte + pumpkin + gourd + wheat + berries + acorns bands) — belongs squarely in Phase 9 with the rest of the design polish.

**Next session — Session 12:**
Wire `/diary/[date]` route. Server component reads `?date=YYYY-MM-DD` (default today), fetches the entry (may be null), renders shell with day nav ← / → arrows. Editor + mood + autosave land in Session 13.

**Blocked on:** nothing.

---

## 2026-09-20 — Session 11.1: Copy Yesterday — Phase 2 complete

Minh clarified he wanted Phase 2 wrapped before jumping into Phase 3, so this session backfills the last unchecked box before the fresh chat for Phase 3.

**What landed:**
- `copyDayBlocks(input: CopyDayInput)` server action in `app/(app)/today/actions.ts`. Signature is generic (source date range + offsetMs) rather than hard-coded to "yesterday → today" so it can be reused later for "copy last Monday", "copy this to next week", etc.
  - Reads with `.gte("starts_at", sourceStart).lt("starts_at", sourceEnd)` — half-open range keeps the endpoints from double-counting.
  - Clones preserve `title`, `notes`, `category_id`; shifts both `starts_at` and `ends_at` by the offset.
  - Bulk insert in one `.insert(clones).select("id")` — one round-trip regardless of how many blocks yesterday held.
  - Returns `{ ok: true, count }` or `{ ok: false, error }`.
- `components/timetable/CopyYesterdayButton.tsx` — client component. Computes yesterday's local day-range using `new Date(y, m, d - 1)` (respects user's tz), sends a fixed `86_400_000 ms` offset. DST-transition days will be off by 1 h; acceptable for MVP, noted for later.
  - Status button copy cycles: `Copy yesterday` → `Copying…` → `Copied N` (or `Nothing yesterday` if the source day was empty) → resets after 3 s.
  - On error: label flips to `Failed — retry`, title attr surfaces the actual message on hover.
- Placed in the `/today` header nav row, left of the Prev/This week/Next pills, styled with the same accent-tinted pill look for consistency.

**Design decisions worth remembering:**
- Client sends fully-resolved instants + offset. Alternative (send date-only strings and let server compute in user's tz) requires the server to know the tz from the profile — cheap in principle, but ties every server action to a tz lookup. Client-computed instants keep the action pure.
- Copy Yesterday ADDS to today; it does not replace existing blocks. If the user already has meetings on today, cloning yesterday's blocks piles on top. That's the expected behavior — deletion is one click on the block editor.
- No dedup / overlap check. Users can create overlapping blocks by design (a "Deep Work" block behind a "Meetings" block is realistic scheduling). Copy Yesterday preserves that.

**Verified:** `npm run build` green. `/today` route 5.59 → 6.09 kB.

**Phase 2 complete.** Fresh chat for Phase 3 — session should read this file + `docs/ROADMAP.md` (schema already done: `[x] diary_entries table + RLS`), then start with the `/diary/[date]` shell + day nav.

---

## 2026-09-21 — Session 11.2: Paw moved to drag ghost + TopBar arrows wired

**Minh clarified two things at once:**
1. The paw belonged in the *drag-to-create* moment (the ghost you draw with), not the sidebar. Restore the sidebar Create button to a plain `+`, put a PawPrint icon in the ghost.
2. The `< >` arrows in the TopBar were placeholder pills that did nothing on click.

**What landed:**
- **Sidebar** — reverted `PawPrint` to `Plus` in the Create button; button geometry back to the original `w-5 h-5` yellow disk with a bold `+`.
- **WeekGrid drag ghost** — inline `<PawPrint size={11}>` next to the time-range label inside a rounded pill on the ghost. Added a `shadow-[0_0_0_4px_var(--accent-soft)]` outer glow so the ghost reads as "here's where the block will land" rather than a plain dashed rectangle.
- **TopBar arrows** — `< >` now use `useRouter` + `usePathname` + `useSearchParams` to compute `?week=` deltas. `Today` button navigates to `/today` (drops any `?week=`). Because `useSearchParams` triggers dynamic rendering, TopBar is wrapped in `<Suspense>` inside `app/(app)/layout.tsx` — `/chill`, `/diary`, `/focus` stay statically rendered.
- The chevrons remain functional-shaped even on non-timetable routes; they push to `/today?week=...` for now, so a user isn't stuck with inert controls before diary/focus have their own prev/next.

**Design skill scope note:** `/design-taste-frontend` explicitly excludes dense product UI (Section 13). Applied only its universal quality rules (color/shape consistency, motion motivated, em-dash ban) to this product surface. Full landing-page polish deferred to Phase 9 as before.

**Verified:** `npm run build` green. `/today` route 6.09 → **6.62 kB**.

**Still deferred:** cross-day drag-move, functional mini-month day-picker in the sidebar.

---

## 2026-09-29 — Session 12: `/diary/[date]` shell + day nav (Phase 3 begins)

**What landed:**
- `app/(app)/diary/page.tsx` — now just `redirect("/diary/<today>")`. `force-dynamic` because "today" depends on the clock and the request's timezone cookie.
- `app/(app)/diary/[date]/page.tsx` — async server component.
  - Validates `params.date` strictly (`isValidISODate`: shape + round-trip, so `2026-02-31` is rejected rather than rolling into March). Invalid → redirect to `/diary`.
  - Fetches `id, entry_date, mood, content_text, updated_at` with `.eq("user_id", user.id).eq("entry_date", date).maybeSingle()`. RLS already scopes by user; the explicit `user_id` filter matches the `(user_id, entry_date)` unique index and documents intent.
  - Header: `Diary` + long date (`Tuesday, September 29, 2026`) + Prev / Today / Next pills (same pill style as the timetable header). `Today` renders as an inert pill with `aria-current="date"` when you're on today; `Next` is disabled at today (no writing ahead).
  - Body card: existing entry → mood chip + `content_text` with `whitespace-pre-wrap` + "Last edited" in the user's tz. No entry → `EmptyDay` with three variants (today / past / future). Query error → quiet `role="alert"` line.
- **TopBar arrows** now step ±1 day on `/diary/*` (and `Today` goes to `/diary`), ±1 week on `/today`, as the Session 11.2 comment anticipated. `aria-label`s read "Previous day" / "Next day" on the diary.
- **Timezone plumbing** — new `lib/today.ts` (`getUserTimeZone`, `getUserToday`). The root layout's head gets a second tiny inline script that writes `Intl.DateTimeFormat().resolvedOptions().timeZone` into a `fy-tz` cookie (1 year, `samesite=lax`). Server reads it, validates it against `Intl` (the cookie is user-controlled), falls back to UTC.
- `lib/dates.ts` gains date-string helpers: `isValidISODate`, `shiftISODate`, `todayInTimeZone`, `formatLongDate`. All arithmetic is done in UTC on `YYYY-MM-DD` strings, so there are no DST gaps.

**Decisions worth remembering:**
- **Diary days are strings, not instants.** `entry_date` is a Postgres `date`; keeping it as `YYYY-MM-DD` end-to-end avoids the classic "server in UTC, user in Toronto, entry lands on the wrong day" bug. `YYYY-MM-DD` also compares correctly as a plain string (`date > today`).
- **Cookie over `profiles.timezone`.** The profile column exists but defaults to `'UTC'` and nothing sets it yet. The cookie tracks the device you're actually on (travel just works). If a settings page ever lets users pin a zone, the resolution order becomes profile → cookie → UTC.
- The very first request, before the cookie exists, resolves "today" in UTC. It's one request at most, and the next navigation corrects it.
- `Link` (client nav) for the day pills rather than `<a>` like `/today` uses. Day-stepping is a rapid, repeated action, and a soft navigation keeps the shell mounted.
- Future dates render (with a "hasn't happened yet" empty state) instead of redirecting: a bookmarked or typed URL shouldn't bounce.

**Verified:** `npm run typecheck` + `npm run build` green. `/diary` → ƒ 146 B, `/diary/[date]` → ƒ 186 B. Date helpers exercised in Node (invalid Feb 31, leap day, year/month rollovers, `Asia/Ho_Chi_Minh` vs `America/Los_Angeles` across UTC midnight, bogus zone → UTC). In the browser pane, unauthenticated `/diary` → `/login?next=/diary` and the `fy-tz` cookie is set (`America/Toronto`). The authenticated render was **not** eyeballed this session (no signed-in session in the preview pane). Check `/diary` on prod after deploy.

**Next session — Session 13:** Tiptap editor + autosave (3 s debounce). Upsert `diary_entries` via server action with `onConflict: "user_id,entry_date"`, writing both `content_json` and the `content_text` extract. Replace the plaintext render in `[date]/page.tsx` with the editor, seeded from `content_json`.

**Blocked on:** nothing. (Side note: the Supabase MCP returned an empty project this session. Re-checked in Session 13: it was a stale connection; the MCP points at the right project.)

---

## 2026-09-29 — Session 13: Tiptap editor + 3 s autosave

**What landed:**
- Deps: `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extensions` (all `^3.31.3`, React 18 peer OK).
- `app/(app)/diary/actions.ts`: `saveDiaryEntry({ date, contentJson, contentText })`.
  - Auth check; strict date; refuses future dates (against the `fy-tz` today); `contentJson` must be a Tiptap `doc`; 512 KB JSON cap; `content_text` sliced to 100k chars.
  - `upsert(..., { onConflict: "user_id,entry_date" })` lists only `user_id, entry_date, content_json, content_text`, so a mood written by the upcoming picker is never clobbered by an autosave.
  - Returns `updated_at` for the "Saved 9:41 PM" label; `revalidatePath("/diary/<date>")`.
- `components/diary/DiaryEditor.tsx` (client):
  - `useEditor` with `immediatelyRender: false` (SSR-safe in Next 14) and `shouldRerenderOnTransaction: false` (no React re-render per keystroke). StarterKit with headings limited to h2/h3 (the page owns h1), Placeholder varies by today vs. past.
  - Autosave: `onUpdate` marks dirty + restarts a 3 s timer. `flush()` **snapshots the doc synchronously**, then appends the request to a promise chain so saves land strictly in order. A version counter means only the newest save may announce "Saved".
  - Flush triggers: debounce, unmount (stepping to another day / leaving the route), `visibilitychange → hidden`, Ctrl/Cmd+S. `beforeunload` shows the browser's leave prompt only while there are unsaved words.
  - Status line (`aria-live="polite"`): Unsaved changes / Saving… / Saved h:mm / Last saved h:mm / Couldn't save + Retry. Footer hints the markdown shortcuts (`#`, `-`, `>`).
  - Placeholder `div` of the same min-height renders until the editor mounts, so the card doesn't jump.
- `app/(app)/diary/[date]/page.tsx`: now also selects `content_json`; today + past days render the editor keyed by `date`; future days keep the empty state (now `FutureDay`). `toEditorContent` lifts plaintext into paragraphs if a row has text but no doc.
- `app/globals.css`: `.diary-prose` scale (Lora body, h2/h3, lists, quote with accent rule, code, hr, placeholder), all from theme tokens, so Sunny Cafe and Netcafe both work.

**Decisions worth remembering:**
- **Snapshot-then-chain beats "skip if in flight".** Dropping a save while one is in flight loses the unmount flush (the component is gone by the time the first request returns). Snapshotting synchronously and chaining means every flush gets written, in order, even after unmount.
- **`revalidatePath` is load-bearing, not cosmetic.** Next 14 keeps dynamic pages in the client router cache for 30 s. Without the purge, Prev → Next within 30 s would seed the editor with the pre-edit doc, and the next autosave would overwrite newer words with older ones. Cost: one RSC re-render per save, which is fine at a 3 s debounce. The editor ignores the refreshed `initialContent` prop (content is only read at creation), so the cursor never jumps.
- No toolbar yet: markdown input rules cover headings/lists/quotes. A bubble menu can come with Phase 9 polish if needed.
- A row is only created on the first edit. Opening a day never writes, so the heatmap won't count visited-but-empty days.
- **Bundle:** `/diary/[date]` went 186 B → **129 kB** (ProseMirror). Noted for the Phase 9 Lighthouse pass. `next/dynamic` code-splitting of the editor is the first lever.

**Verified:**
- `npm run typecheck` + `npm run build` green.
- Editor mounted on a throwaway unprotected route in the preview pane (deleted before commit):
  - typing works; `## ` + space becomes `<h2>` (Lora, 23.2px); clearing the doc shows the placeholder via `::before`.
  - The status goes Unsaved changes → (3 s) → Couldn't save + Retry (expected: no session → `unauthenticated`). Ctrl+S flushes immediately.
  - No console or server errors.
- Upsert semantics checked in Supabase as the `authenticated` role with the real user's JWT claims, inside `begin … rollback`: two upserts on the same `(user_id, entry_date)` produce 1 row, a mood set in between survives, and `updated_at` is touched. Rolled back; `diary_entries` still has 0 rows.
- **Not eyeballed:** the signed-in `/diary/<date>` page itself. First real entry on prod is the acceptance test.

**Next session — Session 14:** mood picker. Six moods from the enum as a pill row above the editor; `setDiaryMood(date, mood | null)` server action upserting **only** `mood` (so it composes with autosave). Click the active mood again to clear it.

**Blocked on:** nothing.

---

## 2026-09-29 — Session 14: Mood picker

**What landed:**
- `lib/moods.ts`: `MOODS` (value / emoji / label), `DiaryMood` type, `isDiaryMood` guard. Values checked against the live `diary_mood` enum (`radiant, calm, focused, tired, low, stormy`, exact match). Emoji set leans on weather to fit the cafe feel: 🌞 🍃 🎯 😴 🌧️ ⛈️.
- `setDiaryMood(date, mood | null)` in `app/(app)/diary/actions.ts`. Same guards as `saveDiaryEntry` (auth, strict date, no future) plus enum validation.
  - Setting a mood upserts **only** `mood`.
  - Clearing uses a plain `update … set mood = null`, so clearing on a day with no row writes nothing instead of creating an empty entry.
- `components/diary/MoodPicker.tsx`: six toggle pills (`aria-pressed`, `role="group"` labelled "Mood"). The emoji is `aria-hidden`, so screen readers announce just "Stormy, toggle button, pressed".
  - Click to set; click the active one again to clear. Optimistic.
  - Requests go through the same serialized promise chain as the editor, and on failure the UI rolls back to the last server-confirmed mood with a `role="alert"` line. Only the newest click controls post-failure UI.
  - Active pill: `bg-accent-soft` + accent border + `shadow-glow`, emoji nudged to `scale-110`.
- `/diary/[date]`: the static mood chip is replaced by `<MoodPicker key={date}>` above the editor. Future days still show neither.

**Decisions worth remembering:**
- **Mood and content are independent writes.** Two actions that each upsert only their own columns compose freely. No race between a mood click and an in-flight autosave can clobber the other field. Verified in SQL (below).
- Toggle buttons over a radiogroup: a radiogroup can't be "cleared" by re-selecting, and "no mood" is a legitimate state. Six tab stops is fine for six options.
- Dropped `cn()` from the picker: it pulled `tailwind-merge` (~6 kB) into a route that didn't otherwise need it. Plain template literals are enough when no classes conflict. `/diary/[date]` 129 → **130 kB**.

**Verified:**
- `npm run typecheck` + `npm run build` green.
- Supabase, as the `authenticated` role with the real user's claims inside `begin … rollback`: a mood-only upsert on an empty day creates the row; a following content upsert keeps the mood (`focused / words`); clear-on-missing-day touches nothing. Rolled back.
- **Prod autosave confirmed working:** Minh's first real entry exists for 2026-09-29 (created 19:12 UTC, autosaved again 22 s later). Content not read.
- Picker on a throwaway route: initial `Calm` pressed. Clicking `Stormy` lit it immediately (optimistic), then it rolled back to `Calm` with the alert (no session there). No console errors. Route deleted before commit.
- Gotcha logged: running `next dev` right after `next build` without clearing `.next` produced `Failed to find Server Action` in dev. That was stale manifests, not a code bug; `rm -rf .next` fixed it.

**Next session — Session 15:** anchored prompts: a few gentle prompt chips ("One small win", "What drained me", "Tomorrow I'll…") that insert a heading + empty paragraph at the cursor in the editor. Client-only; no schema change.

**Blocked on:** nothing.

---

## 2026-09-29 — Session 15: Anchored prompts

**Spec correction first:** Session 14's "next" note suggested new prompts ("One small win", "What drained me"…). The PRD (§6.3) and US-3.1 already pin them down: **two anchored prompts, always visible above the editor — "What am I thinking today?" and "What am I trying to do?" — click inserts a heading at the cursor.** Built to spec.

**What landed:**
- `components/diary/PromptChips.tsx` (the `PromptChip` from DESIGN_SYSTEM §components). `DIARY_PROMPTS` constant, rendered inside `DiaryEditor` above a dashed divider, so the prompts share the editor instance without lifting state.
  - Typography per DESIGN_SYSTEM type scale: "diary prompt" = **2xl / 1.75rem**, Lora italic, -0.01em tracking. Hover/focus draws an accent underline; a small mono hint reads `+ add` or `↓ jump`.
  - **Click inserts** `h2(prompt) + empty paragraph` at the cursor via `insertContent`, so the caret lands ready to write under the heading.
  - **Already present → jump, not duplicate.** `findSection` scans top-level nodes for an exact-text heading and returns its span (to the next heading or doc end); clicking moves the caret to the end of that section with `TextSelection.near(…, -1)` and scrolls it into view. The `aria-label` flips between `Insert heading: …` and `Jump to: …`.
  - `useEditorState` with a selector that returns a small `"true,false"` string, so the prompt row re-renders only when a prompt heading appears or disappears, not per keystroke (the editor itself runs with `shouldRerenderOnTransaction: false`).
- No schema change, no new server action: the headings are just content and ride the existing autosave.

**Bug caught in verification (and the fix worth remembering):**
- First pass: after clicking a prompt, the next keystrokes landed at the **old** caret (end of the first paragraph), and the second prompt inserted *above* the first. Cause: mousedown on the button blurs the editor; Tiptap's `focus()` restores DOM focus in a `requestAnimationFrame`, so input in that window goes to the stale DOM caret.
- Fix: `onMouseDown={e => e.preventDefault()}` on the prompt buttons. The editor never loses focus on click, and keyboard activation (Tab → Enter) still goes through `onClick`. This is the standard toolbar-button pattern and should be reused for any future editor toolbar/bubble menu.

**Verified (throwaway route in the preview pane, deleted before commit):**
- Both prompts render enabled, labelled `Insert heading: …`.
- Type → click prompt 1 → type → click prompt 2 → type → click prompt 1 again → type produced `<p>Morning words</p><h2>What am I thinking today?</h2><p>thinking stuff (jumped)</p><h2>What am I trying to do?</h2><p>doing stuff</p>`: correct order, no duplicate, the jump landed at the end of the right section, and the editor kept focus throughout. Labels flipped to `Jump to: …`.
- Keyboard: focus the prompt button → Enter → typing lands at the end of its section.
- No console or server errors. `npm run typecheck` + `npm run build` green.

**Next session — Session 16:** heatmap of past entries: last-N-weeks grid (GitHub-style) on `/diary`, intensity from `length(content_text)`, mood tint on hover, click a cell to jump to `/diary/<date>` (US-3.2). One range query on the `(user_id, entry_date desc)` index. Last box of Phase 3.

**Blocked on:** nothing.

---

## 2026-09-29 — Session 16: Entry heatmap (Phase 3 boxes complete)

**Minh's layout direction (recorded before building):** a big part of the page can be decoration, maybe pixel animation, but **keep it blank for now** so we can brainstorm it properly later. So the heatmap lives *in the diary column* (under the editor card, same `max-w-3xl`), and the wide area to the right stays empty. Added a "Decoration zones brainstorm" box to Phase 9.

**What landed:**
- Migration `20260929193449_phase3_diary_content_chars.sql` (applied via MCP + mirrored): `content_chars integer generated always as (char_length(content_text)) stored`. The heatmap needs length, not text; a generated column keeps it in sync with zero app code and is selectable through PostgREST, so a year of data is ~365 tiny rows instead of a year of diary text. Advisors: unchanged (only the standing leaked-password toggle).
- `/diary/[date]` now runs two queries in parallel: the day's entry, plus `entry_date, mood, content_chars` for the 53-week window (`yearStart` = this week's Monday − 52 weeks, up to today in the user's tz). It re-renders after each autosave (`revalidatePath`), so today's cell deepens as you write.
- `components/diary/EntryHeatmap.tsx` (client):
  - GitHub-style grid, **Monday-first** like the timetable, 53 × 7, future cells in the current week left blank.
  - Intensity by length: 0 / <200 / <600 / <1500 / 1500+ chars. Colors via `color-mix(var(--accent) N%, var(--bg-alt))` (Tailwind opacity modifiers don't work on plain-var tokens), top step `--heat-max`, a new per-theme token: honey-brown in Sunny, bright neon `accent-soft` in Netcafe ("more" should glow at night; with `accent-strong` levels 3 and 4 were indistinguishable there).
  - Each cell is a `Link` to `/diary/<date>` (`prefetch={false}`: 366 viewport prefetches would be absurd) with `aria-label`/`title` like "Monday, September 28, 2026: 🎯 Focused, about 75 words". Mood is conveyed in text, not color.
  - **ARIA grid with a roving tab stop:** one tabbable cell (the open day), ↑/↓ = ±1 day, ←/→ = ±1 week, clamped to the window; Enter follows the link. Rows are real flex rows (`display: contents` rows can vanish from the a11y tree).
  - Month labels: a label wherever a month starts; the partial first month's label is dropped if the next month begins within 3 columns (they collided in the first render).
  - Header "Your year in pages" + "N days written in the last 12 months" (mood-only days don't count) + Less → More legend.
  - Scrolls horizontally inside its card on narrow screens (starts scrolled to the recent end); the page itself never scrolls sideways. On desktop the 717 px grid fits the 718 px card interior.

**Verified (throwaway route, deleted):** 7 rows × 53 cells, 366 links from Mon 2025-09-29; single tab stop on the selected day; arrows ↑ → 09-27, → into the future blocked, ← → 09-20, ↓ → 09-21; labels/intensities as expected; month row "Oct … Sep" with no collision; `--heat-max` resolves #B87700 / #FFF08A per theme (verified with transitions disabled: the hidden preview pane freezes CSS transitions, so a mid-fade read looked like a bug but wasn't). No console or server errors from the page. `typecheck` + `lint` + `build` green; `/diary/[date]` 132 → **134 kB**. (One build failed with `next/font … reading '1'`: a transient Google Fonts download failure. `curl` showed the CSS reachable a minute later and the rebuild passed. If it recurs on Vercel, self-host the fonts.)

**Phase 3 status:** every box is built. Exit criterion ("author writes 3 diary entries in a row") is Minh's to hit, and the hotfix (15.1) is what makes it possible.

**Next — Phase 4 (Tasks + Restrictions), Session 17:** `tasks` table + RLS (bucket enum today/tomorrow/backlog, `done_at`, `restricted` flag, sort order). Read PRD §6.4 and §6.6 and the ERD first.

**Blocked on:** nothing.

---

## 2026-09-29 — Session 17: `tasks` table + RLS (Phase 4 begins)

**Migrations** (applied via MCP, mirrored with matching versions):
- `20260929233739_phase4_tasks.sql`: `task_priority` enum, `tasks` table, 4 indexes, RLS, `touch_tasks_updated_at` trigger (pinned `search_path`), plus **`time_blocks.linked_task_id`** (FK on delete set null + partial index), as the Phase 2 migration promised.
- `20260929233847_phase4_tasks_split_policies.sql`: replaced the `for all` modify policy with separate insert / update / delete policies.

**Design decision: buckets are derived from a date, not stored (deviates from ERD; ERD updated).**
- The ERD had `bucket enum(today, tomorrow, backlog, done)`. Two problems:
  1. A stored "tomorrow" is wrong the moment midnight passes. Something would have to rewrite every row daily.
  2. `done` as a bucket loses where the task came from, but US-4.3 says unchecking returns it *to its bucket*.
- Instead: `scheduled_for date` (null = Backlog; = today → Today; = today+1 → Tomorrow; < today and open → overdue, which is exactly the population the end-of-day roll, US-4.4, needs) and `completed_at` (done is a *state*). Tomorrow becomes Today on its own at the user's midnight, since "today" comes from the `fy-tz` cookie like the diary does.
- The board UI stays Today / Tomorrow / Backlog exactly as the PRD describes; only storage changed.

**Other decisions:**
- `sort_order double precision`: fractional indexing. A drop between neighbours writes `(a+b)/2`, so one row changes per reorder. Floats allow ~50 successive halvings at one spot before precision runs out; the board session should renormalize a bucket when a gap drops below ~1e-9.
- `priority` default `med`; `description` default `''` (NOT NULL, avoids null/empty ambiguity); title 1–200 chars after trim, description ≤ 5000 (check constraints, so bad input fails in the DB, not just the UI).
- **RLS hardening beyond the older tables:**
  - `(select auth.uid())` so the uid is evaluated once per statement (advisor 0003).
  - Per-command policies so SELECT has exactly one policy (advisor 0006).
  - Insert/update `with check` also requires `category_id` to be null or **the caller's own category**. The FK alone would accept another user's category id.
- Partial indexes match the three hot queries: open tasks by bucket + order, completed-by-time ("Done today", streaks, weekly wins), and "any open restricted task" (header chip, US-4.5).

**Verified (Supabase, `begin … rollback`, as `authenticated` with real JWT claims, plus a throwaway second `auth.users` row, which the signup trigger seeded with 5 categories):**
- Insert plain ✓. Insert with own category ✓. Foreign category rejected `42501` on insert *and* on update. Inserting for / reassigning to another user rejected `42501`. Blank title rejected `23514`.
- Second user sees 0 of the first user's tasks; their blanket `update` / `delete` affected nothing (title still `mine`).
- Own update / delete work. Deleting a task nulls `time_blocks.linked_task_id`.
- `updated_at` trigger: back-dated row → update → `updated_at = now()`. My first check compared two `now()`s inside one transaction, which are always equal, so that was a test bug, not a trigger bug.
- Advisors: `tasks` clean for 0003 and 0006. Security advisors unchanged (standing leaked-password toggle only). Everything rolled back; no test rows remain.

**Spun off (not this box):** the older tables (`profiles`, `categories`, `time_blocks`, `diary_entries`) still trigger advisors 0003 / 0006, and `time_blocks.category_id` lacks an index. Queued as a separate task ("Harden RLS policies on pre-Phase-4 tables").

**Next session — Session 18:** three-bucket board (Today / Tomorrow / Backlog). `/tasks` route, or a right-side drawer per PRD §5 ("Tasks live in a right-side drawer"); decide at the start of the session. Server-side bucket derivation from `scheduled_for` + user today, "+ Add task" per bucket (US-4.1), checkbox complete with a "Done today" section (US-4.3). Drag-and-drop (dnd-kit) is the box after.

**Blocked on:** nothing.

---

## 2026-09-29 — Session 18: Three-bucket task board (drawer on the Timetable)

**Placement decision:** PRD §6.0 says *"Tasks live in a right-side drawer"* on the Timetable. So there's no `/tasks` route: the board is an `<aside>` beside the week grid.
- On `lg+` it is 340 px, sticky under the TopBar, and scrolls on its own. Below `lg` it stacks under the grid (no overlay or focus-trap machinery needed).
- Open/closed is a `fy-tasks-drawer` cookie, read server-side, so the first paint is right (no flash). The default is open, and the cookie remembers a user who closed it.
- A small client context (`TasksShell`) lets the header toggle and the drawer share state while the page stays a server component.

**What landed:**
- `lib/tasks.ts`: `Bucket` type, labels, `TaskDTO`, `TASK_COLUMNS`, `bucketOf(scheduled_for, today)`, `scheduledForBucket` (its inverse, for writes), `isOverdue`. This is the single place the date → bucket rule lives.
  - Overdue tasks (dated before today, still open) show under **Today**, first, flagged "Overdue · Sep 27", until the end-of-day roll box re-homes them.
  - Tasks dated after tomorrow group under Tomorrow with their date (the UI never creates them; this is defensive).
- `app/(app)/today/task-actions.ts`:
  - `createTask(bucket, title)`: the client sends a *bucket*; the server converts it to a date with `getUserToday()`, so a tab left open across midnight can't misfile. Trims and validates the title (1–200). Appends at `max(sort_order) + 1` within the bucket.
  - `deleteTask(id)`.
  - Both `revalidatePath("/today")`.
- `components/tasks/TaskBoard.tsx`:
  - Three `<section aria-labelledby>` buckets with counts.
  - Cards show the title plus a meta row: overdue, later date, `↑ High` / `Low` (med is the quiet default), and category dot + name via the shared color helper.
  - **Quick-add:** "+ Add task" → input (Enter adds and stays open for rapid entry, Esc closes). An optimistic "Adding…" row shows while the request runs. Errors show a specific reason and put the typed title back.
  - Two-step delete ("Delete?"), reset on blur or mouse-leave. Same pattern as timetable blocks.
- `/today` fetches open tasks in the same `Promise.all` as categories + blocks. The header gains a **Tasks** toggle with the open count.
- `lib/categories.ts`: the category name → theme-token map moved out of `WeekGrid` so blocks and tasks share one source.

**App-wide bug found and fixed along the way: Tailwind opacity modifiers were silently dead.**
- Theme colors are `var(--x)` strings, so Tailwind can't add alpha. **Every** `border-accent/60`, `bg-accent-soft/40`, `ring-accent/70`, etc. (21 usages: timetable and diary nav pills, mood pills, the drag ring on blocks…) compiled to *no CSS at all*. Confirmed by grepping the built stylesheet.
- Fix in `tailwind.config.ts`: a `tone()` helper defines every color as `color-mix(in srgb, var(--x) calc(<alpha-value> * 100%), transparent)`. Tailwind 3.4 fills `<alpha-value>` (1 when there's no modifier, so plain `bg-accent` is unchanged), and each `/NN` now emits real CSS. The pills finally get the soft accent borders they were designed with.

**Accessibility:**
- "High" priority uses `ink-secondary` bold + ↑ rather than `--warning` (#C88A2A is ~2.9:1 on white, failing AA for small text).
- The "Delete?" pill uses `--bg-base` text on `--danger`: white failed in Netcafe (1.9:1 on #FCA5A5); now 4.70:1 in Sunny and 10.08:1 in Netcafe.
- Toggle has `aria-expanded` + `aria-controls` (only while the drawer exists). Delete buttons have per-task labels ("Delete task: …" / "Confirm delete: …"). The add input is labelled per bucket.

**Verified (throwaway route with sample tasks; deleted before commit):**
- Bucketing: Today = [overdue (Sep 27, first), high-priority + Deep Work]; Tomorrow = [tomorrow Low, "Oct 3"]; Backlog = [undated].
- Toggle closes/opens the drawer and writes `fy-tasks-drawer=0/1`.
- Add: "Adding…" appeared, the POST was sent, and the server's answer was surfaced as **"You're signed out. Sign in again to add tasks."** (the expected `unauthenticated`, asserted per the Session 15.1 lesson). Title restored, focus kept.
- Delete step 1 → "Delete?" with a confirm label.
- 1440 px: drawer 340 px, sticky, beside the grid; 800 px: stacked. Netcafe screenshot checked.
- The compiled CSS now contains `.border-accent\/60{border-color:color-mix(...)}` and friends.
- No console errors. `typecheck` + `lint` + `build` green. `/today` 6.72 → **9.17 kB**.
- DB side of create/delete is the RLS already proven in Session 17 (insert own row, delete own row).

**Not yet (next boxes):** drag between buckets (dnd-kit), checkbox → "Done today", editing fields (description / priority / deadline / category / restriction). The restriction badge + header chip is its own box.

**Next session — Session 19:** dnd-kit drag between buckets + reorder within a bucket, using fractional `sort_order` (`(a+b)/2`, renormalize if the gap < 1e-9) and a `moveTask(id, bucket, sortOrder)` action.

**Blocked on:** nothing.

---

## 2026-10-04 — Session 18.1: RLS hardening on the pre-Phase-4 tables

Closes the task spun off in Session 17. The older tables now use the same policy shape as `tasks`.

**Migration** `20261004044827_harden_rls_pre_phase4_tables.sql` (applied via MCP, mirrored with the matching version):
- **Advisor 0003 (`auth_rls_initplan`):** every policy on `profiles`, `categories`, `time_blocks`, `diary_entries` now uses `(select auth.uid())`. The existing select policies (and `profiles`' update policy) were changed with `alter policy`, so names stay stable.
- **Advisor 0006 (`multiple_permissive_policies`):** the `for all` "modify" policy on `categories`, `time_blocks`, `diary_entries` is replaced by separate insert / update / delete policies, so SELECT is governed by one policy. `profiles` keeps select + update only, since inserts come from the signup trigger.
- **Advisor 0001 (`unindexed_foreign_keys`):** `time_blocks_category_idx` on `time_blocks(category_id)`. Deleting a category (`on delete set null`) no longer scans every block.
- **Ownership checks on `time_blocks` insert/update `with check`:** `category_id` must be null or the caller's own category (same rule as `tasks`). I also gave **`linked_task_id`** the same treatment (null or the caller's own task), because it has the identical hole: the FK alone accepts another user's task id. Pre-check: 0 existing blocks pointed at a foreign category or task, so no current row becomes un-updatable.

**Verified** with one `DO` block that ends in a deliberate `raise exception` carrying the results, so everything rolls back, including the throwaway `auth.users` row. It ran as `authenticated` with `request.jwt.claims` set via `set_config`. User A = the real account, user B = a throwaway (the signup trigger seeded its 5 categories). **36/36 PASS:**
- A sees exactly their own rows (5 categories, 11 blocks, 1 diary entry, 1 profile). A can insert / update / delete their own category, block (with own category + own linked task) and diary entry, and can update their own profile.
- A's block with B's category, or linked to B's task, is rejected `42501` on insert **and** update. Inserting a block for B, or reassigning one to B, is rejected `42501`.
- B sees 0 of A's categories / blocks / diary / profile. B's updates and deletes against A's rows affect 0 rows (including a blanket `update time_blocks`). B inserting a category or diary entry for A, or using A's category on B's own block, is rejected `42501`.
- Afterwards, as `postgres`: A's counts are unchanged and no `pwn` values exist anywhere. A separate query after the block confirmed no leftovers (0 throwaway users, 0 test rows, profile name untouched).

**Advisors after:**
- Performance: 0003, 0006 and 0001 are all gone. The only thing left is `unused_index` (INFO) on 5 indexes, including the new one. That's expected at 11 rows, where the planner prefers a sequential scan. Revisit once there's real data.
- Security: unchanged (standing leaked-password dashboard toggle only).

**Blocked on:** nothing. Session 19 (dnd-kit) is still next.

---

## 2026-10-04 — Session 19: Drag tasks between buckets (dnd-kit)

**Prod check first:** `tasks` is still empty and the diary entry is unchanged since 2026-09-29 19:12 UTC, so the Session 15.1 diary hotfix and the Session 18 board haven't been exercised on prod yet. Flagged to Minh again.

**What landed:**
- Deps: `@dnd-kit/core ^6.3.1`, `@dnd-kit/sortable ^10.0.0`, `@dnd-kit/utilities ^3.2.2`.
- `moveTask(id, bucket, prevId, nextId)` in `app/(app)/today/task-actions.ts`:
  - The client sends **neighbour ids, not sort values**. The server reads their current `sort_order` and places the task at `(prev+next)/2`, `prev+1`, `next−1`, or `1`. A stale tab therefore can't write positions computed from old numbers.
  - Neighbours whose `scheduled_for` differs from the target day are ignored, for the same reason.
  - If the gap between neighbours is < `1e-9` (≈50 halvings in one spot), the target bucket is renumbered 1..N first, then the midpoint is recomputed.
  - **Dropping re-dates the task to the bucket's day.** Dragging is an explicit re-home, so an overdue task dragged within Today becomes today's (and loses the Overdue flag).
- `TaskBoard` rewritten around dnd-kit's multi-container sortable:
  - Local `columns` state that follows the server list except mid-drag. `onDragOver` moves the card between buckets live; `onDragEnd` reorders, picks the nearest **same-date** neighbours, applies the move optimistically, and calls the action.
  - On failure the board snaps back to the server's list with a specific message ("You're signed out… The task is back where it was."). On success, `router.refresh()`.
  - Each bucket's `<ul>` is also a `useDroppable`, so **empty buckets accept drops**. While dragging, an empty bucket shows a 44 px dashed zone that tints on hover.
  - **Sensors:** Mouse with a 6 px threshold (same as every drag in the app, so clicks still click); Touch with a 200 ms long-press (so swipes still scroll the drawer); Keyboard with `sortableKeyboardCoordinates`.
  - **Pointer drag from anywhere on the card, keyboard pick-up only from a grip button** (`setActivatorNodeRef` + `onKeyDown` split off the listeners). That way Space/Enter on the delete button still means "delete". The delete button also stops `mousedown`/`touchstart` so a drag can never start from it.
  - **Screen readers:** custom announcements with task titles and bucket names ("Dropped Charlie at position 2 in Today", "Move cancelled. Alpha is back where it was.") plus instructions on the grip.
  - The `DragOverlay` preview is the shared presentational `TaskCardBody`, tilted 1.5° with an accent-soft halo and a **paw print** in the corner, matching the timetable's drag preview.
  - The drop animation (180 ms) is skipped under `prefers-reduced-motion`.

**Verified (throwaway route, real server actions, signed out; deleted before commit):**
- **Keyboard:** grip focus → Space → ↑ ↑ moved "Charlie" from Tomorrow into Today between Alpha and Bravo (live) → Space dropped it → narration "Dropped Charlie tomorrow at position 2 in Today." → server answered `unauthenticated` → board snapped back with the specific alert. (The request was sent and the reason asserted, per the Session 15.1 lesson.)
- **Mouse:** dragging Alpha onto the empty Backlog: preview with paw appeared, the empty zone grew to 44 px, Alpha moved into Backlog live, and the drop got the same rejection and snap-back.
- **Esc:** keyboard drag ↓↓↓ (moved into Tomorrow) → Esc → everything back in place, "Move cancelled…" announced.
- **Delete:** mousedown on delete + a 20 px mouse move did not start a drag, and the click advanced to "Confirm delete: …".
- No console errors. `typecheck` + `lint` + `build` green. `/today` 9.17 → **27.6 kB** (dnd-kit). Noted for the Phase 9 Lighthouse pass, where lazy-loading the drawer when it's closed is the obvious lever.

**Environment gotcha (not a bug, but it shaped the code):** in the hidden preview pane, Web Animations never advance; a bare `document.body.animate()` probe also sat at `currentTime 0`. dnd-kit keeps the source card hidden until its drop animation finishes, so the first test left a "ghost" overlay stuck on screen. In a real browser this finishes in 180 ms. The takeaways: (1) nothing in the board's state may depend on that animation, and it doesn't; (2) reduced-motion users skip it entirely.

**Next session — Session 20:** checkbox complete → "Done today" collapsed section (US-4.3). `setTaskDone(id, done)` sets/clears `completed_at`; done-today = `completed_at` within the user's today. Unchecking returns the task to its bucket (which `scheduled_for` still holds).

**Blocked on:** nothing.

---

## 2026-10-04 — Session 20: Complete → "Done today" (+ a dnd-kit hydration fix)

**What landed:**
- `setTaskDone(id, done)` in `task-actions.ts` sets or clears `completed_at` and never touches `scheduled_for`. So "done" stays a state, and unchecking puts the task straight back in the bucket its date still names (US-4.3). Returns `not_found` if no row matched (e.g. deleted elsewhere).
- `lib/dates.ts → zonedDayStartUTC(iso, timeZone)`: the UTC instant at which a calendar day begins in an IANA zone. It reads the offset with `Intl…formatToParts` and **re-checks it at the candidate instant**, so days that start or end on a DST switch still land on local midnight.
  - Node-tested 10 cases: Toronto EDT/EST, both 2026 switch days (Mar 8 starts in EST, Nov 1 starts in EDT) and the days after, Ho Chi Minh (+7), Kolkata (+5:30), UTC, and London's BST start day. All pass.
- `/today` fetches **done-today** = `completed_at ∈ [local midnight, next local midnight)` for the `fy-tz` zone, newest first, in the same `Promise.all`. The board gets `doneToday` and `timeZone`.
- `TaskBoard`:
  - **Checkbox** (native `<input type="checkbox">`, `accent-color: var(--accent-strong)`, labelled "Mark done: …"). It stops `mousedown`/`touchstart`, so pressing it can never start a drag.
  - Checking strikes the title through and fades the card for **350 ms** (0 under reduced motion), then the board moves it into "Done today" optimistically while the request runs. Any failure restores both lists from the server copy with a specific message.
  - **"Done today"**: a section below the buckets, **collapsed by default** per US-4.3, with a header button (`aria-expanded` / `aria-controls`) showing the count. Rows show a checked box ("Mark not done: …"), the struck-through title, and the completion time in the user's zone. Hidden entirely when nothing's done yet.
  - Unchecking moves the task back into its bucket at its sorted position, optimistically, with rollback on failure.
  - Errors now go through one `errorText(code, doing)` helper and a single board-level alert (complete / reopen / move).
  - The drag overlay shows a static checkbox stand-in so the preview matches the card.

**Bug found in Session 19's code: SSR/client id mismatch in dnd-kit.**
- The console showed `aria-describedby` server `DndDescribedBy-1` vs client `DndDescribedBy-0`. dnd-kit numbers its accessibility ids from a **module-level counter**. On the server that counter keeps counting across requests, so from the second request on (i.e. on prod, always) each grip's `aria-describedby` pointed at an element id that didn't exist on the client, and screen readers lost the drag instructions.
- Session 19's check missed it because it ran on a freshly started server, where both sides happened to be at 0.
- Fix: `<DndContext id="task-board">` (dnd-kit's documented SSR fix). Verified by loading the page three times on one server: the grip's `aria-describedby="task-board"` resolves to the instructions element, ids are unique, and there's no new warning. (The live region keeps its own id and is client-only, so it can't mismatch.)
- **Lesson:** when checking hydration, render the page *more than once* on the same server; anything counter-based only diverges after the first request.

**Verified (throwaway routes, real server actions, signed out; deleted before commit):**
- "Done today" collapsed by default; expanding shows "Delta already done · 10:05 AM" (14:05 UTC in Toronto ✓).
- Check timeline (sampled every 10 ms): 7 ms struck through and still in Today → **373 ms** moved to Done (count 2) → 418 ms server answered `unauthenticated`, both lists restored, alert "You're signed out. Sign in again to change tasks."
- Uncheck timeline: 10 ms Delta back in Backlog (it has no date), Done emptied → 43 ms rejection restored it.
- `typecheck` + `lint` + `build` green. `/today` 27.6 → **28.4 kB**.

**Still to do in Phase 4:** restriction badge + header chip, end-of-day roll modal. Editing task fields (description / priority / deadline / category / restriction toggle) has no box of its own yet but the restriction box needs at least the restriction toggle. Fold a small task editor popover into Session 21.

**Next session — Session 21:** task editor popover (title, description, priority, deadline, category, restriction), reusing the BlockPopover pattern, then the restriction badge on cards plus the persistent "🔒 Focus first: [task]" chip in the TopBar (US-4.5).

**Blocked on:** nothing.

---

## 2026-10-04 — Session 21: Task editor + restriction badge + "🔒 Focus first" header chip

**Prod check:** still 0 tasks and no diary save since 2026-09-29. Everything since the diary hotfix remains untested with a real session.

**What landed:**
- `updateTask(input)` in `task-actions.ts`: title (1–200, trimmed), description (≤ 5000, trimmed), priority enum, deadline (ISO or null, must parse), category, `is_restriction`. It mirrors the table's check constraints so bad input gets a readable reason. RLS still enforces own-category, and the action returns `not_found` if no row matched.
- `components/tasks/TaskPopover.tsx`, modelled on `BlockPopover` (portal, outside-click / Esc close, viewport clamping), with improvements:
  - A real `<form>` (Enter saves).
  - `role="dialog"` labelled by its heading.
  - **Focus returns to the task title** that opened it.
  - Prefers the *left* of the card, since the drawer hugs the right edge.
  - Priority is a radio group styled as pills (`peer-checked`, `peer-focus-visible` outline).
  - Deadline is `datetime-local` (browser wall-clock = the same zone `fy-tz` reports), with a clear button.
  - Restriction is a labelled checkbox: "🔒 Focus first. Keep a gentle reminder in the header until this is done. Nothing gets blocked."
  - Errors are mapped to friendly copy; edits are kept on failure.
- **Opening the editor:** the card title is now a `<button>` ("Edit task: …"), so it's keyboard reachable. Mouse drags still start on it (6 px threshold), and a 250 ms post-drop guard stops a stray click from opening the editor after a drag.
- **Card meta row:**
  - `🔒 Focus first` pill (accent-soft / cat-ink).
  - Deadline in the user's zone: "Due 6:00 PM" when it's today, "Due Oct 5, 6:00 PM" otherwise, and **"Past due …" in danger red** once passed.
- **Header chip (US-4.5):**
  - `FocusFirstSlot` (async server component) picks the open restricted task with the earliest deadline (undated last, then oldest) plus a count of the others. It uses the `tasks_user_open_restriction_idx` partial index from Session 17.
  - The layout renders the slot **inside its own `<Suspense fallback={null}>`**, passed to the client `TopBar` as a `focusSlot` prop, so the lookup streams in and never blocks the shell.
  - `FocusFirstChip` is a link to `/today` reading "🔒 **Focus first:** Finish the essay · due in 2h 15m +1". The countdown re-renders every 30 s and becomes "past due" in red.
  - Responsive: icon only < md, countdown from md, title from lg.
  - Full `aria-label` ("Focus first: X, due in 2h 15m, plus 1 more. Open tasks").
  - **Hidden on `/chill`** (PRD §6.0: from Chill "you cannot see a task or a timer").
  - It refreshes with everything else on `router.refresh()`, since the layout re-renders too.

**Decisions:**
- **Reading the session in the layout makes `/chill` and `/focus` dynamic** (they were static stubs). They're auth-gated, so prerendering them bought nothing, and a correct chip on every page matters more.
- **Deferred:** PRD §6.6's "darken the app slightly when active". A global dim deserves care with the scenes and both themes, so it goes in the Phase 9 visual / reduced-motion pass (noted on the ROADMAP box).

**Verified (throwaway route, real `updateTask`, signed out; deleted before commit):**
- Cards: "Finish the essay | 🔒 Focus first | Due 3:37 AM | ↑ High | Deep Work" (deadline 2h15m ahead in Toronto, same day → time only) and "Reply to Sam | Past due 12:52 AM".
- Chips: "due in 2h 15m +1" and "past due", with the full aria-labels above.
- Editor:
  - Prefilled every field correctly (title, description, High, `2026-10-04T03:37`, Deep Work, restriction checked). Focus started in Title, and it opened left of the card.
  - Changing to Low + unchecking restriction → Save → the request was sent, and the popover showed **"You're signed out. Sign in again to save."** with the edits kept.
  - Esc closed it and **focus returned to "Edit task: Finish the essay"**.
- Screenshot checked. Loaded 3× on one server (hydration lesson): no new console errors.
- `typecheck` + `lint` + `build` green. `/today` 28.4 → **30.2 kB**.

**Next session — Session 22:** end-of-day roll modal (US-4.4). On first visit of a day with open tasks dated before today (or at 23:00 local), offer per task: Move to Tomorrow / Move to Backlog / Keep (re-date to today). Batch server action. That's the last Phase 4 box.

**Blocked on:** nothing.

---

## 2026-10-04 — Session 22: End-of-day roll (Phase 4 boxes complete)

**What landed:**
- `rollTasks(choices: { id, to: Bucket }[])` in `task-actions.ts`: a batch re-home.
  - Validates every choice (≤ 200). The server maps each bucket to a date with `getUserToday()`.
  - It reads the current last `sort_order` once per target bucket, then appends tasks **in the order the choices arrive** (the board's order). Only open tasks are touched.
- `components/tasks/RollModal.tsx`, a real modal dialog:
  - `role="dialog"` + `aria-modal="true"`, labelled and described by its heading and body.
  - Focus moves inside on open, **Tab / Shift+Tab wrap inside**, Esc = "Decide later", and focus returns to the previously focused element on close.
  - Backdrop click = "Decide later". The latest `onLater` is kept in a ref so the focus effect doesn't re-run each render.
  - Two modes with their own copy:
    - **overdue**: "A few things carried over / These didn't get done on their day. Where should they go now?", each task tagged "from Oct 2"; options Tomorrow / Backlog / **Today** (re-dates to today).
    - **evening**: "Winding down / It's getting late. Anything to move off today before you rest?"; options Tomorrow / Backlog / **Keep** (no write).
  - Per-task segmented radios (default Tomorrow), "Everything to: …" bulk buttons, and specific errors ("You're signed out. Sign in again to move these.").
  - If every choice is Keep in evening mode, Done closes without a request.
- `components/tasks/EndOfDayRoll.tsx` decides *when*:
  - **overdue** whenever open tasks are dated before today (which in practice means the first visit of a new day), taking precedence over evening.
  - **evening** when the local hour is ≥ 23 and tasks are still open on today. The hour is re-read every 60 s, so it can appear while the app is left open.
  - The task list is **snapshotted** when the modal opens, so it can't shift under the user, and ordered like the board (date, then `sort_order`).
  - Each mode is offered at most **once per day per device**: both Done and Decide later set `fy-roll-handled:<today>:<mode>` in localStorage. That's a convenience flag, so a second device asking again is acceptable.
  - Mounted inside `TaskBoard`, which only renders on `/today`, so the roll appears where the tasks are.

**Why "once per day per device" in localStorage rather than the DB:** it's a nag-suppression preference, not data. If it's lost (private window, cleared storage), the worst case is being asked once more, which is harmless. Revisit if a settings page ever wants "never ask".

**Verified (throwaway routes, real `rollTasks`, signed out; deleted before commit):**
- Overdue page (tasks from Oct 2 and Oct 3 + one today):
  - The modal opened for **only the two overdue tasks**, tagged "from Oct 2 / Oct 3", defaulting to Tomorrow.
  - Focus started inside; Tab from last → first and Shift+Tab from first → last.
  - "Everything to: Today" set both to keep.
  - Done → the batch request was sent → the modal stayed open with **"You're signed out. Sign in again to move these."**
  - Esc closed it, set `fy-roll-handled:2026-10-04:overdue`, and the modal **did not reappear on reload**.
- Evening page (two tasks dated today):
  - At the real hour (≈ 1 AM) nothing showed.
  - After overriding `Date.prototype.getHours` to 23, the next 60 s tick opened **"Winding down"** with the third option labelled **Keep**, in board order (fixed during the session: it first used raw server order).
  - Keep-all + Done closed it **without a save request** (the only fetch was the page refresh) and set the evening flag.
- No new console errors. `typecheck` + `lint` + `build` green. `/today` 30.2 → **31.6 kB**.

**Phase 4 status:** every box is built (table + RLS, board, drag, done-today, restriction badge + chip, end-of-day roll). The exit criterion, "every task the author does in a week goes through the app", is Minh's to hit, and **none of Phase 4 has been exercised with a real session yet** (prod `tasks` is still empty).

**Next — Phase 5 (Pomodoro + Focus Mode):** timer widget + zustand store. Read PRD §6.5 and US-5.x first. Before that, worth a real-session pass over diary + tasks on prod.

**Blocked on:** nothing.

---

## 2026-10-05 — Session 23: Phase 5 begins — timer widget + zustand store

**Brief change this session:** Minh will be away, so the *whole* of Phase 5 gets built in this session, one commit per box (each still logged here and ticked on the ROADMAP). Minh also asked for a top-tier pixel / chill look in the spirit of pomofox.com, with Monstadt / Liyue (Genshin) as taste references, and supplied a throwaway test account (a `+fytest` alias of his email; its credentials live only in the gitignored `.env.test.local`, used on localhost only). **Original** pixel cafe-cat, not a fox clone.

**What landed (Box 1):**
- `lib/focus/timer.ts`: a pure state machine. Every function takes `now`; time is derived from `endsAt` (running) or `remainingMs` (idle / paused), never counted per tick, so refreshes, throttled tabs and sleeping laptops are all just "what time is it now".
  - Phases focus / short / long, long break every 4th completed focus (configurable 2-8). Skipping a break goes to focus; skipping a focus is the same as Reset (never counted as done).
  - Abandon rule: Reset on a focus phase with >= 60 s *focused* (pauses excluded) produces a `completed=false` record; < 60 s produces nothing. An abandoned session earns no cup.
  - `settle`: a deadline that passed while the tab was closed completes *as of the deadline* and never chains into the next phase.
  - `sanitizeState` / `sanitizeSettings` make corrupt or stale localStorage fall back to a fresh idle timer instead of throwing.
- `lib/focus/store.ts`: zustand + `persist` (`fy-focus`, version 1) with `skipHydration`; `FocusProvider` rehydrates in an effect so server HTML and first client render are both the default idle timer (hydration lesson). A separate seconds-resolution `useClock` store means clock components re-render once per second, not on every 250 ms tick.
- Finished / abandoned focus sessions go to a localStorage **outbox** (`lib/focus/sessions.ts`), keyed by a client-generated session id. Box 4 will flush it to the server; nothing is lost in between and replays are idempotent.
- `FocusProvider` (mounted in `app/(app)/layout.tsx`): single ticker, visibility resync, cross-tab `storage` rehydrate, chime + opt-in notification (notification only while the tab is hidden), tab title (`24:31 · …`, `⏸` when paused, `Break ·` on breaks), sr-only live region announcing **phase boundaries only**. A `fy-focus-chimed` key stops two open tabs chiming twice; completions more than 5 min late (or restored after being away) are saved silently.
- Chime is synthesized (3 sine partials, ~1.9 s decay, low-passed): G5 B5 D6 for a finished focus, D5 A5 for the end of a break. The AudioContext is unlocked by the Start click or the first pointerdown anywhere. Notification permission is requested only when the user flips the settings switch.
- `TimerChip` in the TopBar: only exists while a timer is running or paused; hidden on /chill (PRD 6.0) and on /focus (which shows the full timer). The timer keeps ticking across navigation.
- **Pixel design:** sprites are string grids rendered as crisp SVG rects coloured by new `--pix-*` tokens (ginger tabby in Sunny Cafe, same cat with a canary rim glow in Netcafe). The timer is a 22-cell square pixel track: the cat gallops laps round the *outside* (quarter-turn rotations keep pixels crisp, which a round ring would not), cells light clockwise with progress, paused = cat sits down, break = cat curled asleep with floating z's, finished = cheer hop. Four pixel coffee cups tally the round. Digits use Pixelify Sans (`preload: false`). Reduced motion: no lap, no frame animation, no z's; lit cells still show progress.
- Settings (cycle lengths, chime + volume, notifications, auto-start) live in localStorage as decided. Number fields commit on blur / Enter (clamping per keystroke made typing "50" over "25" impossible).

**Verified:**
- `npm test` (new vitest setup): 82 tests covering transitions, pause/resume math, the 59 s vs 60 s boundary, long-break cadence, expired-on-load, sanitizers, outbox idempotence, store rehydrate from corrupt JSON, sprite grid sizes and track geometry.
- `typecheck` + `lint` + `build` green. `/focus` 4.34 kB (First Load 98 kB).
- Signed in (throwaway account, localhost): Start ran the cat round the track; **reload x3 with a running timer: no console errors, timer resumed at the right time**; the chip showed on /today while the clock kept running; Pause froze `remainingMs` exactly; moving the stored deadline 2.5 s ahead produced exactly **one chime** (AudioContext `running`), a queued `completed=true` record, phase -> short break (idle), one cup filled and the announcement "Focus session complete. Short break next.". Night theme, 375 px width (no horizontal overflow) and the settings panel were checked by screenshot.
- Gotcha: after editing `tailwind.config.ts` the running dev server kept the old config (`font-pixel` resolved to Lora). Restarting dev (and clearing `.next`) fixed it.
- **Not testable headless:** how the chime actually *sounds* and a real OS notification. Minh: set a 1-minute focus in Timer settings and listen.

**Pre-existing, noticed (not changed):** the TopBar title still shows the hard-coded "Sep 14 – 20, 2026" on every page.

**Taste log for Phase 6 (scenes):** Monstadt (windy green-blue meadow, dandelion seeds, windmill) and Liyue (lantern-lit harbour, red + gold, cliffs) are the day / night scene candidates. The cat, cups and palette were drawn to sit in front of a scene later; Phase 5 keeps all margins blank.

**Next — Box 2:** link a task or a timetable block to the session; then Focus Mode, `focus_sessions` + outbox flush, weekly tile.

**Blocked on:** nothing.

---

## 2026-10-05 — Session 24: Link a task or block to the session (Phase 5, Box 2)

**What landed:**
- The link is `{ kind: "task" | "block", id, title }` and lives **inside the persisted timer state** (it was already in `timer.ts`), so it survives a refresh and rides along into the break and the next focus; the user only re-picks when the subject changes. The title is stored with it, so the label is still right if the task is renamed or removed mid-session.
- `/focus` is now a server page (auth-gated like the other pages) that loads **today's open tasks** (`completed_at is null`, `scheduled_for <= today`, so overdue ones are included and Backlog / tomorrow are not, "Focus first" tasks sorted first) and **today's blocks** (the user's local midnights, via `zonedDayStartUTC`). It passes them to `LinkPicker`, slotted into `TimerCard`.
- `LinkPicker`: a "Focusing on [chip ×] Change" row that expands to two groups (tasks / blocks, `aria-pressed` buttons, block times in the user's zone). A link that is not on today's list stays linked and says so. Empty day: a friendly line pointing at Timetable.
- Entry points: a timer icon on each task card (next to delete, hover / focus visible, never starts a drag) and a "Focus on this block" button in the block popover. Both set the link and go to `/focus`.
- The ring shows the linked title as a pill under the clock (hidden on breaks).
- **"Done with it?"**: when a focus session that was linked to a *task* completes live (not "away"), the card offers **Mark done / Not yet**, using the existing `setTaskDone`. It clears the link and refreshes the picker on success. It hides while a new focus phase is running.

**Decisions / lessons:**
- A deleted task must not stay linked. On `not_found` the offer shows "That task is already gone." and the link is cleared (found while testing: the first version kept the dead link).
- **For Box 4:** the outbox record can hold a `taskId` / `blockId` that no longer exists, and an insert with a dangling FK would fail and keep the record stuck in the outbox forever. `saveFocusSession` must verify the ids against the user's rows and null the missing ones (the `label` snapshot keeps the name).
- Linking while a session is running re-targets the *current* session (the record uses the link at the moment it ends). That matches "what am I focusing on now".

**Verified (signed in as the throwaway account, localhost, real server actions):**
- Task-card button -> navigated to /focus with the task linked (`fy-focus.timer.link` correct); the picker listed *Write essay (🔒 Focus first), Reply to Sam, Deep Work 9:00 AM – 11:00 AM* and **excluded** the tomorrow task, the backlog task and tomorrow's block.
- Picking another task changed the link; finishing a session wrote `taskId` + `label` to the outbox record; **Mark done** hit the server (DB confirmed `completed_at` set), the offer disappeared, the link cleared and the task left the picker.
- **Failure path asserted by reason:** link a task, delete it in SQL, finish a session, click Mark done -> the server action was sent (POST /focus) and the card showed **"That task is already gone."** with the link then cleared.
- Block popover "Focus on this block" -> /focus with `kind: "block"` linked.
- `typecheck` + `lint` + `test` (82) + `build` green. `/focus` 4.34 -> 6.58 kB, `/today` 31.6 -> 33.6 kB (the store is now imported by the board and popover).
- Test data for the throwaway account is prefixed `FYTEST` and is removed at the end of the phase.

**Next — Box 3:** Focus Mode (dimmed full-screen overlay, Esc exits but the timer keeps running).

**Blocked on:** nothing.

---

## 2026-10-05 — Session 25: Focus Mode (Phase 5, Box 3)

**What landed:**
- `FocusMode` overlay, portalled to `document.body` and mounted by `FocusProvider`, so it works from any page. Driven by a `focusMode` flag in the store that is **not persisted**: it is a *view* over the running timer, so a reload always lands on the normal page with the timer still going.
- Content, per US-5.2 / PRD 6.5: the phase label, the pixel track at **2x** when there is room (whole-number scale only, so pixels stay crisp; 1x otherwise), the clock, "Focusing on [item]", Reset / Start-Pause / Skip-break, the cup tally and a one-line hint. **All margins stay empty** (Phase 6 decides what lives there). A finished session shows "nice work. rest now." with the cheer hop, then the sleeping cat.
- The dim: scoped tokens under `[data-focus-surface]` (warm cocoa in Sunny Cafe, near-black in Netcafe) plus a vignette. Re-declaring the `--ink-*` / `--border*` / `--pix-track` tokens only inside the overlay means text, buttons and the track follow without any component knowing about Focus Mode; the cat gets its canary rim in the dark room. 700 ms fade-in (DESIGN_SYSTEM), none under reduced motion.
- Entry: an icon button on the timer card and the **F** key (not while typing, or on a control that uses the key). Entering also *asks* for real fullscreen (best effort; a browser that refuses still gets the full-window overlay).
- Leaving: Esc, F, the Leave button, or the browser's own fullscreen exit (`fullscreenchange`, because the browser consumes that Esc without sending a keydown). In every case the timer is untouched.
- Accessibility: `role="dialog"` + `aria-modal`, the page behind gets `inert` (so no focus, clicks or screen-reader reach), Tab / Shift+Tab wrap inside, focus moves to the primary button on open and **returns to the opener** on close, body scroll is locked meanwhile, the live region (outside the inert shell) still announces phase changes.
- Refactor: the cheer logic moved to a `useCheer` hook shared by the card and the overlay.

**Bugs found while testing (both fixed):**
- Focus did not return to the opener after Esc: the overlay's cleanup ran while the page behind was still `inert` (the provider lifts it in the same commit), and an inert element cannot take focus. The restore now runs one tick later.
- `focusMode.ts` next to `FocusMode.tsx` differ only by case, which TypeScript rejects (and which would break on Windows / macOS). The helper is `focusModeControls.ts`.

**Verified (signed in, localhost):**
- F key (real key event) opened the dialog: `inert` on the shell, body scroll locked, focus on Pause, timer still counting. **Esc closed it: `status` still `running`, deadline unchanged, inert and scroll restored.** Opened by click, Esc -> focus returned to "Enter Focus Mode".
- Tab from the last control wrapped to the first and Shift+Tab from the first to the last; a synthetic `fullscreenchange` with no fullscreen element closed it and the timer kept running.
- 1400x1000 at night: ring exactly **640 px** (2x of the 320 px viewBox), "Focusing on FYTEST Deep Work" shown. Moving the deadline 1.5 s ahead *inside* Focus Mode: it stayed open, **one chime**, label -> "Short break", status "nice work. rest now.", live region "Focus session complete. Short break next.", then the sleeping cat.
- Real fullscreen was refused in the headless pane (expected); the overlay worked without it. I could not verify the real-fullscreen path itself, so **Minh: press F in a normal browser window and check the browser goes fullscreen, and that Esc leaves both**.
- `typecheck` + `lint` + `test` (82) + `build` green. `/focus` 6.58 -> 5.69 kB (the cheer hook replaced duplicated code), First Load 110 kB.
- One `next build` failed in `next/font` ("Cannot read properties of null") and passed on retry with no change: a transient Google Fonts fetch. Vercel builds fetch the same fonts, so a rare flaky deploy is possible; redeploying fixes it.

**Next — Box 4:** `focus_sessions` table + RLS, `saveFocusSession`, outbox flush (verify task / block ids and null the missing ones).

**Blocked on:** nothing.

---

## 2026-10-05 — Session 26: `focus_sessions` log (Phase 5, Box 4)

**What landed:**
- Migration `20261005063406_phase5_focus_sessions` (applied via the Supabase MCP, mirrored under `supabase/migrations/`). Deviations from the ERD (now updated in `docs/ERD.md`):
  - `id` has **no default**: the browser generates it when the phase starts, so a retry or a second tab replays harmlessly (`insert … on conflict (id) do nothing`).
  - `planned_seconds` (so "completed" is checkable and an abandoned session reads "10 of 25 min") and `label` (a snapshot of the task / block title; the session keeps its name after the task is deleted and `task_id` goes null).
  - Constraints that reject impossible sessions: planned 60-7200 s, duration `0..planned`, completed ⇒ duration = planned, `ended_at >= started_at`, and a **wall-clock check** (you cannot have focused longer than the clock ran, 5 s slack; pauses only lengthen the wall clock).
  - RLS, one policy per command, `(select auth.uid())`: select / insert / delete own; insert also requires the task and block to be the caller's own (FKs alone accept another user's ids); **no update policy**, a logged session is a fact. Partial indexes on both FKs. Security advisors: nothing new (only the old leaked-password toggle).
- `lib/focus/validate.ts`: the server's gatekeeper. Every field is checked (uuids, time order, a far-future end, planned and duration ranges, completed ⇒ full duration, abandoned ≥ 60 s, wall clock, label length) and returns a **reason** (`bad_duration`, `too_short`, …). Only a fixed set of columns is ever copied, so a tampered client cannot smuggle in `user_id`.
- `saveFocusSessions` (`app/(app)/focus/actions.ts`): auth, batch of ≤ 50, validate, **verify the task / block still exist (RLS-scoped) and null the ones that do not** (the dangling-FK risk logged in Session 24), `user_id` from the session, idempotent upsert. If the batch insert fails it retries row by row: integrity / policy errors (`23xxx`, `42501`) become `rejected`, anything else fails the call so the browser retries. `revalidatePath("/focus")`.
- `lib/focus/flush.ts`: `createFlusher(save)` drains the localStorage outbox in batches of 50. **Saved and rejected ids are dropped** (a record that can never be valid must not block the queue); any other failure keeps everything and records the reason. Concurrent calls collapse into one. It takes `save` as a parameter, so it is unit-tested without importing server code.
- `FocusProvider` flushes when a session is queued (a custom `fy-outbox` event from `enqueueSession`), on load, on `online`, when the tab becomes visible, and every 60 s while anything is pending. The timer card shows "N sessions waiting to save. <reason>" only while something is pending.

**Found while testing (fixed):** signed out, the middleware answers the server action's POST with a redirect to `/login`, so the action resolves with **no result** instead of `{ ok:false, error:"unauthenticated" }`, and the flusher crashed on `res.ok` (the outbox was safe, but the UI had no reason). A missing result is now `no_response`, shown as "Sign in again to save your focus sessions.", with a unit test. In practice an expired session sends the user to /login; the queued session is still there afterwards.

**Verified:**
- SQL as the `authenticated` role with real JWT claims, inside a DO block that always aborts (nothing left behind; the first run exposed a bug in my harness, fixed and re-run): own insert with own task + block ✓; abandoned insert ✓; replay of the same id inserts **0** rows ✓; **another user's task rejected (RLS)** ✓; **inserting as another user rejected (RLS)** ✓; completed with the wrong duration rejected by `focus_sessions_completed_full`, a 10-minute session in a 1-minute window by `focus_sessions_wall_clock`, planned 30 s by `focus_sessions_planned_range`, end-before-start by `focus_sessions_time_order` ✓; owner sees own rows, **update changes 0 rows**, the other user sees 0 and **deletes 0** of them ✓; deleting the task keeps the session with its label and a null `task_id`, deleting the block unlinks it ✓.
- Signed in on localhost, real server action, rows checked in the DB: a finished session linked to a task -> `completed=true, 1500/1500, label, task_id` correct, outbox emptied; **an impossible session (25 min "focused" in 2 s) was rejected with `bad_duration`** and dropped; an abandoned one (Reset after 10 min) -> `completed=false, duration 600`; linking a task, **deleting it in SQL**, then finishing -> saved with `task_id null` and the label kept (no FK failure); signed out (auth cookie removed): the action was sent, the outbox **kept** the session, the app went to /login; **after signing in again the queued session was saved** (4 rows, nothing lost); replaying an already-saved id left the table at 4 rows / 4 distinct ids.
- `typecheck` + `lint` + `test` (**124**) + `build` green.
- The 4 `focus_sessions` rows (and the `FYTEST` tasks) belong to the throwaway account and are left for Box 5's tile checks; they are deleted at the end of the phase.

**Next — Box 5:** weekly focus-hours tile + recent sessions on /focus.

**Blocked on:** nothing.

---

## 2026-10-05 — Session 27: Weekly focus-hours tile (Phase 5, Box 5)

**What landed:**
- `lib/focus/week.ts` (pure, 22 unit tests): the week is the user's **local Monday-Sunday** (`weekMondayISO`, `weekBounds`), and each day's edges come from `zonedDayStartUTC`, so a 25-hour (DST end) or 23-hour (DST start) Sunday still gets all of its sessions and a session at 00:10 local lands on the right side of midnight. `summarizeWeek` sums focused seconds per day (finished **and** stopped-early time counts as focus time) and counts finished vs stopped early. `formatDuration` -> "3h 25m" / "45m" / "<1m" / "0m".
- `WeekTile` (server-rendered, presentational): big pixel-font total, "5 sessions, 4 finished and 1 stopped early", seven pixel columns (**one block = 15 minutes**, rounded up so any focus shows a block, capped at 16 blocks / 4 h with the true number in the label), today's column in the stronger accent with a marker, future days dimmed, "Today: N sessions", and the **last 8 sessions** (✓ finished, dashed circle for stopped early, "10m of 25m", the label or "Focus session", local time). Empty state: a sleeping cat and "Your first session will light up the first block." Each column is a `role="img"` with a full text label ("Mon: 1h 25m, 4 sessions (today)").
- `/focus` fetches the week's sessions and the recent list alongside the task / block lists in one `Promise.all`. The tile sits **under the timer in the same 460 px column**: the wide margins stay empty for the Phase 6/9 decoration decisions.

**Decisions:**
- A session belongs to the day it **started** (local). Hours = focused seconds, so abandoned time counts; the "finished" count is shown separately so the number is honest both ways.
- The tile re-reads on every save because `saveFocusSessions` calls `revalidatePath("/focus")`, which also drops the client router cache (so a session saved from /today shows when you open /focus within the 30 s cache window).

**Verified (signed in, localhost):**
- The tile matched SQL exactly: 4 rows / 5100 s / 3 completed -> "1h 25m", "4 sessions, 3 finished and 1 stopped early", all on Monday (the user's local today, 02:42 EDT while it was already 06:42 UTC), 6 lit blocks for 85 minutes.
- **Live refresh:** finishing a session on /focus moved the tile from "4 sessions, 1h 25m" to "5 sessions, 1h 50m" with no reload; the DB total (6600 s) agreed.
- Throwaway route (deleted): a day over the cap shows 16 blocks with the label "Mon: 5h 25m"; future days at 50% opacity; the empty state renders; Netcafe renders (neon-yellow blocks). It exposed a bug, fixed: a very long session label pushed the row past the card (a grid track grows to its content); the list is now a flex column with `min-w-0` and the label truncates.
- `typecheck` + `lint` + `test` (**146**) + `build` green. `/focus` 5.84 kB (First Load 110 kB).
- Gotcha (not a bug): deleting a route while `next dev` was running left a stale webpack cache (`__webpack_modules__[moduleId] is not a function`); stop dev, `rm -rf .next`, restart.

**Next:** the phase-wide verification pass and cleanup of the throwaway account's test rows (see Session 28).

**Blocked on:** nothing.

---

## 2026-10-05 — Session 28: Phase 5 verification pass, cleanup, hand-off

**Phase 5 is complete** (all five boxes built, one commit each, pushed to main). This session re-checked the whole phase end to end and cleaned up.

**Verified across the phase:**
- Prod, signed out: `/focus` -> **307 to `/login?next=%2Ffocus`** (curl). Prod's Vercel build was not inspected from here (no `gh` CLI); Minh should confirm the latest deploy is green.
- **Reduced motion** (Playwright, `prefers-reduced-motion: reduce`): the cat's lap animation is `none` and the cat sits at the track start (`translate(55px, 55px)`), frame animation is `none` with only the first frame visible, z's hidden. With `no-preference`: lap animation `pix-lap` running, exactly one frame visible per sprite.
- **Hydration:** three consecutive reloads of `/focus` with a running timer, zero console errors, clock and tab title correct after each. (A one-off `__webpack_require__.n is not a function` on a *cold* dev server's first compile did not recur on any later load; it is the dev-only HMR race seen in Session 23.)
- **Phone width (390 px):** no horizontal overflow, full-page screenshot reviewed. It found two tile issues, fixed: the total "1h 50m" wrapped to two lines (now `whitespace-nowrap`, 30 px on phones) and session labels truncated to "FYTEST ..." (duration and time now stack on phones, so the label keeps its room).
- Signed-in flows, DB checks, RLS tests and failure reasons are in Sessions 23-27. Final totals: `typecheck` + `lint` + **146 unit tests** + `build` green; `/focus` 5.84 kB (First Load 110 kB), `/today` 33.7 kB.

**Cleanup:** deleted the throwaway account's 5 sessions, 4 tasks and 2 blocks (all `FYTEST`-prefixed). The *account itself* (a `+fytest` alias) and its profile / categories remain; delete it from Supabase -> Authentication -> Users when you no longer want it. An unrelated unconfirmed signup from a temp-mail domain also appeared in `auth.users` on 2026-10-05 06:05 UTC; it was not touched. `.env.test.local` stays on this machine only (gitignored).

**For Minh to check by hand (things a headless browser cannot judge):**
1. **Sound:** Timer settings -> set Focus to 1 min -> Start -> listen to the chime at the end (and the lower two-note one when a break ends).
2. **Notification:** flip "Notify me when the tab is in the background", allow it, switch tabs during a 1-minute session.
3. **Real fullscreen:** press **F** in a normal window: the browser should go fullscreen, and Esc should leave both fullscreen and the overlay with the timer still running.
4. **Prod smoke test with your real account:** a 1-minute session (completes -> a row appears under "Recent sessions" and the tile moves), link a task and mark it done from the prompt, Reset a session after > 1 min (shows "stopped early").
5. Phase 4's end-of-day roll and task deadlines are still unexercised on prod.
6. Phase 5 exit criterion: complete 3 focus sessions.

**Known follow-ups (not blockers):**
- The TopBar still shows the hard-coded "Sep 14 – 20, 2026" on every page (pre-existing).
- Timer settings live in localStorage (per device) as decided; moving them to the profile is a later settings-page task.
- `/focus` could lazy-load the settings panel; bundle is small, so left alone.
- Phase 6 scene direction logged in Session 23 (Monstadt meadow by day, Liyue lantern harbour by night).

**Next — Phase 6 (cozy environment: ambient mixer).** Read `docs/ROADMAP.md`; first box is `ambient_layers` seeded.

**Blocked on:** nothing.

---

## 2026-10-05 — Session 29: Feedback pass — legible clock, pickable phases, phone reminder

Minh's first look at Phase 5 on screen. He said the ring is good and gave these points:

1. **The pixel font was hard to read** (0, 6 and 8 looked alike, "00:00" worst). Pixelify Sans is gone (also removed from the root layout and Tailwind config, so no extra font download). The clock is now drawn from **hand-made 5x7 digit grids** (`pixel/digits.ts`, rendered by `PixelClock` as crisp SVG rects): 0 has a slash, 6 and 9 have open tails, 8 is the only closed-waist digit. A unit test requires **every pair of digits to differ in at least 5 pixels** (and names the look-alike pairs 0/8, 6/8, 0/6, 3/8, 5/6, 5/3, 9/8, 1/7), so legibility is enforced, not eyeballed. Used in the ring, Focus Mode (2x) and the header chip; the week tile's total uses the mono UI font. Digits are sized relative to the ring (`cqw`) and shrink only for times over 99 minutes.
2. **Short / Long break could not be chosen.** The three phase pills are now buttons (`selectPhase`): click one while the timer is idle and it switches to that phase at its own length, keeping the cycle count and the linked item. While a timer is running or paused the other pills are **disabled** ("Reset the timer to switch"): switching would silently end the session, so that stays an explicit Reset. 5 new unit tests.
3. **Phone reminder.** Entering Focus Mode before a session has started (idle focus phase) shows a calm note, "Stay away from your phone. Put it out of reach and silence notifications. When you are ready, start.", and the main button reads "I am ready, start". It never appears while a session is running or on breaks. "Do not remind me again" and a Timer settings toggle turn it off (`phoneReminder`, default on).
4. **Focus Mode was hard to find / test.** There is now a labelled **Focus Mode [F]** button under the timer controls (the old icon-only button is gone). Also fixed: **F did nothing right after clicking Start**, because the Pause button keeps focus and the key handler ignored buttons. F now works anywhere except text fields; Space still presses a focused button.
5. **Music for focus sessions** is logged as a new Phase 7 box (choose what plays when a session starts / in Focus Mode, remember it).

**Also fixed:** the 2x ring in Focus Mode needs more vertical room now that the phone note exists (it scrolled at 1000 px tall); the 2x scale now needs `innerHeight - 440 >= 640` (1080p fullscreen still qualifies).

**Verified (Playwright, signed in as the throwaway account on localhost):** Short break -> 05:00, Long break -> 15:00, Focus -> 25:00 with `aria-pressed` following; while running the two other pills are `disabled`; clicking Start then pressing **F** (with Pause focused) opened Focus Mode, Esc closed it; no phone note while running; after Reset, F opened it **with** the note and the "I am ready, start" button; no vertical overflow; the header chip shows "24:57" in the pixel digits (Netcafe). Screenshots reviewed in both themes. `typecheck` + `lint` + `test` (**154**) + `build` green; `/focus` 6.03 kB.

**Blocked on:** nothing.

---

## 2026-10-05 — Session 30: Plan locked — core first, then a Figma design stage

Minh confirmed fullscreen Focus Mode works well, and set the order of work: **finish the core functions, test them by hand, *then* a deep design pass with Figma** ("Stage 2"). He has more design input to bring later and asked me to *prepare* and to *tell him before* wiring a Figma project.

**Decisions:**
- New **Stage 2 — Design pass in Figma** on the ROADMAP (after Phase 9's functionality and Minh's manual test). Phase 9's design-polish items fold into it.
- **Phase 6 builds the scene *mechanism* with placeholder art** (layered, parallax-capable, theme-aware, reduced-motion safe). The real Monstadt (day) / Liyue (night) art waits for Stage 2 so it is designed together, not guessed.
- **Nothing is created in Figma until Minh says go**: creating a file in his team is a new shared artifact, so I ask first and tell him when it exists.
- Prepared `docs/DESIGN_BRIEF.md`: current design state, every deferred design item gathered from the log (S7.1 block richness / Netcafe palette / grid materiality, S11 decorated mini-month, decoration zones, restriction darkening, landing page, empty states, sound), scene briefs (original art inspired by the places), a proposed Figma page structure, the verified tool list, a ready-to-go checklist and the kickoff protocol.
- **Tools verified connected this session:** Figma (signed in as Minh, Full seat on a student team; read and write), Canva (reference images only), built-in browser + Playwright (live screenshots), Artifacts, Google Drive, Supabase, GitHub.

**Next:** Phase 6 (ambient mixer), first box `ambient_layers` seeded; the scene box is the placeholder mechanism.

**Blocked on:** nothing.

---

## 2026-10-05 — Session 31: Phase 6 kickoff prepared

Minh will start Phase 6 tomorrow in a new chat, so `docs/PHASE6_KICKOFF.md` is the hand-over: state of play, the two decisions to take first (ambient sound source: synthesized / CC0 files / hybrid, recommended synthesized so there are no licences or downloads; mixer location), a five-box plan with the technical approach for each (including `ambient_layers.kind`, a shared `AudioContext` with the focus chime, and a scene mechanism that can take different layer sets per theme for Stage 2), a headless test plan (OfflineAudioContext RMS / spectral checks, autoplay, hydration, RLS, reduced motion), gotchas learned in Phase 5, and a paste-ready first message.

No code changed this session.

---

## 2026-10-05 — Session 32: Phase 5 human checks confirmed

Minh confirmed the three checks that a headless browser could not make: the **focus chime sounds right**, the **real browser notification works**, and the **latest Vercel deploy is green** (on top of real fullscreen Focus Mode, confirmed earlier). Phase 5 has no outstanding verification items. `docs/PHASE6_KICKOFF.md` was updated to say so, and its paste-ready first message now has the recommended answers filled in (synthesized ambient sound, mixer location as in the PRD, Minh away so all five boxes in one go); Minh can edit them before pasting.

---

## 2026-10-05 — Session 33: Phase 6 begins — `ambient_layers` (Phase 6, Box 1)

**Brief:** Minh is away, so all five Phase 6 boxes get built in this run, one commit each (as in Phase 5). His answers: **(A) ambient sound is synthesized** (swap a single layer for a royalty-free file later only if he dislikes it; ask before downloading anything); **(B) mixer location as in the PRD**: sidebar mini-mixer, full mixer on /chill, master mute always visible in the top bar. Scene art is placeholder; Figma is untouched.

**What landed:**
- Migration `20261005221502_phase6_ambient_layers` (applied via the Supabase MCP, mirrored under `supabase/migrations/`). `ambient_layers`: `key` pk (shape-checked), `label`, `kind` (`synth` | `file`), nullable `storage_path` (required only for `file`), `default_level` 0..1, `sort_order`. Seeded rain 0.6 / fire 0 / keyboard 0.2 / cafe 0.3 / piano 0.3.
- RLS: select for `authenticated` only, **no write policy**, and insert / update / delete / truncate revoked from `anon` and `authenticated`. The `ambient` storage bucket is **not** created: nothing needs it until a layer becomes a file.
- `docs/ERD.md` updated (it said file-only).

**Verified:** as `authenticated` with real JWT claims (aborting DO block, nothing left behind): reads all **5** rows; insert, update and delete each fail with **`42501`**; as `anon` a read fails with `42501`. Security advisors: only the old leaked-password toggle.

**Next — Box 2:** the shared `AudioContext`, synth generators and the mixer store.

---

## 2026-10-05 — Session 34: MixerContext with Web Audio (Phase 6, Box 2)

**What landed (all under `lib/audio/`, 87 new unit tests):**
- **One shared `AudioContext`** (`context.ts`). `primeAudio()` (called from clicks; `latencyHint: "playback"`, because ambient sound runs for hours) and `currentContext()`. `lib/focus/chime.ts` now plays on it, so there is a single browser unlock. The chime is deliberately independent of the mixer: muting ambient sound never silences the end-of-session chime.
- **Graph** (`engine.ts`): per layer `source -> gain`, all into a `master` gain -> a soft **limiter** (`DynamicsCompressor`, a safety net for when every layer is high) -> destination. Levels move with `setTargetAtTime` (60 ms; master fades in over ~350 ms), so a slider never clicks. The graph does not exist until `begin()` (only ever reached from a click) and `halt()` fades out and tears it all down, so a paused mixer costs nothing. A layer at level 0 schedules no events. `begin()` has an epoch guard so a pause during the awaited `resume()` cancels it, and a browser that never resumes the context gives `blocked` after 1.5 s instead of hanging.
- **Scheduler** (`ticker.ts`): events (droplets, crackles, key clicks, piano notes, syllables) are placed ~2.5 s ahead every 250 ms. The tick comes from a **Web Worker timer**, because plain `setInterval` is throttled to 1/s and then 1/min in a hidden tab, which would starve the layers in the app's main use (left running in a background tab); it falls back to `setInterval` when workers are unavailable.
- **Synth generators** (`synth/`), original and royalty-free by construction: rain = pink-noise bed (swells slowly) + band-passed patter + individual droplets; fire = brown-noise roar that flickers + crackle clusters (sharp snaps and dull pops); keyboard = per-key click + "thock" + release click, typed in bursts with pauses, deeper space bar; cafe = four formant-filtered voices (noise + a faint buzzy pitch) taking turns, a room tone and an occasional cup clink; piano = sparse, wandering C major pentatonic notes (a few partials, felt-like decay) through a small dark echo. Noise buffers loop seamlessly (equal-power cross-fade, tested).
- **Event planning is pure** (`synth/plans.ts`): *when* and *how hard* each event happens is separated from Web Audio, so it is unit-tested: time order, windows that do not drop or duplicate events at their seams, a stalled scheduler skipping ahead instead of firing stale events, pentatonic-only notes, bursty typing, clustered crackles.
- **State** (`state.ts`, `layers.ts`): the gain curve is `level^2` (-12 dB at half; perceptual, not linear), `clampLevel` / `sanitizeSettings` (wrong types, NaN, unknown keys, out-of-range all land on a valid mixer; missing layers get their default, not zero), `targetsFor` (curve x per-layer trim, master 0 when muted), `levelText` for `aria-valuetext`. `mergeCatalogue` lets `ambient_layers` rows override label / order / default level for keys this build can play, and ignores layers it cannot (a future `file` layer, a malformed row).
- **Store** (`store.ts`): zustand + `persist` (`fy-mixer`, v1, `skipHydration`) exactly like the focus store; `playing` is **never persisted**, so sound cannot autoplay after a reload (tested). `toggleSound`: off -> play (also unmutes) -> mute -> unmute. `MixerProvider` is mounted in the app layout above `FocusProvider`, so ambient sound survives navigation. `lib/safeStorage.ts` now shared by both stores.
- **Decisions:** default master 0.8; the sound button in the top bar will be one control with three states (Box 3).

**Proving each layer makes sound, without ears** (`lib/audio/measure.ts`, dev-only hook `window.__fyAudioTools.measureLayer`, runs the real generator in an `OfflineAudioContext` for 20 s, seeded):

| layer | RMS | peak | crest | centroid | quiet windows |
|---|---|---|---|---|---|
| rain | 0.134 | 0.53 | 4.0 | 2943 Hz (bright) | 0 |
| fire (after retune) | 0.100 | 0.96 | 9.5 | 331 Hz (dark) | 0 |
| keyboard (after retune) | 0.015 | 0.61 | 40 (very peaky) | 1097 Hz | 78 % (sparse) |
| cafe | 0.116 | 0.63 | 5.4 | 560 Hz | 0 |
| piano | 0.055 | 0.48 | 8.8 | 607 Hz | 34 % (sparse) |

All finite (no NaN). The first run caught two problems: fire was a pure rumble (centroid 200 Hz, crest 4.3: the crackles did not register) and keyboard was thock-dominated and quiet; both retuned. The per-layer `trim`s (rain 1.5, fire 1, keyboard 1.4, cafe 1.45, piano 1.8) come from these numbers so peaks sit near 0.8 and no layer is far quieter than another.

**Verified in the live app (Playwright, signed in, localhost):** before any click: no `AudioContext`, no mixer graph. After `play()`: graph `running`, **5 layers**, gains match the curve (`rain 0.54`, fire 0 because its level is 0, ...), scheduler ticks advancing (12 -> 17 in 1.1 s), output RMS 0.065 through a dev-only analyser after the limiter. Rain to 100 % -> RMS 0.168; **all layers at 0 -> RMS exactly 0 and `activeLayers: []`** (nothing scheduled); fire alone -> 0.072; **mute -> master target 0, RMS 0**; unmute -> 0.087; **pause -> graph torn down (`idle`, 0 layers, RMS 0)**; play again -> rebuilt, 5 layers. Console clean apart from a pre-existing `favicon.ico` 404 (no icon file exists; noted, not changed).
`typecheck` + `lint` + `test` (**233**) + `build` green; no page bundle grew (the mixer is not wired into a page yet).

**Not testable headless:** how it *sounds* (does the cafe read as people, does the piano feel pleasant, is the master loud enough). Collected once at the end of the phase.

**Next — Box 3:** mixer panel UI (`LayerSlider`, `MasterVolume`, top-bar sound button, sidebar mini-mixer, /chill page with "tap to begin").

---

## 2026-10-05 — Session 35: Mixer panel UI (Phase 6, Box 3)

**What landed:**
- **`/chill`** is now the full mixer: a **"Tap to begin"** card (big Begin button; says sound only starts when asked, and lets you set the mix first), a slider per layer in a 2-column grid, a master volume with its own mute toggle. No tasks or timers there (the top bar already hides both on /chill). The scene slot above the mixer arrives in Box 5.
- **Top bar sound button** (`SoundButton`), visible on every page and width. One button, three honest states: nothing playing -> "Start ambient sound" (that click is the user gesture), playing -> "Mute ambient sound", muted -> "Unmute ambient sound" (`aria-pressed` for the muted state, `data-sound` = off / on / muted, lit yellow while playing).
- **Sidebar mini-mixer** (`MiniMixer`): Ambient heading + Play/Pause + five compact sliders (pixel icon + label + range) + master. Hidden on /chill, where the full mixer is the page. Sits above Sign out. (The sidebar is hidden under 768 px as before; on phones the top-bar button and /chill are the controls.)
- **`LayerSlider`** is a native `<input type="range">` (keyboard, touch and screen readers for free) with `aria-valuetext` = "Rain, 60 percent" / "Rain, off". `.fy-range` styles it from theme tokens (filled pill track, round thumb, visible focus ring, 22 px touch target).
- **Pixel layer icons** (`components/mixer/pixel/icons.ts`): 12x12 two-frame sprites in the cafe cat's language (string grids + `--pix-*` tokens, new water / flame / key tokens in both themes). Still when a layer is silent, alternating when it is audible; reduced motion keeps them still. **Placeholder-grade on purpose** (the cafe-chatter bubbles are the weakest): Stage 2 redraws them.
- **`ambient_layers` is now read.** The app layout (a server component) selects the table and `mergeCatalogue`s it over the built-in list; the result goes down through a React context, so server HTML and the first client render agree. A failed read falls back to the built-ins. Labels, order and default levels therefore come from the database.
- Problem states: if the browser refuses audio (`blocked`) or has no Web Audio (`unsupported`), the mixer says so in a polite live region and turns `playing` off.

**Found while testing (fixed):** at 390 px the header overflowed by 1 px once the sound button was added (the theme button was clipped, and a horizontal scrollbar appeared). The prev / next arrows now hide under `sm`: /today, /diary have their own prev / next in the page, and on /chill they are inert. Header and page overflow are 0 on /chill, /today, /diary and /focus at 390 px. Net header width is 24 px *less* than before the box.

**Verified (Playwright, signed in as the throwaway account, localhost, real clicks and key presses):**
- Before the Begin click: no mixer graph, no `AudioContext`, "Start ambient sound" and the tap card visible. **Begin click** -> graph `running`, 5 layers, context `running`, output RMS 0.075, tap card gone, button `on`.
- Keyboard on the rain slider: ArrowRight x2 + PageUp 60 -> 72, `aria-valuetext` "Rain, 72 percent"; Home -> 0 "Rain, off"; End -> 100; output RMS follows (0.075 -> 0.196).
- Top-bar **mute**: label -> "Unmute ambient sound", `aria-pressed=true`, master target 0, **output RMS exactly 0**; unmute restores (0.198).
- **Navigation keeps playing**: client-side nav /chill -> /today left the same graph running (5 layers, ticks advancing, RMS 0.16). Sidebar region "Ambient" with 6 sliders (5 + master) and one Pause button; PageUp x4 on the sidebar Fireplace slider -> 40 percent, engine target 0.16 (0.4^2), `fire` becomes active. Sidebar **Pause** -> graph torn down (`idle`, 0 layers, RMS 0) and the top button returns to "off".
- **Hydration, 15 loads** (/chill x3, /today x3, /chill x3, /focus x3, /chill x3) with saved levels (rain 100, fire 40): every load showed the restored values, **no graph and button "off" (a reload never autoplays)**, and **zero console errors or warnings** (only the old `favicon.ico` 404).
- Reduced motion: icon animations `none`, exactly one frame visible per sprite (5 of 10 frames); with motion: `pix-show-2` running. Day and night themes and the 390 px layout checked by screenshot.
- `typecheck` + `lint` + `test` (**244**, +11 icon-grid tests) + `build` green; `/chill` 0.86 kB (First Load 98.8 kB, the mixer UI), `/focus` 6.79 kB, `/today` 33.9 kB.

**Next — Box 4:** `mixer_state` table + RLS, debounced `saveMixerState`, restore on load.

---

## 2026-10-05 — Session 36: `mixer_state` persistence (Phase 6, Box 4)

**What landed:**
- Migration `20261005223316_phase6_mixer_state`: one row per user (`user_id` pk, `levels` jsonb, `master_volume`, `muted`, `current_track_id` null until Phase 7, `updated_at` via a touch trigger with a pinned `search_path`). Deviations from the ERD (now updated): `muted` is stored; `levels` is **checked in the database** by an immutable function (an object of at most 16 lowercase keys, each a number 0..1), so a tampered client cannot park junk in the row; `current_track_id` has no FK yet. RLS: select / insert / update own, **no delete policy**, nothing for `anon`.
- **`saveMixerState`** server action (`app/(app)/chill/actions.ts`): auth, then `validateMixer` (`lib/audio/validate.ts`: every field checked, a *named* reason for each refusal: `not_an_object`, `bad_levels`, `unknown_layer`, `bad_level`, `bad_master`, `bad_muted`; only three columns are ever copied, so a client cannot smuggle in `user_id`), then an upsert with `user_id` from the session. Returns `updatedAt` or a reason (`db_<code>` for database errors).
- **Saver** (`lib/audio/saver.ts`, injected timers, 19 unit tests): changes are **debounced 800 ms**; **one save in flight at a time** (a change made meanwhile is sent right after, never in parallel); the `pending` flag clears only for the revision that was actually saved; a failure keeps the change and **retries with backoff** (3 s, 10 s, 30 s, 60 s), a refused payload (`bad_*`, `unknown_layer`, DB `23xxx` / `42501`) is **not** retried; flush when the tab is hidden or closing, retry immediately when the connection returns. `classify` maps the action's answer: **no result at all = signed out** (the middleware redirects the POST; Session 26), retryable because the user may sign in in another tab.
- **Which mix wins at load** (`lib/audio/resolve.ts`, pure, 7 tests): (1) unsaved edits on this device always win and are sent up; (2) otherwise the account's mix, so a new device sounds like the old one; (3) otherwise a customised local-only mix is kept and pushed up (first sign-in on a used device); (4) otherwise the catalogue defaults. A user who never touches the mixer never gets a row.
- **No hydration mismatch:** the server HTML and the first client render always show the defaults; the layout reads `mixer_state` and passes it to `MixerProvider` as a prop, which applies it after mount (an effect), exactly like the focus store. (Setting the zustand store during render would have been unsafe: on the server it is a module singleton shared between requests.)
- Store: `rev` (user edits, not persisted), `pending` (**persisted**, so an offline edit survives a reload and is sent at the next load), `saveStatus`; edits that change nothing are not edits. `play()` unmutes and counts as an edit only if it actually unmuted.
- UI: a quiet status line under the mixer (`SaveNote`, live region): "Saving your mix…", "Mix saved to your account", or the reason ("Sign in again to save your mix. It is kept on this device for now.", "Offline: your mix is kept on this device and will save when you are back online.", "Could not save your mix (bad_level). It is kept on this device.").

**Verified:**
- **SQL as `authenticated` with real JWT claims** (aborting block, nothing left behind): own insert ok with `user_id` defaulting to `auth.uid()`; own update ok; **insert as another user -> `42501`**; the other user sees 0 rows and an update by them changes 0 rows; app **delete removes 0 rows** (no policy); `anon` read `42501`; constraints: level 1.5, a string level, an uppercase key, an array, 17 keys, master 1.5, a negative level each **`23514`**; exactly 16 keys accepted. (The in-transaction `updated_at` check read false only because `now()` is constant inside one transaction; the trigger was confirmed across real requests below.) Security advisors: only the old leaked-password toggle; performance: nothing new.
- **Signed in on localhost, real server action, rows checked in the DB:**
  - a **burst of 66 key presses made exactly one POST** (debounce), and the row matched (`rain 0.75`, `fire 0.8`); status "Mix saved to your account", `pending` false;
  - **untouched mixer on a brand-new device: 0 POSTs, 0 rows**, defaults shown (also after visiting another page);
  - a row seeded for "another device" with empty localStorage: **all 5 levels, master 50 and muted restored, on 3 consecutive loads**, 0 POSTs, **0 console errors or warnings**, button "off" (no autoplay);
  - **refusals asserted by reason** (request sent *and* reason shown): `bad_level` (rain 7), `unknown_layer`, `bad_master`, `bad_muted`, `bad_levels` each produced exactly one POST, the matching status and message, **no retry in the following 4.5 s**, and the DB row unchanged;
  - **signed out mid-session** (auth cookies dropped, page kept open): the action was sent (1 POST) and resolved with no result -> status `unauthenticated` and the message above, `pending: true`, the change kept in localStorage, DB unchanged; a reload went to `/login`; **after signing in again the queued edit was saved** (DB `cafe` 0.66 -> 1) and `updated_at` advanced (trigger confirmed);
  - **offline**: status `network`, the offline message, `pending: true`; back online (the `online` event) -> saved, DB `piano` -> 0, `pending: false`.
- The test row is deleted. `typecheck` + `lint` + `test` (**288**, +44 this box) + `build` green; `/chill` 1.17 kB (First Load 100 kB).

**Not covered (small):** two tabs editing at once is last-write-wins by design (no merge); `current_track_id` is unused until Phase 7.

**Next — Box 5:** the scene mechanism (placeholder art).

---

## 2026-10-05 — Session 37: Scene mechanism (Phase 6, Box 5) — Phase 6 complete

**What landed:**
- **The engine** (`components/scene/Scene.tsx`) stacks a `SceneDef`'s layers (back to front), each its own scaled SVG in a 960 x 540 space, and knows nothing about what is drawn. It feeds the mixer in as CSS variables (`--rain`, `--glow`), shifts each layer by its depth for **pointer parallax**, picks the scene from the theme, and honours reduced motion. **Stage 2 swaps the art by replacing two entries in `SCENES`** (`components/scene/scenes.tsx`, Monstadt by day, Liyue by night) without touching the engine; more scenes (v1.5) are just more defs.
- **Theme-aware without a hydration mismatch:** `useTheme` / `useReducedMotion` are `useSyncExternalStore` hooks whose server snapshot is Sunny Cafe / "motion allowed"; the real value takes over after hydration and follows the theme toggle live.
- **Pure, tested logic** (`lib/scene/`, 13 tests): rain streaks in a golden-ratio order so **any prefix is evenly spread** (more rain thickens the whole window, not one side; deterministic, so server and browser draw the same rain); `pointerToUnit` / `layerOffset` (near layers move more, opposite to the pointer, clamped, no `-0`, safe on a zero-size rect); `sceneVars` (rain level -> streak share, fire level -> room warmth with a floor so the room is never dark).
- **What follows the mixer:** the **rain** slider sets how many streaks are on the glass (up to 48) and how fast they fall, and greys the day sky; the **fire** slider warms the lamp and candle glow (0.4 -> 1). Both are CSS variables, so the sliders do not re-render the layers per frame.
- **Placeholder art, two layer sets** (Night study cafe: stars, two skylines with lit windows, a neon sign, rain, window frame, warm glow, desk with lamp / books / candle / steaming cup / plant, vignette. Sunny cafe: sky + sun + drifting clouds, two hills with a small windmill, overcast tint with rain, dust motes, the same room in daylight). Animations are CSS `transform` / `opacity` only (rain, candle flame, glow flicker, steam, star twinkle, clouds, windmill, motes).
- **Reduced motion = a still picture:** every scene animation is `none`, the rain sits at its resting spots, the steam is a faint wisp, layer transitions are off, and parallax is not applied. Parallax also ignores touch pointers.
- `/chill` is now: title, the scene, then the "Tap to begin" card and the mixer. Focus Mode and the page margins stay blank (decoration zones are the Stage 2 brainstorm).

**Verified (Playwright, signed in, localhost):**
- **Rain slider 0 / 10 / 20 / 30 / 40 / 50 / 100 -> 0 / 5 / 10 / 15 / 20 / 24 / 48 visible streaks**; fire 0 -> 100 -> glow opacity 0.4 -> 1; flipping the theme live swapped the layer set (night 8 layers, day 9 with `motes`).
- **Parallax:** pointer at the bottom-right -> offsets sky -0.4 px, far -1.8, near -3.9, rain -5.7, frame -8.0, glow -9.8, motes -10.7, interior -13.4, vignette 0 (ordered by depth); top-left mirrors the signs; leaving the scene resets every layer to 0; a synthetic **touch** pointermove changes nothing.
- **Reduced motion** (`emulateMedia`): parallax offsets all 0, `animation-name: none` on rain, flame, steam, glow, clouds, windmill and motes, the layer transform `none`, rain streaks static at their resting `translateY` (228 px), steam opacity 0.4; back to `no-preference`: `sc-fall`, `sc-flame`, `sc-steam`, `sc-glow-flicker` running again.
- **Hydration:** 3 loads of /chill per theme (6 total), each with the right scene for its theme (`cafe-night` 8 layers, `cafe-day` 9) and **zero console errors or warnings**.
- **Phone (390 px):** the scene is 327 x 184 (16:9), no horizontal overflow; both themes checked by screenshot.
- **The phase exit criterion, on a fresh device:** before the click no audio graph exists and the scene is already moving; **one click on Begin** -> context `running`, 5 layers, output RMS 0.125; the rain slider moves both the sound (RMS 0.064 -> 0.101) and the scene (0 -> 48 streaks); the streaks keep moving between samples (animating).
- The test row in `mixer_state` is deleted. `typecheck` + `lint` + `test` (**301**) + `build` green; `/chill` 5.24 kB (First Load 104 kB), `/today` 33.9 kB, `/focus` 6.79 kB.

---

### Phase 6 summary (hand-off)

Five boxes, five commits: `ambient_layers` (Session 33), the Web Audio engine and five synthesized layers (34), the mixer UI (35), `mixer_state` persistence (36), the scene (37). **301 unit tests** (was 154 at the end of Phase 5), plus the live checks above. Two migrations (`20261005221502`, `20261005223316`). No Figma file was touched or created. Nothing was downloaded: every sound is generated in the browser.

**For Minh to check by ear and eye (a headless browser cannot judge these):**
1. **Do the five layers sound right?** On /chill press Begin and listen to each alone (set the others to 0): rain (hiss + droplets), fireplace (low roar + crackles), keyboard (typing bursts, then pauses), cafe chatter (murmuring voices, a cup clink every ~10 s), piano (sparse pentatonic notes, the first within a second). Cafe and piano are the hardest to make convincing; per the plan, tell me which layer you dislike and I swap just that one for a royalty-free file (and ask before downloading anything).
2. **Loudness and blend:** is the master loud enough at 80 %, do the layers sit together at the default mix (rain 60, keyboard 20, cafe 30, piano 30)? Per-layer `trim` values are in `lib/audio/layers.ts` and are one-line changes.
3. **Left running in a background tab for a few minutes:** does the rain keep its droplets and the keyboard its typing (the scheduler runs on a Web Worker timer so browsers should not starve it)?
4. **Prod smoke test with your real account:** Begin, move two sliders, reload (state restored), open another browser or device (same mix).
5. The scene is **placeholder art**: judge the mechanism (rain thickens with the slider, warmth with fire, parallax, theme swap, still under reduced motion), not the drawing.

**Known follow-ups (not blockers):** the favicon 404 (no icon file exists); the top bar still shows the hard-coded "Sep 14 – 20, 2026"; the mini-mixer is hidden under 768 px with the rest of the sidebar (the top-bar button and /chill are the phone controls); a scene fullscreen / "screensaver" mode and scene art in Focus Mode are Stage 2 ideas; `mixer_state.current_track_id` waits for Phase 7.

**Next — Phase 7 (music: upload + player + suggestions)**, unless Minh's ears ask for layer changes first.

**Blocked on:** nothing.

---

## 2026-10-05 — Session 38: Chill top bar + full-screen scene (feedback pass)

Minh's feedback on /chill: the Day / Week / Month switcher has no job there (hidden in the previous commit); the Today button, prev / next arrows, the hard-coded date and Search have none either, so show the **current day and time** instead; and make the scene **full screen, like a real environment**. (The design of all of this is still temporary; the Figma stage redoes it.)

**What landed:**
- **Top bar on /chill:** Today, the arrows, the hard-coded "Sep 14 – 20, 2026", Search and the view switcher are gone; a live **"Mon, Oct 5 · 8:24 PM"** (`ClockLabel`, `lib/clock.ts`) takes the title's place, in the visitor's own locale, clock style and time zone, updating on the minute (and when a background tab returns, since throttled timers drift). The server renders nothing for it and the browser fills it in, so there is no hydration mismatch. The sound button, settings and theme toggle stay. Other pages are unchanged.
- **Full screen** (`ChillStage`, `Immersive`): a "Full screen" button on the scene asks the browser for real fullscreen (best effort, from the click) and fills the window with the scene either way (`Scene fill`: the layers use `slice`, so any screen shape is covered and the edges crop). On it: a big clock and date, an Exit button, and a pill with Play sound (before sound starts) or Pause / mute / master volume. **The controls fade after 3.5 s** so it can be left running like a screensaver; a pointer move, a tap or Tab brings them back (and the cursor hides while idle). Esc, the Exit button, or the browser's own fullscreen exit leave it; the sound keeps playing. Space plays / pauses. The page behind is inert and does not scroll while it is open, focus is trapped inside and returns to the Full screen button on close. Parallax still follows the mouse. Only one copy of the scene SVG exists at a time.
- A **usability bug found by the test, fixed:** focus first went to the Exit button, so pressing Space (play / pause) would have pressed Exit and closed the view. Focus now starts on the dialog itself. A related guard: **the tap that wakes hidden controls is swallowed**, so on a touch screen the first tap never presses a button that was invisible a moment earlier.

**Verified (Playwright, signed in, localhost):** /chill header on 3 loads: only Menu, sound, Settings and the theme toggle, no "Sep 14", no tablist, clock text equal to the browser's own time; /today keeps Today, both arrows, Search and the switcher. Full screen: the stage was exactly the viewport (1280 x 800) with **real fullscreen granted**, one live scene, body scroll locked, the rest of the page inert; controls opacity 1 -> **0 after 4.2 s idle** -> 1 after a mouse move; F opens nothing (Focus Mode is /focus-only); Space started the sound (graph running, RMS 0.105) without closing the view; mute inside the overlay -> master target 0, RMS 0; 8 Tabs stayed inside and Shift+Tab from the dialog wrapped to the last control; **a real click on the hidden Pause button only woke the controls (still playing), the next click paused**; Esc closed it with the sound still running, focus back on "Full screen", no inert elements or scroll lock left; `document.exitFullscreen()` (what the browser's Esc does) closed the overlay too. Phone 390 x 844: the scene fills it, the pill fits. Night and day looked right. Zero console errors or warnings (only the favicon 404). `typecheck` + `lint` + `test` (**307**, +6 clock tests) + `build` green; `/chill` 7.42 kB (First Load 107 kB).

**Known / for Stage 2:** on a tall portrait phone the 16:9 art is cropped to its middle (a portrait variant of the scene is a design item); the favicon (the tab icon) still does not exist.

---

## 2026-10-05 — Session 39: Phase 7 limits set, kickoff prepared

Minh asked what Phase 7 is and said he wants **all core functions built and tested before any design or small adjustments**. Phase 7 (music: upload, playlists, a persistent player, music for focus sessions, track suggestions, community picks) is next; the remaining core work after it is Phase 8 (motivation), Phase 9's functional items, and a sweep of the controls that are still inert (view switcher, sidebar Create / mini-month, Search, Settings, categories / timezone editing), then Minh's manual test, then Stage 2 (Figma).

**Decision (Minh): music is MP3 only, at most 10 tracks per user** (was 20 tracks, mp3 + m4a + ogg in the original planning; Session 1 above is left as history). I proposed 10 MB per file and 50 MB per user in total (to be confirmed at the start of Phase 7). Updated: PRD (6.7 and constraints), ERD (`music_tracks` constraint), ARCHITECTURE (upload checks), USER_STORIES (US-6.2, plus a refusal-by-reason story), ROADMAP (Phase 7 limits).

`docs/PHASE7_KICKOFF.md` is the hand-over: state of play (three commits not yet pushed), five decisions to confirm with recommended answers (size limits, where the music UI lives, where the focus-music choice is stored, how the admin is identified, how music and ambient volumes relate), a six-box plan with the technical approach for each (including the race-safe quota trigger, server-side verification of the uploaded object with orphan cleanup, signed URLs for a private bucket, a pure queue state machine, a link allow-list for suggestions, and an atomic admin approve function), a headless test plan (generated silent MP3 fixtures so nothing is downloaded, RLS and storage-policy tests in SQL, expected-failure tests by reason), gotchas learned in Phase 6, open items, and a paste-ready first message.

No application code changed this session.

---

## 2026-10-06 — Session 40: Phase 7 begins — music bucket, `music_tracks`, upload (Phase 7, Box 1)

**Brief:** Minh is away, so all six Phase 7 boxes are built in this run, one commit each, pushed at the end. His answers: MP3 only, at most 10 tracks per user; (A) 10 MB per file, 50 MB in total; (B) a Music section on /chill plus a persistent mini-player on every page; (C) the focus-session music choice is stored per device in localStorage; (D) admin = an `admins` table; (E) independent music and ambient volumes, no ducking. The three commits left over from Phase 6 were pushed first. UI is plain on purpose (Figma stage later; Figma untouched).

**What landed:**
- Migrations `20261006003834_phase7_music_tracks` and `20261006004500_phase7_music_room_fn`. Private bucket `music` (10 MB, `audio/mpeg` only). Storage policies: read / delete under `{user_id}/`; insert only a generated `{user_id}/{uuid}.mp3` while the user holds fewer than 10 objects and under 50 MB; no update policy. `music_tracks` per the ERD (updated): `storage_path` must equal `{user_id}/{id}.mp3` (a CHECK), a user may update only `title` / `artist` (column privileges), and a BEFORE INSERT trigger under a per-user advisory lock raises `too_big` / `library_full` / `quota_exceeded`.
- **The first policy recursed** (a subquery on `storage.objects` inside a policy on `storage.objects`: `42P17`), so the count moved into `private.music_room_left()`, a no-argument SECURITY DEFINER helper in a schema the API does not expose; only `authenticated` may execute it.
- **Pure, unit-tested logic** (`lib/music/`, 70 new tests): limits and named reasons; `checkQuota` (the order of refusals is pinned); an MP3 sniffer (ID3v2 header validation with syncsafe size, MPEG-1/2/2.5 Layer III frame header parsing with the frame length, and a **two-frame chain check**, so a text file or an M4A renamed `.mp3` fails; works from a browser `File.slice` and from a server Range request alike); title / file-name cleaning; and the upload pipeline with injected network, which says which stage refused and whether a request had been sent.
- **Upload flow:** the browser checks type / size / count / real bytes / duration (no request at all for an obvious refusal) -> `prepareUpload` re-checks and returns a one-time signed upload URL for a generated name -> the file goes straight to storage -> `finalizeTrack` looks at the *stored* object (its real size and type, never the client's claim), sniffs its first bytes through a Range read, inserts the row, and **deletes the object if anything fails**. `prepareUpload` also sweeps abandoned objects (no row, older than 15 min). `renameTrack`, `deleteTrack` (object first, then the row) and `getTrackUrl` (1 h signed URL for Box 3) complete the actions. The Supabase browser client is imported lazily (it added 70 kB to /chill otherwise).
- UI: `MusicProvider` in the app layout holds the library (read on the server, so no hydration mismatch; actions revalidate the layout); `MusicLibrary` on /chill: usage line, file chooser (multiple), per-file results with the reason in words and in `data-reason`, a list with inline rename and a two-step delete.

**Verified (signed in as the throwaway account, localhost, real server actions and storage; fixtures were generated in a script, nothing was downloaded):**
- **SQL as `authenticated` with real JWT claims** (aborting block, nothing left): own insert ok; insert as another user `42501`; bad path / non-mp3 mime / empty title / zero duration each `23514`; rename ok; update of size, path or user_id `42501`; another user sees 0 rows and updates / deletes 0; the 10th row ok and the **11th `library_full`**; **10 MB + 1 `too_big`**; **five 10 MB files = exactly 50 MB accepted and one more byte `quota_exceeded`**; `anon` `42501`. **Storage policies:** own folder ok; another user's folder, a non-uuid name, a `.ogg` name, a nested path and a root-level name each `42501`; another user's object invisible, not deletable, not updatable; the 11th object and any object past 50 MB stored `42501`; `anon` sees 0 and cannot insert or call the helper. Security advisors: only the old leaked-password toggle.
- **Through the Storage API with the user's JWT:** an 10 MB + 1 body -> "exceeded the maximum allowed size"; `audio/ogg` and `text/plain` -> "mime type ... is not supported"; a non-uuid name and another user's folder -> row-level-security violation; no auth -> refused; listing / reading another user's folder -> 0 / refused; nine raw uploads succeeded next to the existing one and the 10th-12th were refused.
- **Through the real file chooser:** a valid upload sends exactly prepare POST, storage PUT, finalize POST; the row's size and mime equal the stored object's. A text file, a PNG, a WAV (all named `.mp3`), an empty file, a valid MP3 named `.ogg` and an 11 MB file are each refused **in the browser with `not_mp3` / `not_mp3` / `not_mp3` / `bad_size` / `not_mp3` / `too_big` and zero requests sent**; nothing in storage, no row. As a **client that skips its own checks**: a text file named `.mp3` is refused by the server at finalize with `not_mp3` and **the object is removed**; an `audio/ogg` claim is `not_mp3` at prepare; an 11 MB file `too_big` at prepare; an empty file `bad_size` at prepare.
- **Limits end to end:** 10 uploads succeed (nine from one multi-file selection); the 11th is `library_full` both in the browser (0 requests) and, with checks skipped, from the server; **two simultaneous uploads with one slot left: exactly one succeeds**, the other is refused, and rows = objects = 10 afterwards. Five 9.5 MB files = 47.5 MB, then a 3 MB file is `quota_exceeded` in the browser (0 requests) and from the server (prepare). Rename persists across a reload; an empty title is `bad_title` (one request sent, title unchanged); delete needs a confirm ("Keep" cancels) and removes the object and the row. **Signed out mid-session** (cookies dropped, page open): upload, rename and delete each send their request, resolve with no result and show `unauthenticated`; the data is untouched.
- **Hydration:** /chill x2, /today, /chill again after signing back in: the same usage text and zero console errors or warnings (only the old favicon 404).
- `typecheck` + `lint` + `test` (**377**, +70) + `build` green; `/chill` 11.5 kB (First Load 111 kB).

**Found while testing (fixed):** (1) one large upload's finalize **hung for 60 s** on the server's storage read and returned `db_error` while leaving its object behind. The Range read now has a 10 s timeout and one retry, an unreadable object is reported as the retryable `upload_failed`, and **every failure after the id is valid removes the object** (the `list` failure path had not). (2) A refusal by the insert policy at prepare said `upload_failed`; it now says `library_full` (the name is generated, so only the cap can refuse it). The orphan that (1) left is the test of the 15-minute sweep, checked in Box 2.

**Not covered:** the 10th-row race is tested end to end (one of two wins) but not with two truly parallel database sessions; the advisory lock is the standard mechanism. Duration is whatever the browser's decoder says (display only; seeking uses the real audio).

**Next — Box 2:** playlists.

---

## 2026-10-06 — Session 41: Playlists (Phase 7, Box 2)

**What landed:**
- Migration `20261006005156_phase7_playlists`. `playlists` (name 1-60, at most 20 per user via a locking trigger, `playlist_limit`) and `playlist_tracks` (PK `(playlist_id, track_id)`, `position` unique per playlist but **deferred**, so a reorder can rewrite every row in one statement). RLS: own playlists only on every command; a link needs the **playlist and the track both to be the caller's own** (the FK alone would take anyone's id); a user can update only `name` / `position`. Adding and reordering are two **SECURITY INVOKER** functions (`add_playlist_track`, `reorder_playlist`), so RLS still applies, the next position cannot be claimed twice, and a reorder either rewrites every position or none; `reorder_playlist` insists the array is exactly the playlist's own tracks, each once (`bad_order`). ERD updated.
- `lib/music/playlist.ts` (14 new tests): name validation, `moveItem` / `moveUp` / `moveDown`, `isPermutation`, and a **seeded `shuffle`** (always a permutation, stable per seed, optional `first` pinned to the front so shuffling while a track plays does not skip it, uniform over positions across 2000 seeds). Box 3's queue uses it.
- Actions (`app/(app)/chill/playlist-actions.ts`): create / rename / delete / add / remove / reorder, each checking the session and its input, with named reasons (`bad_name`, `playlist_limit`, `already_in_playlist`, `not_found`, `bad_order`, `bad_id`, `unauthenticated`); database refusals map by exception message or SQLSTATE (23505 duplicate, 42501 / 23503 someone else's or missing track).
- UI (plain): a Playlists section on /chill: create form with a counter, per playlist inline rename, two-step delete, an ordered track list with **up / down / remove buttons** (keyboard and screen reader friendly, ends disabled) and an "Add a track" select that lists only tracks not already in it. The layout now also reads playlists (embedded `playlist_tracks`, ordered by position), so the list survives reloads without a hydration mismatch.

**Verified (signed in, localhost, real actions; SQL as `authenticated` with real JWT claims in an aborting block):**
- **SQL:** create ok; empty and 61-char names `23514`; creating one as another user `42501`; add gives positions 0, 1; the same track twice `23505`; **another user's track `42501`**; an unknown playlist `not_found`; reorder works; **missing, duplicate, foreign and extra ids each `bad_order` and the order is unchanged**; a direct two-row position swap in one statement is accepted (deferred unique); changing `track_id`, `playlist_id` or the owner `42501`; another user sees 0 playlists and 0 links, calling add / reorder on mine gives `not_found`, a direct link insert `42501`, and their rename / update / delete touch 0 rows; **the 21st playlist `playlist_limit`**; deleting a track removes its link, deleting a playlist removes its links; `anon` is refused on both tables and on the functions. Advisors: security only the old toggle; performance only unused indexes on `time_blocks` (not ours).
- **UI:** an empty name sends one request and is `bad_name`; a real create shows "FYTEST mix (0 tracks)" and clears the error; three adds appear in order and the select then offers only the track not yet in it; moving a track up twice gives the new order, the top "up" button is disabled, and **the order survives a reload**; 20 playlists via the form, the 21st is `playlist_limit` with the count still 20; two-step delete of 19 playlists; **deleting a library track removes it from the playlist**; remove-from-playlist leaves the library untouched.
- **Forged calls** (the actions called directly with inputs the UI never sends): duplicate add `already_in_playlist`; another user's track, an unknown track, an unknown playlist, removing a non-member, renaming or deleting an unknown playlist each `not_found`; non-uuid ids `bad_id`; reorders with a missing, duplicated, foreign, other-user's, non-uuid or non-array list each `bad_order` with the order unchanged; empty and 61-char rename `bad_name`.
- **Signed out mid-session:** create and add each send their request, resolve with no result and show `unauthenticated`; the database is unchanged.
- **Hydration:** /chill x2, /focus, /chill again: the same playlist text and zero console errors or warnings (only the dev server's own CSS-preload notes).
- **The 15-minute orphan sweep from Box 1, finally exercised:** the 9.5 MB object left behind by the hung finalize (storage 4 objects, 3 rows) was gone after the next normal upload (4 rows, 4 objects, 0 orphans), and that upload itself, which was younger than 15 minutes, was not touched.

`typecheck` + `lint` + `test` (**391**, +14) + `build` green; `/chill` 13.4 kB (First Load 113 kB).

**Next — Box 3:** player engine + mini-player.

---

## 2026-10-06 — Session 42: Player engine + mini-player (Phase 7, Box 3)

**What landed:**
- **One audio element, outside React** (`lib/music/player.ts`): created on first use in the browser and kept for the life of the page, so navigating between pages cannot unmount it. **Decision: a plain element with its own `volume` and `muted`, not routed through the shared `AudioContext`.** Routing needs the signed-URL responses to be CORS-clean, an extra failure mode, and buys only iOS volume control; music and ambient volumes are independent (no ducking), which a plain element gives for free. (iOS ignores `element.volume`; known limitation.)
- **Pure queue state machine** (`lib/music/queue.ts`, 36 tests): `playFrom`, `next` (natural end vs button), `previous` (restarts after 3 s), `jump`, `setShuffle` (the playing track stays in front, no interruption), `setRepeat` / `cycleRepeat` (off -> all -> one), `reconcile` (the library or a playlist changed under the queue), `sanitizeQueue` (localStorage is hostile). Every transition returns the new state and an `action` (`play` / `restart` / `stop` / `keep`) that says what to do about playback. Repeat all with shuffle starts each lap with a fresh permutation that does not begin with the track just played.
- **Signed-URL cache** (`lib/music/signed-url.ts`): a URL with under 2 minutes left counts as expired, simultaneous requests for a track share one fetch, failures are not cached, a signed-out answer (no result) is `unauthenticated`.
- **Playback engine** (`lib/music/engine.ts`, 32 tests with a fake element): `load(id, {play})` never starts anything unless asked; `play()` on a prepared track with a good URL calls `audio.play()` synchronously (inside the click, which is what iOS Safari wants); an expired URL (the element errors, or play after a long pause) fetches a fresh one and **resumes from the same position**; after two consecutive failures it gives up with a named problem (`blocked` / `unavailable` / `unauthenticated`) and cancels any recovery still in flight; switching tracks stops the old one at once; a slow answer for an old track never overwrites a newer one.
- **Store** (`lib/music/store.ts`, 30 tests with a mocked engine): `fy-music` (persisted: queue, source, volume, mute, position; **`playing` is never persisted**, `skipHydration` like the other stores). `syncLibrary` keeps the queue in step with uploads, deletes and playlist reorders: deleting the playing track carries on with the next (or just prepares it when paused); an emptied library unloads; a deleted source playlist falls back to the library.
- **Account memory:** migration `20261006010307_phase7_mixer_current_track`: `mixer_state.current_track_id` is now a FK (on delete set null) and the insert / update policies require the track to be the caller's own. `saveCurrentTrack` is a **partial upsert**, so it never touches levels, master or mute (checked in the database); the player saves a change of track after 1.5 s and opens a new device on that track, paused. A row with empty `levels` now means "no mix saved" (the layout treats it so, otherwise a customised local-only mix would lose to defaults).
- **UI:** `MiniPlayer` at the bottom of every page (sticky, and in the flow, so it takes its own space at the end of the page and never covers a page's controls): previous / play-pause / next, title, artist and source, a seek slider with `aria-valuetext` ("0:03 of 0:04"), shuffle and repeat toggles, **mute always visible**, a music-volume slider (hidden under 640 px; mute stays). With no track chosen it shows one "Play my music" button; with an empty library it is absent. Play buttons on every library track, every playlist and every playlist entry. **Media Session:** metadata, playback state, play / pause / previous / next / seek handlers, position state.

**Verified (signed in, localhost, the real `<audio>` element decoding the generated silent MP3s):**
- **Nothing before a click:** a fresh device shows "Play my music", `paused` true, `played` empty, `src` empty, **0 media requests** over 1.5 s. A saved queue is prepared with `preload=metadata`, never started.
- **Across pages:** after one click, four client-side navigations (/today, /diary, /focus, /chill) kept the **same element** (identity checked) playing with `currentTime` advancing 6.6 -> 10.6 -> 13.6 -> 16.8 -> 19.2.
- **Controls:** seek to 300 s lands at 300.6 s with "5:00 of 10:23"; previous past 3 s restarts, again at the start restarts; pause freezes the clock, resume continues; volume 30 % -> element volume 0.3 and `aria-valuetext` "Music volume, 30 percent"; mute sets the element muted; **ambient master untouched** (0.5). Next, previous, jump and the play buttons load the right tracks. Auto-advance runs 03 -> 05 -> stops at the end of the queue (repeat off) **parked on the first track, paused**. Repeat one loops a 2 s track (0.2 -> 1.9 -> 0.2 ...); repeat all wraps; shuffle on keeps the playing track first, four nexts play all four tracks exactly once, then it stops, and shuffle off restores the library order on the same track.
- **URL refresh:** with playback healthy at 200 s an `error` was fired on the element: a new URL was fetched and the track **resumed at 200.8 s**, playing, no problem shown. Three errors at once: the player gives up and says "This track could not be played. Try another, or press play to retry." (`unavailable`), `playing` false; pressing play recovers. (First run caught a bug: the earlier in-flight recoveries finished after the give-up and restarted playback; the give-up now cancels them, with a regression test.)
- **Restore:** position saved on pause; **three reloads each opened on the same track at 2:00, paused, never played, zero console errors or warnings**. A "new device" (storage cleared before the app boots) opened on the account's remembered track (`FYTEST-03`) on three loads, paused. The account row changed only `current_track_id` (the mix in the row was intact). Forged `saveCurrentTrack`: not a uuid / missing / a number -> `bad_id`; an unknown id and **another user's track** -> `not_found`; null clears it.
- **Deleting the playing track** (repeat one, playing): the queue carried on with the next track, still playing, no problem, **no flash of the empty "Play my music" state** (first run showed one for a frame; fixed).
- **Signed out mid-session:** pressing next sent its request, got no result, and showed `unauthenticated` ("Sign in again to play your music."), nothing playing.
- **Media Session:** title, artist and playback state follow the track and the play state; Space and Enter on the play button toggle it; the seek slider moves with the arrow keys; every control has an accessible name (Previous track, Play music, Next track, Seek, Shuffle [pressed], Repeat: off, Mute music [pressed], Music volume).
- **Music and ambient together:** both running (AudioContext `running`); muting ambient leaves the music playing at its own volume; muting music leaves ambient unmuted; pausing ambient leaves the music playing.
- **Phone (390 px):** no horizontal overflow on /chill, /today, /diary or /focus; the bar is 123 px high (three rows), sits at the bottom of the window, the page's own content ends above it, mute is on screen; the volume slider is hidden at that width.
- **SQL (`authenticated`, real JWT claims, aborting block):** own track on `mixer_state` ok; another user's track on update `42501`; an unknown id `42501` (the policy fires before the FK); null ok; **deleting the track clears the reference**; inserting a row as another user `42501`.
- `typecheck` + `lint` + `test` (**489**, +98 this box) + `build` green; `/chill` 12.4 kB (First Load 117 kB), `/today` 33.8 kB, `/focus` 6.79 kB.

**Found, not mine (pre-existing, not changed):** React logs "two children with the same key `2026-10-05`" from `DiaryDayPage` when navigating to /diary (the heatmap probably repeats a date around a week boundary). Filed as a follow-up.

**Not covered:** how music *sounds* and how the bar *feels* (Minh's ears and hands); iOS Safari's gesture rules (the synchronous-play design follows the documented rule, but no iPhone was available); lock-screen controls on a real device (only the Media Session API state could be checked).

**Next — Box 4:** music for focus sessions.

---

## 2026-10-06 — Session 43: Music for focus sessions (Phase 7, Box 4)

**What landed:**
- **The choice** (`lib/focus/music.ts` pure, `musicStore.ts` persisted as `fy-focus-music`, per device in localStorage as Minh decided): *Nothing*, *Ambient sound only*, *a playlist*, or *a track*, plus "Pause it on breaks" (default on). Picker in **Timer settings** on /focus (an `optgroup` for playlists and one for tracks). A choice whose track or playlist has since been deleted (or a playlist that is now empty) shows as "(no longer available)" with a note, and starts nothing. *Community picks are not offered: they are external links and cannot play in the app (the ROADMAP line is amended).*
- **The one rule** (`wantsMusic`, `musicStep`): music is wanted while a timer is running, and on a break only if the person asked for it to carry on; a paused or idle timer wants none. A step is `start` when that flips on and `stop` when it flips off, so the same answer comes out whichever way the timer got there (Start, Pause, Resume, Reset, Skip, the deadline, an auto-started phase). Playing means *resume the same queue if it is already the chosen one*, else start it fresh; a track loops on its own (repeat one) and a playlist loops as a whole (repeat all), so music lasts the whole session. `stop` is a pause, never a rewind. An ambient choice starts / pauses the ambient mixer the same way and never touches the music player.
- **Hooked in without touching the timer's state machine** (`lib/focus/timer.ts` is unchanged): the focus store tells an optional hook about each *move* of the timer and whether a person (`user`) or the clock (`tick`) caused it, from inside the click that caused it (that click is the gesture browsers need). **Restoring a saved timer on page load is not a move**, so nothing can start by itself when a page opens. The runner (`musicRunner.ts`) calls the real player and mixer through injected dependencies, so the decision logic is unit-tested without audio.
- **Chime:** at the end of a focus session the music pauses in the same transition that plays the chime (default), so the chime is not masked; with "keep playing on breaks" the music carries on and the chime plays over it (no ducking, per decision E).
- **Support in Box 3's code:** a queue source can now be a single `track` (it is not widened to the whole library by a sync); `playList` takes an optional repeat mode; the music store keeps a non-persisted library snapshot for code outside React.

**Verified (signed in, localhost, real clicks on the real timer; a separate dev server on port 3100 because another session held 3000, with 1-minute phases):**
- **Never on load:** with a playlist chosen, reloading /focus left the player paused (`paused` true, `played` empty); **with the timer restored as running, three reloads in a row never started the music** and showed no problem.
- **Start / Pause / Resume / Reset:** "Start focus" played the playlist at once (source playlist, repeat all); Pause paused it and the clock stayed frozen; Resume continued from where it was (not restarted); Reset paused it; Start again continued the same queue.
- **A session to its end:** the music played through the minute, and when the phase ended it **paused in the same transition** as the break began (chime context running); "Start break" left it paused (pause on breaks); skipping the break left it paused.
- **Keep playing on breaks + auto-start:** focus -> break was sampled every 4 s: the break started automatically and the music **never paused or restarted** (74 -> 147 s, continuous).
- **Ambient only:** Start started the ambient mixer (music untouched); pausing the timer paused the mixer. **A single track:** source `track`, repeat one, the mini-player says "One track"; Reset paused it. **Nothing:** Start left the music alone.
- **Deleted choice:** the picker showed "(no longer available)" and "That track is gone, so no music will play. Pick another."; Start started the timer with no music and no problem.
- **Hydration:** /focus x3 with a choice saved: the picker showed the saved playlist each time, zero console errors or warnings.
- **Signed out:** a track whose signed URL was already fetched at page load keeps playing (the URL is a one-hour bearer link by design); a track that needs a fresh URL is refused by name (`unauthenticated`), verified in Box 3.
- Unit tests: **+38** (`music.test.ts` 26: every way the timer can move, sanitising, resolving a choice, the runner with fakes; the timer hook in `store.test.ts`: `user` vs `tick`, nothing on restore / settings / no-op ticks, away completions are `tick` never a start; the track source in the music store). `typecheck` + `lint` + `test` (**527**) + `build` green; `/focus` 6.62 kB (First Load 118 kB).

**Not covered:** whether a break's music handover *feels* right, and how the chime sounds over music (Minh's ears); Safari's gesture rule for auto-started phases (an auto-started focus phase after a break calls play without a click: Chrome allows it once the page has been clicked, anything refusing it shows the "browser blocked playback" note instead of failing silently).

**Next — Box 5:** suggest a track + `track_suggestions`.

---

## 2026-10-06 — Session 44: Suggest a track (Phase 7, Box 5)

**What landed:**
- Migration `20261006012739_phase7_admins_track_suggestions`. **`admins`** (decision D): RLS on with one policy (read your own row); writes revoked, so only a migration changes it; it is filled for Minh's account, looked up by email so no id is hard-coded; `private.is_admin()` answers for policies. **`track_suggestions`** per the ERD (updated): insert only as yourself and only `pending`; read own, or all if admin; update admin only and only `status` / `reviewed_by`; a user may withdraw their own *pending* suggestion; a locking trigger allows at most **5 pending** per user (`too_many_pending`). The link is checked in the database too (`suggestion_link_ok`: https, allow-listed host, no whitespace or control characters, ≤ 500).
- **Link validation** (`lib/music/links.ts`, 60 tests with the suggestion rules): the address is parsed like a browser would, so look-alikes fail by name: `http:` / `javascript:` / `data:` / `file:` -> `link_not_https`; `youtube.com@evil.com` and `user:pass@` -> `link_has_credentials`; `youtube.com.evil.com`, `evilyoutube.com`, `youtu.be.evil.com`, a subdomain, a port, a trailing dot, a Cyrillic or punycode look-alike, an IP, `localhost` -> `link_host_not_allowed`; no scheme, `//host`, whitespace, control or direction-override characters, or an invalid punycode label -> `link_malformed`; over 500 -> `link_too_long`. A property test shows **every accepted link, in its canonical form, also passes the database's rule**. The stored link is the parser's canonical href, never the raw text.
- **Action** (`suggest-actions.ts`): `suggestTrack` validates every field (`bad_title`, `bad_artist`, the link reasons, `bad_reason`) and copies **only the four fields**, so a client cannot choose the status, the reviewer, the owner or the id; the database re-checks everything; `withdrawSuggestion` (not yours, already reviewed or gone are all `not_found`).
- **UI:** a "Suggest a track" section on /chill (title, artist, link, reason; a "waiting for review" counter; a thank-you message), and "Your suggestions" with their status and Withdraw for pending ones. Links render as text plus a button that opens them in a **new tab with `rel="noopener noreferrer"`**; nothing is embedded; a link is made clickable only if it passes the allow-list again at render time, so even a bad row could never become a `javascript:` link. The page reads "mine" **filtered by user** because RLS also lets an admin read everyone's.
- Messages are in words next to each field and carried in `data-reason`.

**Verified (signed in, localhost, real actions; database as `authenticated` with real JWT claims in an aborting block):**
- **SQL:** a non-admin sees no rows in `admins`, `is_admin()` is false, self-promoting, updating or deleting `admins` is `42501`; Minh's account sees its own row and `is_admin()` is true, and even he cannot write `admins`; `anon` is refused on `admins`, `is_admin()` and `track_suggestions`. **All 19 look-alike links are refused and all 9 legitimate forms accepted at the database level**; 501 characters `23514`. Own insert ok; inserting as `approved`, with a `reviewed_by`, or as another user `42501`; an empty title and a 501-character reason `23514`; **the 6th pending `too_many_pending`**; a user sees only their own (5), the admin sees all; a user approving their own changes 0 rows and editing a title is `42501`; the admin approves (1 row) but cannot edit a title (`42501`), a bad status is `23514`, and the admin cannot delete someone else's (0 rows); a user withdraws their pending ones (4 rows) but not an approved one (0). Advisors: security only the old toggle; performance only "unused index" on the new, still-empty tables.
- **Live form:** a good suggestion shows the thank-you, clears the form and appears as "Waiting for review" with an "Open link" anchor (`target=_blank`, `rel="noopener noreferrer"`). **Ten refusals, each by its reason with one request sent and nothing stored:** empty title `bad_title`; `http://` and `javascript:` `link_not_https`; `youtube.com.evil.com` `link_host_not_allowed`; `youtube.com@evil.com` `link_has_credentials`; `youtube.com/x` and a link with a space `link_malformed`; 517 characters `link_too_long`; a 130-character artist `bad_artist`; a 520-character reason `bad_reason`.
- **Markup is text:** a title of `<img src=x onerror=alert(1)>`, an artist of `<b>bold</b>` and a reason with a `<script>` and a `javascript:` anchor were stored and shown literally: **0 injected images, scripts, bold elements or `javascript:` links, 0 dialogs**.
- **Forged fields:** a call carrying `status: approved`, a `reviewed_by`, a `suggested_by` of another user and an `id` was stored as `pending`, owned by the caller, no reviewer, with its own generated id (checked in the table).
- **The cap end to end:** five pending (counter "5 of 5 waiting"), the 6th `too_many_pending` (one request, list unchanged); withdrawing one made room and the 6th went through; withdrawing an unknown id `not_found`, a malformed one `bad_id`. **Signed out:** the submit sent its request, resolved with no result, and showed `unauthenticated`, nothing stored. **Hydration:** /chill x3 with 5 suggestions, zero console errors or warnings.
- `typecheck` + `lint` + `test` (**587**, +60) + `build` green; `/chill` 14 kB (First Load 120 kB).

**Not covered:** whether the thank-you and the form feel right (design pass); spam beyond the 5-pending cap (the admin can reject; rate limits are a Phase 9 question).

**Next — Box 6:** community picks and the admin review.

---

## 2026-10-06 — Session 45: Community picks + admin review (Phase 7, Box 6)

**What landed:**
- Migration `20261006013214_phase7_community_picks`. **`community_picks`** (title, artist, link under the same allow-list check, a note, an optional `suggestion_id` that is unique so one suggestion yields at most one pick, `sort_order`): read by every signed-in user, **insert / update / delete only for an admin** (policies through `private.is_admin()`), nothing for `anon`.
- **`review_suggestion(id, action, note)`**, one database function (SECURITY INVOKER, so RLS still applies to every statement in it; a non-admin could not update a suggestion or insert a pick even without its explicit check). It checks admin (`not_admin`), the action (`bad_action`), the note (`bad_note`), **locks the suggestion row**, then `not_found` / `already_reviewed`; approving **inserts the pick and sets the status together**, rejecting sets the status. Atomic by being one function in one transaction.
- **Actions** (`admin-actions.ts`): `reviewSuggestion` and `removePick`; each checks the session, validates the id / action / note before any round trip, refuses a non-admin by name (`not_admin`) by reading the caller's own `admins` row, and maps the database's reasons (`already_reviewed`, `not_found`, ...).
- **UI (plain):** "Community picks" on /chill for everyone (title, artist, a **Listen** button that opens in a new tab with `rel="noopener noreferrer"`, the note; nothing embedded); an admin also gets **Remove**. "Review suggestions" appears **only for an admin**: the page does not even query other people's pending suggestions for anyone else (RLS would refuse them too), each row shows the title, artist, link ("Open to check"), reason, an optional note and Approve / Reject.

**Verified (signed in, localhost; the test account was made an admin only for the flow and removed again; SQL as `authenticated` with real JWT claims in an aborting block):**
- **SQL:** a non-admin calling `review_suggestion` gets `not_admin`, inserting a pick `42501`, changing a status 0 rows, but can read picks; the admin's approve returns a pick whose title and link are copied from the suggestion, with the note trimmed, the suggestion `approved` and `reviewed_by` set; reject returns null, creates no pick; approving twice, approving a rejected one: `already_reviewed`; bad action, a 501-character note, an unknown id: `bad_action` / `bad_note` / `not_found`, and the suggestion is untouched by refusals. **Atomicity:** with a pick for the suggestion already in the way, the approval failed with `23505` and the suggestion **stayed `pending` with no reviewer**. An admin can edit a pick but not give it a bad link (`23514`), and a second pick for one suggestion is `23505`; a non-admin's update / delete of picks touches 0 rows, the submitter sees their suggestion `approved`, cannot withdraw it (0 rows); an admin removing a pick leaves the suggestion `approved`; `anon` is refused on picks and on the function. Advisors: only the old toggle.
- **A non-admin on /chill:** the picks list is there (empty), **no review section, and the served HTML does not contain "Review suggestions"**; forged `reviewSuggestion` (approve and reject) and `removePick` each came back `not_admin` with a request sent; a malformed id / unknown action / 501-character note `bad_id` / `bad_action` / `bad_note`; the database was untouched (0 picks, 5 pending).
- **As an admin:** the queue lists everyone's pending suggestions (6, including one from Minh's account), while **"Your suggestions" shows only the admin's own** (the page filters by user because RLS lets an admin read all). Approving with a note `  A warm one for rainy days  ` made a pick (note trimmed, Listen link `target=_blank` `rel="noopener noreferrer"`), emptied that queue row and flipped the submitter's list to approved; rejecting removed the queue row and made no pick. **Reviewing again** (approve an approved one, reject an approved one, approve a rejected one) is `already_reviewed`, an unknown id `not_found`. **Three simultaneous reviews of one pending suggestion: one `ok`, two `already_reviewed`, exactly one pick.** Remove deleted the pick and left the suggestion approved.
- **Admin rights taken away while a page was open:** a forged review and remove were `not_admin`, and clicking the stale **Remove** button showed `not_admin`; a fresh load three times showed the picks (1, with Listen and no Remove) and **no review section**, zero console errors or warnings.
- **Phone (390 px):** the whole Music page has no horizontal overflow and its last section ends above the mini-player.
- `typecheck` + `lint` + `test` (**587**, unchanged: this box's logic lives in the database and was proven there and live) + `build` green; `/chill` 14.6 kB (First Load 121 kB).

**Not covered:** an admin's workflow with many suggestions (paging, reordering picks, editing a pick's note after approval: Phase 9 / v1.5), and how the review screen feels (design pass). Minh must check that his own account really is an admin on prod: sign in, the "Review suggestions" section should appear on /chill (it is filled for `qminh30k3@gmail.com` by the migration).

**Next:** the Phase 7 exit run, cleanup of test data, and the hand-off summary.

---

### Phase 7 summary (hand-off)

Six boxes, six commits (Sessions 40-45): the music bucket + `music_tracks` + upload; playlists; the player engine + mini-player; music for focus sessions; track suggestions; community picks + admin review. Seven migrations (`20261006003834`, `…003947`, `…005156`, `…010307`, `…012739`, `…013214`, applied to the live database) and **587 unit tests** (was 307 at the end of Phase 6). No Figma file was touched or created. Nothing was downloaded: the test MP3s were generated by a script (valid silent MPEG-1 Layer III frames, with and without ID3 tags) and the throwaway account's data was removed again.

**Exit criterion, run from scratch on a clean device and account (localhost):** an empty library shows no player; **5 tracks uploaded through the real file chooser** (all `done`, "5 of 10 tracks"); **1 suggestion submitted** (shown as "Waiting for review"); **one click on "Play my music"**, then four client-side navigations (/today, /diary, /focus, /chill): the **same `<audio>` element** kept playing and advancing through the queue. The test data was then deleted through the app (5 tracks and their stored files, the suggestion); the database ended with 0 rows and 0 stored objects. Only Minh's account is an admin.

**For Minh to check by hand (a headless browser cannot judge these):**
1. **Your real music:** upload one of your own MP3s on /chill (<= 10 MB). Does it play, does the seek bar feel right, does the mini-player feel right? Does a big ID3 tag with cover art (a few MB) still upload? (The check handles it; only real files prove it.)
2. **The prod smoke test with your account:** sign in at https://findyourself-mu.vercel.app, upload a track, make a playlist, press play and move between pages. Your account is the admin: **the "Review suggestions" section should appear on /chill** (submit a suggestion from another account or the signup of a friend to see the queue fill; approve it and it appears under Community picks).
3. **Focus music:** /focus -> Timer settings -> "Music during focus sessions": pick a playlist, press Start. Does the handover feel right at the end of a session (it pauses so the chime is clear; "Pause it on breaks" off keeps it going)?
4. **A phone:** the mini-player on iOS Safari (its gesture rules and `element.volume` being ignored are the known risks) and the lock-screen controls.
5. **Gaps:** between tracks there is a short pause (the next signed URL is fetched when a track ends). If it bothers you the fix is to prefetch the next track's URL; tell me.

**Known follow-ups (not blockers):**
- **Delete-account (Phase 9) must also remove `{user_id}/` from the `music` bucket:** deleting a user cascades the rows but not the stored files.
- The Diary page logs a React duplicate-key warning on navigation (a pre-existing bug found while testing; filed as its own task).
- A dev-only caveat: another session held port 3000 during Box 4, so tests ran on a second dev server (port 3100, via an untracked launch config); `.claude/launch.json` is unchanged in the repo.
- Chime over music when "keep playing on breaks" is on (no ducking, by decision E).
- Community picks cannot be played inside the app (they are YouTube / Spotify links); the ROADMAP's "choose community picks for focus music" is therefore out of scope.
- Rate limits beyond the 5-pending cap, paging and reordering for an admin with many suggestions: Phase 9 / v1.5.
- Still open from before: Minh's ears on the five ambient layers; the favicon 404; the inert controls sweep (see PHASE7_KICKOFF section 5).

**Next:** Phase 8 (motivation: streak, quotes, weekly wins, progress rings), unless Minh's feedback on the music asks for changes first.

**Blocked on:** nothing.

---

## 2026-10-06 — Session 46: Phase 8 begins — the streak (Phase 8, Box 1)

**Brief (Minh, away; all four boxes in one run, one commit each, push at the end):** (A) a streak day = a day with a diary entry or at least one completed task, in the user's own time zone; a missed day resets to 0 (no grace day); (B) about 120 quotes written for the app, no real-person attributions; (C) the weekly wins card shows focus hours, tasks completed, diary days and the current streak for the local week, from Sunday 18:00; (D) progress rings on /today (there is no separate dashboard): tasks done, focus time against a daily goal, the diary; (E) the streak is computed in the database (a trigger plus a pure function, with unit and SQL tests), never trusted from the client. Core first, no design polish, Figma untouched, nothing downloaded, test data prefixed FYTEST and deleted at the end.

**What landed (migrations `20261006050028_phase8_streak`, `20261006050337_phase8_streak_future_clamp_by_day`):**
- **Found: the client could write its own streak.** `authenticated` held `UPDATE` on `streak_count` / `streak_last_date`. Now `UPDATE` on `profiles` is granted only for `username, display_name, timezone, theme`; the streak columns are written only by `private.refresh_streak` (SECURITY DEFINER, schema not exposed).
- **Found: every profile had `timezone = 'UTC'`** (nothing synced the browser's zone). A streak day needs the person's zone, so `TimeZoneSync` (in the app layout) saves the browser's zone through `saveTimeZone` when it differs (validated with Intl, then by a trigger against `pg_timezone_names`: `bad_timezone`), and the database recomputes the streak when the zone changes.
- **Recompute, not "+1".** After a diary insert / delete / a change that flips "does this day count", a task completion change, or a zone change, the database rebuilds the set of active days from the rows and takes the run ending at the latest one (`private.streak_run(date[])`, a pure gaps-and-islands function). So un-completing a task, deleting an entry, a back-dated entry or a new zone can never leave a wrong number. Stored: `streak_count`, `streak_last_date`, `streak_best` (new, never decreases). A per-person advisory lock serialises two simultaneous events.
- **What counts:** a diary row with text (`content_chars > 0`) **or a mood**; a task with `completed_at`. A day after today never counts (compared by *day*, see below). A back-dated diary entry counts for its own day (writing yesterday's entry this morning is legitimate); the number itself cannot be forged, but the inputs are the person's own rows, so a person could fabricate old rows for themselves. Accepted: it is a personal motivator, not a score.
- **Read time (`lib/streak.ts`, pure, 14 tests):** alive today if the last active day is today (done) or yesterday (at risk: "one thing today keeps it going"); otherwise `current` is 0 and the view says `broken`, with the lapsed length, so the page can show "Welcome back" instead of a reproach. The best streak is kept.
- UI (plain): a Streak card on /today under the header (`data-streak-state` = none / at-risk / done / broken).

**Found by the live test (fixed in the second migration):** my first rule ignored completions with `completed_at > now()`. `setTaskDone` stamps `completed_at` with the **app server's clock**, which can run a moment ahead of the database's, so a task finished this second counted as "future" and the streak stayed 0. The SQL tests had missed it (they used the database's own `now()`). The rule now compares calendar days; a regression case (+5 s counts, +30 h does not) is in `supabase/tests/phase8_streak.sql`.
**Found, not mine, fixed (one line):** the timetable's corner label (`EDT`) was rendered with the *server's* zone and then the browser's, a hydration mismatch for every visitor whose zone is not the server's (on Vercel: everyone but UTC). It now fills in after mount like the NOW line.

**Verified:**
- **SQL (`supabase/tests/phase8_streak.sql`):** 15 cases for `streak_run` (empty, nulls, duplicates, unsorted, gaps, older longer run, month / year / leap-day boundaries, 365 days). As `authenticated` with real JWT claims in an aborting block, on the throwaway account: done today -> 1, +yesterday -> 2, +diary two days back -> 3, an empty diary row does not count, text on it does, un-completing today's task -> run ends yesterday while `best` stays, deleting a diary day breaks the run, a back-fill repairs it, future diary / task days are ignored, +5 s of clock skew counts, an autosave-style edit changes nothing, a zone change moves a 23:30-UTC completion to the next / previous day (UTC -> Ho Chi Minh -> Los Angeles), emptying everything gives 0 with `best` kept; **forging `streak_count`, `streak_last_date`, `streak_best` and inserting a profile are each `42501`**; an unknown or empty zone is `22023 bad_timezone`; another person's profile is untouched (0 rows); `anon` is `42501`.
- **Live (signed in, localhost, real UI):** completing a task -> the chip reads "1 day / A streak begins" after a reload; un-checking it -> 0; re-checking -> 1; setting a mood on the diary -> 1, clearing it -> 0; three backdated task days then a gap -> "Welcome back. A new streak starts with one small thing today." with "best 3 days", identical on three loads; a task from yesterday -> at-risk "One diary line or one finished task today keeps it going"; plus today -> "2 days / Today counts". **Direct PostgREST calls with the user's own token** (nothing echoed): `PATCH` of each streak column -> 403 `42501`, an unknown zone -> 400 `22023 bad_timezone`, a profile insert -> 403 RLS, `anon` -> 401; the row was unchanged afterwards.
- **Zone sync:** the profile moved from `UTC` to the browser's `America/Toronto` on the first visit; a second browser context in `Pacific/Pago_Pago` moved it there and the streak's last day from Oct 6 to Oct 5 (chip "done / 2" for that zone's today); back in Toronto it returned. **Hydration:** /today x3 in each of two zones, zero console errors or warnings (before the one-line fix: a mismatch on every load in the non-server zone).
- `typecheck` + `lint` + `test` (**603**, +14 streak, +2 zone) green (`build` once at the end of the phase, because the dev server is running).

**Not covered:** `saveTimeZone` with an unknown zone from a live browser (the browser cannot produce one; refused by `isKnownTimeZone` in unit tests and by the trigger in SQL); two truly parallel database sessions (the advisory lock is the standard mechanism); a streak that spans a DST change (the zone arithmetic is Postgres's).

**Next — Box 2:** the quotes.

---

## 2026-10-06 — Session 47: The daily quote (Phase 8, Box 2)

**What landed:**
- Migration `20261006050844_phase8_quotes`. `quotes` (`id`, `text` 1-200 and unique, `author` nullable): **120 original lines written for the app** (about focus, rest, small steps, rain, tea), **no author on any row** (decision B: no real-person attributions; none are public-domain-checked, so none are used). Readable by every signed-in user, nothing writable through the API, nothing for `anon`.
- `lib/quotes.ts` (pure, 17 tests): `quoteForDate(iso, quotes)`. The day number (whole days since 1970) is multiplied by a stride coprime with the list length (`strideFor`: the smallest number at or above 38 % of it that is coprime; 47 for 120) modulo the length. So **the same date gives the same quote to everyone**, neighbouring days are far apart, and **any `n` consecutive days show every quote exactly once** (a quote repeats only after a 120-day lap). Rows are sorted by id first, so the order they arrive in does not matter. Malformed dates and empty lists give `null`; rows are validated (`toQuote`), the text is shown as text. Adding quotes later reshuffles the calendar, which is fine.
- A Quote card on /today (above the Streak card); no attribution line unless a row has an author.

**Verified:**
- **SQL (`supabase/tests/phase8_quotes.sql`):** 120 rows, 120 distinct, ids 1-120, longest 91 characters, 0 with an author, none padded. As `authenticated` (real JWT claims): read 120; insert, update and delete each `42501`; `anon` read `42501`.
- **Unit:** pinned golden value (2026-10-06 -> the 5th quote), same date x5, independent of input order, 800 consecutive days never repeat the previous day's quote, a full run of `n` days shows each quote once from four different starts, repeats exactly 120 and 240 days later, every list length 1-200 including dates before 1970, `null` cases, `toQuote` rejects malformed rows.
- **Live (signed in, localhost):** /today x3 in each of three zones, same quote on all three loads and zero console errors or warnings: Toronto and Ho Chi Minh (both Oct 6) show quote 5 ("You don't have to finish today; you only have to begin."), Pago Pago (still Oct 5) shows quote 78 — exactly what the maths predicts, so **two people on the same date see the same line**.
- `typecheck` + `lint` + `test` (**620**, +17) green.

**Not covered:** the quote reading well in the real design (Stage 2); whether 120 lines feel varied across a year (Minh to judge after a few weeks: about three laps per year).

**Next — Box 3:** the weekly wins card.

---

## 2026-10-06 — Session 48: The weekly wins card (Phase 8, Box 3)

**What landed:**
- **When (`lib/wins.ts`, pure):** `winsWindowOpen(nowMs, zone)` is true from **Sunday 18:00 to Monday 00:00 in the person's own zone** (18:00 on Sunday in Auckland is still Sunday morning in Toronto). `msUntilWinsWindow` gives the wait until the next opening, computed from the *wall clock* (new `zonedInstantUTC` in `lib/dates.ts`), not "midnight + 18 hours": Sunday is the usual clock-change day, so the two differ (31 hours from Saturday noon to Sunday 18:00 across New York's fall-back).
- **What (`lib/winsData.ts`):** for the local Monday-Sunday week (reusing the Focus tile's `weekBounds` / `summarizeWeek`, so the two screens agree): focus time and sessions, tasks completed (count by `completed_at` in the week), **diary days** (a date with text or a mood, once each: the same rule as the streak) and the current streak (`streakView`, so the card and the Streak card never disagree). Warm headline (`winsHeadline`): a quiet week says "A quiet week. Rest counts too" and never grades.
- **Card on /today** (`WeeklyWinsCard`, plain): "Your week", the date range, the sentence, and four stats (Focus, Tasks done, Diary days "N of 7", Streak). Decided on the server from the zone cookie; `WinsClock` (renders nothing) asks for a fresh render when Sunday 18:00 arrives in a tab left open (a timer, plus a check when the tab wakes), and does nothing if the card is already showing.
- **A dev-only test hook, `fy-now` cookie** (`lib/nowOverride.ts`, `getNow()` in `lib/today.ts`): in development a cookie holding an ISO instant replaces the server clock for /today, so "Sunday evening" can be tested on a Tuesday. `parseNowOverride` returns null whenever `NODE_ENV` is `production` (unit-tested), so it does nothing on prod. Only /today's `now` / `today` use it; server actions and other pages keep the real clock.

**Verified (signed in, localhost, with seeded FYTEST rows just inside and just outside the week):**
- **Counts (Toronto, week Oct 5-11):** tasks completed Mon 11:00, Wed, Fri, **Sun 22:00 local** (in) and Mon 01:00 local and the Sunday before 23:00 local (out) -> **4**; diary rows with text on Oct 5, a mood-only row Oct 7 (in), an **empty row** Oct 9, and rows on Oct 4 and Oct 12 (out) -> **2 of 7**; focus sessions of 25 min and 10 min (stopped early) inside, plus two outside -> **35m**, headline "4 tasks finished, 35m of focus and 2 days in the diary. That is a real week.", range "Oct 5 – Oct 11", streak line "Starts again with one small thing" (the stored run ended Oct 5). Identical on **three loads, zero console errors or warnings**.
- **The window, live:** no override (a Tuesday) -> no card; Toronto Sunday **17:59 -> no card, 18:00 -> card**; Monday 00:00 -> no card; Hanoi Sunday 17:59 -> no card, 18:00 -> card (the same instant that is Sunday 07:00 in Toronto).
- **A tab left open:** with the browser clock faked to Sunday 17:59:30 the page showed no card; when the timer fired exactly one server render was requested and the card appeared, no errors.
- **Unit (`wins.test.ts` 16, `nowOverride.test.ts` 3):** the window on the minute at both edges; every other weekday closed at four hours of the day; Hanoi, Pago Pago (UTC-11) and Kiritimati (UTC+14); both clock-change Sundays in New York; the countdown (30 h, 1 h, null while open, 150 h from Monday, 31 h across a 25-hour day); **a 400-instant property test over seven zones (Lord Howe's half-hour DST included): the countdown always lands on the first millisecond the window is open**; diary counting; clamping; the copy; week labels across month and year ends; the override is off in production and refuses anything that is not a full ISO instant.
- `typecheck` + `lint` + `test` (**639**, +19) green.

**Not covered:** the card's look (Stage 2); a real Sunday evening (Minh); whether `WinsClock`'s timer survives a laptop sleeping through 18:00 (the wake-up check covers it in principle; browsers throttle timers, nothing automated can prove a real sleep); the override's absence from a production build is by its guard and test, to be seen once in the end-of-phase build.

**Next — Box 4:** the progress rings.

---

## 2026-10-06 — Session 49: Progress rings (Phase 8, Box 4)

**What landed:**
- Migration `20261006051425_phase8_daily_focus_goal`: `profiles.daily_focus_goal_minutes` (default 120; CHECK 15..720 in steps of 5), the only Phase 8 column the client may write (column privilege). A profile setting, not a per-device one, so the goal follows the person (the focus-music choice stays per device by an earlier decision).
- `lib/rings.ts` (pure, 20 tests): **tasks** = done today / (done today + still open for today or overdue), so finishing a task moves the ring forward instead of shrinking the denominator; a task finished today that was dated for another day still counts as done; **nothing planned is an empty ring, not a full one**; **focus** = today's focus seconds / the goal, capped at a full ring with the real time still shown ("25m of 15m", "Goal reached"); **diary** = text or a mood today (the streak's rule). Each ring has a value, a detail line and a full sentence for screen readers (`role="img"` + `aria-label`). A stored goal the rules do not accept falls back to the default.
- `saveFocusGoal` (named reasons `bad_goal`, `unauthenticated`, `db_error`; checked in the action and again by the database) and a plain goal picker (`FocusGoalSelect`): presets 30 min to 5 h, plus the saved value if it is not a preset; on a refusal the select goes back to the saved goal and says why.
- `ProgressRings` + a "Today" card on /today, next to the Streak and Quote cards (and "Your week" on Sunday evening). All plain; the real layout is the Figma stage, and the wide empty areas stay blank (decoration space).

**Verified (signed in, localhost):**
- **Live rings, real UI:** baseline 0 of 0 / "Nothing planned for today", 25m of 2h 00m (0.208), diary "Not yet", identical on three loads, zero console errors or warnings; adding two Today tasks -> **0 of 2**; ticking one -> **1 of 2 (0.500)**; both -> **2 of 2, complete, dash offset 0**; un-ticking one -> 1 of 2 again; a mood on the diary -> **Written, complete**; goal 30 min -> **25m of 30m (0.833)**; goal 15 min -> **25m of 15m, 1.000, "Goal reached"**, offset 0.
- **Refusals by reason:** the picker with options the UI never offers (10, 17, 725): each sent one request and showed **`bad_goal`** and the select returned to the saved goal (30), saved goal unchanged after a reload; **direct PostgREST calls with the user's own token**: 17, 10, 725, 0 and -5 -> `23514 profiles_focus_goal_range`, `"abc"` -> `22P02`, null -> `23502`, 15 -> 200, a body that also sets `streak_count` -> 403 `42501`, `anon` -> 401 `42501`. **Signed out mid-session:** the change sent its request, resolved with no result and showed **`unauthenticated`**, the select went back to the saved value.
- **SQL (`supabase/tests/phase8_focus_goal.sql`, as `authenticated`, real claims, aborting block):** 15, 30, 120, 715, 720 accepted; 0, 5, 10, 14, 17, 721, 725, -5 each `23514`; null `23502`; another person's profile 0 rows; streak columns `42501`; `anon` `42501`.
- **Phone (390 px):** no horizontal overflow, the rings card fits its column, three loads with zero console errors or warnings.
- `typecheck` + `lint` + `test` (**659**, +20) green.

**Not covered:** a goal picker for odd goals (the database accepts any step of 5; the picker offers presets); how the rings look and feel (Stage 2); the rings drawing animation (none yet, so nothing to respect under reduced motion).

---

### Phase 8 summary (hand-off)

Four boxes, four commits (Sessions 46-49): the streak, the daily quote, the weekly wins card, the progress rings. Four migrations (`20261006050028`, `…050337`, `…050844`, `…051425`, applied to the live database) and **659 unit tests** (was 587 at the end of Phase 7), plus SQL test files in `supabase/tests/` (`phase8_streak.sql`, `phase8_quotes.sql`, `phase8_focus_goal.sql`). No Figma file was touched or created. Nothing was downloaded (the 120 quotes are original). One production build was green (`/today` 34.9 kB, First Load 124 kB).

**Exit criterion, run on a simulated Sunday evening (localhost, `fy-now` = Sunday 19:00 Toronto):** /today shows "Your week" (2 tasks finished, 25m of focus, 1 day in the diary), the three rings, the Streak card ("Welcome back..."), and the quote of that date (#120), identical on three loads with zero console errors or warnings, and no horizontal overflow at 390 px. A production build with the same cookie ignores it (no card on a Tuesday), and a non-server time zone hydrates cleanly in production. All test data was deleted again (0 FYTEST rows, 0 test tasks / diary / sessions; the test profile reset).

**Layout note:** the four cards sit above the timetable, which pushed the grid below the fold (its header at y=815 px at 1280 wide). The final arrangement: Wins and Rings on full-width rows, the quote and the streak side by side on wide screens (header at y=538 on a weekday, 758 on a Sunday evening). The real placement (a strip, a side column, or a separate home page) is a Stage 2 design item.

**For Minh to check by hand (a headless browser cannot judge these):**
1. **A real Sunday evening:** open /today after 18:00 on a Sunday (local time). Does "Your week" feel right: the sentence, the four numbers, the streak line? Leave /today open from the afternoon: the card should appear by itself at 18:00 (a timer; if your laptop slept through 18:00 it appears when the tab wakes).
2. **The streak with your real habits:** complete a task or write a diary line (a mood alone also counts) for a few days. Does the "day" end where you expect (it is your own time zone, saved on your profile the first time you open the app)? On a missed day, is "Welcome back" gentle enough? Is "one small thing today keeps it going" a good nudge or noise?
3. **The rings:** does "done today / done + still open for today" match how you think about a day's tasks? Is 2 hours a sensible default focus goal (change it with "Daily focus goal")?
4. **The quotes:** read a few days' worth. 120 lines are original and unattributed; tell me which tone to add, drop or change (one line each in the `quotes` table, via a migration).
5. **Prod smoke test with your account:** the migrations are already live, so sign in at https://findyourself-mu.vercel.app after the push deploys and open /today.

**Decisions I made for you (change any):**
- A diary day counts with **text or a mood** (a mood-only check-in keeps a streak).
- A back-dated diary entry counts for its own day, so writing yesterday's entry this morning repairs yesterday (a person could also fabricate old rows for themselves; accepted for a personal motivator). Future days never count.
- The focus goal is a **profile setting** (follows you across devices), default 2 h.
- Rings and the wins card live on /today because there is no dashboard route yet (the ROADMAP's word); a separate home page is a Stage 2 question.
- No grace day (your rule A). If it feels harsh in practice, the change is local: `private.refresh_streak` would count a single missing day as bridged once per week.

**Known follow-ups (not blockers):**
- The favicon 404 and the top bar's hard-coded "Sep 14 – 20, 2026" are still there (from before).
- Time-zone editing UI (US-8.2) does not exist: the zone follows the browser automatically; a manual override is part of the Settings sweep.
- `saveTimeZone` has no live test with an unknown zone (a browser cannot produce one); unit tests and the database trigger cover it.
- Delete-account (Phase 9) must keep removing `{user_id}/` from the `music` bucket (Phase 7 note); the new columns need nothing extra.
- The `fy-now` cookie is a development-only hook (documented in `lib/nowOverride.ts`); remove it if you prefer no test hooks in the repo.

**Next:** the remaining core work before Minh's manual test: Phase 9's functional items (guest demo mode, privacy note, empty states, error boundaries, delete-account) and the sweep of inert controls (view switcher, sidebar Create / mini-month, Search, Settings, categories / timezone editing, the top bar's hard-coded date), then Stage 2 (Figma), unless Minh's feedback on Phases 6-8 asks for changes first.

**Blocked on:** nothing.

---

## 2026-10-06 — Session 50: Feedback pass on /today (layout, top bar, Create)

Minh's feedback after seeing Phase 8: (1) the rings should be at the side, the timetable is the main thing; (2) the top bar's "Sep 14 – 20, 2026" does nothing (remove it, or show today's day and time), and its `<` `>` arrows duplicate the page's Prev / Next (keep only one); (3) the sidebar's **Create** button does nothing; (4) when do Day / Week / Month start?

**What changed:**
- **Layout:** the Wins / Rings / Streak / Quote cards moved out of the top of the page into the **right-hand column** (`TasksShell` got a `side` slot above the Tasks drawer; the column is sticky and scrolls on its own). The timetable starts at the top of the main column again (grid header at y=188 at 1280 wide, was 538-758). The cards were made narrow-column friendly (rings in three equal columns, 64 px; the wins stats in two columns). On a phone the column stacks after the timetable.
- **Top bar:** the hard-coded date is replaced by the live **day and time** ("Tue, Oct 6 · 1:51 AM", already used on /chill, now on every page, in the visitor's zone, no hydration mismatch); the `<` `>` arrows are gone (the timetable keeps its Prev / This week / Next pills, the diary its Prev / Today / Next pills). The Today button stays (it returns to today on the timetable and the diary).
- **Create:** the inert sidebar button is removed. It comes back when a "new block" flow exists (it belongs with the mini-month / Day view work below).

**Verified (signed in, localhost, three loads each, zero console errors or warnings apart from the known Diary duplicate-key warning that was already there):** header text on /today, /diary and /chill (clock, no arrows, no date, no Create); on /today at 1280 the grid header sits at x=305 and the cards at x=901 (340 px column); the simulated Sunday evening puts "Your week" first in that column; ring text fits its column (no clipping); phone 390 px no horizontal overflow.

**Day / Week / Month:** the switcher is still inert (only Week exists). Not part of Phase 8; proposed as the first item of the inert-controls sweep (see the reply to Minh).

---

## 2026-10-06 — Session 51: Week view only; the sidebar month calendar

**Decision (Minh): no Day or Month view.** The week grid stays the only timetable view; "the month, like a full calendar" is the **calendar widget in the left sidebar**. So the inert Day / Week / Month switcher is **removed** from the top bar, and the deferred functional mini-month (Phase 2 follow-up) is built. PRD and user stories updated; the "Day / Month views" idea is dropped from the inert-controls sweep (and Create stays removed: a "new block" entry point is not needed while drag-to-create is the way).

**What landed:**
- `MiniMonth` in the sidebar (`components/layout/MiniMonth.tsx`, logic in `lib/miniMonth.ts`, 16 tests): a Monday-first month grid (always six rows, so it never jumps), today ringed, the week (or diary day) you are looking at highlighted, **previous / next month** arrows to browse. Clicking a day opens **that week in the timetable** (`/today?week=DATE`) from any page except the diary, where it opens **that day** (`/diary/DATE`) and **future days are greyed out and not links** (the diary takes no entries for them). It shows the month holding the selection (the middle of a week, so a week straddling two months shows the one it mostly belongs to); browsing snaps back when you go to another week. Real links (keyboard, middle-click, screen readers: each day's label is its full date, today has `aria-current="date"`); `prefetch` off so 42 links do not each fetch a dynamic page. Today comes from the browser after mount, so the server renders only a placeholder (no hydration mismatch).
- Top bar: the Day / Week / Month tabs are gone.

**Verified (signed in, localhost, three loads then interaction; zero console errors or warnings apart from the Diary duplicate-key warning that was already there):** October 2026 with Oct 6 ringed and "5,6,7,8,9,10,11" highlighted; clicking Sep 30 -> `/today?week=2026-09-30`, the timetable header reads "Sep 28 – Oct 4, 2026" and that row is highlighted; previous x2 -> August, clicking Aug 12 -> `?week=2026-08-12`, "Aug 10 – 16"; next without clicking -> September, then the page's "This week" snapped the calendar back to October; three nexts from October -> January 2027. In the diary: Oct 6 selected, **33 future cells disabled and not links**, today a link; clicking Oct 5 -> `/diary/2026-10-05`; previous month + Sep 15 -> `/diary/2026-09-15`, September shown, "14..20" highlighted. On /focus nothing is highlighted and a click goes to `/today?week=2026-10-09`. The calendar is present on /chill. `typecheck` + `lint` + `test` (**675**, +16) green.

**Not covered:** the calendar on a phone (the whole sidebar is hidden below 768 px, as before: the timetable has its own Prev / Next pills there); dots marking days with diary entries or blocks (a possible later touch); the autumn decoration (Stage 2).

---

## 2026-10-06 — Session 52: Phase 9 begins — diary key fix and error boundaries (Phase 9, Box 1)

Minh: "the diary page has been fixed according to another chat, check again, we can move to Phase 9 today."

**Diary re-check:** the other chat's fix was **not in the repository** (nothing new on `origin/main`, no unmerged commits on the two worktree branches, a clean tree) and the React "two children with the same key" warning was still logged on every diary page. Cause: `MoodPicker` and `DiaryEditor` are siblings and both had `key={date}`. They now use `mood-${date}` / `editor-${date}` (each still remounts when the day changes). Six diary loads and a client-side Prev click: zero console messages. If the other chat fixes it differently, drop whichever is redundant when merging.

**Phase 9 plan (functional boxes first; design polish stays with Stage 2):** error boundaries -> empty states -> privacy note -> reduced-motion pass -> guest demo -> delete-account -> Lighthouse. Landing copy / screenshots, the decoration-zones brainstorm and README GIFs go with the Figma stage or the end.

**What landed (Box 1):**
- `components/layout/ErrorPanel.tsx` (client): "Something spilled." + "Anything you had already saved is untouched", **Try again**, a link out, and **`Reference: <digest>`** so a bug report can name the error. It never shows the error's message or stack. Try again does `router.refresh()` then `reset()`, so a page that failed on the server fetches its data again.
- `app/(app)/error.tsx`: sits **below** the app layout, so the top bar, sidebar, focus timer and music player survive a broken page. `app/error.tsx`: pages outside the shell (landing, sign in / up), full-screen. `app/global-error.tsx`: the root layout itself failed; brings its own `<html>` / `<body>`, and "Try again" is a full page reload (the router may be what broke). `app/not-found.tsx`: a 404 for any unknown address, with links to the timetable and home.

**Verified (production build, signed in; throwaway crash routes and a cookie-switched root-layout crash, all deleted afterwards):**
- A **server crash inside the shell**: HTTP 500, panel shown, sidebar nav / top bar / calendar still present, `Reference: 2539702156`, the thrown message **not anywhere in the HTML**. "Try again" while the cause persists stays on the panel without looping; with the cause removed (cookie cleared) **one click recovered the page in place** (shell intact).
- A **client-side crash** (a button that throws on render): panel shown, shell intact, message absent. **A running focus timer kept counting down** with the panel on screen (24:57 -> 24:56 -> 24:53), then was reset.
- A crash **outside the shell**: HTTP 500, full-screen panel with the fonts loaded and a "Go home" link. A **root-layout crash** (global-error): HTTP 500, panel with system fonts, message absent; after the cause was removed "Try again" **reloaded into the working app** (it did not recover before the reload fix).
- **404:** `/nope`, `/today/abc` and `/diary/2026-10-05/extra` are all HTTP 404 with the 404 page and working links, signed in and signed out.
- `typecheck` + `lint` + `test` (675, unchanged: the boundaries are UI) green.

**Not covered:** how the panels look (Stage 2); reporting errors to a service (none exists; the reference number is for Minh to grep in Vercel's logs).

**Next — Box 2:** empty states on every page.

---

## 2026-10-06 — Session 53: Empty states (Phase 9, Box 2)

**Audit (the throwaway account has no data, so every page showed as a first-time user sees it):** /focus (week tile + recent sessions), /chill (music, playlists, picks, review queue, link picker) and the Streak / rings / quote cards already had gentle empty copy. **Gaps found and filled:** (1) each empty **task bucket** showed only "Add task": now "Nothing planned for today yet." / "Nothing for tomorrow yet." / "Ideas for someday go here." (hidden while dragging, so it never fights the drop target); (2) a week with **no blocks** showed a blank grid whose only hint sat below the fold: now one line above it, "Nothing scheduled this week. Drag on the grid to add your first block."; (3) the diary's **year heatmap** with zero entries read "0 days written in the last 12 months": now "No pages yet. Your first entry will colour the first square."

**Verified (signed in, localhost):** the three bucket lines, the week line and the diary line on three loads, zero console messages; adding a task removed **only** Today's line (Tomorrow and Backlog kept theirs); another empty week (`?week=2026-10-12`) shows the week line; with a block in the week the line is gone and the block shows. Unit: `lib/tasks.test.ts` (4: a line for every bucket, buckets, overdue) -> **679** tests. Test data deleted.

**Not covered:** the look of the lines (Stage 2), illustrations for empty states (Stage 2).

**Next — Box 3:** the privacy note.

---

## 2026-10-06 — Session 54: The privacy note (Phase 9, Box 3)

**What landed:**
- **`/privacy`** (public, no sign-in; `app/privacy/page.tsx`): "Privacy, in plain words". The short version (private to you; no ads, analytics or tracking cookies; nothing sold or shared; no AI reads your writing; only essential cookies), what is kept (email and a scrambled password, profile, timetable, tasks, diary text + mood, focus sessions, the sound mix, music files, playlists, suggestions), where it lives (Supabase and Vercel; fonts are bundled, nothing goes to analytics / ads / AI), **who can see it** (you; the one exception, track suggestions, which the person running FindYourself reads and which appear as community picks without a name; and, honestly, that the person who runs the service has administrator access to the hosting accounts), the cookie / device-storage table, links you click (YouTube / Spotify open in a new tab only on click), retention (until you delete; routine backups may linger briefly) and a "if this changes" line with a date.
- **The table cannot go stale:** the 12 cookie / device-storage entries live in `lib/privacyFacts.ts` and `privacyFacts.test.ts` scans `app/`, `components/` and `lib/` for every `fy-...` key and **fails if one is not documented (or if a documented one is no longer used)**. On its first run it caught `fy-roll-handled:DATE`, which I had missed.
- Linked from the landing page, the sign-in / sign-up layout and the sidebar.

**Facts checked before writing (so every sentence is true of the code):** no analytics / tracking package in `package.json`; no third-party requests (the only external URLs are the YouTube / Spotify links the user clicks); fonts via `next/font` (self-hosted at build); email + password sign-in only; RLS own-row on every table except the suggestions / picks described; music links expire after an hour.

**Verified (localhost):** `/privacy` returns 200 signed out and signed in on three loads, zero console messages; the table lists all 12 entries; the landing page, `/login`, `/signup` and the sidebar each link to it; no horizontal overflow at 390 px; `typecheck` + `lint` + `test` (**683**, +4) green.

**For Minh before launch (it speaks in your voice):** (1) read it through, especially "Who can see it" and "How long it is kept"; (2) add a **contact line** (an email or a GitHub issues link: I did not publish your address without asking); (3) the deletion paragraph arrives with the delete-account box; (4) there is **no data export** yet, and the page does not promise one.

**Next — Box 4:** the reduced-motion pass.

---

## 2026-10-06 — Session 55: The reduced-motion pass (Phase 9, Box 4)

**Audit:** the pixel cat (`.pix-*`), the Chill scene (`.sc-*` and parallax in `scene/hooks.ts`), Focus Mode's entrance (`.fm-in`) and dnd-kit's drop animation (`dropAnimation` is `null` under the preference) already had specific rules. **Not covered:** the timer chip's pulsing dot (`animate-pulse`, an infinite loop on every page while a timer runs), every Tailwind `transition-*` (chevrons, mood pop, Immersive's 500 ms fade) and any smooth scroll.

**What landed:** a **global safety net** at the end of `app/globals.css` for `prefers-reduced-motion: reduce`: `animation-iteration-count: 1`, near-zero animation and transition durations, no delays, `scroll-behavior: auto` (all `!important`, on `*`, `::before`, `::after`). A change of state still happens, it just does not travel; the specific rules stay (they freeze things in a nicer way, e.g. the cat sits at the start of the track and the lit cells still show progress). The pulse dot also got an explicit `motion-reduce:animate-none`. `lib/reducedMotion.test.ts` (3) fails if the net is removed or weakened.

**Verified (signed in, localhost; Playwright `emulateMedia`, with a running focus timer and the mixer playing, counting running animations that loop or last over 100 ms):** **without the preference:** /focus 6 (cat: `pix-lap`, `pix-head`, `pix-show-4`), /today and /diary 1 each (`pulse`, the timer dot), /chill **73** (`sc-fall`, `sc-steam`, `sc-flame`, `sc-glow-flicker`, `sc-drift`, `sc-spin`, `sc-mote`), /privacy and / 0; button transitions 0.15 s. **With the preference:** **0 on every one of the six pages**, button transitions 0.000001 s. Zero console messages. The timer still counts and the scene still draws (state is unchanged, only the travel is gone).

`typecheck` + `lint` + `test` (**686**, +3) green.

**Not covered:** the browser's own motion (page transitions between routes: none exist), video / GIF content (none), and a real operating-system "reduce motion" toggle (the emulated media feature is what Chromium reads from it).

**Next — Box 5:** the guest demo (the big one; needs a decision from Minh, see the end of this session's reply).

---

## 2026-10-06 — Session 56: Settings page and category management (Phase 9)

**Decisions from Minh (this session):** (1) the guest demo is a **per-visitor sandbox** (anonymous sign-in with seeded data, writable, temporary) rather than a shared read-only account; (2) he created a second throwaway account for the delete-account test (its details are in the gitignored `.env.test.local` as `FY_TEST2_*`); (3) Lighthouse may be added as a dev dependency. Order from here: Settings + categories (this entry) -> delete-account -> the sandbox demo -> Lighthouse.

**Why Settings first:** the top bar's gear did nothing, delete-account needs a home, the focus goal had no place to change it, and the sidebar's "My categories" was a hard-coded list that ignored the person's real categories.

**What landed (migration `20261006062143_phase9_categories`):**
- **Database rules:** a category name is 1-40 characters, **unique per person ignoring case and spaces**, the colour is `#RRGGBB`, **at most 12 per person** (locking trigger, `category_limit`), and a person may update only name / colour / order. Three SECURITY INVOKER functions (so RLS applies inside them): `delete_category(id, move_to)` (moves the blocks and tasks, then deletes, atomically; refuses the last category), `reorder_categories(ids[])`, `category_usage()`.
- **`/settings`** (protected; gear in the top bar; "Edit" in the sidebar): Account (email, the detected time zone), Focus (the daily goal picker, here as well as on the rings card), Categories, and a Privacy link. **Categories editor:** rename in place (blur / Enter saves, Esc cancels), a colour palette (12 swatches), up / down buttons, add (with the count "N of 12"), and a two-step delete that says how many blocks and tasks use the category and offers "Move them to ...". Server actions (`category-actions.ts`) validate first and name every refusal (`bad_name`, `name_too_long`, `bad_color`, `duplicate_name`, `category_limit`, `last_category`, `bad_target`, `bad_order`, `not_found`, `unauthenticated`).
- **Sidebar** now lists the person's real categories in their order (it was the five defaults hard-coded).
- **A latent bug fixed:** `categoryColor` mapped a default name to its theme token regardless of the stored colour, so recolouring "Deep Work" would have done nothing. A default now follows the theme only while it keeps its default name **and** colour.
- **Time zone is auto-detect only** (US-8.2 amended): every page works out "today" from the device's zone (cookie), so a manual override would make the database's streak day and the page's day disagree. Shown read-only in Settings. Say if you want an override anyway.

**Verified:**
- **SQL (`supabase/tests/phase9_categories.sql`, as `authenticated`, aborting block):** empty name / 41 characters / bad colour / sort 5000 -> `23514`; a duplicate ignoring case and spaces -> `23505`; inserting as another person and updating `user_id` -> `42501`; the 13th -> `category_limit`; another person's rows untouched; reorder with a short, duplicated, foreign-id or null list -> `bad_order`; delete: move to self / foreign / unknown -> `bad_target`, unknown or foreign category -> `not_found` and nothing deleted; delete+move moves the block and the task; delete with no target leaves them uncategorised; the last category -> `last_category`; `anon` -> `42501`. (My first run failed because a foreign id read under RLS came back null and null means "do not move": a test mistake, now noted in the file.)
- **Live (signed in, localhost):** /settings x3 loads with the five real categories and zero console messages; adding "FYTEST gym" shows it in the list and the sidebar; **an empty name and a 41-character name send no request** (`bad_name`, `name_too_long`); a duplicate ("  deep WORK ") sends one request and is refused by the database (`duplicate_name`), and so is renaming onto "rest"; recolouring Deep Work changed the swatch and **the block on the timetable painted #E3B04B**; reorder survives a reload and the sidebar follows; deleting a used category showed "used by 1 block and 1 task", moving them to Rest **moved both in the database**; Keep cancels; an unused one shows no move choice; **12 categories hides the add form and says so**; **signed out mid-session** the rename sent its request and showed `unauthenticated`; signed out, /settings redirects to `/login?next=/settings`; phone 390 px no overflow. The throwaway account's categories were restored.
- Unit: `categoryRules.test.ts` (15: names incl. emoji counted as one and separators collapsing to a space, colours, clash rule, DB error mapping, `categoryColor`, reorder helpers). `typecheck` + `lint` + `test` (**701**, +15) green.

**Gotcha worth remembering:** escape sequences such as a backslash-u2028 in tool input can be turned into the raw character, which silently breaks string and regex literals; build such characters with `String.fromCharCode` in source files. Long heredocs with mixed quotes can also break the shell tool: write a script file instead.

**Not covered:** the look of the page (Stage 2); drag-to-reorder (up / down buttons are keyboard- and screen-reader friendly); a manual time-zone override.

**Next:** delete-account (service role key; tested on the second throwaway account).

---

## 2026-10-06 — Session 57: Delete account (Phase 9) — built, final live run waiting for the service key

**What landed:**
- **Settings -> Delete account** (`DeleteAccount.tsx`, `account-actions.ts`): two steps (open the panel, then **type `DELETE`** exactly; the button stays disabled until then). The panel lists what is removed, says approved community picks stay (they never carried a name) and that routine backups can linger briefly. On success the data kept in the browser (`fy-*` keys only) is cleared and the person lands on `/?deleted=1`, which says so.
- **Server action `deleteAccount(confirmation)`** (named reasons `unauthenticated`, `confirmation_mismatch`, `not_configured`, `storage_error`, `delete_failed`): checks the session, checks the phrase **again on the server**, then with the service-role client (`lib/supabase/admin.ts`, server only, returns null unless configured) (1) lists and removes the person's own files in the `music` bucket, **only names directly inside `{user_id}/`** (`ownObjectPaths` refuses slashes, `..` and empty names), re-lists to prove the folder is empty, and **stops with nothing deleted if that fails**; (2) deletes the auth user: every table that refers to the person cascades (checked from the foreign-key list: `profiles`, `categories`, `tasks`, `time_blocks`, `diary_entries`, `focus_sessions`, `mixer_state`, `music_tracks`, `playlists`, `playlist_tracks`, `track_suggestions`, `admins`; `reviewed_by` and `community_picks.suggestion_id` are set null, so approved picks stay); (3) signs the browser out.
- **A deleted person's other devices** stop working by themselves (their session rows go with the user).

**Verified:**
- **Unit (`accountDeletion.test.ts`, 7):** only the exact phrase counts (`delete`, ` DELETE`, `DELETE `, `DELET`, empty, non-strings all refused); the file-path guard; the admin client is absent unless both the address and the key are set.
- **Live, on the second throwaway account** (seeded with a task, a block, a diary mood, a focus session, a mixer row, **two real MP3 files in storage** uploaded through the file chooser, a playlist with a track and a suggestion): the section and panel render; the confirm button is **disabled for `delete`, `DELETE `, ` DELETE`, `DELET` and empty**; "Keep my account" closes the panel; React ignores a click on the disabled button even when the DOM attribute is forced off. **The server's own phrase check, with the click handler called directly: four wrong phrases each sent a request and came back `confirmation_mismatch`**, and the account and its files were intact. **Signed out mid-session** the confirm sent its request and showed `unauthenticated`. **With the service key not configured** the real click showed `not_configured`, "Nothing was deleted", and nothing was touched (this is the live proof of the graceful refusal).
- **Not yet run:** the successful deletion. `.env.local` has the line `SUPABASE_SERVICE_ROLE_KEY=` with an **empty value**, and it is a secret only Minh can paste. Until then the second account (with its seeded rows and 2 stored files) is waiting to be the subject of that run: after it, the checks are: its `auth.users` row, identities, sessions, every table above and its storage objects all 0; the first test account and the one real music file untouched; signing in again with the deleted credentials fails by reason; `fy-*` device keys cleared and other keys kept.

**For Minh:** (1) Supabase dashboard -> Project Settings -> API keys -> copy the **secret / service_role** key into `.env.local` as `SUPABASE_SERVICE_ROLE_KEY=...` (never commit it; `.env*.local` is gitignored); (2) add the same variable in Vercel (Production). Without (2) a visitor's "Delete everything" says "not available right now" and deletes nothing. Then tell me and I run the final check, add the deletion paragraph to the privacy page and tick the box.

**Not covered:** exporting data before deleting (none exists; the panel does not promise it); the look of the page (Stage 2).

---

## 2026-10-06 — Session 58: Lighthouse >= 90 (Phase 9), with real accessibility fixes

**Setup (approved by Minh):** `lighthouse` added as a dev dependency (13.5; no other download). `scripts/lighthouse.mjs` (`npm run lighthouse`) audits a running **production build** (`npm run build`, `npx next start -p 3200`): the four scores, the main timings and what holds a page below 90, for the public pages and, with a Playwright storage-state file, the signed-in ones. Chrome is the installed one. The signed-in session is put into the audit browser through puppeteer (Lighthouse's own storage reset wipes cookies and Chrome ignores a `Cookie` extra-header), and the script warns if a page redirected somewhere it should not have, so a signed-in score can never silently be the login page's. (First runs did exactly that: nine pages ended on `/login`. Caught by the script's own redirect note, then fixed.) On Windows Git Bash prefix the command with `MSYS_NO_PATHCONV=1` when passing `--only /today,/settings`.

**Findings and fixes:**
- **Colour contrast was a real WCAG AA failure** (a stated goal). The theme's own tokens were below 4.5:1 on the cream and white surfaces: `--ink-muted` 3.6:1, `--accent-strong` 3.5:1 (the design doc claimed 5.2:1), `--danger` 4.2-4.7:1, and the success green under 3:1; in the night theme `--ink-muted` 3.5-4.4:1. Smallest shifts that clear AA, keeping primary > secondary > muted: day `ink-secondary #6B5842 -> #604F3B`, `ink-muted #957F65 -> #796752`, `accent-strong #B87700 -> #8C5A00`, `danger #B0553F -> #A7513C` (white on it 5.4:1), `success #6E9F5B -> #699756`, `warning #C88A2A -> #BA8027`; night `ink-muted #6E7898 -> #848CA7`. `docs/DESIGN_SYSTEM.md` corrected (it had the wrong ratios).
- **`lib/contrast.test.ts` (12 tests)** reads the real tokens from `globals.css` and fails if any text colour drops below 4.5:1 on any surface (or a graphic below 3:1), in both themes, and checks the ink hierarchy and the text on the accent fills. It would have failed on the old values.
- **Faded text:** out-of-month days in the sidebar calendar (`ink-muted/70`) and the diary prompts' "+ add" hint (`opacity-70`) were 2.9:1: now plain `ink-muted`.
- **Label in name (WCAG 2.5.3):** the two diary prompt buttons had an `aria-label` ("Insert heading: ...") that did not contain their visible text. The accessible name is now the visible text, with the action in a `title` (a tooltip for everyone, a description for screen readers).
- **A favicon** (`app/icon.svg`, a plain honey-coloured cup; placeholder art for Stage 2): removes the 404 that Lighthouse counted as a console error on every page.

**Result (production build on localhost, signed in as the throwaway account for the app pages):** mobile (the stricter default): `/` 96 / 100 / 100 / 100, `/login` 97, `/signup` 97, `/privacy` 97, `/today` 100, `/diary` 97, `/focus` 100, `/chill` 100, `/settings` 100 performance, **accessibility, best practices and SEO 100 on all nine pages**; desktop: **100 on all four axes on all nine pages**. Lowest single score: 96 (landing page performance, LCP 2.6 s). `typecheck` + `lint` + `test` (**720**, +12) green.

**Caveats:** local numbers (no CDN, no network latency): re-run against production after the push deploys: `npm run lighthouse -- --base https://findyourself-mu.vercel.app` (public pages) and, for the app pages, a storage-state file with a session for that domain. Dark theme was checked by the contrast maths and test, not by Lighthouse (headless Chrome renders the light theme). The input borders (`--border-strong`, about 1.4:1) are below the 3:1 that WCAG 1.4.11 asks of a form field's edge; Lighthouse does not test it. It is a design-stage item and is listed in the follow-ups.

---

## 2026-10-06 — Session 59: The guest demo, a per-visitor sandbox (Phase 9) — built; waiting for the setting to be switched on

**Decision (Minh, this session):** per-visitor sandbox, not a shared read-only account. Each "Try the demo" click makes a temporary anonymous account with sample data. It is fully writable, nothing is shared between visitors, and it is deleted after 24 hours unless the visitor turns it into a real account. (US-1.2 amended: the "read-only + toast" story is replaced.)

**What landed (migration `20261006065509_phase9_demo_sandbox`):**
- **No service-role key needed.** The sample data is written by `public.seed_demo(p_today, p_tz)`, a SECURITY INVOKER function that runs *as the visitor*, so row-level security applies to every row it writes. It refuses a non-guest (`not_demo`), a date more than 2 days from the server's (`bad_date`), an unknown zone (`bad_timezone`) and an account that already has data (`already_seeded`). It places everything relative to the visitor's own day and zone: **this week's 8 timetable blocks** in their categories, **7 tasks** (today incl. one "Focus first" with a 17:00 deadline and one already done, tomorrow, someday), **3 diary days** with moods (so the streak shows 4 and the heatmap has something), **4 finished focus sessions**.
- **Guests cannot upload music or suggest tracks** (the two places a throwaway account could leave files behind or spam the admin queue): `private.is_anonymous()` reads the sign-in token; the storage upload policy, `music_tracks` insert and `track_suggestions` insert now require `not is_anonymous`. On /chill a guest sees a short note ("need an account") instead of the upload, playlist and suggestion sections.
- **At most 300 guest accounts at once** (`demo_full`, a trigger on `auth.users`; real signups are never counted against it). Supabase's own per-IP limit on anonymous sign-ins adds to that.
- **Cleanup:** `private.purge_demo_users(age)` deletes guest accounts older than 24 hours (only rows flagged `is_anonymous`, never younger than an hour, callable by nobody but the owner); **pg_cron is now enabled and runs it hourly** (job `purge-demo-users`, `17 * * * *`; undo with `select cron.unschedule('purge-demo-users')`). Deleting the account cascades every table.
- **App:** a **"Try the demo"** button on the landing page (`startDemo`: signs in anonymously, seeds, then goes to /today; if anyone is already signed in it just carries on; a seeding failure signs the guest out at once); a **banner under the top bar for guests** ("You are trying the demo ... deleted after 24 hours", with a "Create an account to keep it" form: email + password, `upgradeDemo`, which converts the guest into a real account and keeps the data once the emailed link is clicked). Named reasons throughout (`lib/demo.ts`: `demo_disabled`, `demo_full`, `demo_unavailable`, `seed_failed`, `rate_limited`; `bad_email`, `weak_password`, `email_taken`, `not_demo`, `unauthenticated`).

**Verified:**
- **SQL (`supabase/tests/phase9_demo.sql`, as a simulated guest inside rolled-back transactions):** a guest gets a profile and 5 categories; the seed makes **8 blocks, 7 tasks, 3 diary entries, 4 sessions**, 1 task done, 1 "Focus first", 0 uncategorised blocks, **streak 4**; re-seeding is `already_seeded`, a far date `bad_date`, a bad zone `bad_timezone`, a null date `bad_date`; **a guest's suggestion, track row and storage upload are each `42501`**, while a guest can still add a task and rename a category; **a real user's seed is `not_demo` and the same real user can still suggest a track**; `anon` is `42501`. **The cap:** the insert loop is refused with `demo_full` and a real signup still works at the cap. **The purge:** a 25-hour-old guest with a full seed is removed and **all its rows are gone by cascade** (profile, categories, blocks, tasks, diary, sessions: 0), a 23-hour-old guest and a 90-hour-old *real* account are kept, 30 minutes is refused (`too_young`), and an authenticated caller is `42501`.
- **Live (localhost):** **signed out, "Try the demo" sends one request and shows `demo_disabled`** ("The demo is not available right now. You can still create an account.") with **no session created** and the button available again, zero console messages on three loads; signed in as a real user the button carries on to /today; the banner and the guest music note render; in the upgrade form a bad email, "a@b", an empty email and a short password are each refused **with a named message and no request**; a real (non-guest) account submitting a valid form gets **`not_demo` from the server before anything is created**; signed out it gets `unauthenticated`; the landing page has no overflow at 390 px. A throwaway preview route used for this was deleted.
- Unit: `lib/demo.test.ts` (12): auth-error mapping, email / password validation (checked in that order), `isGuest`. `typecheck` + `lint` + `test` (**732**, +12) green.

**Not covered (needs the setting on, and I am not allowed to create accounts myself):** the happy path: a real "Try the demo" click, the banner for a real guest, the seeded app looking right, and the upgrade email round trip. **Supabase currently reports `anonymous_users: false`**, so the button refuses gracefully until it is switched on.

**For Minh:**
1. Supabase dashboard -> Authentication -> Sign In / Providers -> switch on **Allow anonymous sign-ins**. (Supabase recommends also turning on **CAPTCHA** for anonymous sign-ins to stop bots; that needs a Turnstile / hCaptcha key and a small form change, so say if you want it before launch.)
2. Click **Try the demo** on the landing page (localhost or prod). You should land on /today with the banner, a populated week, the task list, three diary days, a streak of 4. Tell me and I check the rows by SQL.
3. Try "Create an account to keep it" with a real address: you get a confirmation email; after clicking it the demo should be your account with its data. (I could not test this one.)
4. Be aware: pg_cron is now enabled in your database for the hourly purge.

---

## 2026-10-06 — Session 60: Phone navigation (found during the control sweep)

**Found:** the top bar's **Menu button did nothing** and the whole sidebar is hidden below 768 px, so on a phone there was **no way to move between pages** (timetable, diary, focus, chill) at all; Settings was unreachable there too (the gear is also hidden on phones). The Phase 6 / 7 notes had listed "the mini-mixer is hidden under 768 px with the rest of the sidebar" as a known follow-up; this is the same gap.

**Fixed:** the Menu button (shown **only below 768 px**) now opens the existing sidebar as a **drawer**: pages, the month calendar, categories and the mini-mixer, Settings (added to the page list) and Sign out. A dimmed backdrop sits behind it; it closes on tapping a link (any navigation), tapping the backdrop, pressing Escape, or growing the window into the desktop layout. `aria-expanded` / `aria-controls` on the button, `id="app-sidebar"` on the drawer. From 768 px up nothing changes (the sidebar is always on screen and the button is hidden, so no dead control). `NavContext` holds the state.

**Verified (signed in, localhost, 390 px then 1280 px, zero console messages):** closed by default (`aria-expanded=false`, sidebar not visible); Menu opens a 290 px drawer from the left edge with the five pages, the calendar and Sign out; a backdrop appears; tapping Focus navigates and closes it; reopened it closes on Escape and on a tap on the backdrop; Settings opens from the drawer; no horizontal overflow; with the drawer open, widening to 1280 px closes it, hides the Menu button and shows the sidebar.

**Not covered:** focus trapping inside the open drawer (Tab can reach the page behind it; Escape and the backdrop close it), swipe-to-close, and the look (Stage 2).

**Remaining inert controls:** the top bar's **Search** button (desktop only; there is no search yet: diary text is stored for it as `content_text`). Decision for Minh: build a search (diary entries, tasks, blocks) or remove the button until Stage 2.

---

### Phase 9 summary (hand-off, 2026-10-06)

**Done and verified:** error boundaries and a 404 (Session 52); empty states (53); the privacy note with a test that keeps its storage table honest (54); the reduced-motion pass with a global safety net (55); Settings and category management (56); Lighthouse >= 90 with real contrast fixes (58); phone navigation (60); the diary duplicate-key warning (52). **Built, waiting on one action from Minh each:** delete-account (57) and the guest demo (59). **Not built (design / later):** landing page final copy and screenshots, the decoration-zones brainstorm, README polish with GIFs (Stage 2 / launch prep). **Not decided:** the top bar's Search button (build a search or remove it).

Tests: **732** unit tests (was 659 at the end of Phase 8); SQL test files for categories, the demo, the streak, quotes and the focus goal in `supabase/tests/`. Migrations this phase: `20261006062143_phase9_categories`, `20261006065509_phase9_demo_sandbox`.

**What Minh has to do (in this order):**
1. **Service-role key** (secret): Supabase dashboard -> Project Settings -> API keys -> copy the **secret** key into `.env.local` as `SUPABASE_SERVICE_ROLE_KEY=...` (the line exists and is **empty**) and into Vercel (Production). Then I run the final delete-account check on the second throwaway account (it is still sitting there with 2 stored files, a playlist, a suggestion...), add the deletion paragraph to the privacy page and tick the box. Until then "Delete everything" says "not available right now" and deletes nothing.
2. **Anonymous sign-ins:** Supabase -> Authentication -> Sign In / Providers -> **Allow anonymous sign-ins**. (Consider CAPTCHA too.) Then click "Try the demo" on the landing page; I check the seeded rows by SQL. Also try "Create an account to keep it" with a real address (the one path I could not test).
3. **Read the privacy page** (it speaks in Minh's voice) and add a contact line.
4. **Decide Search:** build it (diary text, tasks, blocks) or remove the button until Stage 2.
5. After the push deploys, **re-run Lighthouse on the live site**: `npm run lighthouse -- --base https://findyourself-mu.vercel.app` (public pages; for the app pages pass a storage-state file with a session for that domain).

**Known follow-ups (not blockers):** input borders are about 1.4:1 (WCAG 1.4.11 asks 3:1 for a field's edge) -> Stage 2; focus is not trapped inside the phone drawer; no data export; manual time-zone override not built (auto-detect only, by decision); the favicon is a plain placeholder cup; pg_cron is now enabled in the database (hourly purge of guest accounts, `cron.unschedule('purge-demo-users')` to stop it).

**Next:** after the two actions above, Minh's manual test of everything (Phases 1-9), then Stage 2 (the Figma design pass; do not touch Figma without telling Minh).

**Blocked on:** the service-role key (delete-account) and the anonymous-sign-ins setting (demo).

---

## 2026-10-06 — Session 61: Search removed

**Decision (Minh):** delete the top bar's Search button; there is nothing to search yet. It was the last dead control (it never had a handler). Removed from `TopBar`; no other code referenced it. **If a search is wanted later** the data is ready for it: diary entries keep a plain-text copy (`content_text`) for exactly that, tasks and blocks have titles; it belongs with a design pass (a command-palette style box), so it is not on the roadmap now. Verified on /today, /diary, /focus, /chill and /settings: the top bar has Menu (phones only), Today, the sound button, Settings and the theme toggle, with zero console messages. This closes the "Not decided: Search" item in the Phase 9 summary above.

**Pointer for the service-role key** (asked in the same message): Supabase dashboard -> project `vcurckpntzffvvkvvnlg` -> Project Settings -> API Keys -> the **secret** key (older dashboards: "service_role" under Project API keys) -> `.env.local` as `SUPABASE_SERVICE_ROLE_KEY=...` and the same name in Vercel -> Settings -> Environment Variables (Production). Never put it in a `NEXT_PUBLIC_` variable, never commit it.

---

## 2026-10-06 — Session 62: Delete account verified end to end; setup checks

**Minh's setup (confirmed):** anonymous sign-ins on (the project's public settings now report `anonymous_users: true`), the Search button removed, the service-role key in `.env.local` (a new-style `sb_secret_...` key, non-empty, `.env.local` is gitignored, the variable is never `NEXT_PUBLIC_`) and in Vercel (I cannot see Vercel's settings; the live site's behaviour is the check). The pasted Supabase docs excerpt (restrictive policy on `is_anonymous`) matches how the demo is built: the guest rules are in the database, as extra conditions on the insert policies for uploads, tracks and suggestions (equivalent to a restrictive policy).

**The real deletion, run on the second throwaway account** (seeded earlier with a task, a block, a diary mood, a focus session, a mixer row, **2 real MP3 files in storage**, a playlist with a track and a suggestion), through the UI with the full confirmation:
- Landed on `/?deleted=1` with "Your account and everything in it have been deleted"; `/today` then redirects to login; **signing in again fails with "Invalid login credentials"**.
- **Database after:** `auth.users`, `auth.identities`, `auth.sessions` and every table that referred to the account (profile, categories, tasks, blocks, diary, focus, mixer, tracks, playlists, suggestions) **0 rows; 0 orphaned playlist links; 0 stored files** in its folder. The database went from 4 users / 3 stored files / 3 tracks to **3 users / 1 stored file / 1 track**: the one real track and its file, and the first throwaway account (profile and 5 categories), are untouched.
- **A small bug found and fixed:** after deletion one device key (`fy-music`) was still in the browser: the page being left rewrites the music queue as it unloads, after the delete button had cleared it. The home page now clears the `fy-` keys once it has loaded with `?deleted=1`, where nothing is left to rewrite them. Verified: preset `fy-music`, `fy-mixer`, a diary draft and an unrelated key, load `/?deleted=1`: only the unrelated key remains; a normal visit clears nothing.
- The privacy page now has its **"Deleting your account"** paragraph (what goes, that approved picks stay, browser data is cleared, backups can linger briefly), as promised in Session 57.

**Still needs a human click:** "Try the demo" on a real guest (creating the guest account is an account creation, which I must not do myself). Anonymous sign-ins are on and no guest account exists yet; after one click I verify the seeded rows by SQL.

---

## 2026-10-06 — Session 63: "Try the demo" while signed in

**Reported by Minh:** clicking "Try the demo" while signed in goes straight to his own account; in an incognito window "it is fixed". **Cause (the first part):** by design `startDemo` carried on to the app for anyone already signed in, which reads as the demo ignoring the click. **Fix:** a signed-in visitor on a **real** account now gets a short explanation ("You are signed in to your own account. The demo is a separate, temporary account, so starting it signs you out here first.") with two buttons: **Sign out and start the demo** and **Go to my account**. A visitor already in a demo carries on with it. `startDemo(replaceSession)`; new reason `signed_in`.

**Verified (signed in as the throwaway account, localhost):** the click shows the explanation and both buttons, the session cookie is untouched, "Go to my account" opens /today, no guest account was created (0 in `auth.users`), zero console messages. Not clicked by me: "Sign out and start the demo" (it creates a guest account, which is an account creation I must not do). `typecheck` + `lint` + `test` (**733**) green.

**Open question for Minh:** the database still shows **no guest account**, and the project's API log shows **no anonymous sign-up request since the setting was switched on** (the only recent sign-ups are my own refused test and the second throwaway account). So the incognito click did not create a guest (or the log is behind). Asked Minh what the incognito click showed (an error text, the app with a banner, or the landing page again).

---

## 2026-10-06 — Session 64: The guest demo verified on a real guest

Minh clicked "Try the demo" in an incognito window (on the live site); the guest account `d72e32f5-...` was created at 20:17:10 UTC. Checked by SQL:
- **A guest:** `is_anonymous = true`, no email, profile in `America/Toronto` (the visitor's zone, saved by the browser) with **streak 4, last day today**.
- **Seed exactly as designed:** 5 categories; **8 sample blocks, all with a category**, at the right local times (e.g. "Outline the project" Monday 09:00 EDT = 13:00 UTC); **7 tasks** (3 for today, 2 for tomorrow, 2 for someday; "Water the plants" done; "Outline the demo talk" is "Focus first" with its 17:00 EDT deadline; priorities as seeded); **3 diary entries**; **4 focus sessions**; 0 tracks, 0 suggestions.
- **It is writable, as decided:** a 9th block, "New block", appeared **9 seconds after the seed**: Minh dragged one onto the timetable in the sandbox, which worked.
- It will be deleted automatically by the hourly purge about 24 hours after creation (20:17 UTC on 7 October).

**Closes:** the guest demo (happy path). **Still untested:** "Create an account to keep it" with a real email (it sends a confirmation email; the guest becomes a permanent account only after the link is clicked).

---

## 2026-10-06 — Session 65: Phase 9 closed (functional); README and setup guide made accurate

**Phase 9 is complete as far as functionality goes.** Built and verified: the guest demo (live, checked on a real guest), the privacy note, empty states, error boundaries, the reduced-motion pass, Lighthouse >= 90 (with real contrast fixes), Settings and category management, delete-account (run for real on a throwaway account), phone navigation, and the removal of the dead Search button. Left, deliberately, for Stage 2 (design, as the roadmap already said): landing page final design / copy / screenshots, the decoration-zones brainstorm, and README GIFs. Untested by choice (Minh, 2026-10-06): the "create an account to keep it" email round trip.

**Docs:** `README.md` was from Phase 0 ("Currently in Phase 0", Framer Motion and shadcn/ui that the app does not use, a Day/Week view that no longer exists). Rewritten from what the code is: the live link, what each area does, the things worth a closer look (database as the security boundary, the computed streak, measured accessibility, honest failure, the sandbox demo), the real stack, run / test / Lighthouse commands, and an accurate status. `GETTING_STARTED.md` was the scaffold-era note ("placeholder pages", "send me the keys in chat"); now real setup: the Supabase project and keys (with the service-role warning), applying the migrations, the admin email, the auth settings (anonymous sign-ins, CAPTCHA advice), the pg_cron cleanup, Vercel, and how to run the checks and the SQL tests.

**Next:** Minh's hands-on test of everything (Phases 1-9; the checklists are at the end of each phase summary), then Stage 2: the Figma design pass (original pixel-art scenes, final landing, decoration, GIFs for the README). **Do not touch Figma without telling Minh first.** Open decisions for then: the input-border contrast (about 1.4:1; WCAG asks 3:1), a manual time-zone override, CAPTCHA on the demo, a contact line on the privacy page.

---

## 2026-10-06 — Session 66: Manual time zone (US-8.2)

**Decision (Minh):** yes to a manual override, no CAPTCHA on the demo, yes to a privacy page (a contact line is still to be added before launch: needs Minh's choice of address or a GitHub issues link; nothing published without his OK).

**Built:** Settings → Time zone: "Detect it automatically" or "Choose a time zone" (a grouped list of every IANA zone with a live "it is now ..." preview). The choice is saved in `profiles.timezone` + the new `profiles.timezone_manual` (migration `20261006202338_phase9_timezone_manual`), so it follows the person to every device. Two cookies carry it to the server: `fy-tz` (the zone in effect) and `fy-tz-manual` (present only in manual mode; the root layout's inline script lets it win over the device, and `TimeZoneSync` reconciles cookies and profile on a new device). The privacy page lists `fy-tz-manual` (the privacyFacts test fails if a cookie is not documented).

**The real work was not the setting but the maths.** Every page used to take "today", the week, a block's day and a deadline's wall-clock from the BROWSER's zone, so a second source would have disagreed with the server. Now nothing reads the browser zone: `lib/zoned.ts` does wall-clock arithmetic in a named zone (`dayIsoOf`, `wallMinutes`, `minutesIntoDay`, `wallToInstant` with a two-pass offset check for clock-change days, `weekMondayFromParam`, deadline input in the app's zone), and a `ZoneProvider` hands the zone to client components. Converted: the week grid (columns are ISO days, drag-create / move / resize build instants with `wallToInstant`), the NOW line, Copy yesterday, the task deadline popover, the end-of-day roll, the clock and the mini calendar. Also fixed on the way: the week's blocks used to be fetched for a UTC week, which cut the edges off in zones far from UTC; it now uses the zone's own week bounds. Eight helpers in `lib/dates.ts` that nothing used (and that read the browser zone) were deleted.

**Verified:** 759 unit tests (18 new for `lib/zoned.ts`, including a 600-sample round trip over 9 zones and both New York clock-change days), typecheck, lint, production build. Live on the +fytest account, browser in Toronto while the app was set to Tokyo: the grid, clock, calendar and zone label all in Tokyo (GMT+9); a drag-created Thursday 10:00-11:30 stored as 01:00Z-02:30Z (Tokyo wall time); a deadline of 21:00Z shows 6:00 AM Oct 7 in the popover and the list; a fresh device with no cookies and a Toronto browser ends up in Tokyo and does NOT overwrite the profile; the end-of-day roll correctly offered the Oct 6 task because it was already Oct 7 in Tokyo; switching back to automatic restored Toronto / `manual=false` and removed the manual cookie; a forged zone (`Mars/Phobos`) is refused with `bad_timezone` after the request was sent, a signed-out save with `unauthenticated`, and the profile stayed unchanged in both; phone width has no overflow; five loads, zero console errors. Test rows deleted, profile reset to America/Toronto automatic.

**Lesson:** an "it did nothing" failure in a live test was a modal (the end-of-day roll) covering the page; look at `elementFromPoint` before suspecting the handler.

**Still open:** the privacy-page contact line; input-border contrast (about 1.4:1, WCAG asks 3:1); Minh's hands-on test; Stage 2 (Figma, tell Minh first).

---

## 2026-10-06 — Session 67: Stage 2 starts: the Figma file is built and wired to the code

**Minh said go** on the design stage ("start this night, connect and wire to Figma now to prepare for me"), choosing to design before his hands-on test. Same session: the privacy page got a contact line (his email and the GitHub issues link) and a note that the app was built with Claude as a coding assistant.

**Figma file:** "FindYourself — Design Stage 2", `https://www.figma.com/design/cfavJs3bXchFO6b9kSVhxw`, in Minh's team (Full seat, student plan, drafts). Created and filled through the Figma connector with his go-ahead.

**What is real (built from the code, not guessed):**
- **Tokens as variables, mirrored 1:1 from `app/globals.css`.** Color (22) and Pixel (20) in two modes (Sunny Cafe, Netcafe Night), Type (font families per theme), Scale (spacing, radii). Scopes set on all, WEB code syntax `var(--...)` on all. A frame can be switched between the two themes by setting its variable mode, so any screen designed here can be shown in both.
- **Contrast table computed from the variable values:** 18 text and graphic pairs, all pass, in agreement with the code's own `lib/contrast.test.ts`.
- **Pixel kit:** the cat, cups and digits as 26 components, built from the same string grids and the same run-merging as `PixelSprite`, with fills bound to the Pixel variables, so the same component is ginger in Sunny and neon-rimmed in Night. Whole-number scale only.

**What is scaffold only (waiting for Minh):** Moodboard drop zones, Scenes (layer slots and composed 960 x 540 stages, no art), Screens (baseline and redesign slots), Decoration zones (wireframes with the reserved areas, starter prompts), Review (tracker of the 11 open design items).

**Limits found:** the Plugin API cannot import images, so live-app screenshots do not go into the file by script; baselines have to be pasted by Minh or rebuilt from code per screen. Space Grotesk has no SemiBold in Figma. Effect styles and the Focus Mode overrides are not modelled yet.

**Next:** Minh's references on the Moodboard, then the scenes (Monstadt / Liyue) with him; screens redesign beside baselines; each decision gets a Review row, then a commit, then this log.

---

## 2026-10-06 — Session 68: Four themes (Stage 2 direction)

**Decision (Minh):** the two themes become four. **Day:** Monstadt, Liyue. **Night:** Nod-Krai, Natlan. The person picks a mode first, then a region within it (no Liyue night). The mode follows the clock by default and can be switched by hand and switched back. Yellow stays the through-line.

**Consequences:** Figma Color and Pixel collections go from two modes to four (screens are built once and shown in each by switching the variable mode); each palette is contrast-checked for AA; the Scenes page needs four scenes instead of two (Monstadt, Liyue, Nod-Krai, Natlan); Figma work starts with the Timetable screen, one screen at a time, scenes after the references arrive. Code changes (four theme blocks in `app/globals.css`, a mode + region picker, clock-based default) wait until the design settles. Brief section 3 updated.

**Process:** Minh leads the design; Claude builds in Figma directly (verified it can create, edit and delete nodes on the Scenes page; cannot import images).

**Monstadt Timetable, first pass (2026-10-07).** Minh's references: the in-game Monstadt view and a pixelised version of it (windmills, half-timbered houses, trees, sunset gold, slate-blue roofs, red roofs). Direction: top bar bright and sunny with pixel trees and clouds; sidebar plain white; the **mini calendar** carries a see-through pixel windmill with flowers (simpler than the references); week grid, motivation widgets and tasks drawer stay plain; colours must match the scene. Built in Figma (`Screens`, `Timetable · Monstadt day`); see DESIGN_BRIEF section 5b. Findings: bound colour variables ignore paint opacity in the Plugin API (so tints use overlay rectangles and a new `accent/line` variable); at 1440 px the right column (340) leaves the week grid only 752 px (97 px per day), worth a layout decision.

---

## 2026-10-07 — Session 69: Art direction changes from pixel scenes to painted wallpapers

**Decision (Minh):** the scenes will be painted/illustrated wallpapers (storybook watercolour style, European hill town, windmills, spired castle, wildflowers), not hand-built pixel art. Reason: pixel art of that richness needs a pixel artist's tools, and heavy pixel layers cost page load; painted WebP wallpapers are lighter and far easier to make look rich, and make four themes cheap (one wallpaper plus a palette each). Minh supplies the assets, in this layout: `assets/world/` (mondstadt-day, -evening, -night, clouds, distant-hills, windmill, trees as `.webp`), `assets/ui/` (parchment.png, panel.png, buttons.png, decorations/), `assets/icons/` (leaf, windmill, book, moon as `.svg`). Art must be original (not the game's art; no baked-in UI text). The pixel kit (cat, cups, digits, timer track) stays for now; whether it survives next to painted art is open. The two hand-built Figma frames from Session 68 remain as layout references.

**Resolved (Minh):** the file list does not mean three times of day per region. Only the **Monstadt day** wallpaper is needed for now; the four-region plan from Session 68 stands, and the other regions come later. `public/assets/{world,ui/decorations,icons}` created for the files.

---

**Approved (Minh, 2026-10-07): the Diary design is final for now** ("keep it like this"): Figma frame `Diary · Monstadt painted (stand-in)` (node `35:7157`), as built with the painted wallpaper shifted to show the castle, bridge and banner on the right, the see-through sidebar, the cloud top bar, and the diary and year-in-pages panels at 92 % parchment. Do not change it without being asked. The wallpaper is still the stand-in (1623 x 640) and gets swapped for the proper 16:9 file when it exists; the windmill with turning sails is not placed on this page.

---

<!-- New entries append below with date + session number -->

## 2026-10-08 — Session 70: Nod-Krai night references and assets

**Decision (Minh):** the Nod-Krai night wallpaper keeps its **crescent moon**, with a moon animation added in code; the cliff tower is the landmark (no windmill at night); the frost flower is a lily that **sways** (no spin); the wallpaper is upscaled to 2560x1440 (soft, not new detail); aurora, flower and clouds are cut out of their baked checkerboards. Files in `public/assets/world/NodKrai_Night/`, details and the retuned palette (worst-case contrast 5.8:1, panels `#0A1450` at 90 %) in `docs/NODKRAI_NIGHT_BRIEF.md`.

---
## 2026-10-08 — Session 70 (b): design closed for the first code pass

**Decisions (Minh):** (1) **Pixel art is retired** from the shipped UI (cat, cups, pixel digits, pixel timer track); the sprite file stays in git history. (2) **Night runs from 18:00 to 06:00** in the person's own time zone by default, with a manual override and a way back to Auto. (3) **The first code pass ships Monstadt and Nod-Krai;** Liyue and Natlan show as "coming soon" in the picker and fall back to the other region of their mode. (4) **Only the landing page is designed in Figma** (day and night frames, done); Settings (with the mode and region picker), Login, Sign up, the Tasks drawer and the rest are built in code from the existing layouts with the theme tokens. (5) Images (higher-resolution wallpapers, Natlan and Liyue references) and sound come later.

**Design work closed today:** Nod-Krai Night built for Timetable, Focus Mode, Diary and the Focus page, the Chill night live draft, the moth-spirit symbol, the landing page (Figma nodes `81:2` and `81:144`), a new `border/input` colour (3:1 or better on every surface, all five modes; fixes the old 1.4:1 field borders), and the Review tracker brought up to date (rows 16 to 18 added). Specs for restriction darkening, empty states, reduced motion and the Settings picker are written in `docs/THEME_HANDOFF.md`, which also holds the palette tables, the data model (`theme_mode`, `day_region`, `night_region` on `profiles`, two cookies), the touch-point list and the order of work for the code.

**Open, not blocking the first four code steps:** higher-resolution wallpapers, Liyue and Natlan art, sound recordings, the frost flower at icon size, wing parts for the moth, and the public-naming and image-credit question (game place names, game-inspired creature drawn from scratch).

---

## 2026-10-08 — Session 71: Stage 2 coded, steps 2 to 9 (Minh away; plan, build and test run by Claude)

**Brief (Minh):** "step 5 on the stand-in wallpaper", then "step 6 and 7, then 8 and 9, I have been away for a bit: plan, design, implement and test yourself." Branch `design/stage2-themes`, one commit per step, nothing pushed. The detailed record, with every check and number, is `docs/THEME_HANDOFF.md` section 0.

**What landed.** (2) the two token blocks, new tokens, Tailwind additions. (3) the theme painted by the server from cookies, the head script (tested against the resolver across DST days), `saveThemePrefs`. (4) Settings -> Appearance, the Sun/Moon chip. (5) the wallpaper stage with a 1.2 s crossfade, floating glass panels, plates, the Focus-first veil. (6) the round timer, the spirit (dandelion seed / moon-moth), flower session icons, mono digits, the three-column Focus page; the pixel kit deleted. (7) living scenes for Chill, Chill mode and Focus Mode from the two drafts, with a tested wind engine. (8) the landing page with real screenshots. (9) assets cleaned (5.7 MB to 1.7 MB in `public/assets`, a test keeps it), Lighthouse on every page at three screen shapes in both themes, docs and README.

**Decisions I made on the way (change any of them):**
- **Day glass is 90 % / 92 %, not the 80 to 82 % in the Figma frames**: measured over the darkest parts of the Monstadt wallpaper the brown accent text was 3.8:1 at 82 %. A test now composites every text colour over each wallpaper's worst parts.
- **Focus Mode keeps its dark room but shows the scene under a veil**: 82 % by day and 70 % at night, the strengths at which its small text holds 4.5:1 over the brightest part of the painting (the first guesses, 72 % and 50 %, failed the test at 2.9:1 and 2.6:1); the day room's muted ink was lightened.
- **The arc, the week blocks and the focus ring use `--accent-strong`**, because the day accent yellow is 1.4:1 on the cream. This also fixed a page-wide focus ring that had never met 3:1.
- **The mixer's rain slider draws rain** in the new scenes (the old window scene's rain is gone); the fire slider has no visual any more. Gust strength and snow are fixed (no Sound settings panel); there is no wind sound yet.
- **The landing page and the other public pages have no wallpaper stage** except the hero (a light scene, CSS motion only); the app pages have the stage.

**Bugs found by the new tests and by looking (all fixed, each with a test or a recorded check):** `tokens()` in the contrast test read the wrong block on a CRLF checkout (so the day theme was only checked by accident); the unauthenticated save made the top bar toggle throw instead of rolling back; Tailwind's own `.ring` class drew a blue box round the timer; the temporary 300 ms recolour rule overrode the painting's 1.2 s fade; the demo banner's button was navy on navy at night (it was in the old Netcafe theme too); reduced motion did not stop the spirit's bob (a CSS specificity loss that a string test had missed); the week header's "today" tint made its label 2.9:1 at night (found by Lighthouse); the phone downloaded the 2560 px painting on top of the small one.

**Lighthouse (production build, simulated 4G on a phone):** accessibility, best practices and SEO are 100 on every page at every shape in both themes (details in the handoff). Performance is 96 to 100 everywhere except the **landing page on a phone, 79 to 81** (LCP about 5 s: the hero is a full-bleed painting; it went 73 to 81 with phone-sized images). Idea if it matters: a tiny blurred placeholder first, then the painting.

**Not done / open:** sharper wallpapers (both; Monstadt is a 1623 x 640 stand-in); Liyue and Natlan; wind recordings; image credits and whether to keep the game place names; a screen-reader pass over the Appearance card; Minh's hands-on test; merging the branch into `main` (not done: needs Minh).

---

## 2026-10-09 - Session 72: sharper art

**Minh asked** for the blurry and stretched pictures to be sharpened. **Measured first** (in the running app at 1440 x 900, how large each picture is drawn compared with its own pixels): the Monstadt wallpaper was drawn x1.42 its size (stretched and soft); every other picture was drawn smaller than its pixels, so enlarging those would not help on a normal screen.

**Changed:** the Monstadt wallpaper is now 3652 x 1440 (was 1623 x 640; same shape, so the scene coordinates did not change), made with Real-ESRGAN (`realesrgan-x4plus-anime`, 4x, then Lanczos down; chosen over the general model by eye) and saved at the highest WebP quality under the 600 KB per-file test (562 KB). Where a larger original already existed it was used instead of inventing detail: the aurora (1669 x 870, with lossy alpha to keep it near 100 KB), the frost flower (976 x 1124), the fan-flower head (420 x 420). The day cloud was upscaled to 1400 x 956 (colour and transparency done separately: the tool tiles an image that has an alpha channel). The Nod-Krai phone picture is now 1600 x 900 taken from the 2560 picture (was 960 x 540, which a phone drew at up to x4.8); the file is renamed `nodkrai-night-1600.webp` and the stylesheet and `lib/wallpapers.ts` follow. After: the Monstadt wallpaper is drawn at x0.63 (sharp on screens up to about 1.6x pixel density). Public assets total 2.02 MB (limit 2.5 MB). 881 tests, typecheck and lint pass.

**Not changed:** the night wallpaper (2560 x 1440, drawn at x0.64), the night clouds, the small flower icons and the thumbnails (all drawn smaller than their pixels). **Limits:** an upscaler invents plausible detail; the Monstadt painting is still 2.5 : 1 (a true 16:9 needs a new generation). Performance on the landing page on a phone was not re-measured (the day picture is 562 KB instead of 234 KB; the budget decision is Minh's).

---
