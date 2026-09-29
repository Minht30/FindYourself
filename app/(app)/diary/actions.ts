"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserToday } from "@/lib/today";
import { isValidISODate } from "@/lib/dates";

type ActionResult = { ok: true; updatedAt: string } | { ok: false; error: string };

export type SaveDiaryInput = {
  date: string;        // YYYY-MM-DD
  contentJson: unknown; // Tiptap document
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
  if (!isTiptapDoc(input.contentJson)) return { ok: false, error: "invalid_content" };
  if (JSON.stringify(input.contentJson).length > MAX_JSON_BYTES) return { ok: false, error: "too_large" };
  if (typeof input.contentText !== "string") return { ok: false, error: "invalid_content" };

  // Upsert touches only the columns listed, so a mood set elsewhere survives.
  const { data, error } = await supabase
    .from("diary_entries")
    .upsert(
      {
        user_id: user.id,
        entry_date: input.date,
        content_json: input.contentJson,
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
