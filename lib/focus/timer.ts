// Pure pomodoro state machine. No React, no DOM, no clock of its own: every
// function takes `now` (epoch ms), so the same code runs in the store, in unit
// tests, and when a page is restored after being closed.
//
// Time is *derived* from timestamps, never counted tick by tick. A running
// phase stores `endsAt`; a paused or idle one stores `remainingMs`. That is
// what lets the timer survive a refresh, a throttled background tab and a
// laptop sleeping, and lets two tabs agree without talking to each other.

export type Phase = "focus" | "short" | "long";
export type Status = "idle" | "running" | "paused";

export const PHASES: readonly Phase[] = ["focus", "short", "long"];
export const PHASE_LABELS: Record<Phase, string> = {
  focus: "Focus",
  short: "Short break",
  long: "Long break",
};

// A focus session shorter than this is noise (a mis-click), not a session.
export const MIN_LOGGED_ABANDON_MS = 60_000;

export type Settings = {
  focusMin: number;
  shortMin: number;
  longMin: number;
  cyclesBeforeLong: number;
  chime: boolean;
  volume: number; // 0..1
  notifications: boolean;
  autoStart: boolean; // start the next phase on its own
};

export const DEFAULT_SETTINGS: Settings = {
  focusMin: 25,
  shortMin: 5,
  longMin: 15,
  cyclesBeforeLong: 4,
  chime: true,
  volume: 0.6,
  notifications: false,
  autoStart: false,
};

export const LIMITS = {
  minutes: { min: 1, max: 120 },
  cycles: { min: 2, max: 8 },
} as const;

export type LinkKind = "task" | "block";
export type FocusLink = { kind: LinkKind; id: string; title: string };

export type TimerState = {
  phase: Phase;
  status: Status;
  sessionId: string | null; // one id per started phase run; idempotency key for the log
  startedAt: number | null; // when this phase first started (kept across pauses)
  endsAt: number | null; // only while running
  remainingMs: number; // while idle or paused
  plannedMs: number;
  cycle: number; // focus sessions completed since the last long break
  link: FocusLink | null;
};

// What a finished or abandoned focus phase hands to the session log.
export type SessionRecord = {
  id: string;
  startedAt: number;
  endedAt: number;
  durationSec: number; // time actually focused, pauses excluded
  plannedSec: number;
  completed: boolean;
  taskId: string | null;
  blockId: string | null;
  label: string | null;
};

export type Transition = {
  state: TimerState;
  record: SessionRecord | null;
  // Set when a phase ran to zero in this transition (drives chime + toast).
  finished: Phase | null;
};

export function clampMinutes(n: unknown, fallback: number): number {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : fallback;
  return Math.min(LIMITS.minutes.max, Math.max(LIMITS.minutes.min, v));
}

export function sanitizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const cycles =
    typeof r.cyclesBeforeLong === "number" && Number.isFinite(r.cyclesBeforeLong)
      ? Math.round(r.cyclesBeforeLong)
      : DEFAULT_SETTINGS.cyclesBeforeLong;
  const volume =
    typeof r.volume === "number" && Number.isFinite(r.volume) ? Math.min(1, Math.max(0, r.volume)) : DEFAULT_SETTINGS.volume;
  return {
    focusMin: clampMinutes(r.focusMin, DEFAULT_SETTINGS.focusMin),
    shortMin: clampMinutes(r.shortMin, DEFAULT_SETTINGS.shortMin),
    longMin: clampMinutes(r.longMin, DEFAULT_SETTINGS.longMin),
    cyclesBeforeLong: Math.min(LIMITS.cycles.max, Math.max(LIMITS.cycles.min, cycles)),
    chime: typeof r.chime === "boolean" ? r.chime : DEFAULT_SETTINGS.chime,
    volume,
    notifications: typeof r.notifications === "boolean" ? r.notifications : DEFAULT_SETTINGS.notifications,
    autoStart: typeof r.autoStart === "boolean" ? r.autoStart : DEFAULT_SETTINGS.autoStart,
  };
}

