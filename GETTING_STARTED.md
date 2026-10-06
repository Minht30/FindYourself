# Getting started

How to run FindYourself on your own machine and your own Supabase project.

## 1. Install and run

```bash
npm install
cp .env.local.example .env.local   # then fill it in (step 2)
npm run dev                         # http://localhost:3000
```

## 2. Create a Supabase project

1. https://supabase.com/dashboard -> **New project** (any name, a region near you, a strong database password).
2. **Project Settings -> API Keys**. Put these in `.env.local`:
   - Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
   - the publishable / **anon** key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - the **secret** (`service_role`) key -> `SUPABASE_SERVICE_ROLE_KEY`. Server-only: it bypasses all row-level security, so never commit it and never give it a `NEXT_PUBLIC_` name. The app uses it for one thing, deleting an account (and its music files); without it "Delete account" refuses and deletes nothing.
3. **Database**: apply every file in [`supabase/migrations/`](supabase/migrations) in filename order (the SQL editor, or `supabase db push`). They create the tables, row-level security, storage bucket and policies, triggers and functions, and seed the quotes and ambient layers.
   - The admin (who reviews track suggestions) is whoever the `phase7_admins_track_suggestions` migration inserts into `admins`; change that email before applying, or add your user id to `admins` afterwards.
4. **Authentication -> Sign In / Providers**:
   - Email: on (email confirmation on is fine).
   - **Allow anonymous sign-ins**: on, if you want the "Try the demo" button to work. Turning on CAPTCHA for it is advisable on a public site.
5. The demo's cleanup runs as a `pg_cron` job (created by the `phase9_demo_sandbox` migration, hourly, deleting guest accounts older than 24 hours).

## 3. Deploy (Vercel)

Import the repository, and add the same three environment variables (Production). Every push to `main` deploys.

## 4. Check it

```bash
npm run typecheck && npm run lint && npm test     # 700+ unit tests
npm run build && npx next start -p 3200            # a production build
npm run lighthouse -- --base http://localhost:3200 # accessibility / performance, per page
```

The SQL tests (row-level security, triggers, limits, the demo) are in [`supabase/tests/`](supabase/tests): run each block in the SQL editor against a throwaway account; every block ends in an exception that carries its results, so nothing is saved.

## More

[README](README.md) · [Roadmap](docs/ROADMAP.md) · [Decision log](docs/DECISIONS.md) (the dated record of what was built and how it was checked)
