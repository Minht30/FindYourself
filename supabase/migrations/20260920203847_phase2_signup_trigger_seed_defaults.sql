-- On new auth.users insert:
--   1. create matching profiles row
--   2. seed 5 default categories (Deep Work, Meetings, Learning, Rest, Personal)
-- Runs as security definer so it can bypass RLS during signup.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fallback_name text;
begin
  fallback_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, display_name)
  values (new.id, fallback_name);

  insert into public.categories (user_id, name, color, sort_order) values
    (new.id, 'Deep Work',  '#C69B7B', 0),
    (new.id, 'Meetings',   '#D97757', 1),
    (new.id, 'Learning',   '#8B9DC3', 2),
    (new.id, 'Rest',       '#9CAF88', 3),
    (new.id, 'Personal',   '#B497BD', 4);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