export function phaseMs(phase: Phase, s: Settings): number {
  const min = phase === "focus" ? s.focusMin : phase === "short" ? s.shortMin : s.longMin;
  return min * 60_000;
}

export function initialState(s: Settings): TimerState {
  const ms = phaseMs("focus", s);
  return {
    phase: "focus",
    status: "idle",
    sessionId: null,
    startedAt: null,
    endsAt: null,
    remainingMs: ms,
    plannedMs: ms,
    cycle: 0,
    link: null,
  };
}

function isLink(v: unknown): v is FocusLink {
  if (!v || typeof v !== "object") return false;
  const l = v as Record<string, unknown>;
  return (l.kind === "task" || l.kind === "block") && typeof l.id === "string" && typeof l.title === "string";
}

// Persisted state comes from localStorage, which anything can edit and old
// versions can leave behind. Anything unrecognisable falls back to a fresh
// idle timer rather than throwing on load.
export function sanitizeState(raw: unknown, s: Settings): TimerState {
  const fresh = initialState(s);
  if (!raw || typeof raw !== "object") return fresh;
  const r = raw as Record<string, unknown>;
  const phase = PHASES.includes(r.phase as Phase) ? (r.phase as Phase) : null;
  const status: Status | null = r.status === "idle" || r.status === "running" || r.status === "paused" ? r.status : null;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const plannedMs = num(r.plannedMs);
  const remainingMs = num(r.remainingMs);
  if (!phase || !status || plannedMs === null || plannedMs <= 0 || remainingMs === null) return fresh;

  const cycle = num(r.cycle);
  const base: TimerState = {
    phase,
    status,
    sessionId: typeof r.sessionId === "string" ? r.sessionId : null,
    startedAt: num(r.startedAt),
    endsAt: num(r.endsAt),
    remainingMs: Math.min(plannedMs, Math.max(0, remainingMs)),
    plannedMs,
    cycle: cycle === null ? 0 : Math.min(LIMITS.cycles.max, Math.max(0, Math.round(cycle))),
    link: isLink(r.link) ? { kind: r.link.kind, id: r.link.id, title: r.link.title } : null,
  };
  // A running timer without its deadline (or session) can't be resumed honestly.
  if (status === "running" && (base.endsAt === null || base.sessionId === null || base.startedAt === null)) return fresh;
  if (status !== "idle" && (base.sessionId === null || base.startedAt === null)) return fresh;
  if (status !== "running") base.endsAt = null;
  return base;
}

export function remainingAt(state: TimerState, now: number): number {
  if (state.status === "running" && state.endsAt !== null) return Math.max(0, state.endsAt - now);
  return state.remainingMs;
}

export function elapsedMs(state: TimerState, now: number): number {
  return Math.max(0, state.plannedMs - remainingAt(state, now));
}

export function progressAt(state: TimerState, now: number): number {
  return state.plannedMs > 0 ? Math.min(1, elapsedMs(state, now) / state.plannedMs) : 0;
}

export function shouldLogAbandon(elapsed: number): boolean {
  return elapsed >= MIN_LOGGED_ABANDON_MS;
}

// "25:00" at the start, "00:00" only once it is really over (ceil, not floor).
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// After `phase` ends normally, what comes next?
export function nextPhase(phase: Phase, cycle: number, s: Settings): { phase: Phase; cycle: number } {
  if (phase === "focus") {
    const done = cycle + 1;
    return { phase: done >= s.cyclesBeforeLong ? "long" : "short", cycle: done };
  }
  return { phase: "focus", cycle: phase === "long" ? 0 : cycle };
}

function recordFor(state: TimerState, endedAt: number, durationMs: number, completed: boolean): SessionRecord | null {
  if (state.phase !== "focus" || state.sessionId === null || state.startedAt === null) return null;
  return {
    id: state.sessionId,
    startedAt: state.startedAt,
    endedAt,
    durationSec: Math.floor(durationMs / 1000),
    plannedSec: Math.round(state.plannedMs / 1000),
    completed,
    taskId: state.link?.kind === "task" ? state.link.id : null,
    blockId: state.link?.kind === "block" ? state.link.id : null,
    label: state.link?.title ?? null,
  };
}

