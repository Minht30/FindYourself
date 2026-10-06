import { MAX_DURATION_SECONDS, MP3_MIME, type MusicReason } from "./limits";
import { sniffMp3, type Reader } from "./mp3";
import { checkQuota, type Usage } from "./quota";
import { titleFromFilename } from "./filename";

// The upload pipeline, with the network injected so it can be unit-tested:
//   1. cheap checks in the browser (name / type, size, count, the real bytes,
//      the duration) so an obvious refusal costs no request at all;
//   2. prepare   -> the server re-checks and hands out a signed upload URL;
//   3. put       -> the file goes straight to storage;
//   4. finalize  -> the server inspects the stored object and adds the row.
// Every refusal names its reason and says which step made it, and whether a
// request had been sent, so "refused by the browser" and "refused by the
// server" can be told apart.

export type Stage = "client" | "prepare" | "storage" | "finalize";
export type Outcome =
  | { ok: true; trackId: string; title: string }
  | { ok: false; reason: MusicReason; stage: Stage; requestSent: boolean; detail?: string };

type Maybe<T> = T | undefined | null; // a signed-out action POST resolves with no result at all
type ActionFail = { ok: false; reason: MusicReason; detail?: string };

export type UploadDeps = {
  prepare: (i: { name: string; size: number; mime: string }) => Promise<
    Maybe<{ ok: true; trackId: string; path: string; token: string; title: string } | ActionFail>
  >;
  put: (path: string, token: string, file: Blob) => Promise<{ error: { status?: number; message: string } | null }>;
  finalize: (i: {
    trackId: string;
    title: string;
    artist: string;
    durationSeconds: number;
    size: number;
  }) => Promise<Maybe<{ ok: true; trackId: string } | ActionFail>>;
  readDuration: (file: Blob) => Promise<number | null>;
};

export type UploadOptions = {
  title?: string;
  artist?: string;
  // Test hook: behave like a client that skips every browser-side check (a
  // modified page, or a direct call), to prove the server and storage hold
  // the line on their own.
  skipClientChecks?: boolean;
};

// "audio/mpeg" is what browsers report for .mp3; Firefox on some systems says
// "audio/mp3". Anything else (or no name ending .mp3) is not offered at all.
// The bytes are what decide whether it really is one.
export function claimedMime(file: { name: string; type: string }): string {
  const looksMp3 = /\.mp3$/i.test(file.name) && (file.type === "" || file.type === MP3_MIME || file.type === "audio/mp3");
  return looksMp3 ? MP3_MIME : file.type || "unknown";
}

const blobReader =
  (file: Blob): Reader =>
  async (a, b) =>
    new Uint8Array(await file.slice(a, b).arrayBuffer());

const client = (reason: MusicReason): Outcome => ({ ok: false, reason, stage: "client", requestSent: false });

export async function uploadTrack(
  file: File,
  usage: Usage,
  deps: UploadDeps,
  opts: UploadOptions = {},
): Promise<Outcome> {
  const mime = claimedMime(file);
  let durationSeconds = 1;

  if (!opts.skipClientChecks) {
    const quota = checkQuota(usage, file.size, mime);
    if (quota) return client(quota);
    if ((await sniffMp3(blobReader(file), file.size)) !== "ok") return client("not_mp3");
    const d = await deps.readDuration(file);
    if (d === null || !Number.isFinite(d) || d < 0.5 || d > MAX_DURATION_SECONDS) return client("bad_duration");
    durationSeconds = Math.max(1, Math.round(d));
  } else {
    const d = await deps.readDuration(file).catch(() => null);
    if (d !== null && Number.isFinite(d) && d > 0) durationSeconds = Math.min(MAX_DURATION_SECONDS, Math.max(1, Math.round(d)));
  }

  const prep = await deps.prepare({ name: file.name, size: file.size, mime });
  if (!prep) return { ok: false, reason: "unauthenticated", stage: "prepare", requestSent: true };
  if (!prep.ok) return { ok: false, reason: prep.reason, stage: "prepare", requestSent: true, detail: prep.detail };

  const put = await deps.put(prep.path, prep.token, file);
  if (put.error) {
    // storage answers 413 for a body over the bucket limit and 415 for a type it does not allow
    const reason: MusicReason =
      put.error.status === 413 ? "too_big" : put.error.status === 415 ? "not_mp3" : "upload_failed";
    return { ok: false, reason, stage: "storage", requestSent: true, detail: put.error.message };
  }

  const title = (opts.title ?? "").trim() || prep.title || titleFromFilename(file.name);
  const fin = await deps.finalize({
    trackId: prep.trackId,
    title,
    artist: opts.artist ?? "",
    durationSeconds,
    size: file.size,
  });
  if (!fin) return { ok: false, reason: "unauthenticated", stage: "finalize", requestSent: true };
  if (!fin.ok) return { ok: false, reason: fin.reason, stage: "finalize", requestSent: true, detail: fin.detail };
  return { ok: true, trackId: fin.trackId, title };
}
