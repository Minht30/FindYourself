"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { copyDayBlocks } from "@/app/(app)/today/actions";

const DAY_MS = 24 * 60 * 60 * 1000;

export default function CopyYesterdayButton() {
  const router = useRouter();
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "done"; count: number } | { kind: "error"; msg: string }
  >({ kind: "idle" });

  async function onClick() {
    setStatus({ kind: "loading" });

    // Compute yesterday's day-range in the user's own tz, then send those
    // instants as ISO UTC to the server. Offset is fixed at 24h — cheap and
    // wrong only on DST transition days, which we accept for now.
    const now = new Date();
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const res = await copyDayBlocks({
      sourceStart: yesterdayStart.toISOString(),
      sourceEnd: todayStart.toISOString(),
      offsetMs: DAY_MS,
    });

    if (!res.ok) {
      setStatus({ kind: "error", msg: res.error });
      return;
    }
    setStatus({ kind: "done", count: res.count });
    router.refresh();
    setTimeout(() => setStatus({ kind: "idle" }), 3000);
  }

  const label =
    status.kind === "loading"
      ? "Copying…"
      : status.kind === "done"
        ? status.count === 0
          ? "Nothing yesterday"
          : `Copied ${status.count}`
        : status.kind === "error"
          ? "Failed — retry"
          : "Copy yesterday";

  return (
    <button
      onClick={onClick}
      disabled={status.kind === "loading"}
      title={status.kind === "error" ? status.msg : "Duplicate every block from yesterday onto today"}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-accent/60 text-ink-primary text-sm font-ui hover:bg-accent-soft hover:text-cat-ink hover:border-accent disabled:opacity-60 transition"
    >
      <Copy size={13} strokeWidth={2} />
      {label}
    </button>
  );
}
