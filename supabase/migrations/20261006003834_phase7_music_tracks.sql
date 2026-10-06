-- Phase 7, Box 1: the private `music` bucket, its storage policies, and the
-- `music_tracks` table with the limits enforced inside the database.
--
-- Limits (Minh, 2026-10-05): MP3 only, at most 10 tracks per user, 10 MB per
-- file, 50 MB per user in total. Enforced in three places: the app (so the
-- refusal is friendly), the bucket + storage policies (so the API cannot be
-- used to skip the app), and the BEFORE INSERT trigger below (authoritative).
--
-- Deviations from docs/ERD.md (see DECISIONS, Session 40):
--   * the object name IS the track id: storage_path = {user_id}/{id}.mp3, so
--     the stored name is always a generated uuid, never what the user typed
--     (a CHECK enforces it);
--   * `title` / `artist` are the only columns a user may update (column
--     privileges), so size, path and mime cannot be rewritten after the
--     checks have passed.

-- ── bucket ────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('music', 'music', false, 10485760, array['audio/mpeg'])
on conflict (id) do update
  set public = false,
      file_size_limit = 10485760,
      allowed_mime_types = array['audio/mpeg'];

-- ── storage policies: a user touches only {their id}/{uuid}.mp3 ───────────────
create policy "music - read own folder"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'music'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- An upload must be a generated name inside the caller's own folder, and the
-- caller must still have room: fewer than 10 objects and under 50 MB stored.
-- (An object's size is only known once it lands, so the byte cap here is "you
-- may start another upload while under 50 MB"; the exact per-file and total
-- limits are enforced by the bucket and by the music_tracks trigger.)
create policy "music - upload to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'music'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~ ('^' || (select auth.uid())::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.mp3$')
    and (
      select count(*) < 10 and coalesce(sum((o.metadata ->> 'size')::bigint), 0) < 52428800
      from storage.objects o
      where o.bucket_id = 'music'
        and (storage.foldername(o.name))[1] = (select auth.uid())::text
    )
  );

create policy "music - delete own folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'music'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
-- No update policy: stored objects are never overwritten (no upsert).

-- ── table ─────────────────────────────────────────────────────────────────────
create table public.music_tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title text not null,
  artist text not null default '',
  storage_path text not null unique,
  duration_seconds integer not null,
  mime text not null default 'audio/mpeg',
  size_bytes bigint not null,
  created_at timestamptz not null default now(),
  constraint music_tracks_title_length check (char_length(title) between 1 and 120),
  constraint music_tracks_artist_length check (char_length(artist) <= 120),
  constraint music_tracks_mime check (mime = 'audio/mpeg'),
  constraint music_tracks_size check (size_bytes between 1 and 10485760),
  constraint music_tracks_duration check (duration_seconds between 1 and 7200),
  -- the object is {user}/{this track's id}.mp3: generated ids, nothing typed
  constraint music_tracks_path check (storage_path = user_id::text || '/' || id::text || '.mp3')
);

create index music_tracks_user_created_idx on public.music_tracks (user_id, created_at);

-- Count and total are checked under a per-user advisory lock, so two uploads
-- finishing at the same moment cannot both slip under the cap. The reason is
-- the exception message; the app maps it to a friendly sentence.
create or replace function public.music_tracks_enforce_limits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
  total bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended('music:' || new.user_id::text, 0));
  if new.size_bytes > 10485760 then
    raise exception 'too_big' using errcode = 'P0001';
  end if;
  select count(*), coalesce(sum(size_bytes), 0) into n, total
    from public.music_tracks where user_id = new.user_id;
  if n >= 10 then
    raise exception 'library_full' using errcode = 'P0001';
  end if;
  if total + new.size_bytes > 52428800 then
    raise exception 'quota_exceeded' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.music_tracks_enforce_limits() from public, anon, authenticated;

create trigger music_tracks_enforce_limits
  before insert on public.music_tracks
  for each row execute function public.music_tracks_enforce_limits();

alter table public.music_tracks enable row level security;

create policy "own music_tracks - select"
  on public.music_tracks for select
  using ((select auth.uid()) = user_id);

create policy "own music_tracks - insert"
  on public.music_tracks for insert
  with check ((select auth.uid()) = user_id);

create policy "own music_tracks - update"
  on public.music_tracks for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own music_tracks - delete"
  on public.music_tracks for delete
  using ((select auth.uid()) = user_id);

revoke all on public.music_tracks from anon;
-- A user may rename a track and nothing else about it.
revoke update on public.music_tracks from authenticated;
grant update (title, artist) on public.music_tracks to authenticated;
