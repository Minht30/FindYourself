import { create } from "zustand";
import { dropSessions, pendingSessions } from "./sessions";
import type { SessionRecord } from "./timer";

// Result shape of the saveFocusSessions server action (kept here so this file
// does not import server code and stays testable under node).
export type SaveResult =
  | { ok: true; saved: string[]; rejected: { id: string; reason: string }[] }
  | { ok: false; error: string };

export type SaveFn = (batch: SessionRecord[]) => Promise<SaveResult>;

const BATCH = 50;

// What the UI shows about sessions that are not on the server yet.
type SyncState = { pending: number; syncing: boolean; lastError: string | null };
export const useSync = create<SyncState>(() => ({ pending: 0, syncing: false, lastError: null }));

export function refreshPending() {
  useSync.setState({ pending: pendingSessions().length });
}

// The outbox is drained in batches. A rejected record (the server said it can
// never be valid) is dropped too: keeping it would block the queue forever.
// Any other failure keeps everything and records why, so the UI can say so and
// the next trigger (load, online, tab visible, a minute timer) tries again.
export function createFlusher(save: SaveFn) {
  let inFlight = false;

  return async function flush(): Promise<void> {
    if (inFlight) return;
    inFlight = true;
    useSync.setState({ syncing: true });
    try {
      for (;;) {
        const batch = pendingSessions().slice(0, BATCH);
        if (batch.length === 0) {
          useSync.setState({ lastError: null });
          return;
        }
        let res: SaveResult;
        try {
          res = await save(batch);
        } catch {
          useSync.setState({ lastError: "network" });
          return;
        }
        // Signed out, the middleware answers the action's POST with a redirect to
        // /login, so the call resolves with no result at all instead of an error.
        if (!res || typeof res !== "object" || typeof res.ok !== "boolean") {
          useSync.setState({ lastError: "no_response" });
          return;
        }
        if (!res.ok) {
          useSync.setState({ lastError: res.error });
          return;
        }
        for (const r of res.rejected) console.warn(`Focus session ${r.id} was not saved: ${r.reason}`);
        dropSessions([...res.saved, ...res.rejected.map((r) => r.id)]);
        // Neither saved nor rejected would loop forever on the same batch.
        if (res.saved.length + res.rejected.length === 0) {
          useSync.setState({ lastError: "no_progress" });
          return;
        }
      }
    } finally {
      inFlight = false;
      useSync.setState({ syncing: false, pending: pendingSessions().length });
    }
  };
}
