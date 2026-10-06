"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Play, Trash2, X } from "lucide-react";
import {
  addToPlaylist,
  createPlaylist,
  deletePlaylist,
  removeFromPlaylist,
  renamePlaylist,
  reorderPlaylist,
  type PlaylistResult,
} from "@/app/(app)/chill/playlist-actions";
import { MAX_PLAYLIST_NAME, MAX_PLAYLISTS, REASON_TEXT, type MusicReason } from "@/lib/music/limits";
import { moveDown, moveUp, type Playlist } from "@/lib/music/playlist";
import { useMusicStore } from "@/lib/music/store";
import { formatDuration } from "@/lib/music/types";
import { useMusic } from "./MusicProvider";

// An action's answer, or "unauthenticated" when a signed-out POST got none.
type Answer = PlaylistResult | undefined | null;
const reasonOf = (r: Answer): MusicReason | null => (!r ? "unauthenticated" : r.ok ? null : r.reason);

// Playlists: create, rename, delete, add and remove tracks, and put them in
// order with up / down buttons (keyboard and screen-reader friendly).
export default function Playlists() {
  const { playlists } = useMusic();
  const [name, setName] = useState("");
  const [error, setError] = useState<MusicReason | null>(null);
  const [pending, setPending] = useState(false);

  // Dev only: the live tests call the actions directly with inputs the UI
  // would never send (a track that is already in the list, a bad order, someone
  // else's track). Compiled out of production.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as { __fyMusicTools?: Record<string, unknown> };
    w.__fyMusicTools = {
      ...w.__fyMusicTools,
      playlists: { createPlaylist, renamePlaylist, deletePlaylist, addToPlaylist, removeFromPlaylist, reorderPlaylist },
    };
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const r: Answer = await createPlaylist({ name });
    setPending(false);
    const reason = reasonOf(r);
    setError(reason);
    if (!reason) setName("");
  }

  return (
    <section aria-label="Playlists" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg">Playlists</h2>
        <p data-testid="playlist-count" className="text-xs text-ink-secondary">
          {playlists.length} of {MAX_PLAYLISTS}
        </p>
      </div>

      <form onSubmit={create} className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col text-xs font-ui text-ink-secondary">
          New playlist
          <input
            data-testid="playlist-name-input"
            value={name}
            maxLength={MAX_PLAYLIST_NAME + 20}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 rounded border border-[var(--border-strong)] bg-bg-elevated px-2 py-1.5 text-sm text-ink-primary"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent text-cat-ink px-4 py-1.5 text-sm font-medium disabled:opacity-60"
        >
          Create
        </button>
      </form>
      {error && (
        <p role="alert" data-testid="playlist-error" data-reason={error} className="text-xs text-danger">
          {REASON_TEXT[error]}
        </p>
      )}

      {playlists.length === 0 ? (
        <p className="text-sm text-ink-secondary">No playlists yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {playlists.map((p) => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
        </ul>
      )}
    </section>
  );
}

function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const { tracks } = useMusic();
  const byId = new Map(tracks.map((t) => [t.id, t]));
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(playlist.name);
  const [confirming, setConfirming] = useState(false);
  const [adding, setAdding] = useState("");
  const [error, setError] = useState<MusicReason | null>(null);
  const [pending, setPending] = useState(false);

  async function run(fn: () => Promise<Answer>): Promise<boolean> {
    setPending(true);
    setError(null);
    const r = await fn();
    setPending(false);
    const reason = reasonOf(r);
    setError(reason);
    return reason === null;
  }

  // Start this playlist (from a given track, or the top).
  const play = (startId: string | null) =>
    useMusicStore.getState().playList(playlist.trackIds, startId, { kind: "playlist", id: playlist.id });
  const addable = tracks.filter((t) => !playlist.trackIds.includes(t.id));
  const move = (index: number, dir: "up" | "down") =>
    run(() =>
      reorderPlaylist({
        playlistId: playlist.id,
        trackIds: dir === "up" ? moveUp(playlist.trackIds, index) : moveDown(playlist.trackIds, index),
      }),
    );

  return (
    <li
      data-testid="playlist"
      data-playlist-id={playlist.id}
      className="rounded-lg bg-bg-elevated border border-[var(--border)] p-3 shadow-card flex flex-col gap-2"
    >
      <div className="flex flex-wrap items-center gap-2">
        {editing ? (
          <form
            className="flex gap-2 flex-1"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await run(() => renamePlaylist({ id: playlist.id, name }))) setEditing(false);
            }}
          >
            <label className="sr-only" htmlFor={`pl-name-${playlist.id}`}>
              Playlist name
            </label>
            <input
              id={`pl-name-${playlist.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded border border-[var(--border-strong)] bg-bg-elevated px-2 py-1 text-sm"
            />
            <button type="submit" disabled={pending} className="rounded-full bg-accent text-cat-ink px-3 py-1 text-xs font-medium">
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setName(playlist.name);
                setError(null);
              }}
              className="rounded-full border border-[var(--border-strong)] px-3 py-1 text-xs"
            >
              Cancel
            </button>
          </form>
        ) : (
          <>
            <h3 data-testid="playlist-title" className="font-ui font-medium text-sm flex-1 truncate">
              {playlist.name}{" "}
              <span className="text-xs text-ink-secondary font-normal">
                ({playlist.trackIds.length} {playlist.trackIds.length === 1 ? "track" : "tracks"})
              </span>
            </h3>
            <button
              type="button"
              data-testid="playlist-play"
              aria-label={`Play playlist ${playlist.name}`}
              disabled={playlist.trackIds.length === 0}
              onClick={() => play(null)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-accent text-cat-ink hover:bg-accent-soft disabled:opacity-40"
            >
              <Play size={14} />
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-full border border-[var(--border-strong)] px-3 py-1 text-xs hover:bg-accent-soft"
            >
              Rename
            </button>
            {confirming ? (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => deletePlaylist({ id: playlist.id }))}
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
                aria-label={`Delete playlist ${playlist.name}`}
                onClick={() => setConfirming(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-secondary hover:bg-accent-soft hover:text-cat-ink"
              >
                <Trash2 size={15} />
              </button>
            )}
          </>
        )}
      </div>

      {playlist.trackIds.length === 0 ? (
        <p className="text-xs text-ink-secondary">Empty. Add a track below.</p>
      ) : (
        <ol className="flex flex-col gap-1" aria-label={`Tracks in ${playlist.name}`}>
          {playlist.trackIds.map((id, i) => {
            const t = byId.get(id);
            if (!t) return null;
            return (
              <li key={id} data-testid="playlist-track" data-track-id={id} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-right text-xs text-ink-muted tabular-nums">{i + 1}</span>
                <span className="flex-1 min-w-0 truncate">
                  {t.title} <span className="text-xs text-ink-secondary">{formatDuration(t.durationSeconds)}</span>
                </span>
                <button
                  type="button"
                  aria-label={`Play ${t.title} from ${playlist.name}`}
                  onClick={() => play(id)}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-accent-soft"
                >
                  <Play size={13} />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${t.title} up`}
                  disabled={pending || i === 0}
                  onClick={() => void move(i, "up")}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-accent-soft disabled:opacity-30"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${t.title} down`}
                  disabled={pending || i === playlist.trackIds.length - 1}
                  onClick={() => void move(i, "down")}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-accent-soft disabled:opacity-30"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${t.title} from ${playlist.name}`}
                  disabled={pending}
                  onClick={() => void run(() => removeFromPlaylist({ playlistId: playlist.id, trackId: id }))}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-accent-soft disabled:opacity-30"
                >
                  <X size={14} />
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {addable.length > 0 && (
        <form
          className="flex gap-2 items-center"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!adding) return;
            if (await run(() => addToPlaylist({ playlistId: playlist.id, trackId: adding }))) setAdding("");
          }}
        >
          <label className="sr-only" htmlFor={`pl-add-${playlist.id}`}>
            Add a track to {playlist.name}
          </label>
          <select
            id={`pl-add-${playlist.id}`}
            data-testid="playlist-add-select"
            value={adding}
            onChange={(e) => setAdding(e.target.value)}
            className="flex-1 min-w-0 rounded border border-[var(--border-strong)] bg-bg-elevated px-2 py-1 text-sm"
          >
            <option value="">Add a track…</option>
            {addable.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <button type="submit" disabled={pending || !adding} className="rounded-full border border-[var(--border-strong)] px-3 py-1 text-xs hover:bg-accent-soft disabled:opacity-40">
            Add
          </button>
        </form>
      )}

      {error && (
        <p role="alert" data-testid="playlist-error" data-reason={error} className="text-xs text-danger">
          {REASON_TEXT[error]}
        </p>
      )}
    </li>
  );
}
