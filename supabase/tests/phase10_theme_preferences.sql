-- Phase 10: SQL tests for the theme preferences on `profiles` (theme_mode,
-- day_region, night_region). Run in the Supabase SQL editor (or the MCP
-- `execute_sql`). Always ends in an exception carrying the results, so nothing
-- persists. Use a throwaway account.
do $$
declare
  uid constant uuid := '33ccfa36-b0a0-4006-9089-162c0581759d';
  other constant uuid := '06741b5f-1f97-43c0-9de6-ca1acae29a5a';
  out text := ''; n int; v text;
  def record;
begin
  -- The defaults a new profile gets (read as the owner, before switching role).
  select theme_mode, day_region, night_region into def from public.profiles where id = uid;
  out := out || format('now=%s/%s/%s | ', def.theme_mode, def.day_region, def.night_region);

  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- The values the app can draw.
  foreach v in array array['auto', 'day', 'night'] loop
    update public.profiles set theme_mode = v where id = uid;
    get diagnostics n = row_count;
    out := out || format('mode %s ok=%s | ', v, n);
  end loop;
  update public.profiles set day_region = 'monstadt', night_region = 'nodkrai' where id = uid;
  get diagnostics n = row_count;
  out := out || format('regions ok=%s | ', n);

  -- A mode that does not exist, in several shapes.
  foreach v in array array['dusk', 'AUTO', '', ' auto', 'day ', 'both'] loop
    begin
      update public.profiles set theme_mode = v where id = uid;
      out := out || format('mode "%s" ALLOWED (BAD) | ', v);
    exception when others then out := out || format('mode "%s" -> %s | ', v, sqlstate); end;
  end loop;

  -- Regions with no art yet, a region of the other mode, and nonsense: each refused by name.
  foreach v in array array['liyue', 'natlan', 'nodkrai', 'narnia', ''] loop
    begin
      update public.profiles set day_region = v where id = uid;
      out := out || format('day "%s" ALLOWED (BAD) | ', v);
    exception when others then out := out || format('day "%s" -> %s | ', v, sqlstate); end;
  end loop;
  foreach v in array array['natlan', 'liyue', 'monstadt', 'narnia', ''] loop
    begin
      update public.profiles set night_region = v where id = uid;
      out := out || format('night "%s" ALLOWED (BAD) | ', v);
    exception when others then out := out || format('night "%s" -> %s | ', v, sqlstate); end;
  end loop;

  -- None of the three may be null.
  begin update public.profiles set theme_mode = null where id = uid; out := out || 'mode null ALLOWED (BAD) | ';
  exception when others then out := out || format('mode null -> %s | ', sqlstate); end;
  begin update public.profiles set day_region = null where id = uid; out := out || 'day null ALLOWED (BAD) | ';
  exception when others then out := out || format('day null -> %s | ', sqlstate); end;
  begin update public.profiles set night_region = null where id = uid; out := out || 'night null ALLOWED (BAD) | ';
  exception when others then out := out || format('night null -> %s | ', sqlstate); end;

  -- Only your own row.
  update public.profiles set theme_mode = 'night' where id = other;
  get diagnostics n = row_count;
  out := out || format('other person rows=%s (want 0) | ', n);

  -- The streak stays unwritable, even next to a valid theme change.
  begin update public.profiles set streak_count = 9, theme_mode = 'day' where id = uid; out := out || 'streak ALLOWED (BAD) | ';
  exception when others then out := out || format('streak -> %s | ', sqlstate); end;

  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin update public.profiles set theme_mode = 'day' where id = uid; out := out || 'anon ran | ';
  exception when others then out := out || format('anon -> %s | ', sqlstate); end;

  raise exception 'RESULT: %', out;
end $$;
-- Expected: now=auto/monstadt/nodkrai (a profile that has not changed it);
-- mode auto, day, night ok=1; regions ok=1;
-- every bad mode 23514; every bad day region 23514 (liyue, natlan, nodkrai, narnia, "");
-- every bad night region 23514 (natlan, liyue, monstadt, narnia, "");
-- mode null, day null, night null each 23502; other person rows=0; streak 42501; anon 42501.
