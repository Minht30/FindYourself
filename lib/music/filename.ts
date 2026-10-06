import { MAX_ARTIST, MAX_TITLE } from "./limits";

// Control characters (incl. newlines) and the bidi override family. Written as
// an escape so the source stays readable.
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿]/g;

// Cleans text a person typed (or a file name) for display: no control or
// direction-override characters, one space between words, trimmed. Everything
// is rendered as plain text by React, so this is tidiness, not the XSS defence.
export function cleanText(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.normalize("NFC").replace(CONTROL, " ").replace(/\s+/g, " ").trim();
}

// "my_song-01 (live).MP3" -> "my song-01 (live)". The title defaults to this.
export function titleFromFilename(name: unknown): string {
  const base = cleanText(name).replace(/^.*[\\/]/, "").replace(/\.mp3$/i, "");
  const spaced = cleanText(base.replace(/_+/g, " "));
  return spaced.slice(0, MAX_TITLE).trim() || "Untitled";
}

export type TextResult = { ok: true; value: string } | { ok: false; reason: "bad_title" | "bad_artist" };

// A track title: 1 to 120 characters after cleaning.
export function validateTitle(input: unknown): TextResult {
  const v = cleanText(input);
  return v.length >= 1 && v.length <= MAX_TITLE ? { ok: true, value: v } : { ok: false, reason: "bad_title" };
}

// An artist: optional, up to 120 characters after cleaning.
export function validateArtist(input: unknown): TextResult {
  if (input === undefined || input === null) return { ok: true, value: "" };
  if (typeof input !== "string") return { ok: false, reason: "bad_artist" };
  const v = cleanText(input);
  return v.length <= MAX_ARTIST ? { ok: true, value: v } : { ok: false, reason: "bad_artist" };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

// Where a track lives in the private bucket: `{user}/{track}.mp3`, both
// generated ids, never anything the user typed. The database re-checks this.
export function storagePath(userId: string, trackId: string): string {
  return `${userId}/${trackId}.mp3`;
}
