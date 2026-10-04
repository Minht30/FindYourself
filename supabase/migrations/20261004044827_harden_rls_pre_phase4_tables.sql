-- Bring the pre-Phase-4 tables up to the policy shape tasks uses:
--   * (select auth.uid()) so the uid is evaluated once per statement (advisor 0003)
--   * per-command policies so SELECT has exactly one policy (advisor 0006)
--   * time_blocks category / linked task must belong to the caller; the FKs
--     alone accept another user's ids
--   * index time_blocks.category_id (advisor 0001)

-- profiles: select + update only (inserts come from the signup trigger).
alter policy "own profile - select" on public.profiles
  using ((select auth.uid()) = id);

alter policy "own profile - update" on public.profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- categories
alter policy "own categories - select" on public.categories
  using ((select auth.uid()) = user_id);

drop policy "own categories - modify" on public.categories;

create policy "own categories - insert"
  on public.categories for insert
  with check ((select auth.uid()) = user_id);

create policy "own categories - update"
  on public.categories for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own categories - delete"
  on public.categories for delete
  using ((select auth.uid()) = user_id);

-- time_blocks
alter policy "own time_blocks - select" on public.time_blocks
  using ((select auth.uid()) = user_id);

drop policy "own time_blocks - modify" on public.time_blocks;

create policy "own time_blocks - insert"
  on public.time_blocks for insert
  with check (
    (select auth.uid()) = user_id
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = category_id and c.user_id = (select auth.uid())
      )
    )
    and (
      linked_task_id is null
      or exists (
        select 1 from public.tasks t
        where t.id = linked_task_id and t.user_id = (select auth.uid())
      )
    )
  );

create policy "own time_blocks - update"
  on public.time_blocks for update
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = category_id and c.user_id = (select auth.uid())
      )
    )
    and (
      linked_task_id is null
      or exists (
        select 1 from public.tasks t
        where t.id = linked_task_id and t.user_id = (select auth.uid())
      )
    )
  );

create policy "own time_blocks - delete"
  on public.time_blocks for delete
  using ((select auth.uid()) = user_id);

create index time_blocks_category_idx on public.time_blocks (category_id);

-- diary_entries
alter policy "own diary_entries - select" on public.diary_entries
  using ((select auth.uid()) = user_id);

drop policy "own diary_entries - modify" on public.diary_entries;

create policy "own diary_entries - insert"
  on public.diary_entries for insert
  with check ((select auth.uid()) = user_id);

create policy "own diary_entries - update"
  on public.diary_entries for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own diary_entries - delete"
  on public.diary_entries for delete
  using ((select auth.uid()) = user_id);
