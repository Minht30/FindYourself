# Product Requirements Document — FindYourself

**Version:** 0.1
**Status:** Draft
**Owner:** Minh Tran
**Last updated:** 2026-09-19

---

## 1. Problem

Modern productivity tools optimize for output but ignore the *feeling* of daily life. Calendar apps are sterile grids, to-do apps are guilt machines, and journaling apps are separate from planning. People — especially students and knowledge workers — end up switching between 4–5 apps to plan a day, focus on it, and reflect on it.

There is no single, personal, calm space that says: *here is your day, here is what you thought about it, here is the environment you work in.*

## 2. Goal

Ship a single-user-per-account web app that combines **planning, doing, and reflecting** in one cozy interface, so that a user can open FindYourself in the morning, use it as their sole workspace all day, and close it at night having planned tomorrow.

## 3. Non-goals (v1)

- Team collaboration / sharing calendars
- Native mobile apps
- Third-party calendar sync (Google/Outlook) — planned v1.5
- AI-generated insights or automations — deliberately excluded ("keep it human")
- Notifications outside the app (email, push) — v1.5+
- Any social feed, following, or public profile

## 4. Target user

**Primary persona — "Focused Student / Junior Professional"**
- Age 18–28, works or studies in front of a laptop 6–10 hrs/day
- Uses Notion for notes, Google Calendar for time, a Pomodoro tab for focus, Spotify/Lofi.cafe for ambiance — juggling four surfaces
- Journals inconsistently; wants to but current tools feel like more work
- Values aesthetics and *feel* almost as much as functionality
- Willing to spend 5 minutes each morning and 5 minutes each night on the app

## 5. Success metrics

Given no analytics infra in v1, success is qualitative + a small self-report loop:

| Metric | Target |
|---|---|
| Days used consecutively by author in first month | ≥ 20 |
| Diary entries written per week | ≥ 4 |
| Timetable blocks created per day (average) | ≥ 3 |
| Weekly retention (returning users after signup) | ≥ 40% |
| Portfolio impact: reviewer says "I want to try this" | Yes |

## 6. Feature scope — v1

### 6.0 App structure — four pages

Navigation lives at the top of the left sidebar (icon + label rail). Four top-level pages, each with a distinct purpose:

| Page | Route | Purpose |
|---|---|---|
| **📅 Timetable** *(default)* | `/today` → `/week` | The main course. Google-Calendar-style week/day/month view. Tasks live in a right-side drawer. Mini-mixer in sidebar. |
| **📓 Diary** | `/diary/[date]` | Free-form daily entries with mood, prompts, heatmap. Warm serif body. |
| **🎯 Focus** | `/focus` | Pomodoro timer + session log + full-screen focus mode. |
| **🎵 Chill** | `/chill` | *Zero productivity UI.* Music player + animated cozy scene (rain, steam, cafe). Designed to be left running as a screensaver-vibe. Master mute in top bar. |

Design principle: the first three are *doing*; Chill is *being*. Keeping Chill separate protects the calm — you cannot see a task or a timer from it.

### 6.1 Authentication
- Email + password signup/login via Supabase Auth
- Google OAuth as one-click alternative
- Persistent session, secure cookie
- Password reset by email

### 6.2 Timetable (calendar view)
- Day view (primary) and Week view
- Time axis 5:00 → 26:00 (2am next day), 30-min minor gridlines
- Click-drag to create a time-block; drag edges to resize; drag body to move
- Each block has: title, category (color), optional notes, optional linked task
- Categories are user-defined (default: Deep Work, Meetings, Learning, Rest, Personal)
- Blocks persist per-user, per-date
- "Copy yesterday" one-click action

### 6.3 Diary
- One entry per day (auto-created on first write)
- Rich text (bold, italic, headings, lists, quote) via Tiptap or similar
- Mood tag: one of 6 emoji states (radiant, calm, focused, tired, low, stormy)
- Two anchored prompts always visible above editor:
  - *"What am I thinking today?"*
  - *"What am I trying to do?"*
- Yesterday/tomorrow navigation
- Calendar heatmap of past entries (streak visual)

### 6.4 Tasks
- Three buckets: **Today**, **Tomorrow**, **Backlog**
- Task fields: title, description, priority (Low/Med/High), deadline (optional), category, restriction flag
- Drag-drop between buckets
- Checkbox to complete; completed tasks fade to a "Done today" section
- End-of-day roll: unfinished Today tasks prompt to move to Tomorrow or Backlog
- "Restriction flag" — see 6.6

### 6.5 Pomodoro / Focus mode
- Configurable cycles (default 25/5, long break 15 every 4)
- Optional link to a task or a timetable block ("I am focusing on X")
- Enter Focus Mode: full-screen dim, only timer + current task/block visible, ambient scene continues
- Session log: date, duration, linked task/block, completed?
- Weekly focus-hour total shown on dashboard

### 6.6 Restrictions (soft accountability)
- Any task can be marked with a **restriction**: a task-level or day-level rule like:
  - "Cannot start social/streaming apps until this is done" (soft — UI-only reminder banner)
  - "Deadline today at 18:00" — visible countdown
- Restrictions do not block the OS; they show a persistent, gentle reminder in the header and darken the app slightly when active

### 6.7 Cozy environment (the differentiator)
- **Scene:** Night Study Cafe by default — animated background (rain on window, warm interior glow, subtle candle flicker)
- **Ambient mixer:** independent volume sliders for layers:
  - Rain, Fireplace, Keyboard clicks, Cafe chatter, Piano
- **Music:**
  - User can upload MP3/M4A/OGG files (stored in Supabase Storage, per-user private bucket)
  - Playlist management: create playlists, reorder, shuffle
  - "Community picks" — a small curated list I (admin) maintain
  - **Music recommendation form:** users can submit a track suggestion via a simple form (title, artist, YouTube/Spotify link, why they like it). Admin reviews and adds picks to the curated list
- Mini-player (persistent bottom bar) — play/pause/skip/volume

### 6.8 Motivation layer
- Streak counter (days with any diary entry OR any completed task)
- Daily quote (rotating from a curated list, seeded to be same-quote-per-day)
- Weekly "Wins" recap card on Sunday evening: N tasks done, N focus hours, N diary entries
- Progress rings on dashboard: today's tasks done / focus goal / diary written

## 7. Out of scope for v1 (parked for later)

- Google Calendar / Outlook two-way sync
- Recurring tasks & recurring time-blocks
- Habit tracker
- Full theme marketplace (only Night Cafe in v1)
- Sharing a diary entry as an image
- Mobile-native (PWA install acceptable)

## 8. Constraints

- Free tier only: Supabase (500 MB db, 1 GB storage, 50k MAU), Vercel Hobby
- User-uploaded music capped at 50 MB per user, max 20 tracks (enforced in UI + storage policy)
- All build decisions made day-by-day, one small milestone at a time

## 9. Open questions

- Do we allow guest / demo mode (no signup) for portfolio reviewers to click through? *Proposed: yes — a read-only demo account with seed data.*
- License and privacy policy — MIT + a plain-language privacy note, since diaries are sensitive.

## 10. Risks

| Risk | Mitigation |
|---|---|
| Scope creep — cozy features tempt endless polish | Roadmap enforces phase gates; no phase-N feature until phase N-1 shipped |
| Music upload = storage cost | Hard cap per user, monitor Supabase usage weekly |
| Diary privacy — data is intimate | RLS on every table, no analytics on entry content, ship privacy note before launch |
| Ambient audio autoplay blocked by browsers | Ambient starts on first user interaction; visible "tap to begin" overlay |
