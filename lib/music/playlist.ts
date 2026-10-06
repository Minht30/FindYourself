import { mulberry32 } from "@/lib/audio/rng";
import { cleanText } from "./filename";
import { MAX_PLAYLIST_NAME } from "./limits";

export type Playlist = { id: string; name: string; trackIds: string[] };

export type NameResult = { ok: true; value: string } | { ok: false; reason: "bad_name" };

// 1-60 characters after cleaning.
export function validatePlaylistName(input: unknown): NameResult {
  const v = cleanText(input);
  return v.length >= 1 && v.length <= MAX_PLAYLIST_NAME ? { ok: true, value: v } : { ok: false, reason: "bad_name" };
}

// Moves the item at `from` so it ends up at index `to`. Out-of-range or
// no-op moves return the same order (a copy), never throw.
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const out = [...list];
  if (!Number.isInteger(from) || !Number.isInteger(to)) return out;
  if (from < 0 || from >= out.length || to < 0 || to >= out.length || from === to) return out;
  const [item] = out.splice(from, 1);
  out.splice(to, 0, item);
  return out;
}

export const moveUp = <T>(list: readonly T[], index: number) => moveItem(list, index, index - 1);
export const moveDown = <T>(list: readonly T[], index: number) => moveItem(list, index, index + 1);

// Is `b` the same set as `a`, each once, in any order? (What the server
// requires of a reorder.)
export function isPermutation(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  if (set.size !== a.length) return false;
  const seen = new Set<string>();
  for (const x of b) {
    if (!set.has(x) || seen.has(x)) return false;
    seen.add(x);
  }
  return true;
}

// A seeded Fisher-Yates shuffle: always a permutation (nothing lost, nothing
// repeated), the same seed gives the same order, and the input is untouched.
// With `first`, that item is placed at the front and the rest is shuffled, so
// "shuffle" while a track is playing does not skip it.
export function shuffle<T>(list: readonly T[], seed: number, first?: T): T[] {
  const rng = mulberry32(seed);
  const rest = first === undefined ? [...list] : list.filter((x) => x !== first);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return first !== undefined && list.includes(first) ? [first, ...rest] : rest;
}
