import type { Metadata } from "next";
import Link from "next/link";
import { STORED_ITEMS } from "@/lib/privacyFacts";

export const metadata: Metadata = {
  title: "Privacy — FindYourself",
  description: "What FindYourself keeps, where it lives, who can see it, and what you can do about it.",
};

// Plain-language privacy note (public: no sign-in needed). Written from what the
// code actually does; the list of cookies and device storage comes from
// lib/privacyFacts.ts, which a test keeps in step with the source.
const UPDATED = "6 October 2026";

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-2xl mt-10 mb-3">{children}</h2>;
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <header className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2.5 font-display font-bold text-lg text-ink-primary">
          <span
            aria-hidden
            className="w-8 h-8 rounded-[10px] flex items-center justify-center text-cat-ink font-mono font-bold text-[13px] shadow-glow"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-soft))" }}
          >
            FY
          </span>
          FindYourself
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-24 font-ui text-[16px] leading-relaxed text-ink-secondary">
        <h1 className="font-display text-4xl md:text-5xl text-ink-primary mb-3">Privacy, in plain words</h1>
        <p className="text-sm text-ink-muted">Last updated {UPDATED}</p>

        <H2>The short version</H2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Your diary, tasks, timetable and music are yours. The app only ever shows them to the account that wrote them.</li>
          <li>There are no ads, no analytics, no tracking cookies, and nothing is sold or shared.</li>
          <li>No AI reads your writing. There is no AI feature in FindYourself.</li>
          <li>The only cookies are the ones the app needs to work, listed below.</li>
        </ul>

        <H2>What FindYourself keeps</H2>
        <p className="mb-3">When you make an account and use the app, it stores:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Your email address and a scrambled form of your password (the plain password is never stored).</li>
          <li>Your profile: display name, time zone, theme, your streak and your daily focus goal.</li>
          <li>Your timetable blocks, categories and tasks.</li>
          <li>Your diary entries: the text, the mood you picked and the date.</li>
          <li>Your finished focus sessions: when, how long, and which task or block you linked.</li>
          <li>Your ambient sound mix and what you were last playing.</li>
          <li>Music files you upload (MP3 only), your playlists, and track suggestions you send.</li>
        </ul>
        <p className="mt-3">
          The streak is worked out by the database from your own entries and finished tasks. It is not shared and not
          shown to anyone else.
        </p>

        <H2>The demo</H2>
        <p>
          &ldquo;Try the demo&rdquo; makes a temporary guest account with sample data and no email address. It is deleted automatically
          after 24 hours, and guests cannot upload music or send track suggestions. If you create an account from the
          demo, your demo data becomes your account.
        </p>

        <H2>Where it lives</H2>
        <p>
          Your data is kept with Supabase (a hosted database and file storage service), and the site itself is served by
          Vercel. Both only receive what the app needs to work. Fonts are bundled with the site, so your browser does not
          ask a third party for them. Nothing is sent to analytics, advertising or AI services.
        </p>

        <H2>Who can see it</H2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-ink-primary">You.</strong> Every row of your data belongs to one account, and the
            database refuses to show it to anyone else. Your music files are in a private folder that only your account can
            open, through links that expire after an hour.
          </li>
          <li>
            <strong className="text-ink-primary">Track suggestions are the one exception.</strong> If you suggest a
            track, the person who runs FindYourself can read its title, artist, link and your note, to review it. If it
            is approved it appears in the community picks that every signed-in person sees, with the title, artist, link
            and a short note, and without your name.
          </li>
          <li>
            <strong className="text-ink-primary">The person who runs FindYourself</strong> has administrator access to
            the hosting accounts, so, as with any hosted service, they can technically reach the stored data. No page in
            the app shows one person&apos;s diary to another, and there is no feature that reads diaries.
          </li>
        </ul>

        <H2>Cookies and what your browser keeps</H2>
        <p className="mb-4">
          These are all needed for the app to work. There are no tracking or advertising cookies, so there is no cookie
          banner to click away.
        </p>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-bg-elevated">
          <table className="w-full text-left text-[14px]">
            <caption className="sr-only">Cookies and device storage used by FindYourself</caption>
            <thead className="text-ink-muted">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold">Name</th>
                <th scope="col" className="px-4 py-2 font-semibold">Kind</th>
                <th scope="col" className="px-4 py-2 font-semibold">What it is for</th>
              </tr>
            </thead>
            <tbody>
              {STORED_ITEMS.map((item) => (
                <tr key={item.key} className="border-t border-[var(--border)] align-top">
                  <td className="px-4 py-2 font-mono text-[13px] text-ink-primary whitespace-nowrap">{item.key}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{item.kind}</td>
                  <td className="px-4 py-2">{item.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H2>Links you click</H2>
        <p>
          Community picks and suggestions are links to YouTube or Spotify. They open in a new tab only when you click
          them, and nothing from those sites is loaded inside FindYourself.
        </p>

        <H2>How long it is kept</H2>
        <p>
          Until you delete it. You can edit or delete any entry, task, block, track or playlist at any time. Hosting
          providers keep routine backups, so a deleted item can linger in a backup for a short while before it is gone
          for good.
        </p>

        <H2>If this changes</H2>
        <p>This page is updated when the app changes in a way that matters here, and the date at the top changes with it.</p>

        <p className="mt-12">
          <Link href="/" className="text-accent-strong underline underline-offset-4 hover:no-underline">
            ← Back to FindYourself
          </Link>
        </p>
      </main>
    </div>
  );
}
