-- Phase 9: managing categories (US-8.1) — rename, recolour, reorder, delete with
-- reassign. Until now a category could hold any text for a name or colour, there
-- was no cap, and nothing to keep two of them from sharing a name.
--
-- Rules, enforced here (the app checks first, for a friendly message):
--   name   1-40 characters after trimming; unique per person, ignoring case
--   color  '#RRGGBB'
--   at most 12 categories per person (a locking trigger: `category_limit`)
--   the last remaining category cannot be deleted (`last_category`)
-- A person may update only name, colour and order (column privileges).
--
-- Three small functions, all SECURITY INVOKER so row-level security still
-- applies to every statement in them (they can only ever touch the caller's own
-- rows), and exposed to `authenticated` only:
--   delete_category(id, move_to)   optionally moves the blocks and tasks that
--                                  used it to another of the caller's categories,
--                                  then deletes it, atomically
--   reorder_categories(ids[])      the array must be exactly the caller's
--                                  categories, each once (`bad_order`)
--   category_usage()               how many blocks and tasks use each category

alter table public.categories
  add constraint categories_name_len check (char_length(btrim(name)) between 1 and 40),
  add constraint categories_color_hex check (color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint categories_sort_range check (sort_order between 0 and 1000);

create unique index categories_user_name_unique on public.categories (user_id, lower(btrim(name)));

revoke update on public.categories from anon, authenticated;
grant update (name, color, sort_order) on public.categories to authenticated;

create or replace function private.categories_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('categories:' || new.user_id::text, 0));
  if (select count(*) from public.categories where user_id = new.user_id) >= 12 then
    raise exception 'category_limit' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke execute on function private.categories_limit() from public, anon, authenticated;

create trigger categories_limit
  before insert on public.categories
  for each row execute function private.categories_limit();

create or replace function public.delete_category(p_id uuid, p_to uuid default null)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform 1 from public.categories where id = p_id for update;
  if not found then
    raise exception 'not_found';
  end if;
  if (select count(*) from public.categories) <= 1 then
    raise exception 'last_category';
  end if;
  if p_to is not null then
    if p_to = p_id then
      raise exception 'bad_target';
    end if;
    perform 1 from public.categories where id = p_to;
    if not found then
      raise exception 'bad_target';
    end if;
    update public.time_blocks set category_id = p_to where category_id = p_id;
    update public.tasks set category_id = p_to where category_id = p_id;
  end if;
  delete from public.categories where id = p_id;
end;
$$;

create or replace function public.reorder_categories(p_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform 1 from public.categories for update;
  if p_ids is null
     or cardinality(p_ids) <> (select count(*) from public.categories)
     or (select count(distinct x) from unnest(p_ids) as x) <> cardinality(p_ids)
     or exists (select 1 from unnest(p_ids) as x where not exists (select 1 from public.categories c where c.id = x)) then
    raise exception 'bad_order';
  end if;
  update public.categories c
     set sort_order = o.ord - 1
    from unnest(p_ids) with ordinality as o(id, ord)
   where c.id = o.id;
end;
$$;

create or replace function public.category_usage()
returns table (category_id uuid, blocks bigint, tasks bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.id,
         (select count(*) from public.time_blocks b where b.category_id = c.id),
         (select count(*) from public.tasks t where t.category_id = c.id)
    from public.categories c;
$$;

revoke execute on function public.delete_category(uuid, uuid) from public, anon;
revoke execute on function public.reorder_categories(uuid[]) from public, anon;
revoke execute on function public.category_usage() from public, anon;
grant execute on function public.delete_category(uuid, uuid) to authenticated;
grant execute on function public.reorder_categories(uuid[]) to authenticated;
grant execute on function public.category_usage() to authenticated;
