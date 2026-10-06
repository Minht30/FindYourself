# Database Schema (ERD) — FindYourself

Postgres via Supabase. All tables have Row Level Security enabled; policy shape `auth.uid() = user_id` unless noted.

## Diagram (textual)

```
auth.users (Supabase-managed)
    │
    │ 1..N
    ▼
profiles ───────────────────────────────────────────────┐
    │                                                    │
    │ 1..N                                                │
    ├── categories                                        │
    ├── time_blocks   ──── (opt) linked_task_id ─┐        │
    ├── diary_entries                            │        │
    ├── tasks ◄──────────────────────────────────┘        │
    │      │                                              │
    │      └─ has restriction flag                        │
    ├── focus_sessions ─── (opt) task_id, time_block_id ──┘
    ├── mixer_state (1..1)
    ├── music_tracks    (rows point to Storage objects)
    └── playlists → playlist_tracks (M..N)

track_suggestions (public-write, admin-read)
quotes            (global, read-only)
ambient_layers    (global, read-only — rain, fire, etc.)
```

## Table definitions

### `profiles`
| column | type | notes |
|---|---|---|
| id | uuid PK | = auth.users.id |
| username | text unique |  |
| display_name | text |  |
| timezone | text | IANA, e.g. `Asia/Ho_Chi_Minh` |
| theme | text | default `'night_cafe'` |
| streak_count | int | default 0; the run of consecutive active days ending at `streak_last_date`. **Written only by the database** (Phase 8): no client privilege |
| streak_last_date | date | the most recent active day (never in the future); null = never |
| streak_best | int | longest run so far, never decreases (added in Phase 8) |
| daily_focus_goal_minutes | int | the goal behind the focus ring on /today; default 120; CHECK 15..720 in steps of 5 (`profiles_focus_goal_range`); the one Phase 8 column the client may write |
| created_at | timestamptz | default now() |

A **streak day** is a calendar day, in `timezone`, with a diary entry (text or a mood) or a completed task. A missed day resets the run (no grace days). The database recomputes `streak_count` / `streak_last_date` / `streak_best` from the source rows after every change that can matter (triggers on `diary_entries` and `tasks`, plus a zone change on `profiles`), through `private.refresh_streak` and the pure `private.streak_run(date[])`; whether the run is still alive *today* is answered at read time by `lib/streak.ts`. `UPDATE` privilege is granted only on `username, display_name, timezone, theme, daily_focus_goal_minutes`; a trigger refuses a `timezone` that is not in `pg_timezone_names` (`bad_timezone`). The browser keeps `timezone` equal to its own (`TimeZoneSync`).

### `categories`
| column | type | notes |
|---|---|---|
| id | uuid PK |  |
| user_id | uuid FK profiles(id) on delete cascade |  |
| name | text |  |
| color | text | hex, e.g. `#C69B7B` |
| sort_order | int |  |

Seeded per user on signup: Deep Work, Meetings, Learning, Rest, Personal.

*(Phase 9, Session 56.)* Rules in the database: `name` 1-40 characters after trimming and **unique per person ignoring case** (index on `user_id, lower(btrim(name))`); `color` `#RRGGBB`; `sort_order` 0..1000; **at most 12 per person** (a locking trigger, `category_limit`); a person may update only `name`, `color` and `sort_order` (column privileges). Three SECURITY INVOKER functions, so RLS still applies and they only ever touch the caller's own rows: `delete_category(id, move_to)` (optionally moves the blocks and tasks that used it, then deletes, atomically; `not_found`, `bad_target`, `last_category`), `reorder_categories(ids[])` (must be exactly the caller's categories, each once: `bad_order`) and `category_usage()` (blocks and tasks per category). The theme-following colour of the five defaults (`lib/categories.ts`) applies only while a default keeps its default name **and** colour.

### `time_blocks`
| column | type | notes |
|---|---|---|
| id | uuid PK |  |
| user_id | uuid FK |  |
| starts_at | timestamptz |  |
| ends_at | timestamptz |  |
| title | text |  |
| notes | text |  |
| category_id | uuid FK categories(id) |  |
| linked_task_id | uuid FK tasks(id) nullable |  |
| created_at | timestamptz |  |

