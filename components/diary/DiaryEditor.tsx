"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { saveDiaryEntry } from "@/app/(app)/diary/actions";
import PromptChips from "@/components/diary/PromptChips";
import { clearDraft, readDraft, writeDraft, type DiaryDraft } from "@/lib/diaryDraft";

const AUTOSAVE_MS = 3000;
// Backoff for automatic retries after a failed save (seconds, last repeats).
const RETRY_DELAYS_S = [5, 15, 30, 60];

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

// A save can fail two ways. The action can *answer* with a reason (signed
// out, invalid date…), or the call can *throw* before an answer arrives
// (offline, or the tab is talking to a deployment that has since been
// replaced). Only the second is fixed by reloading, and the local draft makes
// reloading safe.
type SaveError = { message: string; canReload: boolean };

const ERROR_COPY: Record<string, string> = {
  unauthenticated: "Signed out. Sign in again; your words are kept on this device.",
  future_date: "Can't save a day that hasn't happened yet.",
  too_large: "This entry is too long to save.",
};

type Props = {
  date: string;
  initialContent: JSONContent | null;
  initialText: string;
  placeholder: string;
  timeZone: string;
  initialUpdatedAt: string | null;
};

// Mounted once per day: the page keys it by date, so stepping days gives a
// fresh editor (and the unmount flush below saves the day you're leaving).
export default function DiaryEditor({
  date,
  initialContent,
  initialText,
  placeholder,
  timeZone,
  initialUpdatedAt,
}: Props) {
  const [status, setStatus] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(initialUpdatedAt);
  const [saveError, setSaveError] = useState<SaveError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [conflict, setConflict] = useState<DiaryDraft | null>(null);

  const editorRef = useRef<Editor | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  const mounted = useRef(true);
  // Saves run strictly one after another so an older snapshot can never land
  // after a newer one.
  const chain = useRef<Promise<void>>(Promise.resolve());
  const version = useRef(0);
  const attempts = useRef(0);
  // content_text the server holds right now, as far as this tab knows.
  const baseText = useRef(initialText);

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const ed = editorRef.current;
    if (!dirty.current || !ed || ed.isDestroyed) return;

    // Snapshot now, synchronously: on unmount the editor is about to go away.
    const doc = ed.getJSON();
    const payload = {
      date,
      // Stringified on purpose: see SaveDiaryInput in the action.
      contentJson: JSON.stringify(doc),
      contentText: ed.getText({ blockSeparator: "\n\n" }).trim(),
    };
    // Local copy first, so the words outlive this request whatever happens.
    writeDraft(date, {
      json: doc,
      text: payload.contentText,
      baseText: baseText.current,
      at: Date.now(),
    });
    dirty.current = false;
    const mine = ++version.current;
    if (mounted.current) setStatus("saving");

    chain.current = chain.current.then(async () => {
      let err: SaveError | null = null;
      let updatedAt = "";
      try {
        const res = await saveDiaryEntry(payload);
        if (res.ok) updatedAt = res.updatedAt;
        else err = { message: ERROR_COPY[res.error] ?? `Couldn't save (${res.error}).`, canReload: false };
      } catch (e) {
        console.warn("[diary] save request failed", e);
        err = { message: "Couldn't reach the server.", canReload: true };
      }

      if (!err) {
        attempts.current = 0;
        baseText.current = payload.contentText;
        // Clear the local copy only when nothing newer is waiting, and do it
        // even after unmount (the day-change flush lands here).
        if (mine === version.current && !dirty.current) clearDraft(date);
        if (!mounted.current) return;
        setSaveError(null);
        if (mine === version.current && !dirty.current) {
          setStatus("saved");
          setSavedAt(updatedAt);
        }
        return;
      }

      if (!mounted.current) return;
      dirty.current = true;
      setStatus("error");
      setSaveError(err);
      // Keep trying in the background; typing reschedules sooner anyway.
      const delay = RETRY_DELAYS_S[Math.min(attempts.current, RETRY_DELAYS_S.length - 1)];
      attempts.current += 1;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay * 1000);
    });
  }, [date]);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, AUTOSAVE_MS);
  }, [flush]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialContent ?? "",
    // Next.js SSR: build the editor on the client only, avoiding hydration mismatches.
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class: "diary-prose min-h-[280px] focus:outline-none",
        "aria-label": "Diary entry",
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    onUpdate: () => {
      dirty.current = true;
      setStatus((s) => (s === "error" ? s : "dirty"));
      schedule();
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Unsaved words from an earlier visit on this device? If the saved entry
  // hasn't changed since, the draft is simply newer: restore it (setContent
  // emits an update, which queues the normal autosave). Otherwise ask.
  useEffect(() => {
    if (!editor) return;
    const draft = readDraft(date);
    if (!draft) return;
    if (draft.text === initialText) {
      clearDraft(date);
    } else if (draft.baseText === initialText) {
      editor.commands.setContent(draft.json);
      setNotice("Restored unsaved words from this device.");
    } else {
      setConflict(draft);
    }
    // Run once per mounted editor; initialText is fixed for this mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, date]);

  function restoreConflict() {
    if (!editor || !conflict) return;
    editor.commands.setContent(conflict.json);
    setConflict(null);
    setNotice("Restored unsaved words from this device.");
  }
  function discardConflict() {
    clearDraft(date);
    setConflict(null);
  }

  // Leave nothing behind: save on unmount (day change / route change), when
  // the tab is hidden, and on unload. No "leave site?" prompt: flush() writes
  // the local draft synchronously, so a request cut off by the unload is
  // restored and re-saved on the next visit.
  useEffect(() => {
    mounted.current = true;
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const onBeforeUnload = () => flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      flush();
      mounted.current = false;
    };
  }, [flush]);

  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      flush();
    }
  }

  function retryNow() {
    attempts.current = 0;
    dirty.current = true;
    flush();
  }

  return (
    <div className="space-y-3" onKeyDown={onKeyDown}>
      <PromptChips editor={editor} />
      <div className="border-t border-dashed border-[var(--border-strong)]" aria-hidden />

      {conflict && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-2 rounded-xl border border-accent/60 bg-accent-soft/40 px-3 py-2 font-ui text-sm text-ink-primary"
        >
          <span>This device has unsaved words for this day that differ from the saved entry.</span>
          <span className="flex gap-2 ml-auto">
            <button type="button" onClick={restoreConflict} className="px-2.5 py-0.5 rounded-full border border-accent bg-accent-soft text-cat-ink">
              Restore them
            </button>
            <button type="button" onClick={discardConflict} className="px-2.5 py-0.5 rounded-full border border-[var(--border-strong)] text-ink-secondary hover:text-ink-primary">
              Discard
            </button>
          </span>
        </div>
      )}
      {notice && !conflict && (
        <p role="status" className="font-ui text-xs text-ink-muted">
          {notice}
        </p>
      )}

      {editor ? (
        <EditorContent editor={editor} />
      ) : (
        // Same footprint as the editor so the card doesn't jump on hydrate.
        <div className="min-h-[280px]" aria-hidden />
      )}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--border)] font-ui text-xs text-ink-muted">
        <span className="hidden sm:inline">
          <kbd className="font-mono border border-[var(--border)] px-1 rounded">#</kbd> heading ·{" "}
          <kbd className="font-mono border border-[var(--border)] px-1 rounded">-</kbd> list ·{" "}
          <kbd className="font-mono border border-[var(--border)] px-1 rounded">&gt;</kbd> quote
        </span>
        <SaveStatus
          status={status}
          savedAt={savedAt}
          timeZone={timeZone}
          error={saveError}
          onRetry={retryNow}
        />
      </div>
    </div>
  );
}

