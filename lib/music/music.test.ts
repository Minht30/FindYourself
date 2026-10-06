import { describe, expect, it } from "vitest";
import { cleanText, isUuid, storagePath, titleFromFilename, validateArtist, validateTitle } from "./filename";
import { MAX_FILE_BYTES, MAX_TOTAL_BYTES, MAX_TRACKS } from "./limits";
import { hasFrameChain, id3TagLength, parseFrameHeader, sniffMp3, type Reader } from "./mp3";
import { checkQuota, usageText } from "./quota";

// ── fixtures: valid silent MP3s built in memory ────────────────────────────────
// MPEG-1 Layer III, 128 kbps, 44.1 kHz: header FF FB 90 00 + 413 zero bytes = 417 bytes.
const FRAME = (() => {
  const f = new Uint8Array(417);
  f.set([0xff, 0xfb, 0x90, 0x00]);
  return f;
})();

function syncsafe(n: number): number[] {
  return [(n >> 21) & 0x7f, (n >> 14) & 0x7f, (n >> 7) & 0x7f, n & 0x7f];
}

function mp3(frames: number, id3Size?: number): Uint8Array {
  const tag = id3Size === undefined ? 0 : 10 + id3Size;
  const out = new Uint8Array(tag + frames * FRAME.length);
  if (id3Size !== undefined) out.set([0x49, 0x44, 0x33, 4, 0, 0, ...syncsafe(id3Size)]);
  for (let i = 0; i < frames; i++) out.set(FRAME, tag + i * FRAME.length);
  return out;
}

const reader =
  (bytes: Uint8Array): Reader =>
  async (a, b) =>
    bytes.slice(a, Math.min(b, bytes.length));

const enc = (s: string) => new TextEncoder().encode(s);

describe("parseFrameHeader", () => {
  it("reads a 128 kbps / 44.1 kHz MPEG-1 Layer III frame as 417 bytes", () => {
    expect(parseFrameHeader(FRAME, 0)).toEqual({ version: 3, sampleRate: 44100, bitrate: 128000, length: 417 });
  });
  it("adds a byte for the padding bit", () => {
    expect(parseFrameHeader(new Uint8Array([0xff, 0xfb, 0x92, 0x00]), 0)?.length).toBe(418);
  });
  it("reads MPEG-2 Layer III (22.05 kHz, 64 kbps) as 208 bytes", () => {
    // FF F3 = MPEG-2 Layer III, no CRC; bitrate index 8 = 64 kbps, rate index 0 = 22050
    expect(parseFrameHeader(new Uint8Array([0xff, 0xf3, 0x80, 0x00]), 0)).toEqual({
      version: 2,
      sampleRate: 22050,
      bitrate: 64000,
      length: 208,
    });
  });
  it.each([
    ["no sync", [0x00, 0xfb, 0x90, 0x00]],
    ["only 8 sync bits", [0xff, 0x1b, 0x90, 0x00]],
    ["reserved version", [0xff, 0xeb, 0x90, 0x00]],
    ["Layer II (mp2)", [0xff, 0xfd, 0x90, 0x00]],
    ["Layer I", [0xff, 0xff, 0x90, 0x00]],
    ["free-format bitrate", [0xff, 0xfb, 0x00, 0x00]],
    ["bad bitrate index 15", [0xff, 0xfb, 0xf0, 0x00]],
    ["bad sample rate index 3", [0xff, 0xfb, 0x9c, 0x00]],
  ])("rejects %s", (_n, bytes) => {
    expect(parseFrameHeader(new Uint8Array(bytes), 0)).toBeNull();
  });
  it("is safe at the edges of the buffer", () => {
    expect(parseFrameHeader(FRAME, -1)).toBeNull();
    expect(parseFrameHeader(FRAME, 415)).toBeNull();
    expect(parseFrameHeader(new Uint8Array(), 0)).toBeNull();
  });
});

