import type { JSONContent } from "@tiptap/react";

// Per-device safety net for the diary. Every save attempt first writes the
// doc here; a confirmed save clears it. If a save never lands (network drop,
// signed out, a deploy replacing the server mid-session), the words survive
// a reload and are restored on the next visit to that day.
//
// `baseText` is the saved entry's content_text the draft was built on. On
// restore we compare against the server's current text:
//   draft.text === server  → the save actually landed; drop the draft.
//   draft.baseText === server → draft is strictly newer; restore silently.
//   otherwise → the entry changed elsewhere too; the user decides.

export type DiaryDraft = { json: JSONContent; text: string; baseText: string; at: number };

const key = (date: string) => `fy-diary-draft:${date}`;

export function readDraft(date: string): DiaryDraft | null {
  try {
    const raw = localStorage.getItem(key(date));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DiaryDraft;
    return parsed?.json?.type === "doc" && typeof parsed.text === "string" && typeof parsed.baseText === "string"
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export function writeDraft(date: string, draft: DiaryDraft): void {
  try {
    localStorage.setItem(key(date), JSON.stringify(draft));
  } catch {
    // Storage full or blocked (private mode): the server save still runs.
  }
}

export function clearDraft(date: string): void {
  try {
    localStorage.removeItem(key(date));
  } catch {}
}
