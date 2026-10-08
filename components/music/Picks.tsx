"use client";

import { useEffect, useState } from "react";
import { removePick, reviewSuggestion, type AdminResult } from "@/app/(app)/chill/admin-actions";
import { MAX_NOTE, REASON_TEXT, type MusicReason } from "@/lib/music/limits";
import { SafeLink } from "./Suggestions";

export type CommunityPick = { id: string; title: string; artist: string; link: string; note: string };
export type PendingSuggestion = { id: string; title: string; artist: string; link: string; reason: string; created_at: string };

const reasonOf = (r: AdminResult | undefined | null): MusicReason | null => (!r ? "unauthenticated" : r.ok ? null : r.reason);

// What the community has picked: a list of links, readable by everyone who is
// signed in. An admin also gets a Remove button.
export function CommunityPicks({ picks, isAdmin }: { picks: readonly CommunityPick[]; isAdmin: boolean }) {
  // Dev only: the live tests call the review action as a non-admin, which the page never renders.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as { __fyMusicTools?: Record<string, unknown> };
    w.__fyMusicTools = { ...w.__fyMusicTools, admin: { reviewSuggestion, removePick } };
  }, []);

  return (
    <section aria-label="Community picks" className="flex flex-col gap-3">
      <h2 className="font-display text-lg">Community picks</h2>
      {picks.length === 0 ? (
        <p className="text-sm text-ink-secondary">No picks yet. Suggestions that are approved show up here.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {picks.map((p) => (
            <PickRow key={p.id} pick={p} isAdmin={isAdmin} />
          ))}
        </ul>
      )}
    </section>
  );
}

function PickRow({ pick, isAdmin }: { pick: CommunityPick; isAdmin: boolean }) {
  const [error, setError] = useState<MusicReason | null>(null);
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);
    setError(null);
    const r: AdminResult | undefined | null = await removePick({ id: pick.id });
    setPending(false);
    setError(reasonOf(r));
  }

  return (
    <li data-testid="community-pick" className="rounded-lg bg-bg-elevated border border-[var(--border)] p-3 shadow-card flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-ui font-medium text-sm flex-1 min-w-0 truncate">
          {pick.title}
          {pick.artist && <span className="font-normal text-ink-secondary"> · {pick.artist}</span>}
        </p>
        {isAdmin && (
          <button
            type="button"
            disabled={pending}
            onClick={remove}
            aria-label={`Remove ${pick.title} from the community picks`}
            className="rounded-full border border-[var(--border-strong)] px-3 py-0.5 text-xs hover:bg-accent-soft hover:text-cat-ink"
          >
            Remove
          </button>
        )}
      </div>
      <SafeLink link={pick.link} label="Listen" />
      {pick.note && <p className="text-xs text-ink-secondary whitespace-pre-line">{pick.note}</p>}
      {error && (
        <p role="alert" data-testid="pick-error" data-reason={error} className="text-xs text-danger">
          {REASON_TEXT[error]}
        </p>
      )}
    </li>
  );
}

// Only ever rendered for an admin (the page does not even fetch the pending
// suggestions of other people for anyone else, and RLS would refuse them).
export function AdminReview({ pending }: { pending: readonly PendingSuggestion[] }) {
  return (
    <section aria-label="Review suggestions" data-testid="admin-review" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-lg">Review suggestions</h2>
        <p className="text-xs text-ink-secondary">Admin only · {pending.length} waiting</p>
      </div>
      {pending.length === 0 ? (
        <p className="text-sm text-ink-secondary">Nothing waiting for review.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {pending.map((s) => (
            <ReviewRow key={s.id} s={s} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ReviewRow({ s }: { s: PendingSuggestion }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<MusicReason | null>(null);
  const [pending, setPending] = useState(false);

  async function review(action: "approve" | "reject") {
    setPending(true);
    setError(null);
    const r: AdminResult | undefined | null = await reviewSuggestion({ id: s.id, action, note });
    setPending(false);
    setError(reasonOf(r));
  }

  return (
    <li data-testid="review-row" className="rounded-lg bg-bg-elevated border border-[var(--border)] p-3 shadow-card flex flex-col gap-2">
      <p className="font-ui font-medium text-sm">
        {s.title}
        {s.artist && <span className="font-normal text-ink-secondary"> · {s.artist}</span>}
      </p>
      <SafeLink link={s.link} label="Open to check" />
      {s.reason && <p className="text-xs text-ink-secondary whitespace-pre-line">{s.reason}</p>}
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col text-xs font-ui text-ink-secondary flex-1 min-w-[10rem]">
          Note for the pick (optional)
          <input
            data-testid="review-note"
            value={note}
            maxLength={MAX_NOTE + 100}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 rounded border border-[var(--border-strong)] bg-bg-elevated px-2 py-1.5 text-sm text-ink-primary"
          />
        </label>
        <button
          type="button"
          data-testid="review-approve"
          disabled={pending}
          onClick={() => review("approve")}
          className="rounded-full bg-accent text-cat-ink px-4 py-1.5 text-sm font-medium"
        >
          Approve
        </button>
        <button
          type="button"
          data-testid="review-reject"
          disabled={pending}
          onClick={() => review("reject")}
          className="rounded-full border border-[var(--border-strong)] px-4 py-1.5 text-sm hover:bg-accent-soft hover:text-cat-ink"
        >
          Reject
        </button>
      </div>
      {error && (
        <p role="alert" data-testid="review-error" data-reason={error} className="text-xs text-danger">
          {REASON_TEXT[error]}
        </p>
      )}
    </li>
  );
}
