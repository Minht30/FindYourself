"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isValidFocusGoal } from "@/lib/rings";
import { TZ_COOKIE, TZ_MANUAL_COOKIE, isKnownTimeZone, parseZoneSetting, zoneFromCookie, type ZoneSettingInput } from "@/lib/timezone";
import { resolveTheme, parseThemePrefs, type ThemePrefs } from "@/lib/theme";
import { THEME_COOKIE, THEME_PREF_COOKIE, serializePrefs } from "@/lib/themeCookies";
import { getNow } from "@/lib/today";

export type SaveTimeZoneResult = { ok: true } | { ok: false; error: "unauthenticated" | "bad_timezone" | "db_error" };

// The database decides which calendar day a diary entry or a finished task
// belongs to (the streak, Phase 8), so it needs the person's zone. The browser
// reports it; this saves it on the profile. A new zone makes the database
// recompute the streak (trigger `profiles_streak_tz`).
export async function saveTimeZone(zone: string): Promise<SaveTimeZoneResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  if (!isKnownTimeZone(zone)) return { ok: false, error: "bad_timezone" };

  // The browser reports its zone on every visit. If the person chose a zone of
  // their own in Settings, that choice stands: the browser does not overwrite it.
  const { data: profile } = await supabase.from("profiles").select("timezone_manual").eq("id", user.id).maybeSingle();
  if (profile?.timezone_manual) return { ok: true };

  const { error } = await supabase.from("profiles").update({ timezone: zone }).eq("id", user.id);
  if (error) return { ok: false, error: error.code === "22023" ? "bad_timezone" : "db_error" };

  revalidatePath("/", "layout");
  return { ok: true };
}

export type SaveFocusGoalResult = { ok: true } | { ok: false; error: "unauthenticated" | "bad_goal" | "db_error" };

// The daily focus goal behind the focus ring on /today: whole minutes, 15 to
// 720 in steps of 5. Checked here for a named reason, and again by the
// database (`profiles_focus_goal_range`).
export async function saveFocusGoal(minutes: number): Promise<SaveFocusGoalResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  if (!isValidFocusGoal(minutes)) return { ok: false, error: "bad_goal" };

  const { error } = await supabase.from("profiles").update({ daily_focus_goal_minutes: minutes }).eq("id", user.id);
  if (error) return { ok: false, error: error.code === "23514" ? "bad_goal" : "db_error" };

  revalidatePath("/today");
  return { ok: true };
}

export type SaveZoneSettingResult =
  | { ok: true; mode: "auto" | "manual"; zone: string }
  | { ok: false; error: "unauthenticated" | "bad_mode" | "bad_timezone" | "db_error" };

const YEAR_SECONDS = 60 * 60 * 24 * 365;

// Settings -> Time zone. "Automatic" follows the device (the browser tells us
// its zone); "choose" pins a zone the person picked. Either way the profile and
// the two cookies the server reads are set together, so the very next page
// already works in the new zone and the database recounts the streak (trigger
// `profiles_streak_tz`). A manual zone is also what other devices follow.
export async function saveTimeZoneSetting(input: ZoneSettingInput): Promise<SaveZoneSettingResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const parsed = parseZoneSetting(input);
  if (!parsed.ok) return { ok: false, error: parsed.reason };
  const { mode, zone } = parsed.setting;

  const { error } = await supabase
    .from("profiles")
    .update({ timezone: zone, timezone_manual: mode === "manual" })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.code === "22023" ? "bad_timezone" : "db_error" };

  const jar = cookies();
  const options = { path: "/", maxAge: YEAR_SECONDS, sameSite: "lax" as const };
  jar.set(TZ_COOKIE, zone, options);
  if (mode === "manual") jar.set(TZ_MANUAL_COOKIE, zone, options);
  else jar.set(TZ_MANUAL_COOKIE, "", { path: "/", maxAge: 0 });

  revalidatePath("/", "layout");
  return { ok: true, mode, zone };
}

export type SaveThemePrefsResult =
  | { ok: true; prefs: ThemePrefs }
  | { ok: false; error: "unauthenticated" | "bad_mode" | "bad_region" | "region_unavailable" | "db_error" };

// Settings -> Appearance and the top bar chip. The choice goes on the profile (so
// every device follows it) and into the two cookies the server reads, together, so
// the very next render already paints the right theme. Anything the app cannot
// draw is refused by name (parseThemePrefs) before the profile is touched; the
// database re-checks it (constraints on `theme_mode`, `day_region`, `night_region`).
export async function saveThemePrefs(input: unknown): Promise<SaveThemePrefsResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const parsed = parseThemePrefs(input);
  if (!parsed.ok) return { ok: false, error: parsed.reason };
  const { prefs } = parsed;

  const { error } = await supabase
    .from("profiles")
    .update({ theme_mode: prefs.mode, day_region: prefs.dayRegion, night_region: prefs.nightRegion })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.code === "23514" ? "bad_region" : "db_error" };

  const jar = cookies();
  const options = { path: "/", maxAge: YEAR_SECONDS, sameSite: "lax" as const };
  jar.set(THEME_PREF_COOKIE, serializePrefs(prefs), options);
  jar.set(THEME_COOKIE, resolveTheme(prefs, getNow().getTime(), zoneFromCookie(jar.get(TZ_COOKIE)?.value) ?? "UTC"), options);

  revalidatePath("/", "layout");
  return { ok: true, prefs };
}
