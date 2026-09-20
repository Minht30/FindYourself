-- handle_new_user is only invoked by the trigger on auth.users insert.
-- Revoke REST/anon/authenticated access so it cannot be called via /rest/v1/rpc.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
