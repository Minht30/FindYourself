# Architecture — FindYourself

## 1. High-level

```
┌───────────────────────────────────────────────────────────┐
│                     Browser (Next.js)                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│  │ Timetable  │ │   Diary    │ │   Tasks    │  (RSC + CS) │
│  └────────────┘ └────────────┘ └────────────┘             │
│  ┌────────────┐ ┌───────────────────────────┐             │
│  │  Pomodoro  │ │  Ambient / Music Mixer    │             │
│  └────────────┘ └───────────────────────────┘             │
└──────────────┬────────────────────────────────────────────┘
               │ HTTPS
               ▼
┌───────────────────────────────────────────────────────────┐
│                  Next.js on Vercel                        │
│  App Router · Server Actions · Route Handlers · Edge      │
└──────────────┬────────────────────────────────────────────┘
               │  supabase-js
               ▼
┌───────────────────────────────────────────────────────────┐
│                        Supabase                           │
│  Postgres (RLS)  ·  Auth  ·  Storage (user music)         │
└───────────────────────────────────────────────────────────┘
```

## 2. Frontend

- **Framework:** Next.js 14, App Router
- **Rendering:** RSC for reads (timetable/diary lists), Client Components for interactive surfaces (drag-drop grid, mixer, timer)
- **State:** React state + `zustand` for cross-component client state (mixer levels, timer, current playing track). No Redux.
- **Data fetching:** Supabase client directly from RSC; mutations via Server Actions
- **Realtime:** Not in v1 (single-user data doesn't need it)
- **Styling:** Tailwind CSS + CSS variables for theme tokens; `shadcn/ui` primitives
- **Motion:** Framer Motion for scene animations, block drag, page transitions
- **Editor:** Tiptap for diary rich text
- **Drag & drop:** `@dnd-kit/core` for tasks; custom pointer-based drag for timetable grid
- **Audio:** Web Audio API with `<audio>` elements wrapped in a `MixerContext` — each ambient layer is its own looping `AudioBufferSourceNode` with a `GainNode`, master gain routed to `AudioContext.destination`

## 3. Backend

Supabase provides everything server-side:
- **Auth:** email/password + Google OAuth
- **Database:** Postgres with strict Row Level Security per user
- **Storage:** two buckets
  - `music` — per-user private, RLS by `owner = auth.uid()`
  - `ambient` — public read-only, admin write (rain.mp3, fire.mp3, etc.)
- **Edge functions:** none in v1; if needed later (e.g. weekly digest email), one Deno function

## 4. Directory structure

```
findyourself/
├── app/
│   ├── (auth)/login, signup, reset
│   ├── (app)/
│   │   ├── layout.tsx           ← sidebar + persistent mini-player
│   │   ├── page.tsx             ← dashboard (redirects to /today)
│   │   ├── today/               ← timetable
│   │   ├── diary/[date]/
│   │   ├── tasks/
│   │   ├── focus/               ← full-screen focus mode
│   │   └── settings/
│   ├── api/                     ← webhooks only (Supabase not needed here)
│   └── landing/page.tsx
├── components/
│   ├── timetable/  diary/  tasks/  mixer/  music/  pomodoro/
│   └── ui/                      ← shadcn primitives
├── lib/
│   ├── supabase/                ← server + client factories
│   ├── audio/                   ← MixerContext, buffer loader
│   └── utils/
├── stores/                      ← zustand stores
├── styles/theme.css             ← design tokens
├── db/
│   ├── schema.sql               ← full schema
│   ├── policies.sql             ← RLS
│   └── seed.sql                 ← categories, quotes, ambient tracks
└── docs/                        ← the folder you are reading
```

## 5. Key decisions & rationale

| Decision | Rationale |
|---|---|
| Next.js over Vite SPA | RSC lets diary/timetable load with server-side auth; SEO-neutral but faster first paint |
| Supabase over custom Node backend | RLS + Auth + Storage in one; zero-cost demo tier; strong CV story ("modern BaaS") |
| No AI in v1 | User's explicit product decision — diary is intimate, human-authored |
| Zustand over Redux | Mixer + timer are tiny state — Redux overhead not justified |
| Tiptap over Slate | Better docs, lighter, headless, ships with shadcn-friendly styles |
| No mobile-native | Responsive + PWA covers 90% of use; keeps scope small |
| Web Audio API instead of `<audio>` alone | Precise per-layer gain, no autoplay-restart glitches, ready for future crossfade |

## 6. Security

- Supabase RLS on **every** table with a policy shaped `auth.uid() = user_id`
- Storage bucket for music has a policy limiting `SELECT/INSERT/DELETE` to `owner = auth.uid()`
- Diary content is never sent to any 3rd party, never logged, never used for analytics
- HTTPS-only cookies for session
- CSP header excluding inline scripts (Next.js default is safe with nonces)
- Music uploads: MIME-type verified server-side (audio/mpeg, audio/mp4, audio/ogg), size ≤ 50 MB, filename sanitized

## 7. Performance targets

- LCP < 2.0s on 4G
- Timetable grid interaction latency < 16ms (60fps drag)
- Ambient layer switch < 50ms perceptible delay
- Diary autosave debounce 3s, network request < 300ms

## 8. Deployment

- **Prod:** Vercel Production; `main` branch auto-deploys
- **Preview:** every PR → Vercel Preview URL
- **DB migrations:** Supabase CLI, versioned SQL in `db/migrations/`
- **Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- **Backups:** Supabase daily snapshots (free tier: 7 days)
