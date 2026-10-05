-- Phase 6, Box 1: ambient_layers (global, read-only catalogue of mixer layers).
--
-- Deviations from the original docs/ERD.md (see DECISIONS, Session 33):
--   * `kind` ('synth' | 'file'): every layer is generated with Web Audio today,
--     but a single layer can later be swapped for a royalty-free file (storage
--     bucket `ambient`) without touching the engine or the schema.
--   * storage_path is nullable and only required for kind = 'file'.
--   * sort_order gives the mixer a stable order.
-- The row is *metadata*: the sound itself for a synth layer lives in the
-- browser (lib/audio/synth), keyed by `key`.

create table public.ambient_layers (
  key text primary key,
  label text not null,
  kind text not null default 'synth',
  storage_path text,
  default_level numeric not null default 0,
  sort_order integer not null default 0,
  constraint ambient_layers_key_shape check (key ~ '^[a-z][a-z0-9_]{0,31}$'),
  constraint ambient_layers_label_length check (char_length(label) between 1 and 40),
  constraint ambient_layers_kind check (kind in ('synth', 'file')),
  constraint ambient_layers_file_has_path check (kind <> 'file' or storage_path is not null),
  constraint ambient_layers_level_range check (default_level between 0 and 1)
);

alter table public.ambient_layers enable row level security;

-- Global and read-only: any signed-in user may read; there is deliberately no
-- insert / update / delete policy, so only the migration (service role) writes.
create policy "ambient_layers - read for signed-in users"
  on public.ambient_layers for select
  to authenticated
  using (true);

-- Belt and braces on top of RLS: the API roles never need to write here.
revoke insert, update, delete, truncate on public.ambient_layers from anon, authenticated;
revoke all on public.ambient_layers from anon;

insert into public.ambient_layers (key, label, kind, default_level, sort_order) values
  ('rain',     'Rain',           'synth', 0.60, 1),
  ('fire',     'Fireplace',      'synth', 0.00, 2),
  ('keyboard', 'Keyboard',       'synth', 0.20, 3),
  ('cafe',     'Cafe chatter',   'synth', 0.30, 4),
  ('piano',    'Piano',          'synth', 0.30, 5);
