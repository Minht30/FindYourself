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

// Nod-Krai's content panels are light paper: their colour tokens are re-declared inside this
// scope, so what a text colour really is on a panel is the night block with these laid over it.
export const PAPER_SELECTOR = ':root[data-theme="nodkrai-night"] [data-surface="paper"]';

// The tokens a scope changes, laid over the tokens it sits inside.
export function scoped(base: string, scope: string): Record<string, string> {
  return { ...tokens(base), ...tokens(scope) };
}

// One token of a rule, as written (`calc(...)`, `url(...)`, `82%`), for the tokens that are not hex colours.
export function rawToken(selector: string, name: string): string {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`selector not found in globals.css: ${selector}`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  const m = css.slice(open, close).match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`--${name} is not in ${selector}`);
  return m[1].trim();
}

// `--paper-a: 82%` as 0.82, and `--paper-blur: 10px` as 10.
export function paperAlpha(selector: string): number {
  const m = rawToken(selector, "paper-a").match(/^(\d+)%$/);
  if (!m) throw new Error(`--paper-a in ${selector} is not a whole percentage`);
  return Number(m[1]) / 100;
}
export function paperBlur(selector: string): number {
  const m = rawToken(selector, "paper-blur").match(/^(\d+)px$/);
  if (!m) throw new Error(`--paper-blur in ${selector} is not whole pixels`);
  return Number(m[1]);
}