describe("id3TagLength", () => {
  it("is 0 without a tag", () => expect(id3TagLength(FRAME.slice(0, 10))).toEqual({ ok: true, length: 0 }));
  it("is header + size for a tag", () => {
    expect(id3TagLength(mp3(1, 1000).slice(0, 10))).toEqual({ ok: true, length: 1010 });
  });
  it("counts the footer of an ID3v2.4 tag that has one", () => {
    const h = new Uint8Array([0x49, 0x44, 0x33, 4, 0, 0x10, ...syncsafe(100)]);
    expect(id3TagLength(h)).toEqual({ ok: true, length: 120 });
  });
  it("refuses a malformed tag: bad version, bad revision, non-syncsafe size, truncated header", () => {
    expect(id3TagLength(new Uint8Array([0x49, 0x44, 0x33, 9, 0, 0, 0, 0, 0, 1])).ok).toBe(false);
    expect(id3TagLength(new Uint8Array([0x49, 0x44, 0x33, 4, 0xff, 0, 0, 0, 0, 1])).ok).toBe(false);
    expect(id3TagLength(new Uint8Array([0x49, 0x44, 0x33, 4, 0, 0, 0x80, 0, 0, 1])).ok).toBe(false);
    expect(id3TagLength(new Uint8Array([0x49, 0x44, 0x33, 4])).ok).toBe(false);
  });
});

describe("hasFrameChain", () => {
  it("accepts two consecutive matching frames", () => {
    expect(hasFrameChain(mp3(2), { eof: false })).toBe(true);
  });
  it("accepts a lone single frame only at the end of the file", () => {
    expect(hasFrameChain(mp3(1), { eof: true })).toBe(true);
    expect(hasFrameChain(mp3(1).slice(0, 417), { eof: false })).toBe(false);
  });
  it("finds the chain after a few junk bytes", () => {
    const m = mp3(3);
    const junk = new Uint8Array(m.length + 5);
    junk.set(m, 5);
    expect(hasFrameChain(junk, { eof: true })).toBe(true);
  });
  it("rejects a header whose next frame does not line up", () => {
    const m = mp3(2);
    m[417] = 0x00; // break the second sync
    expect(hasFrameChain(m, { eof: false })).toBe(false);
  });
  it("rejects a second frame with a different sample rate", () => {
    const m = mp3(2);
    m[417 + 2] = 0x94; // 48 kHz instead of 44.1
    expect(hasFrameChain(m, { eof: false })).toBe(false);
  });
  it("rejects text and zeros", () => {
    expect(hasFrameChain(enc("this is not audio at all, just a text file".repeat(50)), { eof: true })).toBe(false);
    expect(hasFrameChain(new Uint8Array(5000), { eof: true })).toBe(false);
  });
});

describe("sniffMp3", () => {
  it("accepts a bare MP3", async () => {
    const m = mp3(40);
    expect(await sniffMp3(reader(m), m.length)).toBe("ok");
  });
  it("accepts an MP3 behind a small and a large ID3 tag (cover art can be megabytes)", async () => {
    for (const size of [200, 3000, 400_000]) {
      const m = mp3(30, size);
      expect(await sniffMp3(reader(m), m.length)).toBe("ok");
    }
  });
  it("accepts a one-frame file", async () => {
    const m = mp3(1);
    expect(await sniffMp3(reader(m), m.length)).toBe("ok");
  });
  it("refuses a text file renamed .mp3", async () => {
    const t = enc("Dear diary, this is definitely not music.".repeat(100));
    expect(await sniffMp3(reader(t), t.length)).toBe("not_mp3");
  });
  it("refuses wrong magic bytes (a PNG, an MP4 'ftyp' box, an Ogg page)", async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Array(9000).fill(7)]);
    const mp4 = new Uint8Array([0, 0, 0, 0x20, ...enc("ftypM4A "), ...new Array(9000).fill(1)]);
    const ogg = new Uint8Array([...enc("OggS"), ...new Array(9000).fill(2)]);
    for (const f of [png, mp4, ogg]) expect(await sniffMp3(reader(f), f.length)).toBe("not_mp3");
  });
  it("refuses an ID3 tag with no audio after it, and a tag that lies about its size", async () => {
    const onlyTag = mp3(0, 500);
    expect(await sniffMp3(reader(onlyTag), onlyTag.length)).toBe("not_mp3");
    const liar = mp3(5, 100);
    liar.set([...syncsafe(20_000_000)], 6); // claims 20 MB of tag in a 2 KB file
    expect(await sniffMp3(reader(liar), liar.length)).toBe("not_mp3");
  });
  it("refuses tiny and empty files", async () => {
    expect(await sniffMp3(reader(new Uint8Array()), 0)).toBe("not_mp3");
    expect(await sniffMp3(reader(new Uint8Array([0xff, 0xfb])), 2)).toBe("not_mp3");
  });
});

