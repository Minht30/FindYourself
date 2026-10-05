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
  useMixerStore.setState({
    settings: defaultSettings(),
    playing: false,
    problem: null,
    hydrated: false,
    rev: 0,
    pending: false,
    saveStatus: { kind: "idle" },
  });
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
    // only the mix and the "not yet saved" flag are remembered on this device
    expect(Object.keys(raw.state).sort()).toEqual(["pending", "settings"]);
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

describe("saving to the account", () => {
  it("every user edit marks the mix unsaved and bumps the revision", () => {
    expect(store().pending).toBe(false);
    expect(store().rev).toBe(0);
    store().setLevel("rain", 0.9);
    expect([store().pending, store().rev]).toEqual([true, 1]);
    store().setMaster(0.4);
    store().setMuted(true);
    expect(store().rev).toBe(3);
  });

  it("an edit that changes nothing is not an edit (no pointless save)", () => {
    store().setLevel("rain", store().settings.levels.rain);
    store().setMaster(store().settings.master);
    store().setMuted(store().settings.muted);
    expect(store().rev).toBe(0);
    expect(store().pending).toBe(false);
  });

  it("play() unmutes and counts as an edit only when it actually unmutes", () => {
    store().play();
    expect(store().rev).toBe(0);
    store().pause();
    store().setMuted(true);
    const rev = store().rev;
    store().play();
    expect(store().settings.muted).toBe(false);
    expect(store().rev).toBe(rev + 1);
  });

  it("markSaved clears pending only if no newer edit happened meanwhile", () => {
    store().setLevel("rain", 0.9); // rev 1
    store().markSaved(1);
    expect(store().pending).toBe(false);
    store().setLevel("rain", 0.8); // rev 2
    store().setLevel("rain", 0.7); // rev 3
    store().markSaved(2); // the save of rev 2 finished, but rev 3 exists
    expect(store().pending).toBe(true);
    store().markSaved(3);
    expect(store().pending).toBe(false);
  });

  it("pending survives a reload, so an offline edit is still sent later", async () => {
    store().setLevel("rain", 0.9);
    pending = storage.getItem("fy-mixer");
    await reload();
    expect(store().pending).toBe(true);
    expect(store().settings.levels.rain).toBe(0.9);
  });

  it("a stored pending flag that is not literally true is ignored", async () => {
    pending = JSON.stringify({ state: { settings: defaultSettings(), pending: "yes" }, version: 1 });
    await reload();
    expect(store().pending).toBe(false);
  });

  it("applyResolved replaces the mix without counting as an edit", () => {
    const next = { ...defaultSettings(), master: 0.1 };
    store().applyResolved(next, true);
    expect(store().settings.master).toBe(0.1);
    expect(store().pending).toBe(true);
    expect(store().rev).toBe(0);
  });
});
