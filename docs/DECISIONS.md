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

<!-- New entries append below with date + session number -->
