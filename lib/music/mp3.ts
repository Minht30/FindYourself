// Is this really an MP3? The file extension and the browser's MIME type are
// the client's claims, so neither is trusted. The bytes are checked instead:
// an optional ID3v2 tag, then a chain of two MPEG audio frames (Layer III).
// A text file, an image or an M4A renamed to .mp3 fails; a real MP3 passes.
//
// All pure and byte-level, so the browser (File.slice) and the server (a Range
// request on the stored object) share it, and tests can feed it any bytes.

const BITRATES_V1_L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
const BITRATES_V2_L3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
const RATES: Record<number, number[]> = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };

export type Frame = { version: number; sampleRate: number; bitrate: number; length: number };

// Parses an MPEG-1/2/2.5 Layer III frame header at `at`, or null if the four
// bytes there are not one.
export function parseFrameHeader(b: Uint8Array, at: number): Frame | null {
  if (at < 0 || at + 4 > b.length) return null;
  const b1 = b[at + 1];
  if (b[at] !== 0xff || (b1 & 0xe0) !== 0xe0) return null; // 11 sync bits
  const version = (b1 >> 3) & 3; // 0 = 2.5, 1 = reserved, 2 = 2, 3 = 1
  const layer = (b1 >> 1) & 3; // 1 = Layer III
  if (version === 1 || layer !== 1) return null;
  const bitrateIndex = b[at + 2] >> 4;
  const rateIndex = (b[at + 2] >> 2) & 3;
  if (bitrateIndex === 0 || bitrateIndex === 15 || rateIndex === 3) return null; // free-format / bad
  const padding = (b[at + 2] >> 1) & 1;
  const bitrate = (version === 3 ? BITRATES_V1_L3 : BITRATES_V2_L3)[bitrateIndex] * 1000;
  const sampleRate = RATES[version][rateIndex];
  const length = Math.floor(((version === 3 ? 144 : 72) * bitrate) / sampleRate) + padding;
  return { version, sampleRate, bitrate, length };
}

export type Id3 = { ok: true; length: number } | { ok: false };

// The length of an ID3v2 tag at the start of the file (0 if there is none).
// A tag that says it is ID3 but is malformed is refused.
export function id3TagLength(head: Uint8Array): Id3 {
  if (head.length < 3 || head[0] !== 0x49 || head[1] !== 0x44 || head[2] !== 0x33) return { ok: true, length: 0 };
  if (head.length < 10) return { ok: false };
  const major = head[3];
  if (major < 2 || major > 4 || head[4] === 0xff) return { ok: false };
  // the size is four "syncsafe" bytes (7 bits each)
  if ((head[6] | head[7] | head[8] | head[9]) & 0x80) return { ok: false };
  const size = (head[6] << 21) | (head[7] << 14) | (head[8] << 7) | head[9];
  const footer = major === 4 && (head[5] & 0x10) !== 0 ? 10 : 0;
  return { ok: true, length: 10 + size + footer };
}

// Within `buf` (which starts where the audio should), is there a valid frame
// followed by a second, matching one? `eof` says the buffer reaches the end of
// the file, which is what lets a tiny single-frame file through.
export function hasFrameChain(buf: Uint8Array, opts: { eof: boolean; maxScan?: number }): boolean {
  const scan = Math.min(opts.maxScan ?? 4096, buf.length);
  for (let i = 0; i < scan; i++) {
    const f = parseFrameHeader(buf, i);
    if (!f) continue;
    const next = i + f.length;
    if (next === buf.length && opts.eof) return true; // a file that is exactly one frame
    const g = parseFrameHeader(buf, next);
    if (g && g.version === f.version && g.sampleRate === f.sampleRate) return true;
    if (next + 4 > buf.length && opts.eof) return true; // truncated last frame
  }
  return false;
}

// Reads `[start, end)` of the file; shorter when the file ends first.
export type Reader = (start: number, end: number) => Promise<Uint8Array>;

// The whole check, for any source of bytes: head -> ID3 tag length -> frames
// right after the tag.
export async function sniffMp3(read: Reader, fileSize: number): Promise<"ok" | "not_mp3"> {
  if (!Number.isFinite(fileSize) || fileSize < 4) return "not_mp3";
  const head = await read(0, 10);
  const id3 = id3TagLength(head);
  if (!id3.ok) return "not_mp3";
  if (id3.length >= fileSize) return "not_mp3"; // a tag with no audio after it
  const WINDOW = 8192;
  const end = Math.min(fileSize, id3.length + WINDOW);
  const audio = await read(id3.length, end);
  return hasFrameChain(audio, { eof: end >= fileSize }) ? "ok" : "not_mp3";
}
