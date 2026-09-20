-- Phase 3: diary_entries with RLS.
-- One row per user per calendar day. Content stored twice:
--   content_json: the Tiptap document (structure preserved for editing)
--   content_text: plaintext extract (drives search + heatmap intensity)

create type public.diary_mood as enum
  ('radiant', 'calm', 'focused', 'tired', 'low', 'stormy');

create table public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null,
  mood public.diary_mood,
  content_json jsonb not null default '{}'::jsonb,
  content_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint diary_entries_user_date_unique unique (user_id, entry_date)
);

create index diary_entries_user_date_idx on public.diary_entries (user_id, entry_date desc);

alter table public.diary_entries enable row level security;

create policy "own diary_entries - select"
  on public.diary_entries for select
  using (auth.uid() = user_id);

create policy "own diary_entries - modify"
  on public.diary_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Keep updated_at fresh on every UPDATE.
create or replace function public.touch_diary_entries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger diary_entries_touch_updated_at
  before update on public.diary_entries
  for each row execute function public.touch_diary_entries_updated_at();
