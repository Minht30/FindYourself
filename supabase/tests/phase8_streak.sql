-- Phase 8, Box 1: SQL tests for the streak. Run each block in the Supabase SQL
-- editor (or through the MCP `execute_sql`). Nothing persists: block 2 always
-- ends in an exception whose message carries the results, and the transaction
-- is rolled back.
--
-- Before block 2, replace the uuid with a THROWAWAY account that has no diary
-- entries or tasks (the block asserts that), never a real person's account.

-- ── 1. The pure function: every row's `ok` must be true ─────────────────────
with cases(name, days, want_run, want_last) as (values
  ('empty', array[]::date[], 0, null::date),
  ('null only', array[null]::date[], 0, null),
  ('one day', array['2026-10-05']::date[], 1, '2026-10-05'::date),
  ('three consecutive', array['2026-10-03','2026-10-04','2026-10-05']::date[], 3, '2026-10-05'),
  ('unsorted', array['2026-10-05','2026-10-03','2026-10-04']::date[], 3, '2026-10-05'),
  ('duplicates', array['2026-10-05','2026-10-05','2026-10-04','2026-10-04']::date[], 2, '2026-10-05'),
  ('gap resets to latest run', array['2026-10-01','2026-10-02','2026-10-03','2026-10-05']::date[], 1, '2026-10-05'),
  ('gap, older run longer', array['2026-09-01','2026-09-02','2026-09-03','2026-09-04','2026-10-04','2026-10-05']::date[], 2, '2026-10-05'),
  ('two-day gap', array['2026-10-01','2026-10-04']::date[], 1, '2026-10-04'),
  ('month boundary', array['2026-09-29','2026-09-30','2026-10-01']::date[], 3, '2026-10-01'),
  ('year boundary', array['2025-12-31','2026-01-01']::date[], 2, '2026-01-01'),
  ('leap day', array['2028-02-28','2028-02-29','2028-03-01']::date[], 3, '2028-03-01'),
  ('non-leap feb', array['2026-02-27','2026-02-28','2026-03-01']::date[], 3, '2026-03-01'),
  ('nulls mixed in', array['2026-10-04',null,'2026-10-05']::date[], 2, '2026-10-05'),
  ('365 days', (select array_agg(d::date) from generate_series('2025-10-06'::date,'2026-10-05'::date,'1 day') d), 365, '2026-10-05')
)
select c.name, r.run_length, r.last_day, c.want_run, c.want_last,
       (r.run_length = c.want_run and r.last_day is not distinct from c.want_last) as ok
from cases c cross join lateral private.streak_run(c.days) r
order by ok, name;

