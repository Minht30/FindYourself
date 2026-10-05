import type { SessionRecord } from "./timer";

// A finished or abandoned focus phase is written here first, and only removed
// once the server has it. That is what keeps a session from being lost when the
// user is signed out, offline, or closes the tab mid-request. Records carry a
// client-generated id, so replaying one is harmless (the insert is idempotent).
const KEY = "fy-focus-outbox";
export const OUTBOX_EVENT = "fy-outbox";
const CAP = 200;

function read(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isRecord) : [];
  } catch {
    return [];
  }
}

function write(list: SessionRecord[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-CAP)));
  } catch {
    // storage full or blocked: the session is lost, but the timer still works
  }
}

function isRecord(v: unknown): v is SessionRecord {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.startedAt === "number" &&
    typeof r.endedAt === "number" &&
    typeof r.durationSec === "number" &&
    typeof r.plannedSec === "number" &&
    typeof r.completed === "boolean"
  );
}

export function enqueueSession(record: SessionRecord) {
  const list = read();
  if (list.some((r) => r.id === record.id)) return;
  write([...list, record]);
  // Tells the provider there is something to send (it flushes straight away).
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OUTBOX_EVENT));
}

export function pendingSessions(): SessionRecord[] {
  return read();
}

export function dropSessions(ids: string[]) {
  const gone = new Set(ids);
  write(read().filter((r) => !gone.has(r.id)));
}
