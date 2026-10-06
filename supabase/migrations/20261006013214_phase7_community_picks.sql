-- Phase 7, Box 6: community picks and the admin review.
--
-- community_picks: tracks the admin chose to recommend (a link, nothing hosted).
-- Readable by every signed-in user; writable only by an admin (policies through
-- private.is_admin(), so `admins` is the single source of truth).
--
-- review_suggestion(): approving a suggestion sets its status AND creates the
-- pick in one function, so they happen together or not at all. It is SECURITY
-- INVOKER: RLS still applies to every statement in it (a non-admin could not
-- update a suggestion or insert a pick even without the explicit check), and the
-- explicit check at the top gives the named refusal `not_admin`. Reviewing a
-- suggestion twice is `already_reviewed`; the row is locked while it is reviewed,
-- so two admins cannot both approve it.

create table public.community_picks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null default '',
  link text not null,
  note text not null default '',
  suggestion_id uuid references public.track_suggestions(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint community_picks_title_length check (char_length(title) between 1 and 120),
  constraint community_picks_artist_length check (char_length(artist) <= 120),
  constraint community_picks_note_length check (char_length(note) <= 500),
  constraint community_picks_link check (public.suggestion_link_ok(link)),
  constraint community_picks_sort_order check (sort_order >= 0)
);

-- one pick per suggestion, so an approval cannot be applied twice
create unique index community_picks_suggestion_idx
  on public.community_picks (suggestion_id) where suggestion_id is not null;
create index community_picks_sort_idx on public.community_picks (sort_order, created_at);

alter table public.community_picks enable row level security;

create policy "community_picks - read"
  on public.community_picks for select to authenticated
  using (true);

create policy "community_picks - admin insert"
  on public.community_picks for insert to authenticated
  with check ((select private.is_admin()));

create policy "community_picks - admin update"
  on public.community_picks for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "community_picks - admin delete"
  on public.community_picks for delete to authenticated
  using ((select private.is_admin()));

revoke all on public.community_picks from anon;

-- Approve or reject a pending suggestion. Returns the new pick's id when
-- approved, null when rejected.
create or replace function public.review_suggestion(p_id uuid, p_action text, p_note text default '')
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  s public.track_suggestions;
  pick uuid;
  uid uuid := (select auth.uid());
  note text := coalesce(btrim(p_note), '');
begin
  if uid is null or not (select private.is_admin()) then
    raise exception 'not_admin' using errcode = 'P0001';
  end if;
  if p_action is null or p_action not in ('approve', 'reject') then
    raise exception 'bad_action' using errcode = 'P0001';
  end if;
  if char_length(note) > 500 then
    raise exception 'bad_note' using errcode = 'P0001';
  end if;

  select * into s from public.track_suggestions where id = p_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if s.status <> 'pending' then
    raise exception 'already_reviewed' using errcode = 'P0001';
  end if;

  if p_action = 'approve' then
    insert into public.community_picks (title, artist, link, note, suggestion_id, sort_order)
    values (
      s.title, s.artist, s.link, note, s.id,
      coalesce((select max(sort_order) + 1 from public.community_picks), 0)
    )
    returning id into pick;
    update public.track_suggestions set status = 'approved', reviewed_by = uid where id = s.id;
  else
    update public.track_suggestions set status = 'rejected', reviewed_by = uid where id = s.id;
  end if;
  return pick;
end;
$$;

revoke execute on function public.review_suggestion(uuid, text, text) from public, anon;
grant execute on function public.review_suggestion(uuid, text, text) to authenticated;
