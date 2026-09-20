import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2.5 font-display font-bold text-lg text-ink-primary">
          <div
            className="w-8 h-8 rounded-[10px] flex items-center justify-center text-cat-ink font-mono font-bold text-[13px] shadow-glow"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-soft))" }}
          >
            FY
          </div>
          FindYourself
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-8">{children}</main>
    </div>
  );
}
