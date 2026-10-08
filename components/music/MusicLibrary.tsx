"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Trash2, Upload } from "lucide-react";
import {
  deleteTrack,
  finalizeTrack,
  prepareUpload,
  renameTrack,
} from "@/app/(app)/chill/music-actions";
import { readDuration } from "@/lib/music/duration";
import { MAX_ARTIST, MAX_TITLE, REASON_TEXT, type MusicReason } from "@/lib/music/limits";
import { usageText } from "@/lib/music/quota";
import { formatDuration, type Track } from "@/lib/music/types";
import { LIBRARY, useMusicStore } from "@/lib/music/store";
import { uploadTrack, type Outcome, type UploadDeps, type UploadOptions } from "@/lib/music/upload";
import { useMusic } from "./MusicProvider";

// The wiring between the pipeline in lib/music/upload.ts and the real world:
// server actions for the checks, the browser Supabase client for the bytes.
const realDeps: UploadDeps = {
  prepare: (i) => prepareUpload(i),
  finalize: (i) => finalizeTrack(i),
  readDuration: (f) => readDuration(f),
  put: async (path, token, file) => {
    // Loaded on the first upload only: the Supabase browser client is ~70 kB
    // that nobody needs just to look at their library.
    const { createClient } = await import("@/lib/supabase/client");
    const { error } = await createClient()
      .storage.from("music")
      .uploadToSignedUrl(path, token, file, { contentType: "audio/mpeg" });
    if (!error) return { error: null };
    const e = error as { status?: number; statusCode?: string | number; message: string };
    return { error: { status: Number(e.status ?? e.statusCode) || undefined, message: e.message } };
  },
};

type Row = { key: number; name: string; state: "working" | "done" | "refused"; reason?: MusicReason; stage?: string };

