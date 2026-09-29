"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserToday } from "@/lib/today";
import { isValidISODate } from "@/lib/dates";
import { isDiaryMood, type DiaryMood } from "@/lib/moods";

type ActionResult = { ok: true; updatedAt: string } | { ok: false; error: string };

export type SaveDiaryInput = {
  date: string;        // YYYY-MM-DD
  // Tiptap document as a JSON *string*. ProseMirror builds node attrs as
  // null-prototype objects (e.g. a heading's { level: 2 }), which React's
  // server-action serializer rejects outright, so the client stringifies.
  contentJson: string;
  contentText: string; // plaintext extract (search + heatmap intensity)
};

// A long diary day is a few thousand words; 512 KB of JSON leaves plenty of
// headroom while stopping a runaway payload from landing in the table.
const MAX_JSON_BYTES = 512 * 1024;
const MAX_TEXT_CHARS = 100_000;

function isTiptapDoc(value: unknown): value is { type: "doc" } {
  return typeof value === "object" && value !== null && (value as { type?: unknown }).type === "doc";
}

export async function saveDiaryEntry(input: SaveDiaryInput): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  if (!isValidISODate(input.date)) return { ok: false, error: "invalid_date" };
  if (input.date > getUserToday()) return { ok: false, error: "future_date" };
  if (typeof input.contentJson !== "string") return { ok: false, error: "invalid_content" };
  if (input.contentJson.length > MAX_JSON_BYTES) return { ok: false, error: "too_large" };
  let doc: unknown;
  try {
    doc = JSON.parse(input.contentJson);
  } catch {
    return { ok: false, error: "invalid_content" };
  }
  if (!isTiptapDoc(doc)) return { ok: false, error: "invalid_content" };
  if (typeof input.contentText !== "string") return { ok: false, error: "invalid_content" };

  // Upsert touches only the columns listed, so a mood set elsewhere survives.
  const { data, error } = await supabase
    .from("diary_entries")
    .upsert(
      {
        user_id: user.id,
        entry_date: input.date,
        content_json: doc,
        content_text: input.contentText.slice(0, MAX_TEXT_CHARS),
      },
      { onConflict: "user_id,entry_date" }
    )
    .select("updated_at")
    .single();

  if (error) return { ok: false, error: error.message };

  // Purges the client router cache too, so stepping to another day and back
  // never re-seeds the editor from a stale copy (Next 14 caches dynamic
  // pages client-side for 30 s).
  revalidatePath(`/diary/${input.date}`);
  return { ok: true, updatedAt: data.updated_at };
}

// Sets (or clears, with null) the day's mood. Like saveDiaryEntry, the upsert
// names only its own column, so mood and autosave never overwrite each other.
export async function setDiaryMood(date: string, mood: DiaryMood | null): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  if (!isValidISODate(date)) return { ok: false, error: "invalid_date" };
  if (date > getUserToday()) return { ok: false, error: "future_date" };
  if (mood !== null && !isDiaryMood(mood)) return { ok: false, error: "invalid_mood" };

  // Clearing uses a plain update: if the day has no row yet there is nothing
  // to clear, and we shouldn't create an empty entry just to store "no mood".
  const query =
    mood === null
      ? supabase
          .from("diary_entries")
          .update({ mood: null })
          .eq("user_id", user.id)
          .eq("entry_date", date)
          .select("updated_at")
          .maybeSingle()
      : supabase
          .from("diary_entries")
          .upsert({ user_id: user.id, entry_date: date, mood }, { onConflict: "user_id,entry_date" })
          .select("updated_at")
          .single();

  const { data, error } = await query;
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/diary/${date}`);
  return { ok: true, updatedAt: data?.updated_at ?? new Date().toISOString() };
}
