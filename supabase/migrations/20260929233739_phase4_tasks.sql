-- Phase 4: tasks with RLS.
--
-- Deviation from docs/ERD.md (see DECISIONS, Session 17): no `bucket` enum.
-- Buckets are derived from a calendar date, so "Tomorrow" becomes "Today" at
-- midnight on its own, and "done" is a state, not a bucket:
--   scheduled_for = today      -> Today
--   scheduled_for = today + 1  -> Tomorrow
--   scheduled_for is null      -> Backlog
--   scheduled_for < today and not completed -> overdue (end-of-day roll)
--   completed_at is not null   -> done; unchecking returns it to its bucket
-- "today" is the user's calendar day, computed by the app (fy-tz cookie).

create type public.task_priority as enum ('low', 'med', 'high');

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  priority public.task_priority not null default 'med',
  category_id uuid references public.categories(id) on delete set null,
  scheduled_for date,                 -- null = Backlog
  deadline timestamptz,               -- optional hard time ("today at 18:00")
  is_restriction boolean not null default false,
  completed_at timestamptz,
  -- Fractional ordering within a bucket: a drop between a and b writes
  -- (a + b) / 2, so reordering touches one row.
  sort_order double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_title_length check (char_length(btrim(title)) between 1 and 200),
  constraint tasks_description_length check (char_length(description) <= 5000)
);

-- Board load: open tasks by bucket, in order.
create index tasks_user_open_idx
  on public.tasks (user_id, scheduled_for, sort_order)
  where completed_at is null;

-- "Done today" + streak/wins queries.
create index tasks_user_completed_idx
  on public.tasks (user_id, completed_at desc)
  where completed_at is not null;

-- Header chip: any open restricted task.
create index tasks_user_open_restriction_idx
  on public.tasks (user_id)
  where is_restriction and completed_at is null;

create index tasks_category_idx on public.tasks (category_id);

alter table public.tasks enable row level security;

-- (select auth.uid()) is evaluated once per statement instead of per row.
create policy "own tasks - select"
  on public.tasks for select
  using ((select auth.uid()) = user_id);

-- A task may only point at the caller's own category: the FK alone would
-- accept another user's category id.
create policy "own tasks - modify"
  on public.tasks for all
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

create or replace function public.touch_tasks_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_touch_updated_at
  before update on public.tasks
  for each row execute function public.touch_tasks_updated_at();

-- ============================================================
-- time_blocks.linked_task_id (promised in the Phase 2 migration)
-- ============================================================
alter table public.time_blocks
  add column linked_task_id uuid references public.tasks(id) on delete set null;

create index time_blocks_linked_task_idx
  on public.time_blocks (linked_task_id)
  where linked_task_id is not null;
