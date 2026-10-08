// What a guest sees in place of the upload, playlist and suggestion sections:
// those need a real account (the database refuses them for guests).
export default function GuestMusicNote() {
  return (
    <section
      aria-label="Your music"
      data-guest-music-note
      className="rounded-2xl bg-glass-card border border-[var(--border)] shadow-card p-5 font-ui"
    >
      <h2 className="font-display text-xl mb-1">Your music</h2>
      <p className="text-[14px] text-ink-secondary">
        Uploading music, making playlists and suggesting tracks need an account. Create one from the banner at the top
        and your demo comes with you.
      </p>
    </section>
  );
}
