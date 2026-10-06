import type { Quote } from "@/lib/quotes";

// Today's quote. Server-rendered and presentational; the text is rendered as
// text, never as markup. No attribution unless the row carries an author.
export default function QuoteCard({ quote }: { quote: Quote | null }) {
  if (!quote) return null;
  return (
    <figure
      aria-label="Quote of the day"
      data-quote-id={quote.id}
      className="rounded-2xl border border-[var(--border)] bg-bg-elevated px-4 py-3 font-ui"
    >
      <blockquote className="font-display text-[17px] leading-snug text-ink-primary">{quote.text}</blockquote>
      {quote.author ? <figcaption className="mt-1 text-[12px] text-ink-muted">{quote.author}</figcaption> : null}
    </figure>
  );
}
