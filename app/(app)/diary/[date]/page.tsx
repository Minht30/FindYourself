import Link from "next/link";
import { redirect } from "next/navigation";
import { NotebookPen } from "lucide-react";
import type { JSONContent } from "@tiptap/react";
import { createClient } from "@/lib/supabase/server";
import DiaryEditor from "@/components/diary/DiaryEditor";
import MoodPicker from "@/components/diary/MoodPicker";
import type { DiaryMood } from "@/lib/moods";
import { getUserTimeZone } from "@/lib/today";
import { formatLongDate, isValidISODate, shiftISODate, todayInTimeZone } from "@/lib/dates";

// Always fresh — the entry may have been written a moment ago.
export const dynamic = "force-dynamic";

type Props = { params: { date: string } };

type DiaryEntryDTO = {
  id: string;
  entry_date: string;
  mood: DiaryMood | null;
  content_json: JSONContent | Record<string, never>;
  content_text: string;
  updated_at: string;
};

const pill =
  "px-3 py-1.5 rounded-full border border-accent/60 text-ink-primary hover:bg-accent-soft hover:text-cat-ink hover:border-accent transition";
const pillDisabled =
  "px-3 py-1.5 rounded-full border border-[var(--border)] text-ink-muted cursor-not-allowed";

export default async function DiaryDayPage({ params }: Props) {
  const { date } = params;
  if (!isValidISODate(date)) redirect("/diary");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/diary/${date}`);

  const { data: entry, error } = await supabase
    .from("diary_entries")
    .select("id, entry_date, mood, content_json, content_text, updated_at")
    .eq("user_id", user.id)
    .eq("entry_date", date)
    .maybeSingle<DiaryEntryDTO>();

  const timeZone = getUserTimeZone();
  const today = todayInTimeZone(timeZone);
  const isToday = date === today;
  const isFuture = date > today; // YYYY-MM-DD compares correctly as a string
  const prev = shiftISODate(date, -1);
  const next = shiftISODate(date, 1);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-baseline gap-4 flex-wrap">
        <h1 className="font-display text-3xl">Diary</h1>
        <span className="font-mono text-sm text-ink-muted">{formatLongDate(date)}</span>
        <nav aria-label="Day navigation" className="ml-auto flex items-center gap-2 font-ui text-sm">
          <Link href={`/diary/${prev}`} className={pill} aria-label="Previous day">
            ‹ Prev
          </Link>
          {isToday ? (
            <span className={pillDisabled} aria-current="date">
              Today
            </span>
          ) : (
            <Link href={`/diary/${today}`} className={pill}>
              Today
            </Link>
          )}
          {/* No writing ahead of time: stop at today. */}
          {date >= today ? (
            <span className={pillDisabled} aria-disabled="true">
              Next ›
            </span>
          ) : (
            <Link href={`/diary/${next}`} className={pill} aria-label="Next day">
              Next ›
            </Link>
          )}
        </nav>
      </div>

      <section className="rounded-2xl bg-bg-elevated border border-[var(--border)] shadow-card p-6 md:p-8 min-h-[320px]">
        {error ? (
          <p role="alert" className="font-ui text-sm text-ink-secondary">
            Couldn&apos;t load this day&apos;s entry. Try refreshing.
          </p>
        ) : isFuture ? (
          <FutureDay />
        ) : (
          <div className="space-y-5">
            <MoodPicker key={date} date={date} initialMood={entry?.mood ?? null} />
            <DiaryEditor
              key={date}
              date={date}
              initialContent={toEditorContent(entry)}
              initialText={entry?.content_text ?? ""}
              placeholder={
                isToday
                  ? "How did today feel? Start anywhere."
                  : "What do you remember about this day?"
              }
              timeZone={timeZone}
              initialUpdatedAt={entry?.updated_at ?? null}
            />
          </div>
        )}
      </section>
    </div>
  );
}

// Tiptap doc if we have one; otherwise lift any plaintext into paragraphs so
// a row written without JSON (e.g. by hand in SQL) still opens editable.
function toEditorContent(entry: DiaryEntryDTO | null): JSONContent | null {
  if (!entry) return null;
  if ((entry.content_json as JSONContent).type === "doc") return entry.content_json as JSONContent;
  const text = entry.content_text.trim();
  if (!text) return null;
  return {
    type: "doc",
    content: text.split(/\n{2,}/).map((para) => ({
      type: "paragraph",
      content: [{ type: "text", text: para }],
    })),
  };
}

function FutureDay() {
  return (
    <div className="h-full min-h-[256px] flex flex-col items-center justify-center text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-accent-soft text-cat-ink flex items-center justify-center">
        <NotebookPen size={22} aria-hidden />
      </div>
      <h2 className="font-display text-xl text-ink-primary">This page is still blank.</h2>
      <p className="font-ui text-sm text-ink-secondary max-w-sm">
        This day hasn&apos;t happened yet. Come back when it has a story.
      </p>
    </div>
  );
}
