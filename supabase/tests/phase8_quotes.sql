-- Phase 8, Box 2: SQL tests for `quotes`. Run in the Supabase SQL editor (or the
-- MCP `execute_sql`). Block 2 always ends in an exception that carries the
-- results, so nothing persists. Replace the uuid with any signed-up user.

-- ── 1. The data: 120 rows, unique, short, no author, nothing padded ─────────
select count(*) n,                         -- 120
       count(distinct text) uniq,          -- 120
       min(id) lo, max(id) hi,             -- 1 .. 120
       max(char_length(text)) maxlen,      -- <= 200
       count(*) filter (where author is not null) with_author,  -- 0
       bool_or(text ~ '^\s|\s$') padded    -- false
from public.quotes;

-- ── 2. Permissions ──────────────────────────────────────────────────────────
do $$
declare out text := ''; n int;
begin
  perform set_config('request.jwt.claims', json_build_object('sub','33ccfa36-b0a0-4006-9089-162c0581759d','role','authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.quotes;
  out := out || format('read as authenticated -> %s rows (want 120) | ', n);
  begin insert into public.quotes(id, text) values (999, 'FYTEST x'); out := out || 'insert ALLOWED (BAD) | ';
  exception when others then out := out || format('insert -> %s | ', sqlstate); end;
  begin update public.quotes set text = 'hacked' where id = 1; get diagnostics n = row_count; out := out || format('update ran rows=%s (BAD) | ', n);
  exception when others then out := out || format('update -> %s | ', sqlstate); end;
  begin delete from public.quotes where id = 1; get diagnostics n = row_count; out := out || format('delete ran rows=%s (BAD) | ', n);
  exception when others then out := out || format('delete -> %s | ', sqlstate); end;
  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin select count(*) into n from public.quotes; out := out || format('anon read rows=%s (BAD) | ', n);
  exception when others then out := out || format('anon read -> %s | ', sqlstate); end;
  raise exception 'RESULT: %', out;
end $$;
-- Expected: read 120; insert / update / delete / anon read each 42501.