function SaveStatus({
  status,
  savedAt,
  timeZone,
  error,
  onRetry,
}: {
  status: SaveState;
  savedAt: string | null;
  timeZone: string;
  error: SaveError | null;
  onRetry: () => void;
}) {
  const time = savedAt
    ? new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone }).format(new Date(savedAt))
    : null;
  const pill =
    "px-2 py-0.5 rounded-full border border-accent/60 text-ink-primary hover:bg-accent-soft hover:text-cat-ink transition";

  return (
    <span aria-live="polite" className="ml-auto flex flex-wrap items-center justify-end gap-2 font-mono">
      {status === "dirty" && "Unsaved changes"}
      {status === "saving" && "Saving…"}
      {status === "saved" && `Saved ${time ?? ""}`.trim()}
      {status === "idle" && time && `Last saved ${time}`}
      {status === "error" && (
        <>
          <span className="text-[var(--danger)]">{error?.message ?? "Couldn't save."}</span>
          <span className="text-ink-muted">Kept on this device, retrying.</span>
          <button type="button" onClick={onRetry} className={pill}>
            Retry
          </button>
          {error?.canReload && (
            <button type="button" onClick={() => window.location.reload()} className={pill}>
              Reload
            </button>
          )}
        </>
      )}
    </span>
  );
}
