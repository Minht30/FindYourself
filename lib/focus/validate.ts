import { MIN_LOGGED_ABANDON_MS } from "./timer";

// What the server accepts from the outbox. The browser is untrusted, so every
// field is checked here before anything touches the database; the table's own
// constraints are the second line, not the first.

export type SessionRow = {
  id: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  planned_seconds: number;
  task_id: string | null;
  time_block_id: string | null;
  label: string | null;
  completed: boolean;
};

export type Verdict = { ok: true; row: SessionRow } | { ok: false; reason: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MIN_PLANNED_S = 60;
const MAX_PLANNED_S = 7200;
const CLOCK_SLACK_S = 5; // matches focus_sessions_wall_clock
const FUTURE_SLACK_MS = 10 * 60_000; // a skewed clock is fine, a far-future session is not
const EARLIEST = Date.UTC(2020, 0, 1);

const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);
const isFiniteNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

export function validateSession(raw: unknown, nowMs: number): Verdict {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "bad_shape" };
  const r = raw as Record<string, unknown>;

  if (!isUuid(r.id)) return { ok: false, reason: "bad_id" };
  if (typeof r.completed !== "boolean") return { ok: false, reason: "bad_completed" };

  if (!isFiniteNum(r.startedAt) || !isFiniteNum(r.endedAt)) return { ok: false, reason: "bad_time" };
  if (r.startedAt < EARLIEST || r.endedAt > nowMs + FUTURE_SLACK_MS || r.endedAt < r.startedAt) {
    return { ok: false, reason: "bad_time" };
  }

  if (!isInt(r.plannedSec) || r.plannedSec < MIN_PLANNED_S || r.plannedSec > MAX_PLANNED_S) {
    return { ok: false, reason: "bad_planned" };
  }
  if (!isInt(r.durationSec) || r.durationSec < 0 || r.durationSec > r.plannedSec) {
    return { ok: false, reason: "bad_duration" };
  }
  if (r.completed && r.durationSec !== r.plannedSec) return { ok: false, reason: "bad_duration" };
  if (!r.completed && r.durationSec * 1000 < MIN_LOGGED_ABANDON_MS) return { ok: false, reason: "too_short" };
  // Pauses only make the wall clock longer; you cannot focus longer than it ran.
  if ((r.endedAt - r.startedAt) / 1000 < r.durationSec - CLOCK_SLACK_S) return { ok: false, reason: "bad_duration" };

  const taskId = r.taskId ?? null;
  const blockId = r.blockId ?? null;
  if ((taskId !== null && !isUuid(taskId)) || (blockId !== null && !isUuid(blockId))) {
    return { ok: false, reason: "bad_link" };
  }

  let label: string | null = null;
  if (r.label !== null && r.label !== undefined) {
    if (typeof r.label !== "string") return { ok: false, reason: "bad_label" };
    const t = r.label.trim();
    if (t.length > 200) return { ok: false, reason: "bad_label" };
    label = t === "" ? null : t;
  }

  return {
    ok: true,
    row: {
      id: r.id,
      started_at: new Date(r.startedAt).toISOString(),
      ended_at: new Date(r.endedAt).toISOString(),
      duration_seconds: r.durationSec,
      planned_seconds: r.plannedSec,
      task_id: taskId as string | null,
      time_block_id: blockId as string | null,
      label,
      completed: r.completed,
    },
  };
}
