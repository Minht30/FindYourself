-- Phase 8, Box 4: SQL tests for the daily focus goal on `profiles`. Run in the
-- Supabase SQL editor (or the MCP `execute_sql`). Always ends in an exception
-- carrying the results, so nothing persists. Use a throwaway account.
do $$
declare
  uid constant uuid := '33ccfa36-b0a0-4006-9089-162c0581759d';
  other constant uuid := '06741b5f-1f97-43c0-9de6-ca1acae29a5a';
  out text := ''; n int; v int;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;

  foreach v in array array[15, 30, 120, 715, 720] loop
    update public.profiles set daily_focus_goal_minutes = v where id = uid;
    get diagnostics n = row_count;
    out := out || format('%s ok=%s | ', v, n);
  end loop;

  foreach v in array array[0, 5, 10, 14, 17, 721, 725, -5] loop
    begin
      update public.profiles set daily_focus_goal_minutes = v where id = uid;
      out := out || format('%s ALLOWED (BAD) | ', v);
    exception when others then out := out || format('%s -> %s | ', v, sqlstate); end;
  end loop;

  begin update public.profiles set daily_focus_goal_minutes = null where id = uid; out := out || 'null ALLOWED (BAD) | ';
  exception when others then out := out || format('null -> %s | ', sqlstate); end;

  update public.profiles set daily_focus_goal_minutes = 60 where id = other;
  get diagnostics n = row_count;
  out := out || format('other person rows=%s (want 0) | ', n);

  begin update public.profiles set streak_count = 9, daily_focus_goal_minutes = 60 where id = uid; out := out || 'streak ALLOWED (BAD) | ';
  exception when others then out := out || format('streak -> %s | ', sqlstate); end;

  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin update public.profiles set daily_focus_goal_minutes = 60 where id = uid; out := out || 'anon ran | ';
  exception when others then out := out || format('anon -> %s | ', sqlstate); end;

  raise exception 'RESULT: %', out;
end $$;
-- Expected: 15, 30, 120, 715, 720 ok=1; 0, 5, 10, 14, 17, 721, 725, -5 each 23514;
-- null 23502; other person rows=0; streak 42501; anon 42501.
