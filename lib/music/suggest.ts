import { cleanText } from "./filename";
import { MAX_ARTIST, MAX_REASON, MAX_TITLE, type MusicReason } from "./limits";
import { validateLink } from "./links";

export type Suggestion = { title: string; artist: string; link: string; reason: string };
export type SuggestionResult = { ok: true; value: Suggestion } | { ok: false; reason: MusicReason };

// A free-text field that may contain line breaks (a reason): control characters
// other than newlines are removed, runs of blank lines collapse, edges are trimmed.
function cleanMultiline(input: unknown): string {
  if (typeof input !== "string") return "";
  return (
    input
      .normalize("NFC")
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿]/g, "")
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

// Every field is checked and each refusal names its reason; the first problem
// wins, in the order the form shows the fields.
export function validateSuggestion(input: unknown): SuggestionResult {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;

  const title = cleanText(o.title);
  if (title.length < 1 || title.length > MAX_TITLE) return { ok: false, reason: "bad_title" };

  if (o.artist !== undefined && o.artist !== null && typeof o.artist !== "string") return { ok: false, reason: "bad_artist" };
  const artist = cleanText(o.artist ?? "");
  if (artist.length > MAX_ARTIST) return { ok: false, reason: "bad_artist" };

  const link = validateLink(o.link);
  if (!link.ok) return { ok: false, reason: link.reason };

  if (o.reason !== undefined && o.reason !== null && typeof o.reason !== "string") return { ok: false, reason: "bad_reason" };
  const reason = cleanMultiline(o.reason ?? "");
  if (reason.length > MAX_REASON) return { ok: false, reason: "bad_reason" };

  return { ok: true, value: { title, artist, link: link.url, reason } };
}
