import { describe, expect, it } from "vitest";
import { DELETE_MESSAGES, DELETE_PHRASE, confirmationOk, ownObjectPaths } from "@/lib/accountDeletion";
import { createAdminClient } from "@/lib/supabase/admin";

describe("confirmationOk", () => {
  it("accepts only the exact phrase", () => {
    expect(confirmationOk(DELETE_PHRASE)).toBe(true);
    for (const bad of ["delete", "Delete", " DELETE", "DELETE ", "DELETE\n", "DELET", "", null, undefined, 1, {}, ["DELETE"]]) {
      expect(confirmationOk(bad)).toBe(false);
    }
  });
});

describe("ownObjectPaths", () => {
  const uid = "14cc53ea-a95f-40dd-86d3-ebbb184756b4";

  it("prefixes names with the person's own folder", () => {
    expect(ownObjectPaths(uid, ["a.mp3", "b.mp3"])).toEqual([`${uid}/a.mp3`, `${uid}/b.mp3`]);
    expect(ownObjectPaths(uid, [])).toEqual([]);
  });

  it("never lets a listed name reach outside that folder", () => {
    const names = ["", "../other/x.mp3", "sub/x.mp3", "a/../b.mp3", "..", "x\\y.mp3", "ok.mp3"];
    expect(ownObjectPaths(uid, names)).toEqual([`${uid}/ok.mp3`]);
  });

  it("ignores things that are not strings", () => {
    expect(ownObjectPaths(uid, [null as unknown as string, 5 as unknown as string, "ok.mp3"])).toEqual([`${uid}/ok.mp3`]);
  });
});

describe("createAdminClient", () => {
  it("is absent unless both the address and the service key are set", () => {
    expect(createAdminClient({})).toBeNull();
    expect(createAdminClient({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" })).toBeNull();
    expect(createAdminClient({ SUPABASE_SERVICE_ROLE_KEY: "k" })).toBeNull();
    expect(createAdminClient({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "" })).toBeNull();
  });

  it("builds a client when configured", () => {
    expect(createAdminClient({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k" })).not.toBeNull();
  });
});

describe("messages", () => {
  it("say what happened in words, and never promise the data is gone when it is not", () => {
    for (const m of Object.values(DELETE_MESSAGES)) expect(m.length).toBeGreaterThan(10);
    expect(DELETE_MESSAGES.storage_error).toMatch(/nothing was deleted/i);
    expect(DELETE_MESSAGES.not_configured).toMatch(/nothing was deleted/i);
    expect(DELETE_MESSAGES.delete_failed).toMatch(/still there/i);
  });
});
