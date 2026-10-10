import { Sun } from "lucide-react";
import type { Quote } from "@/lib/quotes";

// Today's quote, laid out as in the design: a sun and "Quote of the day", then a round picture of
// the theme's world beside the quote in italics. Both pictures are in the markup and the other
// theme's is hidden (like the landing page), so the server's HTML is right with no script. Server-
// rendered and presentational; the text is rendered as text, never as markup. No attribution unless
// the row carries an author.
export default function QuoteCard({ quote }: { quote: Quote | null }) {
  if (!quote) return null;
  const picture = "h-24 w-24 shrink-0 rounded-full border border-white object-cover shadow-card";
  return (
    <figure
      aria-label="Quote of the day"
      data-quote-id={quote.id}
      data-surface="paper"
      className="card-paper px-5 py-4 font-ui"
    >
      <div className="flex items-center gap-2 text-[color:var(--accent-strong)]">
        <Sun size={20} strokeWidth={1.6} aria-hidden />
        <h2 className="font-heading text-xl leading-tight">Quote of the day</h2>
      </div>
      <div className="mt-3 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- a 96 px decoration, already small WebP */}
        <img src="/assets/ui/quote/quote-medallion-monstadt.webp" alt="" width={96} height={96} loading="lazy" className={`for-monstadt ${picture}`} />
        {/* eslint-disable-next-line @next/next/no-img-element -- a 96 px decoration, already small WebP */}
        <img src="/assets/ui/quote/quote-medallion-nodkrai.webp" alt="" width={96} height={96} loading="lazy" className={`for-nodkrai-night ${picture}`} />
        <div className="min-w-0">
          <blockquote className="font-body text-[18px] italic leading-snug text-ink-muted">{quote.text}</blockquote>
          {quote.author ? <figcaption className="mt-1 text-[12px] text-ink-muted">{quote.author}</figcaption> : null}
        </div>
      </div>
    </figure>
  );
}
