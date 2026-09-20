# FindYourself

> A cozy personal productivity sanctuary — plan your day, write your thoughts, and build a workspace that feels like *yours*.

FindYourself is a full-stack web app that combines a Google Calendar-style **timetable**, a private **diary**, a **task manager with focus restrictions**, a **Pomodoro timer**, and a **custom ambient environment** (mixable sounds + user-uploaded music) into a single, calm workspace styled after a late-night study cafe.

Built as a portfolio project to demonstrate end-to-end product thinking: PRD, user stories, architecture, database design, design system, and a live deployed app.

---

## Vision

Most productivity tools are cold and transactional. FindYourself treats a day as something you *inhabit* — you open the app in the morning, glance at your timetable, drop into a focus block with rain on the window and a lofi track playing, and end the night by writing what you thought about. It is a diary of yourself and a plan for tomorrow, in the same place.

## Core pillars (v1)

| Pillar | What it is |
|---|---|
| **Timetable** | Day/week grid, drag to create time-blocks, color-coded categories, Google Calendar-style |
| **Diary** | Free-form daily entries, mood tag, "what am I thinking / what am I trying to do" prompts |
| **Tasks** | Today / Tomorrow / Backlog with priority, deadline, and per-task restrictions (locked focus) |
| **Pomodoro + Focus mode** | 25/5 cycles, full-screen dim, non-focus UI hidden, session tracked |
| **Cozy environment** | Night-cafe scene with ambient layers (rain, fireplace, keyboard, jazz) + user music upload + curated recommendations |
| **Motivation** | Streaks, daily quote, weekly "wins" recap, gentle nudges |

## Tech stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** Supabase (Postgres, Auth, Storage, Row Level Security)
- **Deployment:** Vercel + Supabase free tier
- **Design:** Custom design system, "Night Study Cafe" theme, dark-first, light theme variant

## Documentation

- [Product Requirements](docs/PRD.md)
- [User Stories](docs/USER_STORIES.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database Schema (ERD)](docs/ERD.md)
- [Design System](docs/DESIGN_SYSTEM.md)
- [Roadmap](docs/ROADMAP.md)
- [Decision Log](docs/DECISIONS.md)

## Status

Currently in **Phase 0 — planning & design**. See [Roadmap](docs/ROADMAP.md).

## Author

Built by Minh Tran as a portfolio project — end-to-end product design, engineering, and deployment.
