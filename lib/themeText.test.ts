import { describe, expect, it } from "vitest";
import { COMING_SOON, DAY_REGIONS, NIGHT_REGIONS } from "@/lib/theme";
import { MODE_OPTIONS, REGION_CARDS, THEME_REASONS, modeMessage, reasonText, regionMessage } from "@/lib/themeText";

describe("the region cards", () => {
  it("has one card per region the app can draw and per region coming soon, day first", () => {
    expect(REGION_CARDS.map((c) => `${c.mode}:${c.region}`)).toEqual(["day:monstadt", "day:liyue", "night:nodkrai", "night:natlan"]);
  });

  it("makes exactly the regions the resolver can draw selectable", () => {
    for (const c of REGION_CARDS) {
      const drawable = (c.mode === "day" ? (DAY_REGIONS as readonly string[]) : (NIGHT_REGIONS as readonly string[])).includes(c.region);
      expect(c.available, c.region).toBe(drawable);
    }
    for (const r of [...COMING_SOON.day, ...COMING_SOON.night]) expect(REGION_CARDS.find((c) => c.region === r)?.available, r).toBe(false);
  });

  it("gives every selectable card a picture and no coming-soon card one", () => {
    for (const c of REGION_CARDS) expect(c.thumb !== null, c.region).toBe(c.available);
  });

  it("describes each card in a sentence", () => {
    for (const c of REGION_CARDS) expect(c.blurb.length, c.region).toBeGreaterThan(10);
  });
});

describe("the mode options", () => {
  it("are Day, Night, Auto, with the values the profile accepts", () => {
    expect(MODE_OPTIONS.map((o) => o.value)).toEqual(["day", "night", "auto"]);
  });
});

describe("refusals in words", () => {
  it("names every reason saveThemePrefs can return, each different", () => {
    for (const r of ["unauthenticated", "bad_mode", "bad_region", "region_unavailable", "db_error"]) expect(THEME_REASONS[r], r).toBeTruthy();
    expect(new Set(Object.values(THEME_REASONS)).size).toBe(Object.keys(THEME_REASONS).length);
  });

  it("says a region that is coming soon is not available yet, not that it does not exist", () => {
    expect(reasonText("region_unavailable")).toBe("That region is not available yet.");
    expect(reasonText("bad_region")).not.toBe(reasonText("region_unavailable"));
  });

  it("an unknown reason is the save failure, never an empty message", () => {
    expect(reasonText("something_new")).toBe(THEME_REASONS.db_error);
  });
});

describe("what the live region announces", () => {
  it("a change of mode names the scene now showing", () => {
    expect(modeMessage("night", "nodkrai-night")).toBe("Night mode. Showing Nod-Krai, night.");
    expect(modeMessage("day", "monstadt")).toBe("Day mode. Showing Monstadt, day.");
  });

  it("going back to Auto says it follows the clock, and what that gives right now", () => {
    expect(modeMessage("auto", "nodkrai-night")).toBe("Auto: following your clock. Showing Nod-Krai, night now.");
    expect(modeMessage("auto", "monstadt")).toBe("Auto: following your clock. Showing Monstadt, day now.");
  });

  it("a region picked for the mode on screen says the scene switched", () => {
    expect(regionMessage("day", "monstadt", "monstadt")).toBe("Switched to Monstadt, day.");
    expect(regionMessage("night", "nodkrai", "nodkrai-night")).toBe("Switched to Nod-Krai, night.");
  });

  it("a region picked for the mode that is not on screen says it is kept for later", () => {
    expect(regionMessage("night", "nodkrai", "monstadt")).toBe("Nod-Krai is now your night scene.");
    expect(regionMessage("day", "monstadt", "nodkrai-night")).toBe("Monstadt is now your day scene.");
  });
});
