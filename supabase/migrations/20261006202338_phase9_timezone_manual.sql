-- Phase 9: a manual time zone (US-8.2: "auto-detect, editable").
--
-- `timezone` has been the zone the database counts days in (the streak) since
-- Phase 8, kept equal to the browser's. `timezone_manual` says the person chose
-- it themselves: while it is true the browser's zone no longer overwrites it.
-- The person may update it (column privilege); the zone itself is still checked
-- by the `profiles_check_timezone` trigger, and a changed zone still makes the
-- database recompute the streak.

alter table public.profiles
  add column timezone_manual boolean not null default false;

grant update (timezone_manual) on public.profiles to authenticated;
