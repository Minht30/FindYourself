-- Phase 8, Box 1 (fix found by the first live test): "no completions from the
-- future" must compare calendar days, not instants.
--
-- `setTaskDone` stamps `completed_at` with the app server's clock. That clock
-- can be a moment ahead of the database's `now()` (here: the dev machine; on
-- Vercel the same skew exists in principle), and `completed_at <= now()` then
-- classed a task finished this very second as "future" and left the streak at
-- 0. A completion counts if its local day is not after today; only a day that
-- has not started yet is ignored.

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
       and (completed_at at time zone tz)::date <= today
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

-- Repair anyone the old rule left behind.
do $$
declare p record;
begin
  for p in select id from public.profiles loop
    perform private.refresh_streak(p.id);
  end loop;
end $$;
