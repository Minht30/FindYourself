import type { MusicReason } from "./limits";

// The bucket is private, so a track plays from a short-lived signed URL (about
// an hour). This keeps the URLs the player already has, hands out a fresh one
// before the old runs out, and shares one request between callers that ask for
// the same track at once.

export type UrlEntry = { url: string; expiresAt: number };
export type UrlAnswer = ({ ok: true } & UrlEntry) | { ok: false; reason: MusicReason };
// The server action's answer; a signed-out action POST resolves with no result.
export type UrlFetcher = (id: string) => Promise<UrlAnswer | undefined | null>;

// A URL with less than this left is treated as expired: playback that starts
// now must outlast the buffering of the first seconds.
export const REFRESH_MARGIN_MS = 2 * 60_000;

export const isFresh = (e: UrlEntry | undefined, now: number, margin = REFRESH_MARGIN_MS): e is UrlEntry =>
  !!e && e.expiresAt - now > margin;

export type UrlCache = {
  get: (id: string, opts?: { force?: boolean }) => Promise<UrlAnswer>;
  // The URL we hold for `id` if it is still fresh (no request).
  peek: (id: string) => UrlEntry | undefined;
  invalidate: (id: string) => void;
  clear: () => void;
};

export function createUrlCache(fetchUrl: UrlFetcher, now: () => number = Date.now): UrlCache {
  const cache = new Map<string, UrlEntry>();
  const inflight = new Map<string, Promise<UrlAnswer>>();

  const request = (id: string): Promise<UrlAnswer> => {
    const existing = inflight.get(id);
    if (existing) return existing;
    const p = (async (): Promise<UrlAnswer> => {
      try {
        const r = await fetchUrl(id);
        if (!r) return { ok: false, reason: "unauthenticated" };
        if (r.ok) cache.set(id, { url: r.url, expiresAt: r.expiresAt });
        return r;
      } catch {
        return { ok: false, reason: "db_error" };
      } finally {
        inflight.delete(id);
      }
    })();
    inflight.set(id, p);
    return p;
  };

  return {
    async get(id, opts) {
      const held = cache.get(id);
      if (!opts?.force && isFresh(held, now())) return { ok: true, ...held };
      return request(id);
    },
    peek: (id) => {
      const held = cache.get(id);
      return isFresh(held, now()) ? held : undefined;
    },
    invalidate: (id) => void cache.delete(id),
    clear: () => cache.clear(),
  };
}
