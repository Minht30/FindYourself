-- Phase 3 heatmap: entry length without shipping content_text to the client.
-- Stored generated column: always in sync with content_text, selectable via
-- PostgREST, so a year of heatmap data is ~365 small rows.
alter table public.diary_entries
  add column content_chars integer
  generated always as (char_length(content_text)) stored;
