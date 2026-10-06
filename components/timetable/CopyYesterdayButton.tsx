"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { copyDayBlocks } from "@/app/(app)/today/actions";
import { shiftISODate, todayInTimeZone, zonedDayStartUTC } from "@/lib/dates";

export default function CopyYesterdayButton({ timeZone }: { timeZone: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "done"; count: number } | { kind: "error"; msg: string }
  >({ kind: "idle" });

  async function onClick() {
    setStatus({ kind: "loading" });

    // Yesterday's day-range in the app's zone (the automatic or the chosen one),
    // sent as UTC instants. The offset is the real distance between the two
    // midnights, so blocks land at the same wall-clock time even when a clock
    // change makes yesterday 23 or 25 hours long.
    const today = todayInTimeZone(timeZone);
    const yesterdayStart = zonedDayStartUTC(shiftISODate(today, -1), timeZone);
    const todayStart = zonedDayStartUTC(today, timeZone);

    const res = await copyDayBlocks({
      sourceStart: yesterdayStart.toISOString(),
      sourceEnd: todayStart.toISOString(),
      offsetMs: todayStart.getTime() - yesterdayStart.getTime(),
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
