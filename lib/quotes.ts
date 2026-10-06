import { isValidISODate } from "@/lib/dates";

// The daily quote. The list lives in the `quotes` table (global, read-only);
// which one shows on which day is a pure function of the calendar date, so the
// same date gives the same quote to everyone and nothing needs storing.
//
// Walking the list one by one would show neighbouring (and often similar)
// lines on neighbouring days. Instead the day number is multiplied by a stride
// that shares no factor with the list length: consecutive days land far apart,
// and any `n` consecutive days show every quote exactly once, so a quote
// repeats only after a full lap (about four months with ~120 quotes).

export const QUOTE_COLUMNS = "id, text, author";

export type Quote = { id: number; text: string; author: string | null };

const MS_PER_DAY = 86_400_000;

// Whole days since 1970-01-01 for a YYYY-MM-DD date (no zone: it is a date).
export function dayNumber(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

function gcd(a: number, b: number): number {
  while (b) [a, b] = [b, a % b];
  return a;
}

// The smallest number at or above 38 % of the list length that is coprime with
// it (the golden-ratio spread keeps neighbouring days well apart).
export function strideFor(n: number): number {
  if (n <= 1) return 1;
  let s = Math.max(1, Math.round(n * 0.382));
  while (gcd(s, n) !== 1) s += 1;
  return s;
}

export function quoteIndexForDay(day: number, n: number): number {
  if (n <= 0) return -1;
  const raw = (day * strideFor(n)) % n;
  return raw < 0 ? raw + n : raw;
}

// Rows in, today's quote out. Order of the input does not matter (rows are
// sorted by id first); an empty list or a malformed date is `null`.
export function quoteForDate(iso: string, quotes: readonly Quote[]): Quote | null {
  if (!isValidISODate(iso) || quotes.length === 0) return null;
  const sorted = [...quotes].sort((a, b) => a.id - b.id);
  return sorted[quoteIndexForDay(dayNumber(iso), sorted.length)] ?? null;
}

// A row from the database into a Quote, or null if it is malformed. Text is
// shown as text, never as markup.
export function toQuote(row: { id?: unknown; text?: unknown; author?: unknown } | null | undefined): Quote | null {
  if (!row || typeof row.id !== "number" || !Number.isInteger(row.id)) return null;
  if (typeof row.text !== "string" || row.text.trim() === "") return null;
  const author = typeof row.author === "string" && row.author.trim() !== "" ? row.author.trim() : null;
  return { id: row.id, text: row.text.trim(), author };
}
