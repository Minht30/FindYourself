# Roadmap — FindYourself

Phased, day-by-day executable. Each phase ends with a **demo-able state**. No phase-N feature starts until phase N-1 is demo-able.

---

## Phase 0 — Planning & design ✅ (this session)

- [x] Product brief
- [x] PRD
- [x] User stories with acceptance criteria
- [x] Architecture doc
- [x] ERD
- [x] Design system
- [x] Roadmap
- [x] Decision log
- [ ] Interactive HTML mockup (design system + key screens)

**Exit criteria:** all docs above committed, mockup viewable in browser.

---

## Phase 1 — Foundation (est. 1–2 short sessions)

- [x] Next.js 14 + TypeScript + Tailwind scaffolded (manual, no `create-next-app` to avoid overwriting docs/)
- [x] Base layout: TopBar + Sidebar shell, four page routes stubbed
- [x] Theme tokens wired — both Sunny Cafe and Netcafe After Dark live in `app/globals.css`, toggle in TopBar with localStorage persistence + no-flash script
- [x] Supabase client factories written (`lib/supabase/client.ts`, `server.ts`) — inactive until env vars provided
- [ ] Supabase project created by Minh, env vars filled in `.env.local`
- [ ] Auth: email/password + Google OAuth (needs Supabase project first)
- [x] Landing page (`/`)
- [ ] Deploy to Vercel with Supabase connected (needs GitHub push + Vercel account)

**Exit criteria:** you can sign up, land on an empty `/today`, and log out.

**Current state:** Local dev server should show the landing page + working shell. Sign-up flow blocked on Supabase credentials from Minh.

---

## Phase 2 — Timetable MVP (est. 2–3 sessions)

- [x] `time_blocks` table + RLS (also `profiles` + `categories`, with RLS on all three)
- [x] Category picker + seeded categories on signup (trigger inserts 5 defaults on `auth.users` insert)
- [x] Week view grid (time axis + 7 day columns) — replaced `/today` placeholder; read-only, prev/this/next week nav via `?week=` param, live NOW line, category color mapping that morphs with theme
- [x] Click-drag to create block — pointer-based drag on any empty slot, 15-min snap, live ghost preview with time label, min 15-min duration; persists via `createBlock` server action. Drag threshold (6px) prevents stray-click blocks; Esc cancels mid-drag.
- [x] Block editor popover (title, category, notes) — click any block; portal-rendered dialog with title input, category dropdown, notes textarea, save + two-step delete + cancel; close on outside click or Esc; positions to the right of the block, falls back to left, then clamps.
- [x] Drag body to move + drag top/bottom edges to resize — same-day only, 15-min snap, 6px drag threshold (so a stray click still opens the popover), Esc cancels mid-drag, live optimistic offset with `ring-2 ring-accent/70` while dragging, `moveBlock` server action persists. Cross-day move is a follow-up.
- [x] "Copy yesterday" — button in the /today header. Client sends yesterday's day-range (in the user's tz) + 24h offset; `copyDayBlocks` server action reads matching blocks, inserts clones shifted +24h. Reports `Copied N` or `Nothing yesterday`.

**Exit criteria:** author uses the timetable for one real day. ✓ **Phase 2 complete.**

**Deferred inside Phase 2** (do before Phase 9 polish):
- Cross-day drag-move
- Mini-month calendar in sidebar (functional day-picker)

---

## Phase 3 — Diary (est. 1–2 sessions)

- [x] `diary_entries` table + RLS — mood enum (radiant/calm/focused/tired/low/stormy), content_json + content_text, unique (user_id, entry_date), updated_at auto-touch trigger with pinned search_path
- [x] `/diary/[date]` route shell + day nav ← / → — `/diary` redirects to the user's today (tz from `fy-tz` cookie); `/diary/YYYY-MM-DD` fetches the entry (may be null), Prev / Today / Next pills (Next stops at today), TopBar arrows step days on /diary; friendly empty state, existing entry rendered as plaintext
- [x] Tiptap editor — StarterKit (h2/h3, lists, quote, code) + Placeholder, markdown shortcuts, `diary-prose` styles from theme tokens
- [x] Mood picker — six emoji + label toggle pills above the editor (click active to clear), optimistic with rollback, `setDiaryMood` writes only `mood`
- [x] Anchored prompts — "What am I thinking today?" / "What am I trying to do?" always visible above the editor; click inserts an h2 at the cursor, or jumps to its section if already present
- [x] Autosave debounce 3s — serialized save chain, flush on unmount / tab hide / Ctrl+S, beforeunload guard, Saved / Saving / Retry status
- [x] Heatmap of past entries — 53-week Monday-first grid under the editor, intensity from `content_chars` (generated column), mood + ~words in each cell label, click / arrow keys + Enter to jump (US-3.2)

