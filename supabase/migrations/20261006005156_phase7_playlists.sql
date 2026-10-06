-- Phase 7, Box 2: playlists and their ordered tracks.
--
-- * A playlist is named (1-60 chars); at most 20 per user (trigger, under a
--   per-user advisory lock).
-- * playlist_tracks is the ordered many-to-many: (playlist_id, track_id) is the
--   key, so a track appears once per playlist; `position` is unique per
--   playlist but the check is DEFERRED, so a reorder can rewrite every row in
--   one statement.
-- * A track put in a playlist must be the caller's own, and so must the
--   playlist (policies; the foreign keys alone would accept anybody's ids).
-- * Adding and reordering go through two small SECURITY INVOKER functions, so
--   they are atomic (the next position cannot be claimed twice; a reorder
--   either rewrites every position or none) and RLS still applies to them.
-- * Deleting a track or a playlist removes the link rows (cascade).

create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint playlists_name_length check (char_length(name) between 1 and 60)
);
create index playlists_user_created_idx on public.playlists (user_id, created_at);

create or replace function public.playlists_enforce_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('playlists:' || new.user_id::text, 0));
  if (select count(*) from public.playlists where user_id = new.user_id) >= 20 then
    raise exception 'playlist_limit' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke execute on function public.playlists_enforce_limit() from public, anon, authenticated;

create trigger playlists_enforce_limit
  before insert on public.playlists
  for each row execute function public.playlists_enforce_limit();

alter table public.playlists enable row level security;

create policy "own playlists - select" on public.playlists for select
  using ((select auth.uid()) = user_id);
create policy "own playlists - insert" on public.playlists for insert
  with check ((select auth.uid()) = user_id);
create policy "own playlists - update" on public.playlists for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own playlists - delete" on public.playlists for delete
  using ((select auth.uid()) = user_id);

revoke all on public.playlists from anon;
revoke update on public.playlists from authenticated;
grant update (name) on public.playlists to authenticated;

create table public.playlist_tracks (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  track_id uuid not null references public.music_tracks(id) on delete cascade,
  position integer not null,
  primary key (playlist_id, track_id),
  constraint playlist_tracks_position_range check (position between 0 and 100000),
  constraint playlist_tracks_position_unique unique (playlist_id, position) deferrable initially deferred
);
-- the foreign key to music_tracks is scanned when a track is deleted
create index playlist_tracks_track_idx on public.playlist_tracks (track_id);

alter table public.playlist_tracks enable row level security;

-- Every command is allowed only on the caller's own playlists; inserting also
-- requires the track to be the caller's own.
create policy "own playlist_tracks - select" on public.playlist_tracks for select
  using (exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = (select auth.uid())));

create policy "own playlist_tracks - insert" on public.playlist_tracks for insert
  with check (
    exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = (select auth.uid()))
    and exists (select 1 from public.music_tracks t where t.id = track_id and t.user_id = (select auth.uid()))
  );

create policy "own playlist_tracks - update" on public.playlist_tracks for update
  using (exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = (select auth.uid())));

create policy "own playlist_tracks - delete" on public.playlist_tracks for delete
  using (exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = (select auth.uid())));

revoke all on public.playlist_tracks from anon;
-- the only thing that ever changes about a link is its position
revoke update on public.playlist_tracks from authenticated;
grant update (position) on public.playlist_tracks to authenticated;

-- Append a track to the end of a playlist. Locks the playlist row so two
-- adders cannot claim the same position. SECURITY INVOKER: another user's
-- playlist is invisible (-> not_found) and another user's track is refused by
-- the policy (42501).
create or replace function public.add_playlist_track(p_playlist uuid, p_track uuid)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  pos integer;
begin
  perform 1 from public.playlists where id = p_playlist for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  insert into public.playlist_tracks (playlist_id, track_id, position)
  select p_playlist, p_track, coalesce(max(position) + 1, 0)
    from public.playlist_tracks where playlist_id = p_playlist
  returning position into pos;
  return pos;
end;
$$;

-- Put a playlist's tracks in a new order, atomically. `p_track_ids` must be
-- exactly the playlist's current tracks, each once, in the wanted order;
-- anything else is `bad_order` and nothing changes.
create or replace function public.reorder_playlist(p_playlist uuid, p_track_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  n integer;
begin
  perform 1 from public.playlists where id = p_playlist for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  select count(*) into n from public.playlist_tracks where playlist_id = p_playlist;
  if p_track_ids is null
     or coalesce(array_length(p_track_ids, 1), 0) <> n
     or (select count(distinct x) from unnest(p_track_ids) x) <> n
     or exists (
       select 1 from unnest(p_track_ids) x
       where not exists (select 1 from public.playlist_tracks pt where pt.playlist_id = p_playlist and pt.track_id = x)
     )
  then
    raise exception 'bad_order' using errcode = 'P0001';
  end if;
  update public.playlist_tracks pt
     set position = o.ord - 1
    from unnest(p_track_ids) with ordinality as o(id, ord)
   where pt.playlist_id = p_playlist and pt.track_id = o.id;
end;
$$;

revoke execute on function public.add_playlist_track(uuid, uuid) from public, anon;
revoke execute on function public.reorder_playlist(uuid, uuid[]) from public, anon;
grant execute on function public.add_playlist_track(uuid, uuid) to authenticated;
grant execute on function public.reorder_playlist(uuid, uuid[]) to authenticated;
