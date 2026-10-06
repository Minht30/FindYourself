-- Phase 9: the guest demo ("Try the demo"), a per-visitor sandbox.
--
-- A visitor signs in anonymously (a real, temporary account with no email),
-- gets sample data, and can use the whole app. Nothing is shared between
-- visitors. A banner offers to turn the sandbox into a real account (the data
-- comes along); otherwise it is deleted after 24 hours.
--
-- What keeps that safe, all in the database:
--   * guests cannot upload music or send track suggestions (storage and the
--     suggestion queue are the two places a throwaway account could leave
--     something behind or spam the admin);
--   * at most 300 guest accounts exist at once (`demo_full`);
--   * the seed runs AS the visitor (SECURITY INVOKER), so row-level security
--     applies to every row it writes and no service-role key is involved;
--   * a purge deletes guest accounts older than 24 hours (never anyone else:
--     only rows flagged is_anonymous, and never younger than an hour);
--     pg_cron runs it every hour.

-- Is the caller a guest? (The sign-in token carries `is_anonymous`.)
create or replace function private.is_anonymous()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false);
$$;
revoke execute on function private.is_anonymous() from public, anon;
grant execute on function private.is_anonymous() to authenticated;

-- 1. Guests cannot upload music or suggest tracks.
alter policy "music - upload to own folder" on storage.objects
  with check (
    (bucket_id = 'music')
    and ((storage.foldername(name))[1] = ((select auth.uid()))::text)
    and (name ~ ('^' || ((select auth.uid()))::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.mp3$'))
    and (select private.music_room_left())
    and not (select private.is_anonymous())
  );

alter policy "own music_tracks - insert" on public.music_tracks
  with check (((select auth.uid()) = user_id) and not (select private.is_anonymous()));

alter policy "track_suggestions - insert own" on public.track_suggestions
  with check (
    ((select auth.uid()) = suggested_by)
    and (status = 'pending')
    and (reviewed_by is null)
    and not (select private.is_anonymous())
  );

-- 2. A cap on live guest accounts.
create or replace function private.limit_guest_accounts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_anonymous and (select count(*) from auth.users where is_anonymous) >= 300 then
    raise exception 'demo_full';
  end if;
  return new;
end;
$$;
revoke execute on function private.limit_guest_accounts() from public, anon, authenticated;

create trigger limit_guest_accounts
  before insert on auth.users
  for each row execute function private.limit_guest_accounts();

-- 3. The sample data. Runs as the visitor; refuses anyone who is not a guest or
-- who already has data. `p_today` is the visitor's own calendar day (the app
-- reads it from their time-zone cookie) and must be within two days of the
-- server's date; `p_tz` must be a real zone. Everything is placed relative to
-- that day, so the demo always looks current: this week's blocks, a task list
-- for today / tomorrow / someday, three diary days (a streak) and a few focus
-- sessions.
create or replace function public.seed_demo(p_today date, p_tz text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_mon date;
begin
  if v_user is null then
    raise exception 'unauthenticated';
  end if;
  if not private.is_anonymous() then
    raise exception 'not_demo';
  end if;
  if p_today is null or p_today < current_date - 2 or p_today > current_date + 2 then
    raise exception 'bad_date';
  end if;
  if p_tz is null or not exists (select 1 from pg_catalog.pg_timezone_names where name = p_tz) then
    raise exception 'bad_timezone';
  end if;
  if exists (select 1 from public.time_blocks where user_id = v_user)
     or exists (select 1 from public.tasks where user_id = v_user)
     or exists (select 1 from public.diary_entries where user_id = v_user) then
    raise exception 'already_seeded';
  end if;

  v_mon := p_today - (extract(isodow from p_today)::int - 1);

  -- This week's timetable.
  insert into public.time_blocks (user_id, title, notes, starts_at, ends_at, category_id)
  select v_user, b.title, b.notes,
         ((v_mon + b.day) + b.s) at time zone p_tz,
         ((v_mon + b.day) + b.e) at time zone p_tz,
         (select c.id from public.categories c where c.user_id = v_user and c.name = b.cat)
    from (values
      (0, time '09:00', time '11:00', 'Outline the project',   'Deep Work', 'Phone away, door closed.'),
      (0, time '14:00', time '14:45', 'Team sync',             'Meetings',  ''),
      (1, time '10:00', time '11:30', 'Read: design patterns', 'Learning',  'Chapter 4, take notes.'),
      (2, time '18:00', time '19:00', 'Gym',                   'Personal',  ''),
      (3, time '09:30', time '12:00', 'Build the prototype',   'Deep Work', ''),
      (4, time '15:00', time '16:00', 'Plan next week',        'Meetings',  ''),
      (5, time '10:00', time '11:30', 'Long walk',             'Rest',      'No phone.'),
      (6, time '17:00', time '18:00', 'Cook something new',    'Personal',  '')
    ) as b(day, s, e, title, cat, notes);

  -- Tasks: today (one done already, one "Focus first"), tomorrow, someday.
  insert into public.tasks (user_id, title, description, priority, category_id, scheduled_for, deadline, is_restriction, completed_at, sort_order)
  select v_user, t.title, t.descr, t.prio::public.task_priority,
         (select c.id from public.categories c where c.user_id = v_user and c.name = t.cat),
         t.sched, t.dl, t.restr, t.done, t.ord
    from (values
      ('Outline the demo talk',          'Three slides, no more.',         'high', 'Deep Work', p_today,     ((p_today + time '17:00') at time zone p_tz), true,  null::timestamptz, 1),
      ('Reply to Sam about the schedule', '',                              'med',  'Meetings',  p_today,     null::timestamptz,                            false, null::timestamptz, 2),
      ('Water the plants',               '',                               'low',  'Personal',  p_today,     null::timestamptz,                            false, ((p_today + time '08:30') at time zone p_tz), 3),
      ('Book the dentist',               '',                               'med',  'Personal',  p_today + 1, null::timestamptz,                            false, null::timestamptz, 4),
      ('Finish the reading list',        'Two articles left.',             'med',  'Learning',  p_today + 1, null::timestamptz,                            false, null::timestamptz, 5),
      ('Learn a new recipe',             '',                               'low',  'Rest',      null::date,  null::timestamptz,                            false, null::timestamptz, 6),
      ('Sort the photo folder',          '',                               'low',  'Personal',  null::date,  null::timestamptz,                            false, null::timestamptz, 7)
    ) as t(title, descr, prio, cat, sched, dl, restr, done, ord);

  -- Three days in the diary, so the streak and the heatmap have something to show.
  insert into public.diary_entries (user_id, entry_date, mood, content_json, content_text)
  select v_user, p_today - d.back, d.mood::public.diary_mood,
         jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
           jsonb_build_object('type', 'heading', 'attrs', jsonb_build_object('level', 2),
             'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', d.prompt))),
           jsonb_build_object('type', 'paragraph',
             'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', d.body))))),
         d.prompt || E'\n\n' || d.body
    from (values
      (3, 'focused', 'What am I trying to do?',      'Finish the outline before lunch, then answer the three emails I have been avoiding. Small steps, in order.'),
      (2, 'calm',    'What am I thinking today?',    'A slow morning. Rain on the window, tea, and no rush. I read a few pages and sketched the shape of the week.'),
      (1, 'radiant', 'What am I thinking today?',    'Shipped the first version of the prototype and went for a long walk afterwards. It felt good to see it all working.')
    ) as d(back, mood, prompt, body);

  -- A few finished focus sessions.
  insert into public.focus_sessions (id, user_id, started_at, ended_at, duration_seconds, planned_seconds, completed, label)
  select gen_random_uuid(), v_user,
         ((p_today - f.back) + f.s) at time zone p_tz,
         ((p_today - f.back) + f.s + interval '25 minutes') at time zone p_tz,
         1500, 1500, true, f.label
    from (values
      (1, time '10:00', 'Prototype'),
      (1, time '10:35', 'Prototype'),
      (2, time '14:00', 'Reading'),
      (3, time '09:15', 'Outline')
    ) as f(back, s, label);
end;
$$;
revoke execute on function public.seed_demo(date, text) from public, anon;
grant execute on function public.seed_demo(date, text) to authenticated;

-- 4. Cleanup: delete guest accounts (and, by cascade, everything they made)
-- older than the given age. Only accounts flagged is_anonymous; never younger
-- than an hour whatever is asked. Returns how many were removed.
create or replace function private.purge_demo_users(p_older_than interval default interval '24 hours')
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  if p_older_than < interval '1 hour' then
    raise exception 'too_young';
  end if;
  delete from auth.users where is_anonymous and created_at < now() - p_older_than;
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke execute on function private.purge_demo_users(interval) from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('purge-demo-users', '17 * * * *', $cron$select private.purge_demo_users(interval '24 hours')$cron$);
