import { readFileSync } from "node:fs";
import path from "node:path";

// Test helper: reads the real stylesheet so tests check what ships. (Not imported by app code.)
// CRLF on Windows checkouts is normalised, so multi-line selectors match everywhere.
export const css = readFileSync(path.resolve(__dirname, "../app/globals.css"), "utf8").replaceAll("\r\n", "\n");

// The six-digit hex tokens (`--name: #RRGGBB;`) of the first rule that starts with `selector`.
// A selector that is not in the stylesheet throws: indexOf's -1 would otherwise land on the
// first block in the file and check the wrong theme.
export function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`selector not found in globals.css: ${selector}`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  const out: Record<string, string> = {};
  for (const m of css.slice(open, close).matchAll(/--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})\s*;/g)) out[m[1]] = m[2];
  return out;
}

export const THEME_SELECTORS = {
  monstadt: ':root,\n:root[data-theme="monstadt"]',
  "nodkrai-night": ':root[data-theme="nodkrai-night"]',
} as const;