-- ── 2. Triggers, permissions and zones, as `authenticated` ──────────────────
do $$
declare
  uid constant uuid := '33ccfa36-b0a0-4006-9089-162c0581759d'; -- THROWAWAY test account
  other constant uuid := '06741b5f-1f97-43c0-9de6-ca1acae29a5a'; -- someone else (only read / refused)
  out text := '';
  r record;
  n int;
  d0 date := (now() at time zone 'UTC')::date;
  tid uuid;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into n from public.diary_entries where user_id = uid;
  if n <> 0 then raise exception 'test account has diary rows; use a clean one'; end if;
  select count(*) into n from public.tasks where user_id = uid;
  if n <> 0 then raise exception 'test account has tasks; use a clean one'; end if;

  -- (zone is assumed UTC here: set it first if the account has another)
  update public.profiles set timezone = 'UTC' where id = uid;

  insert into public.tasks(user_id, title, completed_at) values (uid, 'FYTEST today', now()) returning id into tid;
  select streak_count c, streak_last_date l, streak_best b into r from public.profiles where id = uid;
  out := out || format('1 done today -> %s/%s/%s (want 1/%s/1) | ', r.c, r.l, r.b, d0);

  insert into public.tasks(user_id, title, completed_at) values (uid, 'FYTEST yday', now() - interval '1 day');
  select streak_count c into r from public.profiles where id = uid;
  out := out || format('2 +yesterday -> %s (want 2) | ', r.c);

  insert into public.diary_entries(user_id, entry_date, mood) values (uid, d0 - 2, 'calm');
  select streak_count c into r from public.profiles where id = uid;
  out := out || format('3 +diary d-2 -> %s (want 3) | ', r.c);

  insert into public.diary_entries(user_id, entry_date) values (uid, d0 - 3);
  select streak_count c into r from public.profiles where id = uid;
  out := out || format('4 empty diary d-3 does not count -> %s (want 3) | ', r.c);

  update public.diary_entries set content_text = 'hello', content_json = '{"a":1}' where user_id = uid and entry_date = d0 - 3;
  select streak_count c, streak_best b into r from public.profiles where id = uid;
  out := out || format('5 text on d-3 -> %s/%s (want 4/4) | ', r.c, r.b);

  update public.tasks set completed_at = null where id = tid;
  select streak_count c, streak_last_date l, streak_best b into r from public.profiles where id = uid;
  out := out || format('6 uncomplete today -> %s/%s/%s (want 3/%s/4) | ', r.c, r.l, r.b, d0 - 1);

  delete from public.diary_entries where user_id = uid and entry_date = d0 - 2;
  select streak_count c, streak_best b into r from public.profiles where id = uid;
  out := out || format('7 delete d-2 -> %s/%s (want 1/4) | ', r.c, r.b);

  insert into public.diary_entries(user_id, entry_date, mood) values (uid, d0 - 2, 'low');
  select streak_count c into r from public.profiles where id = uid;
  out := out || format('8 back-fill d-2 -> %s (want 3) | ', r.c);

  insert into public.diary_entries(user_id, entry_date, mood) values (uid, d0 + 1, 'calm');
  insert into public.tasks(user_id, title, completed_at) values (uid, 'FYTEST future', now() + interval '30 hours');
  select streak_count c, streak_last_date l into r from public.profiles where id = uid;
  out := out || format('9 future days ignored -> %s/%s (want 3/%s) | ', r.c, r.l, d0 - 1);

  -- a completion a few seconds AHEAD of the database clock still counts as today
  -- (the app server's clock can run ahead of the database's)
  delete from public.tasks where user_id = uid;
  insert into public.tasks(user_id, title, completed_at) values (uid, 'FYTEST skew', now() + interval '5 seconds');
  select streak_count c, streak_last_date l into r from public.profiles where id = uid;
  out := out || format('9b clock skew +5s -> %s/%s (want 1/%s: d-1 is missing) | ', r.c, r.l, d0);
  delete from public.tasks where user_id = uid;

  update public.diary_entries set content_text = 'hello again', content_json = '{"a":2}' where user_id = uid and entry_date = d0 - 3;
  select streak_count c into r from public.profiles where id = uid;
  out := out || format('10 autosave-style update -> %s (want 2: only d-2 and d-3 remain, unchanged by the edit) | ', r.c);

  begin update public.profiles set streak_count = 99 where id = uid; out := out || '11a ALLOWED (BAD) | ';
  exception when others then out := out || format('11a streak_count -> %s | ', sqlstate); end;
  begin update public.profiles set streak_last_date = d0, streak_best = 99 where id = uid; out := out || '11b ALLOWED (BAD) | ';
  exception when others then out := out || format('11b last_date/best -> %s | ', sqlstate); end;
  begin insert into public.profiles(id) values (gen_random_uuid()); out := out || '11c ALLOWED (BAD) | ';
  exception when others then out := out || format('11c profile insert -> %s | ', sqlstate); end;

  update public.profiles set display_name = 'FYTEST' where id = uid;
  get diagnostics n = row_count;
  out := out || format('12a display_name rows=%s (want 1) | ', n);
  begin update public.profiles set timezone = 'Mars/Phobos' where id = uid; out := out || '12b ALLOWED (BAD) | ';
  exception when others then out := out || format('12b bad zone -> %s %s | ', sqlstate, sqlerrm); end;
  begin update public.profiles set timezone = '' where id = uid; out := out || '12c ALLOWED (BAD) | ';
  exception when others then out := out || format('12c empty zone -> %s %s | ', sqlstate, sqlerrm); end;

  update public.profiles set display_name = 'hacked' where id = other;
  get diagnostics n = row_count;
  out := out || format('13 other profile rows=%s (want 0) | ', n);

  delete from public.diary_entries where user_id = uid;
  delete from public.tasks where user_id = uid;
  insert into public.tasks(user_id, title, completed_at)
    values (uid, 'FYTEST late', (d0::timestamp - interval '30 minutes') at time zone 'UTC'); -- yesterday 23:30 UTC
  select streak_count c, streak_last_date l into r from public.profiles where id = uid;
  out := out || format('14a UTC -> %s/%s (want 1/%s) | ', r.c, r.l, d0 - 1);
  update public.profiles set timezone = 'Asia/Ho_Chi_Minh' where id = uid;
  select streak_last_date l into r from public.profiles where id = uid;
  out := out || format('14b Ho_Chi_Minh -> %s (want %s) | ', r.l, d0);
  update public.profiles set timezone = 'America/Los_Angeles' where id = uid;
  select streak_last_date l into r from public.profiles where id = uid;
  out := out || format('14c Los_Angeles -> %s (want %s) | ', r.l, d0 - 1);

  delete from public.tasks where user_id = uid;
  select streak_count c, streak_last_date l, streak_best b into r from public.profiles where id = uid;
  out := out || format('15 emptied -> %s/%s/best %s (want 0/null/best 4) | ', r.c, r.l, r.b);

  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin update public.profiles set streak_count = 50 where id = uid; out := out || '16 anon ran | ';
  exception when others then out := out || format('16 anon -> %s | ', sqlstate); end;

  raise exception 'RESULT: %', out;
end $$;
