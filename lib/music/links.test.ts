import { describe, expect, it } from "vitest";
import { ALLOWED_HOSTS, validateLink } from "./links";
import { validateSuggestion } from "./suggest";

// The same rule the database applies to a stored link (suggestion_link_ok).
const DB_RULE = /^https:\/\/((www\.|m\.|music\.)?youtube\.com|youtu\.be|open\.spotify\.com|spotify\.link)(\/|$)/i;
const DB_BAD_CHARS = /[\s\u0000-\u001f\u007f]/;

const GOOD = [
  "https://youtube.com/watch?v=abc",
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s",
  "https://m.youtube.com/watch?v=abc",
  "https://music.youtube.com/watch?v=abc",
  "https://youtu.be/abc",
  "https://youtu.be",
  "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC",
  "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=abc",
  "https://spotify.link/abc123",
  "https://YOUTUBE.com/x",
  "  https://youtu.be/abc  ",
];

const BAD: [string, string][] = [
  ["http://youtube.com/x", "link_not_https"],
  ["javascript:alert(1)", "link_not_https"],
  ["data:text/html,<script>alert(1)</script>", "link_not_https"],
  ["ftp://youtube.com/x", "link_not_https"],
  ["file:///etc/passwd", "link_not_https"],
  ["https://youtube.com@evil.com/x", "link_has_credentials"],
  ["https://user:pass@youtube.com/x", "link_has_credentials"],
  ["https://youtube.com:secret@youtu.be/x", "link_has_credentials"],
  ["https://youtube.com.evil.com/x", "link_host_not_allowed"],
  ["https://evilyoutube.com/x", "link_host_not_allowed"],
  ["https://youtube.comx/", "link_host_not_allowed"],
  ["https://youtu.be.evil.com", "link_host_not_allowed"],
  ["https://notyoutu.be/x", "link_host_not_allowed"],
  ["https://open.spotify.com.evil.io/", "link_host_not_allowed"],
  ["https://spotify.link.evil.com", "link_host_not_allowed"],
  ["https://sub.youtube.com/x", "link_host_not_allowed"],
  ["https://evil.com/?https://youtube.com", "link_host_not_allowed"],
  ["https://www.evil.com/youtube.com", "link_host_not_allowed"],
  ["https://youtube.com:8080/x", "link_host_not_allowed"],
  ["https://youtube.com./x", "link_host_not_allowed"],
  ["https://xn--80ak6aa92e.com/x", "link_host_not_allowed"], // a valid punycode look-alike host
  ["https://xn--youtub-8na.com/x", "link_malformed"], // an invalid punycode label: the parser itself refuses it
  ["https://youtubе.com/x", "link_host_not_allowed"], // a Cyrillic "е"
  ["https://127.0.0.1/x", "link_host_not_allowed"],
  ["https://localhost/x", "link_host_not_allowed"],
  ["//youtube.com/x", "link_malformed"],
  ["youtube.com/x", "link_malformed"],
  ["https://", "link_malformed"],
  ["not a link", "link_malformed"],
  ["", "link_malformed"],
  ["   ", "link_malformed"],
  ["https://youtube.com/a b", "link_malformed"],
  ["https://youtube.com/a\nb", "link_malformed"],
  ["https://youtube.com/a\u0000b", "link_malformed"],
  ["https://youtube.com/a‮b", "link_malformed"],
  ["https://youtu.be/" + "a".repeat(500), "link_too_long"],
];

describe("validateLink: accepted", () => {
  it.each(GOOD)("accepts %s", (raw) => {
    const r = validateLink(raw);
    expect(r.ok).toBe(true);
  });
  it("returns the canonical address and the host", () => {
    expect(validateLink("  https://YOUTUBE.com/Watch?v=A  ")).toEqual({ ok: true, url: "https://youtube.com/Watch?v=A", host: "youtube.com" });
    expect(validateLink("https://youtu.be")).toEqual({ ok: true, url: "https://youtu.be/", host: "youtu.be" });
  });
  it("every accepted link, once canonical, also passes the database's rule", () => {
    for (const raw of GOOD) {
      const r = validateLink(raw);
      if (!r.ok) throw new Error("unexpected refusal of " + raw);
      expect(DB_RULE.test(r.url)).toBe(true);
      expect(DB_BAD_CHARS.test(r.url)).toBe(false);
      expect(r.url.length).toBeLessThanOrEqual(500);
    }
  });
  it("a backslash trick resolves to youtube itself (the parser reads it as a path), so it is harmless", () => {
    const r = validateLink("https://youtube.com\\@evil.com/x");
    expect(r.ok && r.host).toBe("youtube.com");
  });
});

