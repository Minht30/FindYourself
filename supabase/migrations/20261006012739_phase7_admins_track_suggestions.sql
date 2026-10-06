-- Phase 7, Box 5: who is an admin, and track suggestions.
--
-- Decision D (Minh): an `admins` table, not a flag on `profiles` (users can
-- update their own profile row). It has NO write policy and its write
-- privileges are revoked, so only a migration (or the owner role) changes it.
-- A signed-in user may read only their own row, which is how the app learns
-- whether to show the review view. Minh's account (qminh30k3@gmail.com) is
-- filled in below, looked up by email so no id is hard-coded.
--
-- track_suggestions: a signed-in user suggests a track by link (nothing is
-- hosted or embedded). Insert own as `pending` only; read own, or all if admin;
-- update admin only (status and reviewed_by); a user may withdraw their own
-- *pending* suggestion. The link is checked in the database too: https only,
-- an allow-list of hosts, no whitespace, at most 500 characters; and at most 5
-- pending suggestions per user (a locking trigger).

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create policy "admins - read own row"
  on public.admins for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

insert into public.admins (user_id)
select id from auth.users where email = 'qminh30k3@gmail.com'
on conflict do nothing;

-- Used by policies (and later by the review functions). In a schema the API
-- does not expose, SECURITY DEFINER so it can read `admins` for any caller,
-- no arguments so it can only ever answer "is the caller an admin?".
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

-- The link rule, once, for the table's CHECK. The app normalises with the URL
-- parser first (lib/music/links.ts), so a stored link is always a canonical
-- href; this is the backstop for anything that skips the app.
create or replace function public.suggestion_link_ok(l text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select l is not null
     and char_length(l) <= 500
     and l !~ '[[:space:][:cntrl:]]'
     and l ~* '^https://((www\.|m\.|music\.)?youtube\.com|youtu\.be|open\.spotify\.com|spotify\.link)(/|$)';
$$;

create table public.track_suggestions (
  id uuid primary key default gen_random_uuid(),
  suggested_by uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title text not null,
  artist text not null default '',
  link text not null,
  reason text not null default '',
  status text not null default 'pending',
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint track_suggestions_title_length check (char_length(title) between 1 and 120),
  constraint track_suggestions_artist_length check (char_length(artist) <= 120),
  constraint track_suggestions_reason_length check (char_length(reason) <= 500),
  constraint track_suggestions_link check (public.suggestion_link_ok(link)),
  constraint track_suggestions_status check (status in ('pending', 'approved', 'rejected'))
);

create index track_suggestions_user_created_idx on public.track_suggestions (suggested_by, created_at desc);
-- the review view: pending first
create index track_suggestions_status_created_idx on public.track_suggestions (status, created_at);
create index track_suggestions_reviewed_by_idx on public.track_suggestions (reviewed_by) where reviewed_by is not null;

create or replace function public.track_suggestions_enforce_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('suggestions:' || new.suggested_by::text, 0));
  if (select count(*) from public.track_suggestions
       where suggested_by = new.suggested_by and status = 'pending') >= 5 then
    raise exception 'too_many_pending' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke execute on function public.track_suggestions_enforce_limit() from public, anon, authenticated;

create trigger track_suggestions_enforce_limit
  before insert on public.track_suggestions
  for each row execute function public.track_suggestions_enforce_limit();

alter table public.track_suggestions enable row level security;

-- A new suggestion is always the caller's own, always pending, never reviewed.
create policy "track_suggestions - insert own"
  on public.track_suggestions for insert to authenticated
  with check (
    (select auth.uid()) = suggested_by
    and status = 'pending'
    and reviewed_by is null
  );

create policy "track_suggestions - read own or admin"
  on public.track_suggestions for select to authenticated
  using ((select auth.uid()) = suggested_by or (select private.is_admin()));

create policy "track_suggestions - admin review"
  on public.track_suggestions for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Withdrawing your own suggestion, while it is still pending.
create policy "track_suggestions - withdraw own pending"
  on public.track_suggestions for delete to authenticated
  using ((select auth.uid()) = suggested_by and status = 'pending');

revoke all on public.track_suggestions from anon;
-- the only things a review changes
revoke update on public.track_suggestions from authenticated;
grant update (status, reviewed_by) on public.track_suggestions to authenticated;
