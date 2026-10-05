-- Phase 6, Box 4: mixer_state, one row per user (the ambient mix they left).
--
-- Deviations from docs/ERD.md (see DECISIONS, Session 36):
--   * `muted` is stored too, so "I left it muted" survives a new device.
--   * `levels` is checked in the database, not only in the app: an object of at
--     most 16 keys (lowercase layer keys), each a number from 0 to 1. A tampered
--     client cannot park junk or megabytes in the row.
--   * `current_track_id` stays null until Phase 7 (music); no foreign key yet
--     because music_tracks does not exist.
--   * No delete policy for the app: the row goes away with the profile
--     (on delete cascade), and "reset my mix" is an update.

create or replace function public.mixer_levels_valid(l jsonb)
returns boolean
language sql
immutable
set search_path = public
as $$
  select jsonb_typeof(l) = 'object'
    and (select count(*) from jsonb_object_keys(l)) <= 16
    and not exists (
      select 1 from jsonb_each(l) e
      where e.key !~ '^[a-z][a-z0-9_]{0,31}$'
         or jsonb_typeof(e.value) <> 'number'
         or (e.value #>> '{}')::numeric not between 0 and 1
    );
$$;

create table public.mixer_state (
  user_id uuid primary key default auth.uid() references public.profiles(id) on delete cascade,
  levels jsonb not null default '{}'::jsonb,
  master_volume numeric not null default 0.8,
  muted boolean not null default false,
  current_track_id uuid,
  updated_at timestamptz not null default now(),
  constraint mixer_state_levels_valid check (public.mixer_levels_valid(levels)),
  constraint mixer_state_master_range check (master_volume between 0 and 1)
);

create or replace function public.touch_mixer_state_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger mixer_state_touch_updated_at
  before update on public.mixer_state
  for each row execute function public.touch_mixer_state_updated_at();

alter table public.mixer_state enable row level security;

-- (select auth.uid()) is evaluated once per statement; one policy per command.
create policy "own mixer_state - select"
  on public.mixer_state for select
  using ((select auth.uid()) = user_id);

create policy "own mixer_state - insert"
  on public.mixer_state for insert
  with check ((select auth.uid()) = user_id);

create policy "own mixer_state - update"
  on public.mixer_state for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.mixer_state from anon;