Index: `(user_id, starts_at)`

### `diary_entries`
| column | type | notes |
|---|---|---|
| id | uuid PK |  |
| user_id | uuid FK |  |
| entry_date | date | unique with user_id |
| mood | text | enum: radiant, calm, focused, tired, low, stormy |
| content_json | jsonb | Tiptap doc |
| content_text | text | plaintext for search |
| updated_at | timestamptz |  |

Unique: `(user_id, entry_date)`

### `tasks`
*(Revised in Phase 4, Session 17: buckets are derived from a date instead of a `bucket` enum. See DECISIONS.)*

| column | type | notes |
|---|---|---|
| id | uuid PK |  |
| user_id | uuid FK profiles | on delete cascade |
| title | text | 1–200 chars after trim (check) |
| description | text | default `''`, ≤ 5000 chars |
| priority | enum `task_priority` | low, med, high; default med |
| category_id | uuid FK categories nullable | on delete set null; must be the caller's own category (RLS) |
| scheduled_for | date nullable | **null = Backlog**; today = Today; today+1 = Tomorrow; past + open = overdue (end-of-day roll) |
| deadline | timestamptz nullable | optional hard time, e.g. "today at 18:00" |
| is_restriction | bool | default false |
| completed_at | timestamptz nullable | set = done; clearing it returns the task to its bucket |
| sort_order | float8 | fractional ordering within a bucket |
| created_at | timestamptz |  |
| updated_at | timestamptz | touch trigger |

Indexes: `(user_id, scheduled_for, sort_order) where completed_at is null`, `(user_id, completed_at desc) where completed_at is not null`, `(user_id) where is_restriction and completed_at is null`, `(category_id)`.

`time_blocks.linked_task_id` → `tasks(id)` on delete set null (added in the same migration).

### `focus_sessions`
| column | type | notes |
|---|---|---|
| id | uuid PK | **no default**: generated by the browser when the phase starts, so replays are idempotent |
| user_id | uuid FK | default `auth.uid()`, cascade |
| started_at | timestamptz |  |
| ended_at | timestamptz | `>= started_at` |
| duration_seconds | int | time actually focused, pauses excluded; `0..planned`; wall clock must allow it (5 s slack) |
| planned_seconds | int | 60..7200 (added in Phase 5) |
| task_id | uuid nullable | `on delete set null` |
| time_block_id | uuid nullable | `on delete set null` |
| label | text nullable | title snapshot (≤ 200), survives deleting the task / block (added in Phase 5) |
| completed | bool | true ⇒ `duration_seconds = planned_seconds` |
| created_at | timestamptz |  |

Indexes: `(user_id, started_at desc)`, partial on `task_id` and `time_block_id` (FK scans). RLS: select / insert / delete own; insert also requires the task / block to be the caller's own; **no update policy** (a logged session is a fact). Only focus phases are logged, never breaks.

### `mixer_state`
*(Revised in Phase 6, Session 36.)* One row per user: the ambient mix they left.

| column | type | notes |
|---|---|---|
| user_id | uuid PK FK profiles | default `auth.uid()`, on delete cascade |
| levels | jsonb | e.g. `{"rain":0.6,"fire":0,"keyboard":0.2,"cafe":0.3,"piano":0.3}`; CHECK `mixer_levels_valid`: an object of at most 16 lowercase layer keys, each a number 0..1 |
| master_volume | numeric | 0..1 (check), default 0.8 |
| muted | bool | default false (added in Phase 6) |
| current_track_id | uuid nullable | FK to `music_tracks` **on delete set null** (Phase 7, Session 42); the insert / update policies also require the track to be the caller's own. Written only by `saveCurrentTrack` (a partial upsert that leaves levels / master / mute alone); a row whose `levels` is `{}` exists only because of this column and means "no mix saved yet" |
| updated_at | timestamptz | touch trigger (pinned search_path) |

RLS: select / insert / update own (`(select auth.uid()) = user_id`); **no delete policy** (the row goes with the profile, "reset" is an update); `anon` has no access. The server action also validates every field and names the reason it refuses a save.

