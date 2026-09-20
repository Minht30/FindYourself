# Getting started

## 1. Install dependencies

```bash
npm install
```

## 2. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000 — you'll see the landing page. Click **Enter →** to see the app shell with sidebar and theme toggle.

## 3. Later — connect Supabase

When we wire up auth, copy `.env.local.example` to `.env.local` and fill in your Supabase project's URL and keys. See [Supabase setup](#supabase-setup) below.

---

## What's in this scaffold (Phase 1 slice 1)

| File | Purpose |
|---|---|
| `package.json` | Next.js 14, React 18, TypeScript, Tailwind, Supabase SSR, Lucide icons |
| `app/globals.css` | Design tokens for both themes (Sunny Cafe + Netcafe After Dark) |
| `app/layout.tsx` | Root layout + Google Fonts + no-flash theme restore script |
| `app/page.tsx` | Landing page |
| `app/(app)/layout.tsx` | App shell (top bar + sidebar) |
| `app/(app)/today/page.tsx` | Timetable placeholder |
| `app/(app)/diary/page.tsx` | Diary placeholder |
| `app/(app)/focus/page.tsx` | Focus placeholder |
| `app/(app)/chill/page.tsx` | Chill placeholder |
| `components/layout/TopBar.tsx` | Top bar with view switcher + theme toggle |
| `components/layout/Sidebar.tsx` | Left rail with 4-page nav + categories |
| `lib/supabase/*` | Supabase client factories (unused until Phase 1 slice 2) |
| `tailwind.config.ts` | Colors mapped to CSS variables so themes swap live |

## Supabase setup

1. Go to https://supabase.com/dashboard → **New project**
2. Pick a name (e.g. `findyourself`), region closest to you, and a strong database password
3. Once the project is ready, go to **Project Settings → API**
4. Copy the three values into `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` *(keep secret; server-only)*
5. Send me the first two values in chat when you're ready and I'll wire the auth flow.

## GitHub setup

1. Go to https://github.com/new
2. Repository name: `findyourself`
3. Public or private — your call. Public is fine for CV visibility.
4. Do NOT initialize with a README (we have one).
5. After creating, GitHub shows the remote URL. Send it to me and I'll wire git.
