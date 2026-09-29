"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { saveDiaryEntry } from "@/app/(app)/diary/actions";
import PromptChips from "@/components/diary/PromptChips";

const AUTOSAVE_MS = 3000;

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

type Props = {
  date: string;
  initialContent: JSONContent | null;
  placeholder: string;
  timeZone: string;
  initialUpdatedAt: string | null;
};

// Mounted once per day: the page keys it by date, so stepping days gives a
// fresh editor (and the unmount flush below saves the day you're leaving).
export default function DiaryEditor({ date, initialContent, placeholder, timeZone, initialUpdatedAt }: Props) {
  const [status, setStatus] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(initialUpdatedAt);

  const editorRef = useRef<Editor | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  const mounted = useRef(true);
  // Saves run strictly one after another so an older snapshot can never land
  // after a newer one.
  const chain = useRef<Promise<void>>(Promise.resolve());
  const version = useRef(0);

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const ed = editorRef.current;
    if (!dirty.current || !ed || ed.isDestroyed) return;

    // Snapshot now, synchronously: on unmount the editor is about to go away.
    const payload = {
      date,
      contentJson: ed.getJSON(),
      contentText: ed.getText({ blockSeparator: "\n\n" }).trim(),
    };
    dirty.current = false;
    const mine = ++version.current;
    if (mounted.current) setStatus("saving");

    chain.current = chain.current.then(async () => {
      const res = await saveDiaryEntry(payload).catch(
        (e: unknown) => ({ ok: false, error: String(e) }) as const
      );
      if (!mounted.current) return;
      if (!res.ok) {
        dirty.current = true;
        setStatus("error");
        return;
      }
      // Only the newest save gets to announce "Saved"; if the user typed
      // during the request, the pending debounce owns the status.
      if (mine === version.current && !dirty.current) {
        setStatus("saved");
        setSavedAt(res.updatedAt);
      }
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
      setStatus("dirty");
      schedule();
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Leave nothing behind: save on unmount (day change / route change) and
  // when the tab is hidden; warn before a hard unload with unsaved words.
  useEffect(() => {
    mounted.current = true;
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        flush();
        e.preventDefault();
        e.returnValue = "";
      }
    };
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

  return (
    <div className="space-y-3" onKeyDown={onKeyDown}>
      <PromptChips editor={editor} />
      <div className="border-t border-dashed border-[var(--border-strong)]" aria-hidden />
      {editor ? (
        <EditorContent editor={editor} />
      ) : (
        // Same footprint as the editor so the card doesn't jump on hydrate.
        <div className="min-h-[280px]" aria-hidden />
      )}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--border)] font-ui text-xs text-ink-muted">
        <span>
          <kbd className="font-mono border border-[var(--border)] px-1 rounded">#</kbd> heading ·{" "}
          <kbd className="font-mono border border-[var(--border)] px-1 rounded">-</kbd> list ·{" "}
          <kbd className="font-mono border border-[var(--border)] px-1 rounded">&gt;</kbd> quote
        </span>
        <SaveStatus status={status} savedAt={savedAt} timeZone={timeZone} onRetry={flush} />
      </div>
    </div>
  );
}

function SaveStatus({
  status,
  savedAt,
  timeZone,
  onRetry,
}: {
  status: SaveState;
  savedAt: string | null;
  timeZone: string;
  onRetry: () => void;
}) {
  const time = savedAt
    ? new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone }).format(new Date(savedAt))
    : null;

  return (
    <span aria-live="polite" className="flex items-center gap-2 font-mono">
      {status === "dirty" && "Unsaved changes"}
      {status === "saving" && "Saving…"}
      {status === "saved" && `Saved ${time ?? ""}`.trim()}
      {status === "idle" && time && `Last saved ${time}`}
      {status === "error" && (
        <>
          <span className="text-[var(--danger)]">Couldn&apos;t save</span>
          <button
            type="button"
            onClick={onRetry}
            className="px-2 py-0.5 rounded-full border border-accent/60 text-ink-primary hover:bg-accent-soft hover:text-cat-ink transition"
          >
            Retry
          </button>
        </>
      )}
    </span>
  );
}
