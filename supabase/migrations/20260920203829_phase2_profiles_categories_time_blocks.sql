-- Phase 2: profiles + categories + time_blocks with RLS
-- Per docs/ERD.md. Policy shape: auth.uid() = user_id.

-- ============================================================
-- profiles
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  timezone text not null default 'UTC',
  theme text not null default 'night_cafe',
  streak_count integer not null default 0,
  streak_last_date date,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "own profile - select"
  on public.profiles for select
  using (auth.uid() = id);

create policy "own profile - update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- inserts are done by the on_auth_user_created trigger (security definer),
-- so no user-facing insert policy is needed.

-- ============================================================
-- categories
-- ============================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  color text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index categories_user_id_idx on public.categories (user_id, sort_order);

alter table public.categories enable row level security;

create policy "own categories - select"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "own categories - modify"
  on public.categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- time_blocks
-- ============================================================
create table public.time_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  title text not null default '',
  notes text,
  category_id uuid references public.categories(id) on delete set null,
  -- linked_task_id will be added in Phase 4 when tasks table exists.
  created_at timestamptz not null default now(),
  constraint time_blocks_time_range check (ends_at > starts_at)
);

create index time_blocks_user_starts_idx on public.time_blocks (user_id, starts_at);

alter table public.time_blocks enable row level security;

create policy "own time_blocks - select"
  on public.time_blocks for select
  using (auth.uid() = user_id);

create policy "own time_blocks - modify"
  on public.time_blocks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
