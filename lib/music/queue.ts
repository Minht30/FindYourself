import { shuffle } from "./playlist";

// The play queue as a pure state machine: no audio, no React, no clock. The
// player feeds it events (a click, the track ending, a track being deleted) and
// does what the answer says. Every transition returns the new state and an
// `action` telling the player what to do about *playback*:
//
//   play     start playing `state.current` (load it first)
//   restart  seek the current track to 0 and keep going
//   stop     pause; `state.current` is where it stopped (the queue's start)
//   keep     nothing about playback changes
//
// `base` is the list as the person ordered it (a playlist, or the library);
// `order` is the play order: `base`, or a shuffled permutation of it.

export type Repeat = "off" | "all" | "one";
export const REPEAT_MODES: readonly Repeat[] = ["off", "all", "one"];

export type QueueState = {
  base: string[];
  order: string[];
  current: string | null;
  shuffle: boolean;
  seed: number;
  repeat: Repeat;
};

export type Action = "play" | "restart" | "stop" | "keep";
export type Transition = { state: QueueState; action: Action };

// Pressing "previous" more than this far into a track restarts it instead.
export const RESTART_AFTER_SECONDS = 3;

export const emptyQueue = (): QueueState => ({
  base: [],
  order: [],
  current: null,
  shuffle: false,
  seed: 1,
  repeat: "off",
});

const uniq = (ids: readonly string[]) => [...new Set(ids)];
const idx = (s: QueueState) => (s.current === null ? -1 : s.order.indexOf(s.current));
const result = (state: QueueState, action: Action): Transition => ({ state, action });

// A fresh queue from `base`, starting at `startId` (or the first in play
// order). The shuffle setting and repeat mode carry over from `prev`.
export function load(prev: QueueState, base: readonly string[], startId?: string | null, seed = prev.seed): QueueState {
  const list = uniq(base);
  const start = startId && list.includes(startId) ? startId : null;
  const order = prev.shuffle ? shuffle(list, seed, start ?? undefined) : list;
  return { ...prev, base: list, order, seed, current: start ?? order[0] ?? null };
}

// Play something now: `startId` of `base`.
export function playFrom(prev: QueueState, base: readonly string[], startId?: string | null, seed?: number): Transition {
  const state = load(prev, base, startId, seed);
  return result(state, state.current === null ? "stop" : "play");
}

// The track ended on its own (`auto`), or "next" was pressed.
export function next(s: QueueState, auto: boolean): Transition {
  if (s.current === null) return result(s, "stop");
  if (auto && s.repeat === "one") return result(s, "restart");
  const i = idx(s);
  if (i >= 0 && i < s.order.length - 1) return result({ ...s, current: s.order[i + 1] }, "play");

  // At the end of the queue.
  if (s.repeat === "all" && s.order.length > 0) {
    if (!s.shuffle) return result({ ...s, current: s.order[0] }, s.order.length === 1 ? "restart" : "play");
    // A new lap of a shuffled queue: a fresh order whose first track is not the one just played.
    const seed = s.seed + 1;
    let order = shuffle(s.base, seed);
    if (order.length > 1 && order[0] === s.current) order = [...order.slice(1), order[0]];
    return result({ ...s, order, seed, current: order[0] }, order.length === 1 ? "restart" : "play");
  }
  // repeat off: stop, parked on the first track
  return result({ ...s, current: s.order[0] ?? null }, "stop");
}

// "Previous": past the first seconds it restarts this track; otherwise it goes
// back one (and wraps with repeat all); at the very start it restarts.
export function previous(s: QueueState, positionSeconds: number): Transition {
  if (s.current === null) return result(s, "stop");
  if (positionSeconds > RESTART_AFTER_SECONDS) return result(s, "restart");
  const i = idx(s);
  if (i > 0) return result({ ...s, current: s.order[i - 1] }, "play");
  if (s.repeat === "all" && s.order.length > 1) return result({ ...s, current: s.order[s.order.length - 1] }, "play");
  return result(s, "restart");
}

// Jump to a track in the queue (a click in a list).
export function jump(s: QueueState, id: string): Transition {
  return s.order.includes(id) ? result({ ...s, current: id }, "play") : result(s, "keep");
}

// Shuffle on: a new random order with the current track kept in front, so
// turning it on does not skip. Off: back to the list's own order, still on the
// same track.
export function setShuffle(s: QueueState, on: boolean, seed = s.seed + 1): Transition {
  if (on === s.shuffle) return result(s, "keep");
  const order = on ? shuffle(s.base, seed, s.current ?? undefined) : [...s.base];
  return result({ ...s, shuffle: on, seed: on ? seed : s.seed, order }, "keep");
}

export const setRepeat = (s: QueueState, repeat: Repeat): Transition =>
  repeat === s.repeat ? result(s, "keep") : result({ ...s, repeat }, "keep");

// off -> all -> one -> off
export const cycleRepeat = (s: QueueState): Transition =>
  setRepeat(s, REPEAT_MODES[(REPEAT_MODES.indexOf(s.repeat) + 1) % REPEAT_MODES.length]);

// The library changed under the queue (a track was deleted, a playlist
// reordered). Keep what is still valid. If the playing track vanished, move on
// to whatever now sits where it was (`play`), or stop if nothing is left.
export function reconcile(s: QueueState, valid: ReadonlySet<string>, newBase?: readonly string[]): Transition {
  const base = (newBase ?? s.base).filter((id) => valid.has(id));
  const cleanBase = uniq(base);
  const kept = s.order.filter((id) => cleanBase.includes(id));
  // tracks that are new to the base go on the end of a shuffled order, in base order
  const order = s.shuffle ? [...kept, ...cleanBase.filter((id) => !kept.includes(id))] : cleanBase;

  if (s.current === null || order.includes(s.current)) {
    const state = { ...s, base: cleanBase, order };
    return result(state, "keep");
  }
  // the playing track is gone: the one that now sits at its old index, else the last, else nothing
  const at = Math.min(Math.max(s.order.indexOf(s.current), 0), Math.max(order.length - 1, 0));
  const current = order[at] ?? null;
  return result({ ...s, base: cleanBase, order, current }, current === null ? "stop" : "play");
}

// Sanitises a queue read back from localStorage (anything can be in there).
export function sanitizeQueue(raw: unknown, valid?: ReadonlySet<string>): QueueState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const ids = (v: unknown): string[] =>
    Array.isArray(v) ? uniq(v.filter((x): x is string => typeof x === "string" && (!valid || valid.has(x)))) : [];
  const base = ids(r.base);
  const shuffled = r.shuffle === true;
  const seed = typeof r.seed === "number" && Number.isFinite(r.seed) ? Math.trunc(r.seed) : 1;
  const repeat = REPEAT_MODES.includes(r.repeat as Repeat) ? (r.repeat as Repeat) : "off";
  let order = ids(r.order).filter((id) => base.includes(id));
  // an order that is not a permutation of base is rebuilt from base; without shuffle the order is the base
  if (!shuffled || order.length !== base.length) order = shuffled ? shuffle(base, seed) : [...base];
  const current = typeof r.current === "string" && order.includes(r.current) ? r.current : (order[0] ?? null);
  return { base, order, current, shuffle: shuffled, seed, repeat };
}
