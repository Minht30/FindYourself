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
- [ ] "Copy yesterday"

**Exit criteria:** author uses the timetable for one real day.

---

## Phase 3 — Diary (est. 1–2 sessions)

- [ ] `diary_entries` table + RLS
- [ ] Tiptap editor
- [ ] Mood picker
- [ ] Anchored prompts
- [ ] Day nav ← / →
- [ ] Autosave debounce 3s
- [ ] Heatmap of past entries

**Exit criteria:** author writes 3 diary entries in a row.

---

## Phase 4 — Tasks + Restrictions (est. 2 sessions)

- [ ] `tasks` table + RLS
- [ ] Three-bucket board (Today/Tomorrow/Backlog)
- [ ] dnd-kit drag between buckets
- [ ] Complete → "Done today"
- [ ] Restriction badge + persistent header chip
- [ ] End-of-day roll modal

**Exit criteria:** every task the author does in a week goes through the app.

---

## Phase 5 — Pomodoro + Focus Mode (est. 1 session)

- [ ] Timer widget + zustand store
- [ ] Link to task/block
- [ ] Focus Mode fullscreen
- [ ] `focus_sessions` log
- [ ] Weekly focus-hours tile

**Exit criteria:** author completes 3 focus sessions.

---

## Phase 6 — Cozy environment: ambient mixer (est. 1–2 sessions)

- [ ] `ambient_layers` seeded (rain/fire/keyboard/cafe/piano)
- [ ] MixerContext with Web Audio
- [ ] Mixer panel UI
- [ ] `mixer_state` persistence
- [ ] Animated Night Cafe scene (SVG + CSS)

**Exit criteria:** open app → rain plays, sliders adjust, scene animates.

---

## Phase 7 — Music: upload + player + suggestions (est. 2 sessions)

- [ ] Supabase Storage bucket `music` with per-user policy
- [ ] `music_tracks` table + upload dropzone
- [ ] Client-side size/quota check
- [ ] Playlist model + reorder
- [ ] Mini-player (persistent, cross-page)
- [ ] `track_suggestions` table + form
- [ ] "Community picks" list (admin-curated)

**Exit criteria:** author uploads 5 tracks, submits one suggestion, plays music across pages.

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

## How we work this project (session protocol)

Every session:
1. Read `docs/DECISIONS.md` and this roadmap first
2. Identify the current phase's next unchecked box
3. Do that one box; check it off
4. Append the day's outcome to `docs/DECISIONS.md`

No skipping ahead. No polishing phase N-2 while phase N is unfinished.
