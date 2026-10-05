import { describe, expect, it } from "vitest";
import { resolveInitial } from "./resolve";
import { defaultSettings, type MixerSettings } from "./state";

const defaults = defaultSettings();
const mix = (rain: number, over: Partial<MixerSettings> = {}): MixerSettings => ({
  ...defaults,
  levels: { ...defaults.levels, rain },
  ...over,
});

describe("resolveInitial", () => {
  it("unsaved local edits win over the account, and are sent up", () => {
    const r = resolveInitial({ local: { settings: mix(0.9), pending: true }, server: mix(0.2), defaults });
    expect(r).toEqual({ settings: mix(0.9), pending: true, source: "local-pending" });
  });

  it("a saved local mix gives way to the account (a new device sounds like the old one)", () => {
    const r = resolveInitial({ local: { settings: mix(0.9), pending: false }, server: mix(0.2), defaults });
    expect(r.source).toBe("server");
    expect(r.settings.levels.rain).toBe(0.2);
    expect(r.pending).toBe(false);
  });

  it("no local state at all: the account wins", () => {
    const r = resolveInitial({ local: null, server: mix(0.2), defaults });
    expect(r).toMatchObject({ source: "server", pending: false });
  });

  it("no account row but a customised local mix: keep it and push it up", () => {
    const r = resolveInitial({ local: { settings: mix(0.9), pending: false }, server: null, defaults });
    expect(r).toEqual({ settings: mix(0.9), pending: true, source: "local" });
  });

  it("no account row and a local mix equal to the defaults: nothing to save (no row for a user who never touched it)", () => {
    const r = resolveInitial({ local: { settings: defaults, pending: false }, server: null, defaults });
    expect(r).toEqual({ settings: defaults, pending: false, source: "defaults" });
  });

  it("nothing anywhere: the defaults", () => {
    expect(resolveInitial({ local: null, server: null, defaults })).toEqual({
      settings: defaults,
      pending: false,
      source: "defaults",
    });
  });

  it("a muted-only difference counts as customised", () => {
    const r = resolveInitial({ local: { settings: { ...defaults, muted: true }, pending: false }, server: null, defaults });
    expect(r.source).toBe("local");
    expect(r.pending).toBe(true);
  });
});