// Your library: add MP3s, rename, delete. Plain on purpose; the design pass
// comes later. Every refusal shows its reason in words and in `data-reason`.
export default function MusicLibrary() {
  const { tracks, usage } = useMusic();
  const usageRef = useRef(usage);
  usageRef.current = usage;
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const seq = useRef(0);

  // Dev only: lets the live tests drive the pipeline without the file chooser,
  // including as a client that skips its own checks. Compiled out of production.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as { __fyMusicTools?: Record<string, unknown> };
    w.__fyMusicTools = {
      ...w.__fyMusicTools,
      upload: (file: File, opts?: UploadOptions): Promise<Outcome> => uploadTrack(file, usageRef.current, realDeps, opts),
    };
  }, []);

  async function add(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    setBusy(true);
    for (const file of list) {
      const key = ++seq.current;
      setRows((r) => [...r, { key, name: file.name, state: "working" }]);
      let out: Outcome;
      try {
        out = await uploadTrack(file, usageRef.current, realDeps);
      } catch {
        out = { ok: false, reason: "upload_failed", stage: "storage", requestSent: true };
      }
      setRows((r) =>
        r.map((x) =>
          x.key !== key
            ? x
            : out.ok
              ? { ...x, state: "done" }
              : { ...x, state: "refused", reason: out.reason, stage: out.stage },
        ),
      );
      // Let the refreshed library (revalidated by the action) land before the next file is checked.
      await new Promise((res) => setTimeout(res, 50));
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  return (
    <section aria-label="Music library" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg">Your music</h2>
        <p data-testid="music-usage" className="text-xs text-ink-secondary">
          {usageText(usage)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label
          className={`inline-flex items-center gap-2 rounded-full bg-accent text-cat-ink font-ui font-semibold text-sm px-5 py-2.5 shadow-glow hover:bg-accent-soft transition cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-accent ${
            busy ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          <Upload size={16} />
          Add MP3 files
          <input
            ref={input}
            data-testid="music-file-input"
            type="file"
            accept=".mp3,audio/mpeg"
            multiple
            disabled={busy}
            className="sr-only"
            onChange={(e) => void add(e.target.files)}
          />
        </label>
        <p className="text-xs text-ink-muted">MP3 only, up to 10 MB each.</p>
      </div>

      {rows.length > 0 && (
        <ul aria-label="Upload results" aria-live="polite" className="flex flex-col gap-1 text-sm">
          {rows.map((r) => (
            <li
              key={r.key}
              data-testid="upload-row"
              data-state={r.state}
              data-reason={r.reason ?? ""}
              data-stage={r.stage ?? ""}
              className={r.state === "refused" ? "text-danger" : "text-ink-secondary"}
            >
              <span className="font-medium">{r.name}</span>
              {": "}
              {r.state === "working" ? "uploading…" : r.state === "done" ? "added" : REASON_TEXT[r.reason ?? "db_error"]}
            </li>
          ))}
        </ul>
      )}

      {tracks.length === 0 ? (
        <p className="text-sm text-ink-secondary">No music yet. Add an MP3 and it will show up here.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tracks.map((t) => (
            <TrackRow key={t.id} track={t} />
          ))}
        </ul>
      )}
    </section>
  );
}

function TrackRow({ track }: { track: Track }) {
  const { tracks } = useMusic();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [title, setTitle] = useState(track.title);
  const [artist, setArtist] = useState(track.artist);
  const [error, setError] = useState<MusicReason | null>(null);
  const [pending, setPending] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const r = await renameTrack({ id: track.id, title, artist });
    setPending(false);
    if (!r) return setError("unauthenticated");
    if (!r.ok) return setError(r.reason);
    setEditing(false);
  }

  async function remove() {
    setPending(true);
    setError(null);
    const r = await deleteTrack({ id: track.id });
    setPending(false);
    if (!r) return setError("unauthenticated");
    if (!r.ok) {
      setConfirming(false);
      setError(r.reason);
    }
  }

  return (
    <li
      data-testid="track-row"
      data-track-id={track.id}
      className="rounded-lg bg-bg-elevated border border-[var(--border)] p-3 shadow-card flex flex-col gap-2"
    >
      {editing ? (
        <form onSubmit={save} className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <label className="flex flex-col text-xs font-ui text-ink-secondary flex-1">
            Title
            <input
              value={title}
              maxLength={MAX_TITLE}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 rounded border border-[var(--border-strong)] bg-bg-elevated px-2 py-1.5 text-sm text-ink-primary"
            />
          </label>
          <label className="flex flex-col text-xs font-ui text-ink-secondary flex-1">
            Artist
            <input
              value={artist}
              maxLength={MAX_ARTIST}
              onChange={(e) => setArtist(e.target.value)}
              className="mt-1 rounded border border-[var(--border-strong)] bg-bg-elevated px-2 py-1.5 text-sm text-ink-primary"
            />
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="rounded-full bg-accent text-cat-ink px-4 py-1.5 text-sm font-medium">
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setTitle(track.title);
                setArtist(track.artist);
                setError(null);
              }}
              className="rounded-full border border-[var(--border-strong)] px-4 py-1.5 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="min-w-0 flex-1">
            <p data-testid="track-title" className="font-ui font-medium text-sm truncate">
              {track.title}
            </p>
            <p className="text-xs text-ink-secondary truncate">
              {track.artist || "Unknown artist"} · {formatDuration(track.durationSeconds)} ·{" "}
              {(track.sizeBytes / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={`Play ${track.title}`}
              data-testid="track-play"
              onClick={() =>
                useMusicStore.getState().playList(
                  tracks.map((t) => t.id),
                  track.id,
                  LIBRARY,
                )
              }
              className="w-8 h-8 rounded-full flex items-center justify-center bg-accent text-cat-ink hover:bg-accent-soft"
            >
              <Play size={14} />
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-full border border-[var(--border-strong)] px-3 py-1 text-xs hover:bg-accent-soft hover:text-cat-ink"
            >
              Rename
            </button>
            {confirming ? (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={remove}
                  className="rounded-full bg-danger text-white px-3 py-1 text-xs font-medium"
                >
                  Confirm delete
                </button>
                <button type="button" onClick={() => setConfirming(false)} className="rounded-full border border-[var(--border-strong)] px-3 py-1 text-xs">
                  Keep
                </button>
              </>
            ) : (
              <button
                type="button"
                aria-label={`Delete ${track.title}`}
                onClick={() => setConfirming(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      )}
      {error && (
        <p role="alert" data-testid="track-error" data-reason={error} className="text-xs text-danger">
          {REASON_TEXT[error]}
        </p>
      )}
    </li>
  );
}
