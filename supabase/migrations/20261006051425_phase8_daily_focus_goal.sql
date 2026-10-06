-- Phase 8, Box 4: the daily focus goal behind the progress rings.
--
-- The focus ring on /today shows today's focus time against a goal the person
-- chooses. It is a profile setting (not a per-device one, so it follows them),
-- 15 to 720 minutes in steps of 5, default 2 hours. The client may update it
-- (column privilege) but only to a value the CHECK accepts; the streak columns
-- stay unwritable (Box 1).

alter table public.profiles
  add column daily_focus_goal_minutes integer not null default 120;

alter table public.profiles
  add constraint profiles_focus_goal_range
  check (daily_focus_goal_minutes between 15 and 720 and daily_focus_goal_minutes % 5 = 0);

grant update (daily_focus_goal_minutes) on public.profiles to authenticated;
