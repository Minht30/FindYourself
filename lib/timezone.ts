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
