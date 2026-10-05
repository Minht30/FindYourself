-- Phase 5: focus_sessions log (US-5.3).
--
-- Deviations from docs/ERD.md (see DECISIONS, Session 26):
--   * id has no default: the browser generates it when the phase starts, so a
--     replayed save (offline retry, two tabs) is a no-op, not a duplicate row.
--   * planned_seconds: lets "completed" be checked and the tile show
--     "18 of 25 min" for an abandoned session.
--   * label: a snapshot of the task / block title, so a session keeps its name
--     after the task is deleted (task_id then goes null).
-- Only focus phases are logged, never breaks.

create table public.focus_sessions (
  id uuid primary key,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null,   -- time actually focused, pauses excluded
  planned_seconds integer not null,
  task_id uuid references public.tasks(id) on delete set null,
  time_block_id uuid references public.time_blocks(id) on delete set null,
  label text,
  completed boolean not null,
  created_at timestamptz not null default now(),
  constraint focus_sessions_planned_range check (planned_seconds between 60 and 7200),
  constraint focus_sessions_duration_range check (duration_seconds between 0 and planned_seconds),
  -- ran to zero means the whole planned time was focused
  constraint focus_sessions_completed_full check (not completed or duration_seconds = planned_seconds),
  constraint focus_sessions_time_order check (ended_at >= started_at),
  -- you cannot have focused longer than the wall clock allows (5 s of slack
  -- for rounding); pauses only ever make the wall clock longer.
  constraint focus_sessions_wall_clock check (
    extract(epoch from (ended_at - started_at)) >= duration_seconds - 5
  ),
  constraint focus_sessions_label_length check (label is null or char_length(label) <= 200)
);

-- Week tile + recent list: this user's sessions, newest first.
create index focus_sessions_user_started_idx
  on public.focus_sessions (user_id, started_at desc);

-- Foreign keys: ON DELETE SET NULL scans these when a task / block is deleted.
create index focus_sessions_task_idx
  on public.focus_sessions (task_id) where task_id is not null;
create index focus_sessions_block_idx
  on public.focus_sessions (time_block_id) where time_block_id is not null;

alter table public.focus_sessions enable row level security;

-- (select auth.uid()) is evaluated once per statement, one policy per command.
create policy "own focus_sessions - select"
  on public.focus_sessions for select
  using ((select auth.uid()) = user_id);

-- A session may only point at the caller's own task / block: the FKs alone
-- would accept another user's ids.
create policy "own focus_sessions - insert"
  on public.focus_sessions for insert
  with check (
    (select auth.uid()) = user_id
    and (
      task_id is null
      or exists (
        select 1 from public.tasks t
        where t.id = task_id and t.user_id = (select auth.uid())
      )
    )
    and (
      time_block_id is null
      or exists (
        select 1 from public.time_blocks b
        where b.id = time_block_id and b.user_id = (select auth.uid())
      )
    )
  );

-- No update policy: a logged session is a fact and is never edited.
create policy "own focus_sessions - delete"
  on public.focus_sessions for delete
  using ((select auth.uid()) = user_id);
