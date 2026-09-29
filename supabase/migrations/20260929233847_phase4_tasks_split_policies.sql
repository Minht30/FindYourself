-- Split "for all" into per-command policies so SELECT is governed by exactly
-- one policy (advisor 0006 multiple_permissive_policies).
drop policy "own tasks - modify" on public.tasks;

create policy "own tasks - insert"
  on public.tasks for insert
  with check (
    (select auth.uid()) = user_id
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = category_id and c.user_id = (select auth.uid())
      )
    )
  );

create policy "own tasks - update"
  on public.tasks for update
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
  );

create policy "own tasks - delete"
  on public.tasks for delete
  using ((select auth.uid()) = user_id);
