import { describe, expect, it, vi } from "vitest";
import { MAX_FILE_BYTES, MAX_TRACKS } from "./limits";
import { claimedMime, uploadTrack, type UploadDeps } from "./upload";

// A File-like object is enough: the pipeline only needs name, type, size, slice().
function file(name: string, bytes: Uint8Array, type = "audio/mpeg"): File {
  return new File([bytes as BlobPart], name, { type });
}

const FRAME = (() => {
  const f = new Uint8Array(417);
  f.set([0xff, 0xfb, 0x90, 0x00]);
  return f;
})();
const mp3Bytes = (frames = 60) => {
  const b = new Uint8Array(frames * 417);
  for (let i = 0; i < frames; i++) b.set(FRAME, i * 417);
  return b;
};

function deps(over: Partial<UploadDeps> = {}) {
  const d = {
    prepare: vi.fn(async (i: { name: string }) => ({
      ok: true as const,
      trackId: "8f6c1d3e-0a5b-4c7e-9d2f-1a3b5c7d9e0f",
      path: "u/8f6c1d3e-0a5b-4c7e-9d2f-1a3b5c7d9e0f.mp3",
      token: "tok",
      title: i.name.replace(/\.mp3$/i, ""),
    })),
    put: vi.fn(async () => ({ error: null })),
    finalize: vi.fn(async (i: { trackId: string }) => ({ ok: true as const, trackId: i.trackId })),
    readDuration: vi.fn(async () => 12.4),
    ...over,
  };
  return d as typeof d & UploadDeps;
}

const empty = { count: 0, totalBytes: 0 };

describe("uploadTrack: the happy path", () => {
  it("runs prepare -> put -> finalize and reports the title", async () => {
    const d = deps();
    const r = await uploadTrack(file("Rain Dance.mp3", mp3Bytes()), empty, d);
    expect(r).toEqual({ ok: true, trackId: "8f6c1d3e-0a5b-4c7e-9d2f-1a3b5c7d9e0f", title: "Rain Dance" });
    expect(d.prepare).toHaveBeenCalledWith({ name: "Rain Dance.mp3", size: 60 * 417, mime: "audio/mpeg" });
    expect(d.put).toHaveBeenCalledTimes(1);
    expect(d.finalize).toHaveBeenCalledWith(expect.objectContaining({ durationSeconds: 12, size: 60 * 417 }));
  });
  it("accepts an .mp3 whose type the browser left empty or called audio/mp3", async () => {
    for (const type of ["", "audio/mp3"]) {
      const r = await uploadTrack(file("a.mp3", mp3Bytes(), type), empty, deps());
      expect(r.ok).toBe(true);
    }
  });
  it("uses a title the user typed in preference to the file name", async () => {
    const d = deps();
    await uploadTrack(file("a.mp3", mp3Bytes()), empty, d, { title: "  My Song ", artist: "Me" });
    expect(d.finalize).toHaveBeenCalledWith(expect.objectContaining({ title: "My Song", artist: "Me" }));
  });
});

describe("uploadTrack: refused in the browser, no request sent", () => {
  const refusal = (r: Awaited<ReturnType<typeof uploadTrack>>) => (r.ok ? "ok" : `${r.reason}/${r.stage}/${r.requestSent}`);

  it("library_full", async () => {
    const d = deps();
    const r = await uploadTrack(file("a.mp3", mp3Bytes()), { count: MAX_TRACKS, totalBytes: 0 }, d);
    expect(refusal(r)).toBe("library_full/client/false");
    expect(d.prepare).not.toHaveBeenCalled();
    expect(d.put).not.toHaveBeenCalled();
  });
  it("too_big (reads only the size: never the bytes)", async () => {
    const d = deps();
    const big = new File([new Uint8Array(10)], "big.mp3", { type: "audio/mpeg" });
    Object.defineProperty(big, "size", { value: MAX_FILE_BYTES + 1 });
    expect(refusal(await uploadTrack(big, empty, d))).toBe("too_big/client/false");
    expect(d.prepare).not.toHaveBeenCalled();
  });
  it("quota_exceeded", async () => {
    const r = await uploadTrack(file("a.mp3", mp3Bytes()), { count: 3, totalBytes: 50 * 1024 * 1024 - 100 }, deps());
    expect(refusal(r)).toBe("quota_exceeded/client/false");
  });
  it("not_mp3 by type, by name, and by the bytes (a text file named .mp3)", async () => {
    const d = deps();
    const text = new TextEncoder().encode("hello, this is a diary entry".repeat(200));
    expect(refusal(await uploadTrack(file("a.ogg", mp3Bytes(), "audio/ogg"), empty, d))).toBe("not_mp3/client/false");
    expect(refusal(await uploadTrack(file("a.mp3", mp3Bytes(), "audio/wav"), empty, d))).toBe("not_mp3/client/false");
    expect(refusal(await uploadTrack(file("a.mp3", text), empty, d))).toBe("not_mp3/client/false");
    expect(d.prepare).not.toHaveBeenCalled();
  });
  it("bad_size for an empty file", async () => {
    expect(refusal(await uploadTrack(file("a.mp3", new Uint8Array()), empty, deps()))).toBe("bad_size/client/false");
  });
  it.each([null, NaN, Infinity, 0, 0.1, 99999])("bad_duration when the decoder says %s", async (dur) => {
    const d = deps({ readDuration: vi.fn(async () => dur as number | null) });
    expect(refusal(await uploadTrack(file("a.mp3", mp3Bytes()), empty, d))).toBe("bad_duration/client/false");
    expect(d.prepare).not.toHaveBeenCalled();
  });
});

