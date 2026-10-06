import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { NOT_STORAGE, STORED_ITEMS, documentedKeys } from "@/lib/privacyFacts";

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name.startsWith(".")) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) && name !== "privacyFacts.ts") out.push(full);
  }
  return out;
}

describe("privacy facts", () => {
  const root = path.resolve(__dirname, "..");
  const found = new Set<string>();
  for (const dir of ["app", "components", "lib"]) {
    for (const file of sourceFiles(path.join(root, dir))) {
      const text = readFileSync(file, "utf8");
      // a key is a quoted / backticked literal that starts with fy- (optionally ending in ':' + template)
      for (const m of text.matchAll(/["'`](fy-[a-z]+(?:-[a-z]+)*)(?=["'`:=;])/g)) found.add(m[1]);
    }
  }

  it("finds the keys the app really uses (the scan itself works)", () => {
    for (const k of ["fy-tz", "fy-theme", "fy-mixer", "fy-music", "fy-focus-music", "fy-tasks-drawer", "fy-diary-draft"]) {
      expect(found.has(k)).toBe(true);
    }
  });

  it("documents every cookie and device-storage key the code uses", () => {
    const documented = documentedKeys();
    const undocumented = [...found].filter((k) => !documented.has(k) && !NOT_STORAGE.has(k));
    expect(undocumented).toEqual([]);
  });

  it("does not list keys the code no longer uses", () => {
    const stale = [...documentedKeys()].filter((k) => !found.has(k));
    expect(stale).toEqual([]);
  });

  it("describes each item in words", () => {
    for (const item of STORED_ITEMS) expect(item.what.length).toBeGreaterThan(10);
    expect(new Set(STORED_ITEMS.map((i) => i.key)).size).toBe(STORED_ITEMS.length);
  });
});
