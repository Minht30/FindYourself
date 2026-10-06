-- Phase 9: SQL tests for the guest demo. Run each block in the Supabase SQL editor
-- (or the MCP `execute_sql`). Every block ends in an exception whose message
-- carries the results, so nothing persists: the guest accounts it creates only
-- ever exist inside the rolled-back transaction. `real_user` (block 1) is the
-- throwaway test account; it is only read or refused, never changed.

-- ── 1. Seed, refusals, and what a guest may and may not do ──────────────────
-- Expected: guest created: profile=1 categories=5; seeded blocks=8 tasks=7
-- diary=3 focus=4 done=1 restriction=1 uncategorised blocks=0; streak=4 last=<today>;
-- reseed -> already_seeded; far date -> bad_date; bad zone -> bad_timezone; null
-- date -> bad_date; guest suggestion / track / upload -> 42501; guest can still add
-- a task and rename a category; real user -> not_demo and can still suggest a
-- track; anon -> 42501.
do $$
declare
  guest constant uuid := '00000000-0000-0000-0000-00000000d3a0';
  real_user constant uuid := '33ccfa36-b0a0-4006-9089-162c0581759d';
  d date := current_date;
  out text := ''; r record; n int;
begin
  insert into auth.users (id, aud, role, is_anonymous, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  values (guest, 'authenticated', 'authenticated', true, now(), now(), '{}'::jsonb, '{}'::jsonb);
  select count(*) into n from public.categories where user_id = guest;
  out := out || format('guest created: profile=%s categories=%s | ', (select count(*) from public.profiles where id = guest), n);

  perform set_config('request.jwt.claims', json_build_object('sub', guest, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  set local role authenticated;

  perform public.seed_demo(d, 'America/Toronto');
  select (select count(*) from public.time_blocks) b, (select count(*) from public.tasks) t, (select count(*) from public.diary_entries) di, (select count(*) from public.focus_sessions) f,
         (select count(*) from public.tasks where completed_at is not null) done, (select count(*) from public.tasks where is_restriction) restr,
         (select count(*) from public.time_blocks where category_id is null) uncategorised_blocks into r;
  out := out || format('seeded: blocks=%s tasks=%s diary=%s focus=%s done=%s restriction=%s uncategorised blocks=%s | ', r.b, r.t, r.di, r.f, r.done, r.restr, r.uncategorised_blocks);
  select streak_count c, streak_last_date l into r from public.profiles where id = guest;
  out := out || format('streak=%s last=%s | ', r.c, r.l);

  begin perform public.seed_demo(d, 'America/Toronto'); out := out || 'reseed ALLOWED | '; exception when others then out := out || format('reseed -> %s | ', sqlerrm); end;
  begin perform public.seed_demo(d + 5, 'America/Toronto'); out := out || 'far date ALLOWED | '; exception when others then out := out || format('far date -> %s | ', sqlerrm); end;
  begin perform public.seed_demo(d, 'Mars/Phobos'); out := out || 'bad zone ALLOWED | '; exception when others then out := out || format('bad zone -> %s | ', sqlerrm); end;
  begin perform public.seed_demo(null, 'UTC'); out := out || 'null date ALLOWED | '; exception when others then out := out || format('null date -> %s | ', sqlerrm); end;

  begin insert into public.track_suggestions(suggested_by,title,artist,link,reason) values (guest,'x','y','https://youtu.be/abc','z'); out := out || 'guest suggestion ALLOWED | '; exception when others then out := out || format('guest suggestion -> %s | ', sqlstate); end;
  begin insert into public.music_tracks(user_id,title,storage_path,duration_seconds,mime,size_bytes,id) values (guest,'x', guest || '/11111111-1111-1111-1111-111111111111.mp3', 10, 'audio/mpeg', 1000, '11111111-1111-1111-1111-111111111111'); out := out || 'guest track ALLOWED | '; exception when others then out := out || format('guest track -> %s | ', sqlstate); end;
  begin insert into storage.objects(bucket_id, name, owner, metadata) values ('music', guest || '/11111111-1111-1111-1111-111111111111.mp3', guest, '{"size":1000,"mimetype":"audio/mpeg"}'::jsonb); out := out || 'guest upload ALLOWED | '; exception when others then out := out || format('guest upload -> %s | ', sqlstate); end;
  insert into public.tasks(user_id,title) values (guest,'FYTEST mine'); get diagnostics n = row_count; out := out || format('guest can add a task=%s | ', n);
  update public.categories set name = 'Renamed' where user_id = guest and name = 'Rest'; get diagnostics n = row_count; out := out || format('guest can rename a category=%s | ', n);

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', real_user, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin perform public.seed_demo(d, 'UTC'); out := out || 'real user seeded ALLOWED | '; exception when others then out := out || format('real user -> %s | ', sqlerrm); end;
  insert into public.track_suggestions(suggested_by,title,artist,link,reason) values (real_user,'FYTEST ok','y','https://youtu.be/abc','z'); get diagnostics n = row_count; out := out || format('real user can still suggest=%s | ', n);

  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin perform public.seed_demo(d, 'UTC'); out := out || 'anon seeded ALLOWED | '; exception when others then out := out || format('anon -> %s | ', sqlstate); end;

  raise exception 'RESULT: %', out;
end $$;

-- ── 2. The cap on guest accounts ────────────────────────────────────────────
-- Expected: the insert loop is refused with demo_full (it can only fire once 300
-- guests exist); a real (non-guest) signup still works at the cap.
do $$
declare out text := ''; k int;
begin
  begin
    for k in 1..305 loop
      insert into auth.users (id, aud, role, is_anonymous, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
      values (gen_random_uuid(), 'authenticated', 'authenticated', true, now(), now(), '{}'::jsonb, '{}'::jsonb);
    end loop;
    out := out || 'cap NOT enforced | ';
  exception when others then
    out := out || format('cap: refused with "%s" | ', sqlerrm);
  end;
  insert into auth.users (id, aud, role, is_anonymous, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  values (gen_random_uuid(), 'authenticated', 'authenticated', false, now(), now(), '{}'::jsonb, '{}'::jsonb);
  out := out || 'a real signup still works at the cap | ';
  raise exception 'RESULT: %', out;
end $$;

-- ── 3. The purge ────────────────────────────────────────────────────────────
-- Expected: before blocks=8 tasks=7 diary=3; 30 minutes -> too_young; purge
-- removed=1 (plus any real old guests that exist); the 25-hour-old guest is gone,
-- the 23-hour-old guest and a 90-hour-old NON-guest are kept; all of the old
-- guest's rows are gone by cascade; an authenticated caller -> 42501.
do $$
declare
  old_guest constant uuid := '00000000-0000-0000-0000-0000000000a1';
  new_guest constant uuid := '00000000-0000-0000-0000-0000000000a2';
  old_real  constant uuid := '00000000-0000-0000-0000-0000000000a3';
  out text := ''; n int;
begin
  insert into auth.users (id, aud, role, is_anonymous, created_at, updated_at, raw_app_meta_data, raw_user_meta_data) values
    (old_guest, 'authenticated', 'authenticated', true,  now() - interval '25 hours', now(), '{}'::jsonb, '{}'::jsonb),
    (new_guest, 'authenticated', 'authenticated', true,  now() - interval '23 hours', now(), '{}'::jsonb, '{}'::jsonb),
    (old_real,  'authenticated', 'authenticated', false, now() - interval '90 hours', now(), '{}'::jsonb, '{}'::jsonb);
  perform set_config('request.jwt.claims', json_build_object('sub', old_guest, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  set local role authenticated;
  perform public.seed_demo(current_date, 'UTC');
  reset role;
  out := out || format('before: blocks=%s tasks=%s diary=%s | ', (select count(*) from public.time_blocks where user_id = old_guest), (select count(*) from public.tasks where user_id = old_guest), (select count(*) from public.diary_entries where user_id = old_guest));
  begin perform private.purge_demo_users(interval '30 minutes'); out := out || 'too young ALLOWED | '; exception when others then out := out || format('30 minutes -> %s | ', sqlerrm); end;
  select private.purge_demo_users(interval '24 hours') into n;
  out := out || format('purge removed=%s | ', n);
  out := out || format('old guest gone=%s, 23h guest kept=%s, old NON-guest kept=%s | ',
    not exists (select 1 from auth.users where id = old_guest), exists (select 1 from auth.users where id = new_guest), exists (select 1 from auth.users where id = old_real));
  out := out || format('old guest rows after: profile=%s categories=%s blocks=%s tasks=%s diary=%s focus=%s | ',
    (select count(*) from public.profiles where id = old_guest), (select count(*) from public.categories where user_id = old_guest), (select count(*) from public.time_blocks where user_id = old_guest),
    (select count(*) from public.tasks where user_id = old_guest), (select count(*) from public.diary_entries where user_id = old_guest), (select count(*) from public.focus_sessions where user_id = old_guest));
  set local role authenticated;
  begin perform private.purge_demo_users(interval '24 hours'); out := out || 'authenticated purge ALLOWED | '; exception when others then out := out || format('authenticated purge -> %s | ', sqlstate); end;
  raise exception 'RESULT: %', out;
end $$;
