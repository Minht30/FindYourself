import { redirect } from "next/navigation";
import { getUserToday } from "@/lib/today";

// /diary always lands on the user's today. Dynamic because "today" depends on
// the request's timezone cookie and the current clock.
export const dynamic = "force-dynamic";

export default function DiaryIndexPage() {
  redirect(`/diary/${getUserToday()}`);
}