### `music_tracks`
*(Built in Phase 7, Session 40.)*

| column | type | notes |
|---|---|---|
| id | uuid PK | default `gen_random_uuid()`; the upload flow supplies it and it **is the object's file name** |
| user_id | uuid FK profiles | default `auth.uid()`, cascade |
| title | text | 1-120 chars (check) |
| artist | text | default `''`, ≤ 120 |
| storage_path | text unique | CHECK: exactly `{user_id}/{id}.mp3`, so the stored name is always a generated uuid, never what the user typed |
| duration_seconds | int | 1..7200; read by the browser's decoder, display only |
| mime | text | CHECK `audio/mpeg` |
| size_bytes | bigint | 1..10 MB (check); the **real stored size**, read from the object by the server |
| created_at | timestamptz |  |

Limits (changed 2026-10-05 from 20 tracks / mp3 + m4a + ogg): max **10** rows per user, 10 MB per file, 50 MB per user in total, `audio/mpeg` only. Enforced in the app (friendly refusal), by the bucket and storage policies, and authoritatively by a BEFORE INSERT trigger that takes a per-user advisory lock (so two simultaneous uploads cannot both slip under the cap) and raises `too_big` / `library_full` / `quota_exceeded`.

RLS: select / insert / update / delete own. Column privileges: a user may update **only `title` and `artist`**; nothing for `anon`. The bucket `music` is private (`file_size_limit` 10 MB, `allowed_mime_types` `audio/mpeg`); storage policies allow a user to read / delete under `{their id}/` and to insert only a generated `{their id}/{uuid}.mp3` while they hold fewer than 10 objects and under 50 MB (a backstop that works through `private.music_room_left()`, a SECURITY DEFINER helper in a schema the API does not expose). There is no update policy on the objects: nothing is overwritten. Deleting an account removes the rows by cascade but **not** the stored objects: the Phase 9 delete-account flow must remove `{user_id}/` from the bucket.

### `playlists` / `playlist_tracks`
*(Built in Phase 7, Session 41.)*

`playlists`: `id` uuid PK, `user_id` (default `auth.uid()`, cascade), `name` (1-60 chars, check), `created_at`. At most **20 per user**: a BEFORE INSERT trigger under a per-user advisory lock raises `playlist_limit`. RLS own-row for all four commands; a user may update only `name` (column privileges); nothing for `anon`.

