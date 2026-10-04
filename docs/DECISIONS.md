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

<!-- New entries append below with date + session number -->
