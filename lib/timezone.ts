// A time zone name, checked the way the rest of the app resolves one: the
// runtime's own Intl must know it. The database re-checks against its own
// list (trigger `profiles_check_timezone`, error `bad_timezone`).
const MAX_ZONE_LENGTH = 64;

export function isKnownTimeZone(zone: unknown): zone is string {
  if (typeof zone !== "string" || zone.length === 0 || zone.length > MAX_ZONE_LENGTH) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

// ── The zone the app works in ─────────────────────────────────────────────
// Automatic: the browser's own zone, saved on the profile so the database
// counts days where the person is. Manual (Settings): a zone they chose, kept
// on the profile (`timezone_manual`) and followed by every page and device.
//
// Two cookies carry it to the server, which has no browser to ask:
//   fy-tz         the zone in effect right now (what the server reads)
//   fy-tz-manual  present only in manual mode, holding the chosen zone; the
//                 inline script in the root layout lets it win over the browser's
export const TZ_COOKIE = "fy-tz";
export const TZ_MANUAL_COOKIE = "fy-tz-manual";

export type ZoneSettingInput = { mode: "auto"; browserZone: string } | { mode: "manual"; zone: string };

export type ZoneSettingResult =
  | { ok: true; setting: { mode: "auto"; zone: string } | { mode: "manual"; zone: string } }
  | { ok: false; reason: "bad_mode" | "bad_timezone" };

// What a "change my time zone" request may be. Anything else is refused by
// name before the profile is touched.
export function parseZoneSetting(input: unknown): ZoneSettingResult {
  if (typeof input !== "object" || input === null) return { ok: false, reason: "bad_mode" };
  const i = input as { mode?: unknown; browserZone?: unknown; zone?: unknown };
  if (i.mode === "auto") {
    return isKnownTimeZone(i.browserZone) ? { ok: true, setting: { mode: "auto", zone: i.browserZone } } : { ok: false, reason: "bad_timezone" };
  }
  if (i.mode === "manual") {
    return isKnownTimeZone(i.zone) ? { ok: true, setting: { mode: "manual", zone: i.zone } } : { ok: false, reason: "bad_timezone" };
  }
  return { ok: false, reason: "bad_mode" };
}

// A cookie value that may be percent-encoded, into a known zone or null.
export function zoneFromCookie(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    return null;
  }
  return isKnownTimeZone(value) ? value : null;
}

// The zone to use: the chosen one if there is one, else the browser's.
export function effectiveZone(manualCookie: string | undefined | null, browserZone: string | undefined | null): string {
  return zoneFromCookie(manualCookie) ?? (isKnownTimeZone(browserZone) ? browserZone : "UTC");
}

// ── The picker's list ─────────────────────────────────────────────────────
export type ZoneGroup = { region: string; zones: { value: string; label: string }[] };

// "America/Argentina/Buenos_Aires" -> "Argentina / Buenos Aires"
export function zoneLabel(zone: string): string {
  const rest = zone.includes("/") ? zone.slice(zone.indexOf("/") + 1) : zone;
  return rest.replace(/_/g, " ").replace(/\//g, " / ");
}

// The zones the browser knows, grouped by region for a <select> ("Africa",
// "America", ..., then "Other" for UTC and Etc/*), each group sorted by name.
export function groupZones(zones: readonly string[]): ZoneGroup[] {
  const byRegion = new Map<string, { value: string; label: string }[]>();
  for (const zone of new Set(zones)) {
    const slash = zone.indexOf("/");
    const region = slash === -1 || zone.startsWith("Etc/") ? "Other" : zone.slice(0, slash);
    const list = byRegion.get(region) ?? [];
    list.push({ value: zone, label: zoneLabel(zone) });
    byRegion.set(region, list);
  }
  return [...byRegion.entries()]
    .map(([region, list]) => ({ region, zones: list.sort((a, b) => a.label.localeCompare(b.label)) }))
    .sort((a, b) => (a.region === "Other" ? 1 : b.region === "Other" ? -1 : a.region.localeCompare(b.region)));
}
