# Supabase migrations

Timestamped SQL files applied via the Supabase MCP `apply_migration` tool. These are mirrored here so the schema is version-controlled alongside the app code.

## Applying to a fresh project

If you ever re-provision the Supabase project, run these files in order — either via the Supabase CLI (`supabase db push`) or by pasting each into the SQL editor. They're idempotent-safe only when applied to an empty database.

## Naming

`<UTC timestamp>_<snake_case_name>.sql` — same convention Supabase's own CLI uses. The timestamp is what `list_migrations` reports as `version`.
