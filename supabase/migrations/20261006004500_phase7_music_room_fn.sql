-- Phase 7, Box 1 (fix): the "music - upload to own folder" policy counted the
-- caller's objects with a subquery on storage.objects itself, which Postgres
-- refuses (42P17, infinite recursion in the policy). The count moves into a
-- SECURITY DEFINER helper that has no arguments: it only ever looks at
-- auth.uid()'s own folder, so it leaks nothing.
--
-- It lives in a `private` schema, which the API (PostgREST) does not expose, so
-- it is not callable as an RPC; only the policy (running as the caller) uses it.

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.music_room_left()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) < 10 and coalesce(sum((o.metadata ->> 'size')::bigint), 0) < 52428800
  from storage.objects o
  where o.bucket_id = 'music'
    and (storage.foldername(o.name))[1] = (select auth.uid())::text;
$$;

revoke execute on function private.music_room_left() from public, anon;
grant execute on function private.music_room_left() to authenticated;

drop policy "music - upload to own folder" on storage.objects;

create policy "music - upload to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'music'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~ ('^' || (select auth.uid())::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.mp3$')
    and (select private.music_room_left())
  );
