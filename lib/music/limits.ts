// The music library's hard limits (Minh, 2026-10-05). The same numbers are
// enforced three times: here (client + server action), in the `music_tracks`
// trigger, and by the storage bucket / policies. Change them in all places.

export const MAX_TRACKS = 10;
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per file
export const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB per user in total
export const MAX_DURATION_SECONDS = 7200;
export const MAX_TITLE = 120;
export const MAX_ARTIST = 120;
export const MAX_PLAYLISTS = 20;
export const MAX_PLAYLIST_NAME = 60;
export const MAX_LINK = 500;
export const MAX_REASON = 500;
export const MAX_PENDING_SUGGESTIONS = 5;
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
  | "bad_name" // a playlist name needs 1 to 60 characters
  | "playlist_limit" // already 20 playlists
  | "already_in_playlist"
  | "bad_order" // a reorder that is not exactly the playlist's own tracks
  | "bad_reason" // a suggestion's reason is over 500 characters
  | "too_many_pending" // already 5 suggestions waiting for review
  | "link_malformed" // not a link at all
  | "link_not_https"
  | "link_host_not_allowed" // not YouTube or Spotify
  | "link_has_credentials" // user:password@ or the youtube.com@evil.com trick
  | "link_too_long"
  | "not_admin"
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
  bad_name: "A playlist name needs 1 to 60 characters.",
  playlist_limit: "You have 20 playlists, the most there can be. Delete one to make another.",
  already_in_playlist: "That track is already in this playlist.",
  bad_order: "That order does not match the playlist, so nothing was changed.",
  bad_reason: "The reason can be up to 500 characters.",
  too_many_pending: "You already have 5 suggestions waiting for review. Wait for one to be reviewed, or withdraw one.",
  link_malformed: "That does not look like a link. Paste the full address, starting with https://.",
  link_not_https: "The link must start with https://.",
  link_host_not_allowed: "Only YouTube and Spotify links are accepted.",
  link_has_credentials: "That link contains a user name or password part, so it was not accepted.",
  link_too_long: "That link is too long (500 characters at most).",
  not_admin: "Only an admin can do that.",
  db_error: "Something went wrong saving that, please try again.",
};
