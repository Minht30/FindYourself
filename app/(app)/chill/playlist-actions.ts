"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/music/filename";
import type { MusicReason } from "@/lib/music/limits";
import { validatePlaylistName } from "@/lib/music/playlist";

type Fail = { ok: false; reason: MusicReason; detail?: string };
export type PlaylistResult = { ok: true; id?: string } | Fail;

const fail = (reason: MusicReason, detail?: string): Fail => ({ ok: false, reason, ...(detail ? { detail } : {}) });
const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

async function authed() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

// The database says why in the exception message (the triggers and functions
// in the playlists migration) or in the Postgres error code.
function dbReason(e: { message?: string; code?: string }): MusicReason {
  const m = e.message ?? "";
  if (m === "playlist_limit" || m === "not_found" || m === "bad_order") return m;
  if (e.code === "23505") return "already_in_playlist"; // (playlist, track) is the key
  if (e.code === "42501" || e.code === "23503") return "not_found"; // someone else's track, or one that is gone
  return "db_error";
}

export async function createPlaylist(input: unknown): Promise<PlaylistResult> {
  const a = await authed();
  if (!a) return fail("unauthenticated");
  const name = validatePlaylistName(obj(input).name);
  if (!name.ok) return fail(name.reason);
  const { data, error } = await a.supabase.from("playlists").insert({ name: name.value }).select("id").single();
  if (error) return fail(dbReason(error), error.code);
  revalidatePath("/", "layout");
  return { ok: true, id: data.id };
}

export async function renamePlaylist(input: unknown): Promise<PlaylistResult> {
  const a = await authed();
  if (!a) return fail("unauthenticated");
  const o = obj(input);
  if (!isUuid(o.id)) return fail("bad_id");
  const name = validatePlaylistName(o.name);
  if (!name.ok) return fail(name.reason);
  const { data, error } = await a.supabase.from("playlists").update({ name: name.value }).eq("id", o.id).select("id");
  if (error) return fail(dbReason(error), error.code);
  if (!data?.length) return fail("not_found");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deletePlaylist(input: unknown): Promise<PlaylistResult> {
  const a = await authed();
  if (!a) return fail("unauthenticated");
  const o = obj(input);
  if (!isUuid(o.id)) return fail("bad_id");
  const { data, error } = await a.supabase.from("playlists").delete().eq("id", o.id).select("id");
  if (error) return fail(dbReason(error), error.code);
  if (!data?.length) return fail("not_found");
  revalidatePath("/", "layout");
  return { ok: true };
}

// Appends to the end. The position is chosen inside the database function,
// under a lock, so two quick adds cannot claim the same slot.
export async function addToPlaylist(input: unknown): Promise<PlaylistResult> {
  const a = await authed();
  if (!a) return fail("unauthenticated");
  const o = obj(input);
  if (!isUuid(o.playlistId) || !isUuid(o.trackId)) return fail("bad_id");
  const { error } = await a.supabase.rpc("add_playlist_track", { p_playlist: o.playlistId, p_track: o.trackId });
  if (error) return fail(dbReason(error), error.code);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeFromPlaylist(input: unknown): Promise<PlaylistResult> {
  const a = await authed();
  if (!a) return fail("unauthenticated");
  const o = obj(input);
  if (!isUuid(o.playlistId) || !isUuid(o.trackId)) return fail("bad_id");
  const { data, error } = await a.supabase
    .from("playlist_tracks")
    .delete()
    .eq("playlist_id", o.playlistId)
    .eq("track_id", o.trackId)
    .select("track_id");
  if (error) return fail(dbReason(error), error.code);
  if (!data?.length) return fail("not_found");
  revalidatePath("/", "layout");
  return { ok: true };
}

// `trackIds` must be exactly the playlist's own tracks, each once, in the wanted
// order; the database function refuses anything else (`bad_order`) and either
// rewrites every position or none.
export async function reorderPlaylist(input: unknown): Promise<PlaylistResult> {
  const a = await authed();
  if (!a) return fail("unauthenticated");
  const o = obj(input);
  if (!isUuid(o.playlistId)) return fail("bad_id");
  if (!Array.isArray(o.trackIds) || o.trackIds.length > 100 || !o.trackIds.every(isUuid)) return fail("bad_order");
  const ids = o.trackIds as string[];
  if (new Set(ids).size !== ids.length) return fail("bad_order");
  const { error } = await a.supabase.rpc("reorder_playlist", { p_playlist: o.playlistId, p_track_ids: ids });
  if (error) return fail(dbReason(error), error.code);
  revalidatePath("/", "layout");
  return { ok: true };
}
