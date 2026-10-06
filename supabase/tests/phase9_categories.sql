-- Phase 9: SQL tests for category management. Run in the Supabase SQL editor (or
-- the MCP `execute_sql`). Always ends in an exception that carries the results,
-- so nothing persists. Use a THROWAWAY account (uid) that has its 5 seeded
-- categories and nothing else; `other` is any second account (only read, refused).
--
-- Expected: start=5; empty name / 41 chars / bad colour / sort 5000 -> 23514;
-- dup name (case and spaces ignored) -> 23505; insert as other / update user_id
-- -> 42501; at cap=12; 13th -> 23514 category_limit; rename rows=1; other rename
-- rows=0; reorder ok; short / dup / foreign-id / null list -> bad_order; usage
-- blocks=1 tasks=1; move to self / foreign / unknown -> bad_target; unknown /
-- foreign delete -> not_found; refusals leave the category; delete+move moves
-- the block and the task; delete with no target leaves them uncategorised;
-- the last category -> last_category; anon -> 42501.
--
-- NB: a NULL move target means "do not move anything", so a foreign category id
-- must be read BEFORE switching role (row-level security hides it afterwards).
do $$
declare
  uid constant uuid := '33ccfa36-b0a0-4006-9089-162c0581759d';
  other constant uuid := '06741b5f-1f97-43c0-9de6-ca1acae29a5a';
  fid uuid := (select id from public.categories where user_id = other limit 1);
  out text := ''; n int; a uuid; b uuid; ids uuid[]; r record; blk uuid; tsk uuid;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role','authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.categories; out := out || format('start=%s | ', n);
  begin insert into public.categories(user_id,name,color,sort_order) values (uid,'','#112233',5); out := out || 'empty name ALLOWED | '; exception when others then out := out || format('empty name -> %s | ', sqlstate); end;
  begin insert into public.categories(user_id,name,color,sort_order) values (uid,repeat('x',41),'#112233',5); out := out || '41 chars ALLOWED | '; exception when others then out := out || format('41 chars -> %s | ', sqlstate); end;
  begin insert into public.categories(user_id,name,color,sort_order) values (uid,'FYTEST bad','red',5); out := out || 'bad colour ALLOWED | '; exception when others then out := out || format('bad colour -> %s | ', sqlstate); end;
  begin insert into public.categories(user_id,name,color,sort_order) values (uid,'  deep WORK ','#112233',5); out := out || 'dup name ALLOWED | '; exception when others then out := out || format('dup name (case/space) -> %s | ', sqlstate); end;
  begin insert into public.categories(user_id,name,color,sort_order) values (uid,'FYTEST x','#112233',5000); out := out || 'sort 5000 ALLOWED | '; exception when others then out := out || format('sort 5000 -> %s | ', sqlstate); end;
  begin insert into public.categories(user_id,name,color,sort_order) values (other,'FYTEST theirs','#112233',5); out := out || 'insert as other ALLOWED | '; exception when others then out := out || format('insert as other -> %s | ', sqlstate); end;
  for n in 1..7 loop insert into public.categories(user_id,name,color,sort_order) values (uid,'FYTEST c'||n,'#AABBCC',4+n); end loop;
  select count(*) into n from public.categories; out := out || format('at cap=%s | ', n);
  begin insert into public.categories(user_id,name,color,sort_order) values (uid,'FYTEST 13th','#AABBCC',20); out := out || '13th ALLOWED | '; exception when others then out := out || format('13th -> %s %s | ', sqlstate, sqlerrm); end;
  begin update public.categories set user_id = other where user_id = uid and name = 'FYTEST c1'; out := out || 'update user_id ALLOWED | '; exception when others then out := out || format('update user_id -> %s | ', sqlstate); end;
  update public.categories set name = 'FYTEST renamed', color = '#010203' where name = 'FYTEST c1'; get diagnostics n = row_count; out := out || format('rename/recolour rows=%s | ', n);
  update public.categories set name = 'hacked' where user_id = other; get diagnostics n = row_count; out := out || format('other rename rows=%s | ', n);
  select array_agg(id order by sort_order) into ids from public.categories;
  perform public.reorder_categories(array(select x from unnest(ids) x order by random()));
  out := out || 'reorder random ok | ';
  begin perform public.reorder_categories(ids[1:cardinality(ids)-1]); out := out || 'short ALLOWED | '; exception when others then out := out || format('short list -> %s | ', sqlerrm); end;
  begin perform public.reorder_categories(ids || ids[1]); out := out || 'dup ALLOWED | '; exception when others then out := out || format('dup list -> %s | ', sqlerrm); end;
  begin perform public.reorder_categories(array(select x from unnest(ids[1:11]) x) || fid); out := out || 'foreign ALLOWED | '; exception when others then out := out || format('foreign id in list -> %s | ', sqlerrm); end;
  begin perform public.reorder_categories(null); out := out || 'null ALLOWED | '; exception when others then out := out || format('null -> %s | ', sqlerrm); end;
  select id into a from public.categories where name = 'FYTEST renamed';
  select id into b from public.categories where name = 'FYTEST c2';
  insert into public.time_blocks(user_id,title,starts_at,ends_at,category_id) values (uid,'FYTEST blk','2026-10-07T14:00:00Z','2026-10-07T15:00:00Z',a) returning id into blk;
  insert into public.tasks(user_id,title,category_id) values (uid,'FYTEST tsk',a) returning id into tsk;
  select blocks, tasks into r from public.category_usage() where category_id = a; out := out || format('usage blocks=%s tasks=%s | ', r.blocks, r.tasks);
  begin perform public.delete_category(a, a); out := out || 'move to self ALLOWED | '; exception when others then out := out || format('move to self -> %s | ', sqlerrm); end;
  begin perform public.delete_category(a, fid); out := out || 'move to foreign ALLOWED | '; exception when others then out := out || format('move to foreign -> %s | ', sqlerrm); end;
  begin perform public.delete_category(a, gen_random_uuid()); out := out || 'move to unknown ALLOWED | '; exception when others then out := out || format('move to unknown -> %s | ', sqlerrm); end;
  begin perform public.delete_category(gen_random_uuid()); out := out || 'unknown ALLOWED | '; exception when others then out := out || format('unknown -> %s | ', sqlerrm); end;
  begin perform public.delete_category(fid); out := out || 'delete foreign ALLOWED | '; exception when others then out := out || format('delete foreign -> %s | ', sqlerrm); end;
  select count(*) into n from public.categories where id = a; out := out || format('still there after refusals=%s | ', n);
  perform public.delete_category(a, b);
  select (select category_id from public.time_blocks where id = blk) = b as blk_moved, (select category_id from public.tasks where id = tsk) = b as tsk_moved into r;
  out := out || format('after delete+move: block moved=%s task moved=%s gone=%s | ', r.blk_moved, r.tsk_moved, not exists (select 1 from public.categories where id = a));
  perform public.delete_category(b);
  select (select category_id from public.time_blocks where id = blk) is null as blk_null, (select category_id from public.tasks where id = tsk) is null as tsk_null into r;
  out := out || format('delete no target: block null=%s task null=%s | ', r.blk_null, r.tsk_null);
  delete from public.categories where name like 'FYTEST%';
  for r in select id from public.categories order by sort_order offset 1 loop perform public.delete_category(r.id); end loop;
  begin perform public.delete_category((select id from public.categories limit 1)); out := out || 'last ALLOWED | '; exception when others then out := out || format('last -> %s | ', sqlerrm); end;
  select count(*) into n from public.categories; out := out || format('left=%s | ', n);
  reset role; perform set_config('request.jwt.claims','{"role":"anon"}',true); set local role anon;
  begin perform public.category_usage(); out := out || 'anon usage ALLOWED | '; exception when others then out := out || format('anon usage -> %s | ', sqlstate); end;
  begin perform public.delete_category(gen_random_uuid()); out := out || 'anon delete ALLOWED | '; exception when others then out := out || format('anon delete -> %s | ', sqlstate); end;
  raise exception 'RESULT: %', out;
end $$;
