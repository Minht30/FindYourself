# User Stories — FindYourself

Format: `As a <role>, I want <capability>, so that <benefit>.`
Acceptance criteria in Given/When/Then.

---

## Epic 1 — Onboarding & Auth

### US-1.1 Sign up
**As a** new visitor, **I want to** create an account with email + password (or Google), **so that** I have a private space for my day.

**Acceptance:**
- Given I am on the landing page, when I click "Get started" and enter a valid email + password, then an account is created and I am redirected to the timetable.
- Given I sign up, when the account is created, then a default set of categories (Deep Work, Meetings, Learning, Rest, Personal) is seeded.
- Given I sign up, when the account is created, then a private Supabase Storage bucket is provisioned for my music.

### US-1.2 Guest demo mode
**As a** portfolio reviewer, **I want to** click "Try demo", **so that** I can see the app populated without signing up.

**Acceptance:**
- Given the landing page, when I click "Try demo", then I am signed in as a read-only demo user with pre-seeded timetable, tasks, and diary entries.
- Given demo mode, when I try to save changes, then a toast appears: "Sign up to save your own version."

---

## Epic 2 — Timetable

### US-2.1 Create a time-block
**As a** user, **I want to** click-and-drag on the day grid to create a time-block, **so that** I can plan my hours quickly.

**Acceptance:**
- Given day view, when I press mouse on the grid at 09:00 and drag to 10:30, then a block appears from 09:00–10:30.
- Given a new block, when I release the mouse, then a title input auto-focuses.
- Given a block, when I press Enter without typing, then it saves as "Untitled block".

### US-2.2 Move and resize a block
**Acceptance:**
- Given an existing block, when I drag its body, then it moves in 15-minute snaps.
- Given a block, when I drag its top or bottom edge, then its start/end changes.
- Blocks cannot overlap unless the user confirms — a warning banner appears on overlap.

### US-2.3 Categorize a block
**Acceptance:**
- Given a block editor, when I choose a category, then the block adopts that category's color.
- Given a user, when they open settings, then they can add/rename/recolor categories.

### US-2.4 Copy yesterday
**Acceptance:**
- Given a day with no blocks, when I click "Copy yesterday", then yesterday's blocks are duplicated onto today.

---

## Epic 3 — Diary

### US-3.1 Write today's entry
**As a** user, **I want to** write a diary entry with mood, **so that** I can reflect on the day.

**Acceptance:**
- Given the diary page for today, when I start typing, then an entry is created and autosaves every 3 seconds.
- Given the editor, when I click a mood emoji, then it is stored on the entry.
- Given the two prompts "What am I thinking today?" and "What am I trying to do?", when I click either, then a heading is inserted at the cursor.

### US-3.2 Navigate past entries
**Acceptance:**
- Given the diary page, when I click ← / →, then I navigate day-by-day.
- Given the diary page, when I click a date in the year-heatmap, then I jump to that date's entry.

### US-3.3 Diary is private
**Acceptance:**
- Given any request for a diary entry, when the requester is not the owner, then Supabase RLS returns no rows.

---

## Epic 4 — Tasks

### US-4.1 Add a task
**Acceptance:**
- Given the tasks panel, when I click "+ Add task" in Today/Tomorrow/Backlog, then a task is created in that bucket.
- Task fields: title (required), description, priority, deadline, category, restriction (bool).

### US-4.2 Drag between buckets
**Acceptance:**
- Given a task in Backlog, when I drag it to Today, then its bucket updates and persists.

### US-4.3 Complete a task
**Acceptance:**
- Given a task, when I check the box, then it animates into a "Done today" collapsed section at the bottom.
- Given a completed task, when I uncheck, then it returns to its bucket.

### US-4.4 End-of-day roll
**Acceptance:**
- Given unfinished Today tasks at 23:00 local (or at first-visit next day), when the roll modal appears, then each task offers Move to Tomorrow / Move to Backlog / Keep.

### US-4.5 Task with restriction
**Acceptance:**
- Given a task with the restriction flag set, when it is uncompleted, then the header shows a persistent reminder chip: "🔒 Focus first: [task title]".
- Given a restricted task and I open the mixer or navigate away, then no action is blocked but the reminder chip remains.

---

## Epic 5 — Pomodoro & Focus

### US-5.1 Start a pomodoro
**Acceptance:**
- Given the timer widget, when I click Start, then a 25-minute countdown begins.
- Given a running timer, when I click "Link to task/block", then I select a task or timetable block for the session.

### US-5.2 Enter Focus Mode
**Acceptance:**
- Given a running timer, when I click the fullscreen icon, then the UI dims to show only timer + linked item + ambient scene continues.
- Given Focus Mode, when I press Esc, then I exit but the timer keeps running.

### US-5.3 Session log
**Acceptance:**
- Given a completed session, when the timer finishes, then a `focus_sessions` row is created with duration, linked task/block id, and completed=true.
- Given the dashboard, when I open it, then I see this week's total focus hours.

---

## Epic 6 — Cozy Environment

### US-6.1 Ambient mixer
**Acceptance:**
- Given the mixer panel, when I move the "Rain" slider, then rain audio volume changes in real time and persists to my profile.
- Given I close the app and reopen, when I load, then my last mixer state is restored.

### US-6.2 Upload music
**Acceptance:**
- Given the music panel, when I drop an MP3 file (< 50 MB, mp3/m4a/ogg), then it uploads to my private bucket and appears in my library.
- Given my library is full (20 tracks), when I try to upload, then an error appears with clear message.

### US-6.3 Music recommendation form
**Acceptance:**
- Given the music panel, when I click "Suggest a track", then a form opens (title, artist, link, why you like it).
- Given I submit, when submission succeeds, then a `track_suggestions` row is created and I see a thank-you toast.
- Given admin view, when I approve a suggestion, then it appears in the "Community picks" list for all users.

### US-6.4 Mini-player
**Acceptance:**
- Given music is playing, when I navigate between pages, then playback continues uninterrupted.

---

## Epic 7 — Motivation

### US-7.1 Streak
**Acceptance:**
- Given I write a diary entry or complete a task on day N, when day N ends, then my streak increments by 1.
- Given I miss a day, when I return, then the streak resets to 1 (with a gentle "welcome back" message, not shame).

### US-7.2 Daily quote
**Acceptance:**
- Given a date, when I load the dashboard, then a quote is displayed. Same date → same quote for everyone.

### US-7.3 Weekly wins
**Acceptance:**
- Given it is Sunday after 18:00 local, when I open the dashboard, then a "Your week" card summarizes tasks done, focus hours, diary entries.

---

## Epic 8 — Settings

### US-8.1 Manage categories
- Rename, recolor, reorder, delete (with reassign prompt).

### US-8.2 Timezone
- Auto-detect on signup, editable.

### US-8.3 Delete account
- Two-step confirmation; deletes all rows and storage objects.
