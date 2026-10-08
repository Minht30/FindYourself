import { describe, expect, it } from "vitest";
import { LAYER_KEYS } from "@/lib/audio/layers";
import { LAYER_ICONS } from "./layerIcons";

describe("mixer icons", () => {
  it("every layer has an icon, and nothing else does", () => {
    expect(Object.keys(LAYER_ICONS).sort()).toEqual([...LAYER_KEYS].sort());
    for (const key of LAYER_KEYS) expect(LAYER_ICONS[key], key).toBeTruthy();
  });

  it("gives each layer its own icon", () => {
    expect(new Set(Object.values(LAYER_ICONS)).size).toBe(LAYER_KEYS.length);
  });
});