`playlist_tracks`: PK `(playlist_id, track_id)` (a track appears once per playlist; both FKs cascade, so deleting a track or a playlist removes the link), `position` int 0..100000 with `unique (playlist_id, position) deferrable initially deferred` (a reorder rewrites every row in one statement). RLS: every command only on links of the caller's own playlists, and **insert also requires the track to be the caller's own** (the FK alone would take anyone's id). Only `position` may be updated. Index on `track_id` (the cascade scan).

Two SECURITY INVOKER functions, so RLS still applies to them and they are exposed to `authenticated` only: `add_playlist_track(playlist, track)` (locks the playlist row, appends at max + 1) and `reorder_playlist(playlist, track_ids[])` (the array must be exactly the playlist's tracks, each once, else `bad_order`; all positions or none change).

### `admins`
*(Phase 7, Session 44; decision D.)* `user_id` PK -> `auth.users` (cascade), `created_at`. RLS on, **one policy: a signed-in user may read their own row** (that is how the app learns whether to show the review view); no insert / update / delete policy and the write privileges are revoked, so only a migration changes it. The migration fills it for Minh's account (looked up by email). `private.is_admin()` (SECURITY DEFINER, no arguments, in a schema the API does not expose) answers "is the caller an admin?" for policies and functions.

### `track_suggestions` (signed-in write, own-or-admin read)
*(Built in Phase 7, Session 44.)*

| column | type | notes |
|---|---|---|
| id | uuid PK | default `gen_random_uuid()` |
| suggested_by | uuid FK profiles | default `auth.uid()`, cascade |
| title | text | 1-120 (check) |
| artist | text | default `''`, ≤ 120 |
| link | text | CHECK `suggestion_link_ok`: https only, host in {youtube.com, www. / m. / music.youtube.com, youtu.be, open.spotify.com, spotify.link}, no whitespace or control characters, ≤ 500; the app stores the URL parser's canonical form |
| reason | text | default `''`, ≤ 500 |
| status | text | CHECK in (pending, approved, rejected); default pending |
| reviewed_by | uuid nullable | -> `auth.users`, set null on delete |
| created_at | timestamptz |  |

RLS: **insert** only as yourself, with `status = 'pending'` and no `reviewed_by`; **select** own, or all if `private.is_admin()`; **update** admin only, and only the columns `status` and `reviewed_by` (column privileges); **delete** your own suggestion while it is still pending (withdraw); nothing for `anon`. A BEFORE INSERT trigger under a per-user advisory lock allows at most **5 pending** per user (`too_many_pending`).

### `community_picks` (read by every signed-in user, written by an admin)
*(Built in Phase 7, Session 45.)*

| column | type | notes |
|---|---|---|
| id | uuid PK |  |
| title | text | 1-120 |
| artist | text | ≤ 120 |
| link | text | the same `suggestion_link_ok` check as suggestions |
| note | text | ≤ 500, the admin's remark |
| suggestion_id | uuid nullable | -> `track_suggestions`, set null on delete; **unique** where not null, so a suggestion yields at most one pick |
| sort_order | int | ≥ 0; a new pick goes last |
| created_at | timestamptz |  |

RLS: select for every `authenticated` user; insert / update / delete only when `private.is_admin()`; nothing for `anon`.

`review_suggestion(p_id, p_action, p_note)` (SECURITY INVOKER, so RLS still applies inside it): `not_admin` unless the caller is an admin; `bad_action` (not approve / reject); `bad_note` (> 500); locks the suggestion row; `not_found`; `already_reviewed` unless it is pending. **Approve** inserts the pick (title, artist and link copied, the trimmed note, the next sort order) and sets the suggestion to `approved` with `reviewed_by`, **in one transaction**; **reject** sets `rejected`. Returns the pick's id or null.

### `quotes` (global read-only)
*(Built in Phase 8, Session 47.)*

| column | type | notes |
|---|---|---|
| id | int PK | 1..120 |
| text | text | 1-200 chars after trim (check), unique |
| author | text nullable | 1-80 if present; **null for every seeded row** (written for the app; no real-person attributions) |

Seeded with 120 original lines. RLS: select for `authenticated` only; **no insert / update / delete policy** and the write privileges are revoked, so only a migration changes it; nothing for `anon`. Which quote shows on a day is a pure function of the date (`lib/quotes.ts`: day number x a stride coprime with the list length, so any `n` consecutive days show every quote once); nothing is stored per user or per day.

### `ambient_layers` (global read-only)
*(Revised in Phase 6, Session 33: layers are synthesized with Web Audio, so a row is metadata; a single layer can become a file later.)*

| column | type | notes |
|---|---|---|
| key | text PK | `^[a-z][a-z0-9_]{0,31}$`, e.g. `rain`; the browser maps it to a generator in `lib/audio/synth` |
| label | text | 1-40 chars |
| kind | text | `synth` (default) or `file` |
| storage_path | text nullable | required when `kind = 'file'` (object in the `ambient` bucket) |
| default_level | numeric | 0..1 |
| sort_order | int | mixer order |

RLS: select for `authenticated` only; **no insert / update / delete policy** and the write privileges are revoked from `anon` and `authenticated`, so only migrations change it. Seeded: rain, fire, keyboard, cafe, piano.

## Storage buckets

| bucket | access | contents |
|---|---|---|
| `music` | private, per-user | user-uploaded tracks; path `{user_id}/{uuid}.{ext}` |
| `ambient` | public read | *not created yet*: only needed if a layer is swapped to `kind = 'file'` (Minh must approve any download first) |

## Row Level Security — example policy

```sql
alter table time_blocks enable row level security;

create policy "own time_blocks — select"
  on time_blocks for select
  using (auth.uid() = user_id);

create policy "own time_blocks — modify"
  on time_blocks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

Same shape applies to `categories`, `diary_entries`, `tasks`, `focus_sessions`, `mixer_state`, `music_tracks`, `playlists`, `playlist_tracks`.