describe("validateLink: refused, by reason", () => {
  it.each(BAD)("refuses %j as %s", (raw, reason) => {
    expect(validateLink(raw)).toEqual({ ok: false, reason });
  });
  it("refuses anything that is not a string", () => {
    for (const v of [null, undefined, 5, {}, [], ["https://youtu.be/x"], true]) {
      expect(validateLink(v)).toEqual({ ok: false, reason: "link_malformed" });
    }
  });
  it("accepts a link of exactly 500 characters and refuses 501", () => {
    const base = "https://youtu.be/";
    expect(validateLink(base + "a".repeat(500 - base.length)).ok).toBe(true);
    expect(validateLink(base + "a".repeat(501 - base.length))).toEqual({ ok: false, reason: "link_too_long" });
  });
  it("the allow-list is exactly the documented hosts", () => {
    expect([...ALLOWED_HOSTS].sort()).toEqual(
      ["m.youtube.com", "music.youtube.com", "open.spotify.com", "spotify.link", "www.youtube.com", "youtu.be", "youtube.com"].sort(),
    );
  });
});

describe("validateSuggestion", () => {
  const base = { title: "Rain Dance", artist: "Someone", link: "https://youtu.be/abc", reason: "Great for focus" };
  it("accepts a good suggestion and cleans the text", () => {
    expect(validateSuggestion({ ...base, title: "  Rain   Dance ", artist: " Some\u0000one " })).toEqual({
      ok: true,
      value: { title: "Rain Dance", artist: "Some one", link: "https://youtu.be/abc", reason: "Great for focus" },
    });
  });
  it("artist and reason are optional", () => {
    expect(validateSuggestion({ title: "x", link: "https://youtu.be/abc" })).toEqual({
      ok: true,
      value: { title: "x", artist: "", link: "https://youtu.be/abc", reason: "" },
    });
  });
  it("names the first problem, in form order", () => {
    expect(validateSuggestion({ ...base, title: "  " })).toEqual({ ok: false, reason: "bad_title" });
    expect(validateSuggestion({ ...base, title: "x".repeat(121) })).toEqual({ ok: false, reason: "bad_title" });
    expect(validateSuggestion({ ...base, artist: "x".repeat(121) })).toEqual({ ok: false, reason: "bad_artist" });
    expect(validateSuggestion({ ...base, artist: 5 })).toEqual({ ok: false, reason: "bad_artist" });
    expect(validateSuggestion({ ...base, link: "https://evil.com/x" })).toEqual({ ok: false, reason: "link_host_not_allowed" });
    expect(validateSuggestion({ ...base, reason: "r".repeat(501) })).toEqual({ ok: false, reason: "bad_reason" });
    expect(validateSuggestion({ ...base, reason: 7 })).toEqual({ ok: false, reason: "bad_reason" });
    expect(validateSuggestion({ title: "", artist: "x".repeat(200), link: "nope", reason: "r".repeat(900) })).toEqual({ ok: false, reason: "bad_title" });
  });
  it("accepts exactly the limits", () => {
    expect(validateSuggestion({ ...base, title: "x".repeat(120), artist: "y".repeat(120), reason: "r".repeat(500) }).ok).toBe(true);
  });
  it("keeps line breaks in a reason but not control characters, and collapses long gaps", () => {
    const r = validateSuggestion({ ...base, reason: "line one\r\n\r\n\r\n\r\nline\u0007 two  ‮" });
    expect(r.ok && r.value.reason).toBe("line one\n\nline two");
  });
  it("junk input is a named refusal, not a crash", () => {
    for (const v of [null, undefined, 5, "x", [], {}]) {
      expect(validateSuggestion(v)).toEqual({ ok: false, reason: "bad_title" });
    }
  });
  it("only the four fields are ever copied (nothing like a status or an id gets through)", () => {
    const r = validateSuggestion({ ...base, status: "approved", suggested_by: "someone", id: "x", reviewed_by: "y" });
    expect(r.ok && Object.keys(r.value).sort()).toEqual(["artist", "link", "reason", "title"]);
  });
});
