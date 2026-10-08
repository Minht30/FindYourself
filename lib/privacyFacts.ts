// What the app keeps in the visitor's browser, in plain words: the single list
// the privacy page prints. A test (privacyFacts.test.ts) scans the source for
// every `fy-...` key and fails if one is missing here, so the page cannot fall
// behind the code.

export type StoredItem = {
  /** The cookie or localStorage key. */
  key: string;
  kind: "cookie" | "device storage";
  what: string;
};

export const STORED_ITEMS: readonly StoredItem[] = [
  { key: "sb-…-auth-token", kind: "cookie", what: "Keeps you signed in (set by the sign-in service)." },
  { key: "fy-tz", kind: "cookie", what: "Your time zone, so the server knows which day it is for you." },
  { key: "fy-tz-manual", kind: "cookie", what: "Only if you pick your own time zone in Settings: the zone you chose." },
  { key: "fy-tasks-drawer", kind: "cookie", what: "Whether the task drawer is open." },
  { key: "fy-theme-pref", kind: "cookie", what: "Your appearance choice: Day, Night or Auto, and the region you picked for each." },
  { key: "fy-theme", kind: "cookie", what: "The scene showing right now (day or night), so the page is painted in the right one before it loads." },
  { key: "fy-mixer", kind: "device storage", what: "Your ambient sound mix, so it is there before you sign in." },
  { key: "fy-music", kind: "device storage", what: "Your music queue, volume and place in the song." },
  { key: "fy-focus", kind: "device storage", what: "The focus timer and its settings, so it survives a reload." },
  { key: "fy-focus-music", kind: "device storage", what: "Which music you chose for focus sessions." },
  { key: "fy-focus-outbox", kind: "device storage", what: "Finished focus sessions waiting to be saved if you were offline." },
  { key: "fy-focus-chimed", kind: "device storage", what: "Remembers that a session's end chime already played." },
  { key: "fy-diary-draft:DATE", kind: "device storage", what: "A copy of what you are writing until it is safely saved." },
  { key: "fy-roll-handled:DATE", kind: "device storage", what: "Remembers you already dealt with the end-of-day task tidy-up." },
];

// Keys that look like ours but are not stored data: a CSS class, an event name,
// and a development-only test cookie that production ignores.
export const NOT_STORAGE = new Set(["fy-range", "fy-outbox", "fy-now", "fy-boom", "fy-boom-layout"]);

export function documentedKeys(): Set<string> {
  const out = new Set<string>();
  for (const item of STORED_ITEMS) {
    const k = item.key.replace(/:DATE$/, "");
    if (k.startsWith("fy-")) out.add(k);
  }
  return out;
}
