"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { suggestTrack, withdrawSuggestion, type SuggestResult } from "@/app/(app)/chill/suggest-actions";
import { MAX_ARTIST, MAX_PENDING_SUGGESTIONS, MAX_REASON, MAX_TITLE, REASON_TEXT, type MusicReason } from "@/lib/music/limits";
import { validateLink } from "@/lib/music/links";

export type MySuggestion = {
  id: string;
  title: string;
  artist: string;
  link: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

const STATUS_TEXT = { pending: "Waiting for review", approved: "Approved", rejected: "Not added" } as const;

// A link shown as text, with a button that opens it in a new tab. Nothing is
// embedded and nothing a person typed is rendered as HTML (React escapes it);
// a link is only made clickable if it passes the allow-list again here, so even
// a bad row in the database cannot become a `javascript:` link.
export function SafeLink({ link, label = "Open link", testId }: { link: string; label?: string; testId?: string }) {
  const v = validateLink(link);
  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      <span className="font-mono text-xs text-ink-secondary truncate" data-testid={testId}>
        {link}
      </span>
      {v.ok && (
        <a
          href={v.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1 rounded-full border border-[var(--border-strong)] px-2.5 py-0.5 text-xs hover:bg-accent-soft hover:text-cat-ink"
        >
          {label}
          <ExternalLink size={11} aria-hidden />
        </a>
      )}
    </span>
  );
}

// Suggest a track by link, and see what happened to your earlier suggestions.
export default function Suggestions({ mine }: { mine: readonly MySuggestion[] }) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [link, setLink] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<MusicReason | null>(null);
  const [thanks, setThanks] = useState(false);
  const [pending, setPending] = useState(false);
  const waiting = mine.filter((s) => s.status === "pending").length;

  // Dev only: the live tests send inputs the form would never produce.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as { __fyMusicTools?: Record<string, unknown> };
    w.__fyMusicTools = { ...w.__fyMusicTools, suggestions: { suggestTrack, withdrawSuggestion } };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setThanks(false);
    const r: SuggestResult | undefined | null = await suggestTrack({ title, artist, link, reason });
    setPending(false);
    if (!r) return setError("unauthenticated");
    if (!r.ok) return setError(r.reason);
    setThanks(true);
    setTitle("");
    setArtist("");
    setLink("");
    setReason("");
  }

  const field = "mt-1 rounded border border-[var(--border-strong)] bg-bg-elevated px-2 py-1.5 text-sm text-ink-primary";

  return (
    <section aria-label="Suggest a track" className="plate py-4 flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg">Suggest a track</h2>
        <p className="text-xs text-ink-secondary">
          {waiting} of {MAX_PENDING_SUGGESTIONS} waiting for review
        </p>
      </div>
      <p className="text-sm text-ink-secondary">
        Know something that suits this place? Send a YouTube or Spotify link. It is reviewed by hand and may join the community picks.
      </p>

      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col text-xs font-ui text-ink-secondary">
          Title
          <input data-testid="sug-title" value={title} maxLength={MAX_TITLE + 20} onChange={(e) => setTitle(e.target.value)} className={field} />
        </label>
        <label className="flex flex-col text-xs font-ui text-ink-secondary">
          Artist (optional)
          <input data-testid="sug-artist" value={artist} maxLength={MAX_ARTIST + 20} onChange={(e) => setArtist(e.target.value)} className={field} />
        </label>
        <label className="flex flex-col text-xs font-ui text-ink-secondary sm:col-span-2">
          Link (YouTube or Spotify)
          <input
            data-testid="sug-link"
            value={link}
            inputMode="url"
            autoComplete="off"
            placeholder="https://"
            onChange={(e) => setLink(e.target.value)}
            className={field}
          />
        </label>
        <label className="flex flex-col text-xs font-ui text-ink-secondary sm:col-span-2">
          Why does it fit? (optional)
          <textarea
            data-testid="sug-reason"
            value={reason}
            rows={2}
            maxLength={MAX_REASON + 100}
            onChange={(e) => setReason(e.target.value)}
            className={field}
          />
        </label>
        <div className="sm:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            data-testid="sug-submit"
            disabled={pending}
            className="rounded-full bg-accent text-cat-ink px-5 py-2 text-sm font-medium shadow-glow hover:bg-accent-soft disabled:opacity-60"
          >
            Send suggestion
          </button>
          {thanks && (
            <p role="status" data-testid="sug-thanks" className="text-sm text-ink-secondary">
              Thank you! Your suggestion was sent and will be reviewed.
            </p>
          )}
          {error && (
            <p role="alert" data-testid="sug-error" data-reason={error} className="text-sm text-danger">
              {REASON_TEXT[error]}
            </p>
          )}
        </div>
      </form>

      {mine.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="font-ui text-sm font-medium">Your suggestions</h3>
          <ul className="flex flex-col gap-2">
            {mine.map((s) => (
              <MyRow key={s.id} s={s} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function MyRow({ s }: { s: MySuggestion }) {
  const [error, setError] = useState<MusicReason | null>(null);
  const [pending, setPending] = useState(false);

  async function withdraw() {
    setPending(true);
    setError(null);
    const r = await withdrawSuggestion({ id: s.id });
    setPending(false);
    if (!r) return setError("unauthenticated");
    if (!r.ok) setError(r.reason);
  }

  return (
    <li
      data-testid="my-suggestion"
      data-status={s.status}
      className="rounded-lg bg-glass-card border border-[var(--border)] p-3 shadow-card flex flex-col gap-1.5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-ui font-medium text-sm flex-1 min-w-0 truncate">
          {s.title}
          {s.artist && <span className="font-normal text-ink-secondary"> · {s.artist}</span>}
        </p>
        <span data-testid="my-suggestion-status" className="text-xs rounded-full bg-bg-alt px-2.5 py-0.5">
          {STATUS_TEXT[s.status]}
        </span>
        {s.status === "pending" && (
          <button
            type="button"
            disabled={pending}
            onClick={withdraw}
            className="rounded-full border border-[var(--border-strong)] px-3 py-0.5 text-xs hover:bg-accent-soft hover:text-cat-ink"
          >
            Withdraw
          </button>
        )}
      </div>
      <SafeLink link={s.link} />
      {s.reason && <p className="text-xs text-ink-secondary whitespace-pre-line">{s.reason}</p>}
      {error && (
        <p role="alert" data-testid="my-suggestion-error" data-reason={error} className="text-xs text-danger">
          {REASON_TEXT[error]}
        </p>
      )}
    </li>
  );
}
