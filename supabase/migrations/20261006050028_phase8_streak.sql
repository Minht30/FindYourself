-- Phase 8, Box 1: the streak, computed in the database.
--
-- A streak day is a calendar day, in the user's own time zone (profiles.timezone),
-- on which they either have a diary entry (text or a mood) or completed a task.
-- A missed day resets the streak to 0 (Minh's rule A; no grace days).
--
-- Stored on `profiles`, and ONLY ever written by the trigger function below:
--   streak_count     length of the run of consecutive active days that ends at
--                    streak_last_date (the most recent active day)
--   streak_last_date the most recent active day (never in the future)
--   streak_best      the longest run seen so far (never decreases)
-- Whether the run is still "alive" today (last day is today or yesterday) is a
-- question about the clock, so the app answers it at read time (lib/streak.ts);
-- the stored numbers are a pure function of the person's rows and zone.
--
-- The client cannot set any of it: UPDATE privilege on the three columns is
-- revoked from `authenticated` and `anon` (they could write streak_count
-- before this migration). Recomputing from the source rows after every
-- relevant change (rather than adding 1) means un-completing a task, deleting
-- a diary entry, a back-dated entry or a zone change can never leave a wrong
-- number behind.

alter table public.profiles
  add column streak_best integer not null default 0;

alter table public.profiles
  add constraint profiles_streak_nonneg check (streak_count >= 0 and streak_best >= streak_count);

-- Only these columns may be changed through the API. The streak columns and
-- created_at are not on the list.
revoke update on public.profiles from anon, authenticated;
grant update (username, display_name, timezone, theme) on public.profiles to authenticated;

-- The zone decides which day an event belongs to, so it must be a real one.
-- (The app validates with Intl first; this is the backstop for anything that
-- skips the app.)
create or replace function private.profiles_check_timezone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.timezone is null
     or not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'bad_timezone' using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke execute on function private.profiles_check_timezone() from public, anon, authenticated;

create trigger profiles_check_timezone
  before insert or update of timezone on public.profiles
  for each row execute function private.profiles_check_timezone();

-- The pure part: a set of days in, the run that ends at the latest day out.
-- Duplicates and nulls are ignored. Days are sorted newest first, and in a run
-- of consecutive days (day + row_number) stays constant, so the latest run is
-- exactly the rows where it equals (latest + 1). No days: (0, null).
create or replace function private.streak_run(p_days date[])
returns table (run_length integer, last_day date)
language sql
immutable
parallel safe
set search_path = ''
as $$
  with d as (select distinct x from unnest(p_days) as t(x) where x is not null),
       r as (
         select x,
                (row_number() over (order by x desc))::integer as rn,
                max(x) over () as mx
         from d
       )
  select coalesce(count(*) filter (where x + rn = mx + 1), 0)::integer, max(x) from r;
$$;
revoke execute on function private.streak_run(date[]) from public, anon, authenticated;

-- The recompute. SECURITY DEFINER (it writes the protected columns), in a
-- schema the API does not expose, and only ever called by the triggers below.
-- The advisory lock makes two simultaneous events for one person queue up, so
-- the later one always sees the earlier one's rows.
create or replace function private.refresh_streak(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  tz text;
  today date;
  days date[];
  run record;
begin
  perform pg_advisory_xact_lock(hashtextextended('streak:' || p_user::text, 0));

  select timezone into tz from public.profiles where id = p_user;
  if not found then
    return; -- the profile is being deleted along with its rows
  end if;
  today := (now() at time zone tz)::date;

  select array_agg(s.d) into days from (
    select entry_date as d
      from public.diary_entries
     where user_id = p_user
       and entry_date <= today
       and (content_chars > 0 or mood is not null)
    union
    select (completed_at at time zone tz)::date
      from public.tasks
     where user_id = p_user
       and completed_at is not null
       and completed_at <= now()
  ) s;

  select * into run from private.streak_run(days);

  update public.profiles
     set streak_count = run.run_length,
         streak_last_date = run.last_day,
         streak_best = greatest(streak_best, run.run_length)
   where id = p_user
     and (streak_count, streak_last_date, streak_best)
         is distinct from (run.run_length, run.last_day, greatest(streak_best, run.run_length));
end;
$$;
revoke execute on function private.refresh_streak(uuid) from public, anon, authenticated;

create or replace function private.streak_touch()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform private.refresh_streak(old.user_id);
    return old;
  end if;
  perform private.refresh_streak(new.user_id);
  return new;
end;
$$;
revoke execute on function private.streak_touch() from public, anon, authenticated;

create or replace function private.streak_touch_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.refresh_streak(new.id);
  return new;
end;
$$;
revoke execute on function private.streak_touch_profile() from public, anon, authenticated;

-- Diary: only changes that can flip "does this day count" run the recompute
-- (autosave rewrites the row every few seconds; most of those do not).
create trigger diary_streak_ins after insert on public.diary_entries
  for each row execute function private.streak_touch();
create trigger diary_streak_upd after update on public.diary_entries
  for each row
  when (old.entry_date <> new.entry_date
        or old.mood is distinct from new.mood
        or (old.content_chars > 0) is distinct from (new.content_chars > 0))
  execute function private.streak_touch();
create trigger diary_streak_del after delete on public.diary_entries
  for each row execute function private.streak_touch();

-- Tasks: only completion changes matter.
create trigger tasks_streak_ins after insert on public.tasks
  for each row when (new.completed_at is not null) execute function private.streak_touch();
create trigger tasks_streak_upd after update on public.tasks
  for each row when (old.completed_at is distinct from new.completed_at) execute function private.streak_touch();
create trigger tasks_streak_del after delete on public.tasks
  for each row when (old.completed_at is not null) execute function private.streak_touch();

-- A new zone moves events onto different days.
create trigger profiles_streak_tz after update of timezone on public.profiles
  for each row when (old.timezone is distinct from new.timezone)
  execute function private.streak_touch_profile();

-- Bring everyone up to date.
do $$
declare p record;
begin
  for p in select id from public.profiles loop
    perform private.refresh_streak(p.id);
  end loop;
end $$;
