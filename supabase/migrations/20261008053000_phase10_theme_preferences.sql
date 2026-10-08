-- Phase 10 (Stage 2 themes): what a person chose for the look of the app.
--
-- Two modes, two regions each: Day shows Monstadt (Liyue later), Night shows
-- Nod-Krai (Natlan later). `theme_mode` says which mode: 'auto' follows the
-- clock in the person's own time zone (night from 18:00 to 06:00, see
-- lib/theme.ts), 'day' and 'night' are fixed. `day_region` and `night_region`
-- are the region to show in each mode. They live on the profile so the choice
-- follows the person to every device; the app mirrors them in a cookie so the
-- server paints the right theme with no flash.
--
-- A region with no art yet is not in the CHECK lists, so the database refuses
-- it by name (23514) the same way the app does. When Liyue or Natlan ship,
-- a migration widens the matching constraint (drop and re-add).
--
-- The person may update the three columns (column privilege) and only to a
-- value the CHECKs accept. The older `theme` column ('night_cafe' by default,
-- never read or written by the app) is left alone; it belongs to the retired
-- Sunny Cafe / Netcafe pair.

alter table public.profiles
  add column theme_mode text not null default 'auto',
  add column day_region text not null default 'monstadt',
  add column night_region text not null default 'nodkrai';

alter table public.profiles
  add constraint profiles_theme_mode_values check (theme_mode in ('auto', 'day', 'night')),
  add constraint profiles_day_region_values check (day_region in ('monstadt')),
  add constraint profiles_night_region_values check (night_region in ('nodkrai'));

grant update (theme_mode, day_region, night_region) on public.profiles to authenticated;
