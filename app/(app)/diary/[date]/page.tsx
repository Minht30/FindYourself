import Link from "next/link";
import { redirect } from "next/navigation";
import { NotebookPen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserTimeZone } from "@/lib/today";
import { formatLongDate, isValidISODate, shiftISODate, todayInTimeZone } from "@/lib/dates";

// Always fresh — the entry may have been written a moment ago.
export const dynamic = "force-dynamic";

type Props = { params: { date: string } };

type DiaryEntryDTO = {
  id: string;
  entry_date: string;
  mood: string | null;
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
    .select("id, entry_date, mood, content_text, updated_at")
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
        ) : entry ? (
          <article className="space-y-4">
            {entry.mood && (
              <span className="inline-block px-3 py-1 rounded-full bg-accent-soft text-cat-ink font-ui text-xs font-medium capitalize">
                {entry.mood}
              </span>
            )}
            {entry.content_text.trim() ? (
              <p className="font-body text-ink-primary leading-relaxed whitespace-pre-wrap">
                {entry.content_text}
              </p>
            ) : (
              <p className="font-body text-ink-muted italic">This entry has a mood but no words yet.</p>
            )}
            <p className="font-mono text-xs text-ink-muted">
              Last edited{" "}
              <time dateTime={entry.updated_at}>
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone,
                }).format(new Date(entry.updated_at))}
              </time>
            </p>
          </article>
        ) : (
          <EmptyDay isToday={isToday} isFuture={isFuture} />
        )}
      </section>
    </div>
  );
}

function EmptyDay({ isToday, isFuture }: { isToday: boolean; isFuture: boolean }) {
  const [title, body] = isFuture
    ? ["This page is still blank.", "This day hasn't happened yet. Come back when it has a story."]
    : isToday
      ? ["A fresh page for today.", "How did today feel? Pour a warm drink; the page will be here when you're ready."]
      : ["Nothing written this day.", "Some days pass quietly, and that's okay."];

  return (
    <div className="h-full min-h-[256px] flex flex-col items-center justify-center text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-accent-soft text-cat-ink flex items-center justify-center">
        <NotebookPen size={22} aria-hidden />
      </div>
      <h2 className="font-display text-xl text-ink-primary">{title}</h2>
      <p className="font-ui text-sm text-ink-secondary max-w-sm">{body}</p>
    </div>
  );
}
