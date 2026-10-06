import { MAX_FILE_BYTES, MAX_TOTAL_BYTES, MAX_TRACKS, MP3_MIME, type MusicReason } from "./limits";

export type Usage = { count: number; totalBytes: number };

// Can a file of `size` bytes be added to a library that already holds `usage`?
// Order matters and is part of the contract (tests pin it): a file that is
// wrong in itself is refused for that, whatever the library looks like.
export function checkQuota(usage: Usage, size: unknown, mime?: unknown): MusicReason | null {
  if (typeof size !== "number" || !Number.isFinite(size) || !Number.isInteger(size) || size <= 0) return "bad_size";
  if (mime !== undefined && mime !== MP3_MIME) return "not_mp3";
  if (size > MAX_FILE_BYTES) return "too_big";
  if (usage.count >= MAX_TRACKS) return "library_full";
  if (usage.totalBytes + size > MAX_TOTAL_BYTES) return "quota_exceeded";
  return null;
}

// "5 of 10 tracks, 18.2 of 50 MB"
export function usageText(u: Usage): string {
  const mb = (u.totalBytes / (1024 * 1024)).toFixed(1);
  return `${u.count} of ${MAX_TRACKS} tracks, ${mb} of ${MAX_TOTAL_BYTES / (1024 * 1024)} MB`;
}
