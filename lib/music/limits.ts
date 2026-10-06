// The music library's hard limits (Minh, 2026-10-05). The same numbers are
// enforced three times: here (client + server action), in the `music_tracks`
// trigger, and by the storage bucket / policies. Change them in all places.

export const MAX_TRACKS = 10;
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per file
export const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB per user in total
export const MAX_DURATION_SECONDS = 7200;
export const MAX_TITLE = 120;
export const MAX_ARTIST = 120;
export const MP3_MIME = "audio/mpeg";

// Every refusal in the music library names its reason, so a test (or a person)
// can tell *why* something was refused, not only that it was.
export type MusicReason =
  | "unauthenticated"
  | "library_full" // already 10 tracks
  | "too_big" // one file over 10 MB
  | "quota_exceeded" // adding it would pass 50 MB in total
  | "not_mp3" // wrong type, or the bytes are not an MP3
  | "bad_size" // zero, negative or not a number
  | "bad_duration"
  | "bad_title"
  | "bad_artist"
  | "bad_id"
  | "not_found"
  | "not_uploaded" // finalize found no object in storage
  | "size_mismatch" // the stored object is not the size the client claimed
  | "upload_failed"
  | "db_error";

export const REASON_TEXT: Record<MusicReason, string> = {
  unauthenticated: "Sign in again to use your music library.",
  library_full: `Your library is full (${MAX_TRACKS} tracks). Delete one to add another.`,
  too_big: "That file is over 10 MB.",
  quota_exceeded: "Adding that would take your library over 50 MB in total.",
  not_mp3: "Only MP3 files are accepted, and that file is not a valid MP3.",
  bad_size: "That file looks empty.",
  bad_duration: "Could not read how long that track is, so it was not added.",
  bad_title: "A title needs 1 to 120 characters.",
  bad_artist: "An artist can be up to 120 characters.",
  bad_id: "That track could not be identified.",
  not_found: "That track no longer exists.",
  not_uploaded: "The upload did not arrive, please try again.",
  size_mismatch: "The uploaded file is not the size it claimed to be, so it was removed.",
  upload_failed: "The upload failed, please try again.",
  db_error: "Something went wrong saving that, please try again.",
};
