"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isUuid, storagePath, titleFromFilename, validateArtist, validateTitle } from "@/lib/music/filename";
import {
  MAX_DURATION_SECONDS,
  MAX_FILE_BYTES,
  MP3_MIME,
  type MusicReason,
} from "@/lib/music/limits";
import { sniffMp3, type Reader } from "@/lib/music/mp3";
import { checkQuota, type Usage } from "@/lib/music/quota";

type Fail = { ok: false; reason: MusicReason; detail?: string };
export type PrepareResult = { ok: true; trackId: string; path: string; token: string; title: string } | Fail;
export type FinalizeResult = { ok: true; trackId: string } | Fail;
export type SimpleResult = { ok: true } | Fail;
export type UrlResult = { ok: true; url: string; expiresAt: number } | Fail;

// A signed URL for playback is valid for an hour; the player refreshes it
// before it runs out (lib/music/signed-url.ts).
const PLAY_URL_SECONDS = 3600;
// An object nobody finalized for this long is an abandoned upload.
const ORPHAN_AFTER_MS = 15 * 60_000;

// Signed out, the middleware answers an action's POST with a redirect, so the
// browser may get no result at all (Session 26); callers treat that as
// "unauthenticated". This covers the case where a request does reach us.
async function authed() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}
type Authed = NonNullable<Awaited<ReturnType<typeof authed>>>;

const fail = (reason: MusicReason, detail?: string): Fail => ({ ok: false, reason, ...(detail ? { detail } : {}) });

// The trigger on music_tracks names its refusal in the exception message.
function dbReason(error: { message?: string; code?: string }): MusicReason {
  const m = error.message ?? "";
  if (m === "library_full" || m === "too_big" || m === "quota_exceeded") return m;
  return "db_error";
}

async function usageOf({ supabase }: Authed): Promise<Usage | null> {
  const { data, error } = await supabase.from("music_tracks").select("size_bytes");
  if (error || !data) return null;
  return { count: data.length, totalBytes: data.reduce((n, r) => n + Number(r.size_bytes), 0) };
}

async function discard({ supabase }: Authed, path: string) {
  try {
    await supabase.storage.from("music").remove([path]);
  } catch {}
}

// Removes objects in the caller's folder that have no row and are old enough
// not to be an upload in progress. They count toward the storage policy's
// "10 objects" backstop, so they must not pile up.
async function sweepOrphans(a: Authed) {
  const { supabase, user } = a;
  const bucket = supabase.storage.from("music");
  const [objects, rows] = await Promise.all([
    bucket.list(user.id, { limit: 100 }),
    supabase.from("music_tracks").select("storage_path"),
  ]);
  if (objects.error || rows.error || !objects.data) return;
  const known = new Set(rows.data.map((r) => r.storage_path));
  const now = Date.now();
  const stale = objects.data
    .filter((o) => {
      const created = o.created_at ? Date.parse(o.created_at) : NaN;
      return !known.has(`${user.id}/${o.name}`) && Number.isFinite(created) && now - created > ORPHAN_AFTER_MS;
    })
    .map((o) => `${user.id}/${o.name}`);
  if (stale.length) await bucket.remove(stale);
}

// Step 1 of an upload: check the file's claims against the library's limits
// and hand out a one-time signed upload URL for a generated object name. The
// client then uploads straight to storage (the file never passes through this
// server). The checks here are for a friendly refusal; the real ones are the
// bucket, the storage policies, the trigger and `finalizeTrack`.
export async function prepareUpload(input: unknown): Promise<PrepareResult> {
  const a = await authed();
  if (!a) return fail("unauthenticated");
  const { name, size, mime } = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;

  const usage = await usageOf(a);
  if (!usage) return fail("db_error");
  const reason = checkQuota(usage, size, mime);
  if (reason) return fail(reason);

  await sweepOrphans(a).catch(() => {});

  const trackId = crypto.randomUUID();
  const path = storagePath(a.user.id, trackId);
  const { data, error } = await a.supabase.storage.from("music").createSignedUploadUrl(path);
  if (error || !data) {
    // The object name is one we generated, so the only thing the insert policy
    // can still refuse is the backstop: 10 objects, or 50 MB, already stored.
    if (/row-level security|unauthorized/i.test(error?.message ?? "")) return fail("library_full", error?.message);
    return fail("upload_failed", error?.message);
  }
  return { ok: true, trackId, path, token: data.token, title: titleFromFilename(name) };
}

// Reads a byte range of a stored object through a short-lived signed URL.
function storedReader(url: string, total: number): Reader {
  return async (start, end) => {
    const last = Math.min(end, total) - 1;
    if (last < start) return new Uint8Array();
    // Never wait on storage without a limit: a stalled read must fail (and be
    // retried once), not hang the upload for a minute.
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, {
          headers: { Range: `bytes=${start}-${last}` },
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) throw new Error(`range ${res.status}`);
        const buf = new Uint8Array(await res.arrayBuffer());
        // A server that ignored Range sent the whole file: take the slice we wanted.
        return res.status === 206 ? buf : buf.slice(start, last + 1);
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError;
  };
}