describe("uploadTrack: refused by the server or by storage", () => {
  it("passes the server's named reason through, with the stage", async () => {
    const d = deps({ prepare: vi.fn(async () => ({ ok: false as const, reason: "library_full" as const })) });
    expect(await uploadTrack(file("a.mp3", mp3Bytes()), empty, d)).toEqual({
      ok: false,
      reason: "library_full",
      stage: "prepare",
      requestSent: true,
      detail: undefined,
    });
    expect(d.put).not.toHaveBeenCalled();
  });
  it("a signed-out action (no result at all) is `unauthenticated`, at whichever step it happens", async () => {
    const a = await uploadTrack(file("a.mp3", mp3Bytes()), empty, deps({ prepare: vi.fn(async () => undefined) }));
    expect(a).toMatchObject({ ok: false, reason: "unauthenticated", stage: "prepare", requestSent: true });
    const b = await uploadTrack(file("a.mp3", mp3Bytes()), empty, deps({ finalize: vi.fn(async () => undefined) }));
    expect(b).toMatchObject({ ok: false, reason: "unauthenticated", stage: "finalize", requestSent: true });
  });
  it("maps storage 413 / 415 / other failures", async () => {
    const run = (status: number | undefined) =>
      uploadTrack(file("a.mp3", mp3Bytes()), empty, deps({ put: vi.fn(async () => ({ error: { status, message: "x" } })) }));
    expect(await run(413)).toMatchObject({ reason: "too_big", stage: "storage" });
    expect(await run(415)).toMatchObject({ reason: "not_mp3", stage: "storage" });
    expect(await run(500)).toMatchObject({ reason: "upload_failed", stage: "storage" });
    expect(await run(undefined)).toMatchObject({ reason: "upload_failed", stage: "storage" });
  });
  it("does not finalize when the upload itself failed", async () => {
    const d = deps({ put: vi.fn(async () => ({ error: { status: 500, message: "boom" } })) });
    await uploadTrack(file("a.mp3", mp3Bytes()), empty, d);
    expect(d.finalize).not.toHaveBeenCalled();
  });
  it("passes a finalize refusal (not_mp3 / size_mismatch) through", async () => {
    const d = deps({ finalize: vi.fn(async () => ({ ok: false as const, reason: "not_mp3" as const })) });
    expect(await uploadTrack(file("a.mp3", mp3Bytes()), empty, d)).toMatchObject({
      reason: "not_mp3",
      stage: "finalize",
      requestSent: true,
    });
  });
});

describe("uploadTrack: a client that skips its own checks", () => {
  it("still sends everything, so the server's answer is what refuses it", async () => {
    const d = deps({ prepare: vi.fn(async () => ({ ok: false as const, reason: "not_mp3" as const })) });
    const text = new TextEncoder().encode("not music");
    const r = await uploadTrack(file("a.mp3", text), empty, d, { skipClientChecks: true });
    expect(r).toMatchObject({ ok: false, reason: "not_mp3", stage: "prepare", requestSent: true });
    expect(d.prepare).toHaveBeenCalledTimes(1);
  });
  it("falls back to a 1 s duration when the file cannot be decoded", async () => {
    const d = deps({ readDuration: vi.fn(async () => null) });
    await uploadTrack(file("a.mp3", mp3Bytes()), empty, d, { skipClientChecks: true });
    expect(d.finalize).toHaveBeenCalledWith(expect.objectContaining({ durationSeconds: 1 }));
  });
});

describe("claimedMime", () => {
  it("is audio/mpeg only for an .mp3 name with an mp3-ish or empty type", () => {
    expect(claimedMime({ name: "a.MP3", type: "audio/mpeg" })).toBe("audio/mpeg");
    expect(claimedMime({ name: "a.mp3", type: "" })).toBe("audio/mpeg");
    expect(claimedMime({ name: "a.mp3", type: "audio/mp3" })).toBe("audio/mpeg");
    expect(claimedMime({ name: "a.mp3", type: "audio/wav" })).toBe("audio/wav");
    expect(claimedMime({ name: "a.m4a", type: "audio/mp4" })).toBe("audio/mp4");
    expect(claimedMime({ name: "a.ogg", type: "" })).toBe("unknown");
  });
});
