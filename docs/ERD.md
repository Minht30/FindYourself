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
| streak_count | int | default 0 |
| streak_last_date | date |  |
| created_at | timestamptz | default now() |

### `categories`
| column | type | notes |
|---|---|---|
| id | uuid PK |  |
| user_id | uuid FK profiles(id) on delete cascade |  |
| name | text |  |
| color | text | hex, e.g. `#C69B7B` |
| sort_order | int |  |

Seeded per user on signup: Deep Work, Meetings, Learning, Rest, Personal.

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
| column | type | notes |
|---|---|---|
| id | uuid PK |  |
| user_id | uuid FK |  |
| title | text |  |
| description | text |  |
| bucket | text | enum: today, tomorrow, backlog, done |
| priority | text | enum: low, med, high |
| category_id | uuid FK nullable |  |
| deadline | timestamptz nullable |  |
| is_restriction | bool | default false |
| completed_at | timestamptz nullable |  |
| sort_order | int |  |
| created_at | timestamptz |  |

### `focus_sessions`
| column | type | notes |
|---|---|---|
| id | uuid PK |  |
| user_id | uuid FK |  |
| started_at | timestamptz |  |
| ended_at | timestamptz |  |
| duration_seconds | int |  |
| task_id | uuid nullable |  |
| time_block_id | uuid nullable |  |
| completed | bool |  |

Index: `(user_id, started_at)`

### `mixer_state`
| column | type | notes |
|---|---|---|
| user_id | uuid PK FK |  |
| levels | jsonb | e.g. `{"rain":0.6,"fire":0.0,"keyboard":0.2,"cafe":0.4,"piano":0.3}` |
| master_volume | numeric | 0..1 |
| current_track_id | uuid nullable |  |
| updated_at | timestamptz |  |

### `music_tracks`
| column | type | notes |
|---|---|---|
| id | uuid PK |  |
| user_id | uuid FK |  |
| title | text |  |
| artist | text |  |
| storage_path | text | e.g. `music/{user_id}/{filename}` |
| duration_seconds | int |  |
| mime | text |  |
| size_bytes | bigint |  |
| created_at | timestamptz |  |

Constraint (enforced in app + trigger): max 20 rows per `user_id`; sum(size_bytes) ≤ 50 MB per `user_id`.

### `playlists` / `playlist_tracks`
Standard M..N. Cascade on user delete.

### `track_suggestions` (public-write for authenticated users, admin-read)
| column | type | notes |
|---|---|---|
| id | uuid PK |  |
| suggested_by | uuid FK profiles(id) |  |
| title | text |  |
| artist | text |  |
| link | text | youtube/spotify url |
| reason | text |  |
| status | text | enum: pending, approved, rejected |
| reviewed_by | uuid nullable |  |
| created_at | timestamptz |  |

RLS: insert-any-authenticated; select-own OR admin.

### `quotes` (global read-only)
| column | type |
|---|---|
| id | int PK |
| text | text |
| author | text |

Seeded with ~120 quotes so a full year has variety with light repetition.

### `ambient_layers` (global read-only)
| column | type |
|---|---|
| key | text PK | e.g. `rain` |
| label | text |  |
| storage_path | text | in `ambient/` public bucket |
| default_level | numeric |  |

## Storage buckets

| bucket | access | contents |
|---|---|---|
| `music` | private, per-user | user-uploaded tracks; path `{user_id}/{uuid}.{ext}` |
| `ambient` | public read | rain.mp3, fire.mp3, keyboard.mp3, cafe.mp3, piano.mp3 |

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