**Exit criteria:** author writes 3 diary entries in a row. *(All boxes built; exit criterion is Minh's to hit.)*

---

## Phase 4 — Tasks + Restrictions (est. 2 sessions)

- [x] `tasks` table + RLS — buckets derived from `scheduled_for` (null = Backlog), `completed_at` = done, fractional `sort_order`, per-command RLS incl. own-category check; `time_blocks.linked_task_id` added
- [x] Three-bucket board (Today/Tomorrow/Backlog) — right-side drawer on /today (PRD §6.0), cookie-remembered open state, quick-add per bucket, overdue flagged under Today, two-step delete
- [x] dnd-kit drag between buckets — plus reorder within a bucket; mouse (6 px), touch (long-press), keyboard via grip; server-computed fractional order from neighbour ids
- [x] Complete → "Done today" — checkbox with a 350 ms strike-through linger, collapsible "Done today" (completed between the user's local midnights, DST-safe), uncheck returns the task to its bucket
- [x] Restriction badge + persistent header chip — task editor popover (title, description, priority, deadline, category, 🔒 Focus first), badge on cards, "🔒 Focus first: [task]" chip with live countdown in the TopBar (hidden on /chill). *Deferred: PRD 6.6 "darken the app slightly when active" → Phase 9 visual pass.*
- [x] End-of-day roll modal — "A few things carried over" for overdue tasks on a new day, "Winding down" from 23:00 for open Today tasks; per-task Tomorrow / Backlog / Today-or-Keep, bulk "Everything to", batch `rollTasks`, once per day per device

**Exit criteria:** every task the author does in a week goes through the app. *(All boxes built 2026-10-04; exit criterion is Minh's to hit, and nothing in Phase 4 has been used with a real session yet.)*

---

## Phase 5 — Pomodoro + Focus Mode (est. 1 session)

- [x] Timer widget + zustand store — pure timestamp-based state machine (`lib/focus/timer.ts`), persisted zustand store, soft Web Audio chime + opt-in notification, TopBar chip (hidden on /chill and /focus), pixel cafe-cat on a square pixel track, coffee-cup tally, settings (cycle lengths, chime, auto-start); 82 unit tests
- [x] Link to task/block — picker on /focus (today's open tasks incl. overdue, "Focus first" first, plus today's blocks), "Focus on this" on task cards and in the block popover, link persisted with the timer and shown in the ring, "Done with it?" prompt after a linked task's session
- [x] Focus Mode fullscreen — dimmed full-screen overlay from any page (button or F), timer + linked item only, margins blank; Esc / X / browser fullscreen-exit leave without touching the timer
- [x] `focus_sessions` log — table + per-command RLS + constraints (migration `20261005063406`), `saveFocusSessions` server action (validated, idempotent, unlinks deleted tasks / blocks), localStorage outbox that retries until the server has it
- [x] Weekly focus-hours tile — on /focus: this week's focus time (local Monday-Sunday, DST-safe), session counts, 7 pixel day columns (one block = 15 min), "Today" count and the last 8 sessions; presentational, so Phase 8 can lift it into the dashboard

**Exit criteria:** author completes 3 focus sessions. *(All boxes built 2026-10-05; the exit criterion is Minh's to hit on prod with his real account.)*

---

## Phase 6 — Cozy environment: ambient mixer (est. 1–2 sessions)

- [x] `ambient_layers` seeded (rain/fire/keyboard/cafe/piano) — metadata table with `kind` (`synth` | `file`), read-only RLS, migration `20261005221502`
- [x] MixerContext with Web Audio — shared `AudioContext` (chime refactored onto it), five original synthesized layers, perceptual gain curve, limiter, worker-driven scheduler, persisted zustand store; each layer proven audible by offline renders; 233 unit tests
- [x] Mixer panel UI — `/chill` full mixer with "Tap to begin", always-visible top-bar sound button (off / on / muted), sidebar mini-mixer, native-range sliders with `aria-valuetext`, pixel layer icons, `ambient_layers` read on the server
- [x] `mixer_state` persistence — table + RLS + DB-level checks, validated `saveMixerState` (named failure reasons), debounced single-flight saver with backoff, local `pending` flag so offline / signed-out edits are never lost, restored after mount (no hydration mismatch)
- [x] Scene mechanism: layered, parallax-capable, theme-aware SVG + CSS scene with **placeholder art** (reduced-motion safe) — rain thickness follows the rain slider, room warmth the fire slider; day and night layer sets; art is swapped by replacing two `SCENES` entries. The real Monstadt (day) / Liyue (night) art is **Stage 2** (below), designed with Minh in Figma.

**Exit criteria:** open app → rain plays, sliders adjust, scene animates. *(All boxes built 2026-10-05 and the criterion verified end to end headlessly; how the layers sound is Minh's ears' to judge, see the Session 37 checklist.)*

---

## Phase 7 — Music: upload + player + suggestions (est. 2 sessions)

- [x] Supabase Storage bucket `music` with per-user policy — private, 10 MB / `audio/mpeg` only, policies per `{user_id}/`, 10-object backstop
- [x] `music_tracks` table + upload — signed upload URL, server verifies the stored object (real size, first bytes), orphan cleanup, rename / delete (a plain file chooser; drag-and-drop is a design-stage nicety)
- [x] Client-side size/quota check — plus the same checks again in the server action, the trigger and the bucket, each refusing by a named reason
- [x] Playlist model + reorder — `playlists` + `playlist_tracks` (own-track check, 20-playlist cap, atomic add / reorder functions), up / down buttons, pure seeded `shuffle`
- [x] **Choose music for focus sessions** (Minh, 2026-10-05) — picker in Timer settings (nothing / ambient only / a playlist / a track), remembered per device, starts on the Start click, pauses on breaks (a setting); community picks are external links so they cannot play in the app
- [x] Mini-player (persistent, cross-page) — one audio element outside React, pure queue state machine (shuffle / repeat / remove-while-playing), signed-URL refresh, Media Session, independent music volume, never autoplays
- [x] `track_suggestions` table + form — `admins` table (Minh), own-or-admin RLS, link allow-list enforced in the app **and** the database, 5-pending cap, markup shown as text, named refusal reasons
- [ ] "Community picks" list (admin-curated)

**Limits (Minh, 2026-10-05):** MP3 only, **at most 10 tracks** per user (10 MB per file, 50 MB in total).

**Exit criteria:** author uploads 5 tracks, submits one suggestion, plays music across pages. *(Kickoff for the next chat: `docs/PHASE7_KICKOFF.md`.)*

---

## Phase 8 — Motivation layer (est. 1 session)

- [ ] Streak on `profiles`, incremented via trigger on diary insert/task complete
- [ ] `quotes` seeded (~120)
- [ ] Weekly wins card (Sunday >18:00)
- [ ] Progress rings on dashboard

**Exit criteria:** dashboard feels alive on a Sunday evening.

---

## Phase 9 — Polish & launch (est. 2 sessions)

- [ ] Guest demo mode with seeded data
- [ ] Landing page final copy + screenshots
- [ ] Privacy note (plain-language)
- [ ] Empty states (every page)
- [ ] Error boundaries
- [ ] Reduced-motion pass
- [ ] **Decoration zones brainstorm** — Minh's direction (2026-09-29): wide empty areas (e.g. right of the diary column) stay blank until then; ideas to explore: pixel-art animations, scenes tied to theme / season / mood
- [ ] Lighthouse ≥ 90 on all axes
- [ ] Delete-account flow
- [ ] README polish with GIFs

**Exit criteria:** public live URL, shared for feedback.

---

## v1.5 (post-launch, prioritized)

1. Google Calendar one-way import
2. Recurring blocks
3. **Important days** — user-defined events (birthdays, anniversaries) + optional national/regional holiday feed (`date-holidays` library). Renders as small markers on calendar cells and a header banner on the day.
4. Habit tracker
5. Weekly email digest (Edge Function)
6. Additional scenes (Forest Retreat, Lofi Bedroom)
7. Seasonal decoration engine — month → SVG + gradient auto-swap (framework already scaffolded in Sunny Cafe theme).

---

## Stage 2 — Design pass in Figma (after the core works)

Minh's plan (2026-10-05): **Stage 1** = all core functions (Phases 1-9 functionality). Then Minh tests everything by hand. **Stage 2** = a deep, collaborative design pass with Figma. Prepared in advance: see `docs/DESIGN_BRIEF.md` (open design items, scene briefs, proposed Figma structure, tools, ready-to-go checklist).

- [ ] Kickoff: Minh says go; Figma file created in his team *only then*
- [ ] Moodboard + tokens + pixel kit pages
- [ ] Monstadt (day) and Liyue (night) scenes, original pixel art, layered for parallax
- [ ] Netcafe palette re-tune, block richness, week-grid materiality
- [ ] Decoration zones brainstorm, decorated mini-month, "darken when restricted"
- [ ] Landing page final design and copy
- [ ] Review loop: every approved item implemented, pushed, screenshotted back into Figma

Phase 9's design-polish items (decoration zones, landing page, block / palette polish) fold into this stage instead of being done twice.

---

## How we work this project (session protocol)

Every session:
1. Read `docs/DECISIONS.md` and this roadmap first
2. Identify the current phase's next unchecked box
3. Do that one box; check it off
4. Append the day's outcome to `docs/DECISIONS.md`

No skipping ahead. No polishing phase N-2 while phase N is unfinished.