// Step 2: the file is in storage. Never trust what the client said about it:
// look at the stored object (its real size and type), read its first bytes (a
// real MP3 has an ID3 tag or an MPEG frame sync, whatever the extension), then
// insert the row. If anything fails the object is removed, so a refused upload
// leaves nothing behind in storage and no row.
export async function finalizeTrack(input: unknown): Promise<FinalizeResult> {
  const a = await authed();
  if (!a) return fail("unauthenticated");
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  if (!isUuid(o.trackId)) return fail("bad_id");
  const trackId = o.trackId;
  const path = storagePath(a.user.id, trackId);

  const refuse = async (r: MusicReason, detail?: string): Promise<Fail> => {
    await discard(a, path);
    return fail(r, detail);
  };

  const dur = o.durationSeconds;
  const title = validateTitle(o.title);
  const artist = validateArtist(o.artist);
  if (typeof dur !== "number" || !Number.isInteger(dur) || dur < 1 || dur > MAX_DURATION_SECONDS) {
    return refuse("bad_duration");
  }
  if (!title.ok) return refuse(title.reason);
  if (!artist.ok) return refuse(artist.reason);

  const bucket = a.supabase.storage.from("music");
  let found = await bucket.list(a.user.id, { search: trackId, limit: 5 });
  if (found.error) found = await bucket.list(a.user.id, { search: trackId, limit: 5 }); // one retry
  // If we cannot even look, the object may still be there: remove it rather than orphan it.
  if (found.error) return refuse("upload_failed", found.error.message);
  const obj = found.data?.find((f) => f.name === `${trackId}.mp3`);
  if (!obj) return fail("not_uploaded");

  const meta = (obj.metadata ?? {}) as { size?: number; mimetype?: string };
  const size = Number(meta.size);
  if (!Number.isFinite(size) || size <= 0) return refuse("bad_size");
  if (size > MAX_FILE_BYTES) return refuse("too_big");
  if (meta.mimetype !== MP3_MIME) return refuse("not_mp3");
  if (typeof o.size === "number" && o.size !== size) return refuse("size_mismatch");

  const usage = await usageOf(a);
  if (!usage) return refuse("db_error");
  const quota = checkQuota(usage, size, MP3_MIME);
  if (quota) return refuse(quota);

  const signed = await bucket.createSignedUrl(path, 60);
  if (signed.error || !signed.data) return refuse("db_error");
  let verdict: "ok" | "not_mp3";
  try {
    verdict = await sniffMp3(storedReader(signed.data.signedUrl, size), size);
  } catch {
    return refuse("upload_failed", "could not read the stored file");
  }
  if (verdict !== "ok") return refuse("not_mp3");

  const { error } = await a.supabase.from("music_tracks").insert({
    id: trackId,
    user_id: a.user.id,
    title: title.value,
    artist: artist.value,
    storage_path: path,
    duration_seconds: dur,
    mime: MP3_MIME,
    size_bytes: size,
  });
  if (error) return refuse(dbReason(error), error.code);

  revalidatePath("/", "layout");
  return { ok: true, trackId };
}

export async function renameTrack(input: unknown): Promise<SimpleResult> {
  const a = await authed();
  if (!a) return fail("unauthenticated");
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  if (!isUuid(o.id)) return fail("bad_id");
  const title = validateTitle(o.title);
  if (!title.ok) return fail(title.reason);
  const artist = validateArtist(o.artist);
  if (!artist.ok) return fail(artist.reason);

  const { data, error } = await a.supabase
    .from("music_tracks")
    .update({ title: title.value, artist: artist.value })
    .eq("id", o.id)
    .select("id");
  if (error) return fail("db_error", error.code);
  if (!data?.length) return fail("not_found");
  revalidatePath("/", "layout");
  return { ok: true };
}

// Deletes the stored file first, then the row: a failure in between leaves a
// track that will not play (and can be deleted again), never a file nobody
// can see or remove.
export async function deleteTrack(input: unknown): Promise<SimpleResult> {
  const a = await authed();
  if (!a) return fail("unauthenticated");
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  if (!isUuid(o.id)) return fail("bad_id");

  const { data: row, error: readError } = await a.supabase
    .from("music_tracks")
    .select("id, storage_path")
    .eq("id", o.id)
    .maybeSingle();
  if (readError) return fail("db_error", readError.code);
  if (!row) return fail("not_found");

  const removed = await a.supabase.storage.from("music").remove([row.storage_path]);
  if (removed.error) return fail("db_error", removed.error.message);
  const { error } = await a.supabase.from("music_tracks").delete().eq("id", row.id);
  if (error) return fail("db_error", error.code);
  revalidatePath("/", "layout");
  return { ok: true };
}

// A short-lived URL to play one track from the private bucket. Only the
// owner's rows are visible, so someone else's id answers `not_found`.
export async function getTrackUrl(input: unknown): Promise<UrlResult> {
  const a = await authed();
  if (!a) return fail("unauthenticated");
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  if (!isUuid(o.id)) return fail("bad_id");
  const { data: row } = await a.supabase.from("music_tracks").select("storage_path").eq("id", o.id).maybeSingle();
  if (!row) return fail("not_found");
  const { data, error } = await a.supabase.storage.from("music").createSignedUrl(row.storage_path, PLAY_URL_SECONDS);
  if (error || !data) return fail("db_error", error?.message);
  return { ok: true, url: data.signedUrl, expiresAt: Date.now() + PLAY_URL_SECONDS * 1000 };
}

// Remembers which track the player was on (null = none), in the mixer_state
// row, so a new device opens on the same track (paused). Only that column is
// written: levels, master and mute belong to saveMixerState. The policy and the
// FK refuse a track that is not the caller's own; a track that was deleted in
// the meantime is `not_found`.
export async function saveCurrentTrack(input: unknown): Promise<SimpleResult> {
  const a = await authed();
  if (!a) return fail("unauthenticated");
  const id = input && typeof input === "object" ? (input as Record<string, unknown>).trackId : undefined;
  if (id !== null && !isUuid(id)) return fail("bad_id");
  const { error } = await a.supabase
    .from("mixer_state")
    .upsert({ user_id: a.user.id, current_track_id: id }, { onConflict: "user_id" });
  if (error) return fail(error.code === "42501" || error.code === "23503" ? "not_found" : "db_error", error.code);
  return { ok: true };
}
