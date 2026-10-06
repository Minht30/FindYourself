-- Phase 7, Box 3: mixer_state.current_track_id becomes a real reference.
--
-- It was a bare uuid in Phase 6 ("no FK yet, music_tracks does not exist").
-- Now: a foreign key to music_tracks that is cleared (set null) when the track
-- is deleted, and the insert / update policies also require the track to be the
-- caller's own, like focus_sessions does for its task / block (the FK alone
-- would accept anyone's id).

alter table public.mixer_state
  add constraint mixer_state_current_track_fk
  foreign key (current_track_id) references public.music_tracks(id) on delete set null;

-- the FK is scanned when a track is deleted
create index mixer_state_current_track_idx
  on public.mixer_state (current_track_id) where current_track_id is not null;

drop policy "own mixer_state - insert" on public.mixer_state;
drop policy "own mixer_state - update" on public.mixer_state;

create policy "own mixer_state - insert"
  on public.mixer_state for insert
  with check (
    (select auth.uid()) = user_id
    and (
      current_track_id is null
      or exists (
        select 1 from public.music_tracks t
        where t.id = current_track_id and t.user_id = (select auth.uid())
      )
    )
  );

create policy "own mixer_state - update"
  on public.mixer_state for update
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      current_track_id is null
      or exists (
        select 1 from public.music_tracks t
        where t.id = current_track_id and t.user_id = (select auth.uid())
      )
    )
  );
