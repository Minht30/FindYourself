-- Advisor 0011: pin search_path on our trigger function so it can't be
-- redirected via a mutable search_path search.
create or replace function public.touch_diary_entries_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