function idleAt(phase: Phase, cycle: number, link: FocusLink | null, s: Settings): TimerState {
  const ms = phaseMs(phase, s);
  return { phase, status: "idle", sessionId: null, startedAt: null, endsAt: null, remainingMs: ms, plannedMs: ms, cycle, link };
}

export function start(state: TimerState, now: number, newId: () => string): TimerState {
  if (state.status === "running") return state;
  if (state.status === "paused") {
    return { ...state, status: "running", endsAt: now + state.remainingMs };
  }
  return {
    ...state,
    status: "running",
    sessionId: newId(),
    startedAt: now,
    endsAt: now + state.remainingMs,
  };
}

export function pause(state: TimerState, now: number): TimerState {
  if (state.status !== "running") return state;
  return { ...state, status: "paused", remainingMs: remainingAt(state, now), endsAt: null };
}

// Runs the current phase to zero. `at` is the moment it really ended (its
// deadline), not "now": a tick that fires late must not stretch the session.
// With `chain` the next phase starts by itself (autoStart) from `at`.
export function complete(state: TimerState, at: number, s: Settings, chain: boolean, newId: () => string): Transition {
  const record = recordFor(state, at, state.plannedMs, true);
  const next = nextPhase(state.phase, state.cycle, s);
  const idle = idleAt(next.phase, next.cycle, state.link, s);
  return {
    state: chain ? start(idle, at, newId) : idle,
    record,
    finished: state.phase,
  };
}

// Abandon the current phase and go back to a full, idle copy of it. A focus
// phase that got far enough is logged as completed=false; the cycle is not
// advanced, because an abandoned session earns no cup.
export function reset(state: TimerState, now: number, s: Settings): Transition {
  if (state.status === "idle") {
    return { state: idleAt(state.phase, state.cycle, state.link, s), record: null, finished: null };
  }
  const elapsed = elapsedMs(state, now);
  const record = shouldLogAbandon(elapsed) ? recordFor(state, now, elapsed, false) : null;
  return { state: idleAt(state.phase, state.cycle, state.link, s), record, finished: null };
}

// Skipping a break goes straight to the next focus phase. Skipping a focus
// phase is the same as resetting it: it is never counted as done.
export function skip(state: TimerState, now: number, s: Settings, chain: boolean, newId: () => string): Transition {
  if (state.phase === "focus") return reset(state, now, s);
  const next = nextPhase(state.phase, state.cycle, s);
  const idle = idleAt(next.phase, next.cycle, state.link, s);
  return { state: chain ? start(idle, now, newId) : idle, record: null, finished: null };
}

// Called on load and on every tick. If the deadline has passed (a closed tab,
// a sleeping laptop), the phase is completed *as of its deadline*. It never
// chains into the next phase: after being away you land on a calm idle timer,
// not on a break that is already half over.
export function settle(state: TimerState, now: number, s: Settings, newId: () => string): Transition | null {
  if (state.status !== "running" || state.endsAt === null || state.endsAt > now) return null;
  return complete(state, state.endsAt, s, false, newId);
}

// Changing durations only touches an idle timer; a running or paused phase
// keeps the length it started with.
export function applySettings(state: TimerState, s: Settings): TimerState {
  if (state.status !== "idle") return state;
  const ms = phaseMs(state.phase, s);
  return { ...state, remainingMs: ms, plannedMs: ms };
}

export function setLink(state: TimerState, link: FocusLink | null): TimerState {
  return { ...state, link };
}

// Cups in the tally: how many of the cycle's focus sessions are done.
export function cupsFilled(state: TimerState, s: Settings): number {
  return Math.min(state.cycle, s.cyclesBeforeLong);
}
