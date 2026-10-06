"use client";

import { useState, useTransition } from "react";
import { deleteAccount } from "@/app/(app)/settings/account-actions";
import { DELETE_MESSAGES, DELETE_PHRASE, confirmationOk, type DeleteReason } from "@/lib/accountDeletion";

// Two steps: open the panel, then type the word on purpose. After it succeeds
// the data kept on this device (sound mix, queue, drafts...) is cleared too.
export default function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [reason, setReason] = useState<DeleteReason | null>(null);
  const [pending, start] = useTransition();

  function confirm() {
    setReason(null);
    start(async () => {
      const res = await deleteAccount(typed);
      // A request that gets no answer (signed out in another tab) has no result.
      if (!res) return setReason("unauthenticated");
      if (!res.ok) return setReason(res.reason);
      try {
        for (const key of Object.keys(localStorage)) if (key.startsWith("fy-")) localStorage.removeItem(key);
      } catch {
        // storage unavailable: nothing to clear
      }
      window.location.assign("/?deleted=1");
    });
  }

  return (
    <div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-4 py-2 rounded-full border border-[var(--danger)] text-[var(--danger)] font-ui font-semibold hover:bg-[var(--danger)] hover:text-white transition"
        >
          Delete my account…
        </button>
      ) : (
        <div data-delete-account-panel className="rounded-xl border border-[var(--danger)] p-4 font-ui text-[14px] text-ink-secondary">
          <p className="text-ink-primary font-semibold">This cannot be undone.</p>
          <p className="mt-1">Deleting your account permanently removes:</p>
          <ul className="list-disc pl-5 mt-1 space-y-0.5">
            <li>your diary, tasks, timetable blocks, categories and focus history,</li>
            <li>your profile, streak and settings, and your saved sound mix,</li>
            <li>your uploaded music files, playlists and track suggestions.</li>
          </ul>
          <p className="mt-2">
            Community picks that were approved earlier stay (they never carried your name). Copies in the hosting
            provider&apos;s routine backups can linger briefly. Data kept in this browser is cleared too.
          </p>
          <label className="mt-3 block">
            Type <strong className="text-ink-primary">{DELETE_PHRASE}</strong> to confirm
            <input
              aria-label={`Type ${DELETE_PHRASE} to confirm`}
              value={typed}
              onChange={(e) => {
                setTyped(e.target.value);
                setReason(null);
              }}
              autoComplete="off"
              spellCheck={false}
              className="mt-1 block w-full max-w-xs rounded-md border border-[var(--border-strong)] bg-bg-elevated px-2 py-1.5 text-ink-primary font-mono"
            />
          </label>
          {reason ? (
            <p role="alert" data-reason={reason} className="mt-2 text-[var(--danger)]">
              {DELETE_MESSAGES[reason]}
            </p>
          ) : null}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={!confirmationOk(typed) || pending}
              onClick={confirm}
              className="px-4 py-2 rounded-full bg-[var(--danger)] text-white font-semibold disabled:opacity-40"
            >
              {pending ? "Deleting…" : "Delete everything"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setTyped("");
                setReason(null);
              }}
              className="px-4 py-2 rounded-full border border-[var(--border-strong)] text-ink-primary"
            >
              Keep my account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
