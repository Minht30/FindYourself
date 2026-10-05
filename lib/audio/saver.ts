import type { MixerSettings } from "./state";

// Saves the mix to the account without hammering the server: a slider drag
// fires a change per pixel, so changes are debounced; only one save is ever in
// flight (the latest state is re-sent afterwards if it moved meanwhile); and a
// failure keeps the change and retries, with a reason the UI can show.
// Timers are injected, so all of it is unit-tested without waiting.

export type SaveOutcome = { ok: true } | { ok: false; reason: string; retry: boolean };

export type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "failed"; reason: string };

// What the server action gave back. `undefined` is not an error in the code:
// signed out, the middleware answers the action's POST with a redirect, so the
// call resolves with no result at all (Session 26).
export type ActionResult = { ok: true } | { ok: false; error: string } | undefined | null;

// Reasons that will never succeed on a retry: the data itself is refused.
const PERMANENT = new Set(["not_an_object", "bad_levels", "unknown_layer", "bad_level", "bad_master", "bad_muted"]);

export function classify(res: ActionResult): SaveOutcome {
  if (!res) return { ok: false, reason: "unauthenticated", retry: true };
  if (res.ok) return { ok: true };
  const permanent = PERMANENT.has(res.error) || /^db_(23|42501)/.test(res.error);
  return { ok: false, reason: res.error, retry: !permanent };
}

export type Timers = {
  set: (fn: () => void, ms: number) => unknown;
  clear: (id: unknown) => void;
};

export type SaverOptions = {
  send: (s: MixerSettings) => Promise<SaveOutcome>;
  // Called with the revision that was saved; the store clears its "pending"
  // flag only if nothing changed since that revision.
  onSaved: (rev: number) => void;
  onStatus: (s: SaveStatus) => void;
  debounceMs?: number;
  retryMs?: readonly number[];
  timers?: Timers;
};

export function createSaver(opts: SaverOptions) {
  const debounceMs = opts.debounceMs ?? 800;
  const retryMs = opts.retryMs ?? [3_000, 10_000, 30_000, 60_000];
  const timers: Timers = opts.timers ?? {
    set: (fn, ms) => setTimeout(fn, ms),
    clear: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
  };

  let latest: { settings: MixerSettings; rev: number } | null = null;
  let dirty = false;
  let inflight = false;
  let failures = 0;
  let timer: unknown = null;

  function arm(ms: number) {
    if (timer !== null) timers.clear(timer);
    timer = timers.set(() => {
      timer = null;
      void flush();
    }, ms);
  }

  async function flush(): Promise<void> {
    if (timer !== null) {
      timers.clear(timer);
      timer = null;
    }
    if (inflight || !dirty || !latest) return;
    inflight = true;
    const sent = latest;
    dirty = false;
    opts.onStatus({ kind: "saving" });

    let outcome: SaveOutcome;
    try {
      outcome = await opts.send(sent.settings);
    } catch {
      outcome = { ok: false, reason: "network", retry: true };
    }
    inflight = false;

    if (outcome.ok) {
      failures = 0;
      opts.onSaved(sent.rev);
      opts.onStatus({ kind: "saved" });
    } else {
      opts.onStatus({ kind: "failed", reason: outcome.reason });
      if (outcome.retry) {
        // Keep the change; a newer one queued meanwhile supersedes it anyway.
        dirty = true;
        failures += 1;
        arm(retryMs[Math.min(failures - 1, retryMs.length - 1)]);
        return;
      }
      // Refused for good: retrying the same data is pointless. The next user
      // change queues a fresh attempt.
      failures = 0;
    }
    // Changed while this save was in flight: send the newer state now.
    if (dirty && timer === null) void flush();
  }

  return {
    // The state changed (a user edit). Saves after a quiet moment.
    queue(settings: MixerSettings, rev: number) {
      latest = { settings, rev };
      dirty = true;
      // A fresh edit restarts the backoff: it is new information.
      failures = 0;
      arm(debounceMs);
    },
    // Tab hidden, page leaving: do not wait for the debounce.
    flush,
    // Back online / tab visible again: do not wait for the backoff.
    retryNow() {
      if (dirty) void flush();
    },
    cancel() {
      if (timer !== null) timers.clear(timer);
      timer = null;
    },
    isIdle: () => !dirty && !inflight,
  };
}

export type Saver = ReturnType<typeof createSaver>;
