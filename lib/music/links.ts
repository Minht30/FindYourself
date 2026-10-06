import { MAX_LINK, type MusicReason } from "./limits";

// Links in suggestions and community picks. Nothing is embedded or fetched:
// a link is stored and later shown as text with a button that opens it in a new
// tab. Even so only a short allow-list of music sites is accepted, over https,
// and the check parses the address like a browser does, so look-alikes fail:
//   https://youtube.com@evil.com      the real host is evil.com
//   https://youtube.com.evil.com      a subdomain of evil.com
//   https://evilyoutube.com           another site
//   http:// / javascript: / data:     not https
// The database re-checks the stored (canonical) form with the same allow-list.

export const ALLOWED_HOSTS: readonly string[] = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "open.spotify.com",
  "spotify.link",
];

export type LinkReason = Extract<
  MusicReason,
  "link_malformed" | "link_not_https" | "link_host_not_allowed" | "link_has_credentials" | "link_too_long"
>;
export type LinkResult = { ok: true; url: string; host: string } | { ok: false; reason: LinkReason };

// eslint-disable-next-line no-control-regex
const WHITESPACE_OR_CONTROL = new RegExp("[\\s\\u0000-\\u001f\\u007f-\\u009f\\u200b-\\u200f\\u202a-\\u202e\\u2066-\\u2069\\ufeff]");

// Returns the canonical address (what the URL parser makes of it) or the one
// reason it was refused.
export function validateLink(input: unknown): LinkResult {
  if (typeof input !== "string") return { ok: false, reason: "link_malformed" };
  const raw = input.trim();
  if (raw.length === 0) return { ok: false, reason: "link_malformed" };
  if (raw.length > MAX_LINK) return { ok: false, reason: "link_too_long" };
  if (WHITESPACE_OR_CONTROL.test(raw)) return { ok: false, reason: "link_malformed" };

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "link_malformed" }; // no scheme ("youtube.com/x"), "//youtube.com", garbage
  }
  if (url.protocol !== "https:") return { ok: false, reason: "link_not_https" };
  if (url.username !== "" || url.password !== "") return { ok: false, reason: "link_has_credentials" };
  // an explicit port is not a legitimate music link; refuse it with the host reason
  if (url.port !== "" || !ALLOWED_HOSTS.includes(url.hostname)) return { ok: false, reason: "link_host_not_allowed" };

  const href = url.href;
  if (href.length > MAX_LINK) return { ok: false, reason: "link_too_long" };
  return { ok: true, url: href, host: url.hostname };
}
