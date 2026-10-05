import { beforeEach, describe, expect, it } from "vitest";

class MemoryStorage {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.has(k) ? (this.data.get(k) as string) : null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, String(v));
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
  clear() {
    this.data.clear();
  }
}
const storage = new MemoryStorage();
(globalThis as unknown as { localStorage: MemoryStorage }).localStorage = storage;

import { defaultSettings } from "./state";
import { soundStatus, useMixerStore } from "./store";

const store = () => useMixerStore.getState();
let pending: string | null = null;

async function reload() {
  useMixerStore.setState({ settings: defaultSettings(), playing: false, problem: null, hydrated: false });
  if (pending !== null) storage.setItem("fy-mixer", pending);
  pending = null;
  await useMixerStore.persist.rehydrate();
}

beforeEach(async () => {
  storage.clear();
  await reload();
});

describe("restoring from localStorage", () => {
  it("a first visit (nothing stored) gives the default mixer, hydrated and silent", () => {
    expect(store().hydrated).toBe(true);
    expect(store().settings).toEqual(defaultSettings());
    expect(store().playing).toBe(false);
  });

  it("restores saved levels, master and mute", async () => {
    pending = JSON.stringify({ state: { settings: { levels: { rain: 0.9 }, master: 0.3, muted: true } }, version: 1 });
    await reload();
    expect(store().settings.levels.rain).toBe(0.9);
    expect(store().settings.master).toBe(0.3);
    expect(store().settings.muted).toBe(true);
  });

  it("unparseable JSON falls back to the defaults and still marks hydrated", async () => {
    pending = "{not json";
    await reload();
    expect(store().hydrated).toBe(true);
    expect(store().settings).toEqual(defaultSettings());
  });

  it("wrong shapes and wild numbers are cleaned, not trusted", async () => {
    pending = JSON.stringify({
      state: { settings: { levels: { rain: 99, fire: "x", evil: 1 }, master: -5, muted: "yes" } },
      version: 1,
    });
    await reload();
    expect(store().settings.levels.rain).toBe(1);
    expect(store().settings.levels.fire).toBe(0); // default for fire is 0
    expect("evil" in store().settings.levels).toBe(false);
    expect(store().settings.master).toBe(0);
    expect(store().settings.muted).toBe(false);
  });

  it("a stored `playing: true` is ignored: sound never autoplays after a reload", async () => {
    pending = JSON.stringify({ state: { settings: defaultSettings(), playing: true }, version: 1 });
    await reload();
    expect(store().playing).toBe(false);
  });

  it("does not persist `playing` or the problem flag either", () => {
    store().play();
    const raw = JSON.parse(storage.getItem("fy-mixer") ?? "{}");
    expect(raw.state.playing).toBeUndefined();
    expect(raw.state.problem).toBeUndefined();
    expect(Object.keys(raw.state)).toEqual(["settings"]);
  });
});

describe("actions", () => {
  it("setLevel clamps and ignores unknown layers", () => {
    store().setLevel("rain", 4);
    expect(store().settings.levels.rain).toBe(1);
    store().setLevel("rain", -1);
    expect(store().settings.levels.rain).toBe(0);
    store().setLevel("rain", NaN);
    expect(store().settings.levels.rain).toBe(0);
    const before = JSON.stringify(store().settings);
    store().setLevel("thunder" as never, 1);
    expect(JSON.stringify(store().settings)).toBe(before);
  });

  it("setLevel changes only that layer", () => {
    const before = store().settings.levels;
    store().setLevel("piano", 0.77);
    expect(store().settings.levels.piano).toBe(0.77);
    for (const k of ["rain", "fire", "keyboard", "cafe"] as const) expect(store().settings.levels[k]).toBe(before[k]);
  });

  it("setMaster clamps", () => {
    store().setMaster(2);
    expect(store().settings.master).toBe(1);
  });

  it("persists a change", () => {
    store().setLevel("fire", 0.5);
    expect(JSON.parse(storage.getItem("fy-mixer")!).state.settings.levels.fire).toBe(0.5);
  });
});

describe("the sound button", () => {
  it("off -> play (unmuted) -> mute -> unmute", () => {
    store().setMuted(true);
    expect(soundStatus(store())).toBe("off");
    store().toggleSound();
    expect(store().playing).toBe(true);
    expect(store().settings.muted).toBe(false); // starting also unmutes
    expect(soundStatus(store())).toBe("on");
    store().toggleSound();
    expect(store().playing).toBe(true);
    expect(soundStatus(store())).toBe("muted");
    store().toggleSound();
    expect(soundStatus(store())).toBe("on");
  });

  it("pause stops playing but keeps the levels", () => {
    store().setLevel("rain", 0.8);
    store().play();
    store().pause();
    expect(store().playing).toBe(false);
    expect(store().settings.levels.rain).toBe(0.8);
  });

  it("a blocked browser turns playing off and records why; play clears it", () => {
    store().play();
    store().setProblem("blocked");
    expect(store().playing).toBe(false);
    expect(store().problem).toBe("blocked");
    store().play();
    expect(store().problem).toBeNull();
    expect(store().playing).toBe(true);
  });
});