describe("checkQuota", () => {
  const empty = { count: 0, totalBytes: 0 };
  it("accepts an ordinary file", () => expect(checkQuota(empty, 4_000_000, "audio/mpeg")).toBeNull());
  it("accepts exactly 10 MB and the 10th track", () => {
    expect(checkQuota(empty, MAX_FILE_BYTES)).toBeNull();
    expect(checkQuota({ count: MAX_TRACKS - 1, totalBytes: 0 }, 1000)).toBeNull();
  });
  it("names each refusal", () => {
    expect(checkQuota(empty, MAX_FILE_BYTES + 1)).toBe("too_big");
    expect(checkQuota({ count: MAX_TRACKS, totalBytes: 100 }, 1000)).toBe("library_full");
    expect(checkQuota({ count: 6, totalBytes: MAX_TOTAL_BYTES - 500 }, 1000)).toBe("quota_exceeded");
    expect(checkQuota(empty, 1000, "audio/ogg")).toBe("not_mp3");
    expect(checkQuota(empty, 1000, "")).toBe("not_mp3");
  });
  it("hits the total exactly at the limit, not one byte before", () => {
    expect(checkQuota({ count: 6, totalBytes: MAX_TOTAL_BYTES - 1000 }, 1000)).toBeNull();
    expect(checkQuota({ count: 6, totalBytes: MAX_TOTAL_BYTES - 1000 }, 1001)).toBe("quota_exceeded");
  });
  it.each([0, -5, 1.5, NaN, Infinity, "1000", null, undefined])("rejects a bad size %s", (size) => {
    expect(checkQuota(empty, size)).toBe("bad_size");
  });
  it("puts a fault in the file itself before a full library", () => {
    const full = { count: MAX_TRACKS, totalBytes: MAX_TOTAL_BYTES };
    expect(checkQuota(full, MAX_FILE_BYTES + 1)).toBe("too_big");
    expect(checkQuota(full, 100, "audio/wav")).toBe("not_mp3");
    expect(checkQuota(full, 0)).toBe("bad_size");
  });
  it("reads the usage aloud", () => {
    expect(usageText({ count: 5, totalBytes: 19_083_264 })).toBe("5 of 10 tracks, 18.2 of 50 MB");
  });
});

describe("text and file names", () => {
  it("cleans control characters, direction overrides and runs of spaces", () => {
    expect(cleanText("  a\u0000b\n\tc\u202ed  ")).toBe("a b c d");
    expect(cleanText(42)).toBe("");
  });
  it("derives a title from a file name", () => {
    expect(titleFromFilename("my_song-01 (live).MP3")).toBe("my song-01 (live)");
    expect(titleFromFilename("C:\\fakepath\\Rain Dance.mp3")).toBe("Rain Dance");
    expect(titleFromFilename("a/b/c.mp3")).toBe("c");
    expect(titleFromFilename(".mp3")).toBe("Untitled");
    expect(titleFromFilename(undefined)).toBe("Untitled");
    expect(titleFromFilename("x".repeat(500) + ".mp3")).toHaveLength(120);
  });
  it("validates titles: 1-120 after cleaning", () => {
    expect(validateTitle("  Lo-fi  ")).toEqual({ ok: true, value: "Lo-fi" });
    expect(validateTitle("   ")).toEqual({ ok: false, reason: "bad_title" });
    expect(validateTitle("x".repeat(121))).toEqual({ ok: false, reason: "bad_title" });
    expect(validateTitle(5)).toEqual({ ok: false, reason: "bad_title" });
    expect(validateTitle("x".repeat(120)).ok).toBe(true);
  });
  it("validates artists: optional, up to 120", () => {
    expect(validateArtist(undefined)).toEqual({ ok: true, value: "" });
    expect(validateArtist("")).toEqual({ ok: true, value: "" });
    expect(validateArtist("x".repeat(121))).toEqual({ ok: false, reason: "bad_artist" });
    expect(validateArtist(7)).toEqual({ ok: false, reason: "bad_artist" });
  });
  it("tells real uuids from other strings and builds the object path from ids only", () => {
    const u = "33ccfa36-b0a0-4006-9089-162c0581759d";
    expect(isUuid(u)).toBe(true);
    for (const bad of ["", "../x", `${u}/../x`, "33ccfa36b0a0400690891 62c0581759d", 5, null]) expect(isUuid(bad)).toBe(false);
    expect(storagePath(u, "8f6c1d3e-0a5b-4c7e-9d2f-1a3b5c7d9e0f")).toBe(`${u}/8f6c1d3e-0a5b-4c7e-9d2f-1a3b5c7d9e0f.mp3`);
  });
});
