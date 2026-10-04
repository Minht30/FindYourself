import { createClient } from "@/lib/supabase/server";
import FocusFirstChip from "@/components/tasks/FocusFirstChip";

// Server half of the header reminder: the open restricted task with the
// earliest deadline (undated ones after), plus how many others are waiting.
// Rendered inside its own Suspense boundary so it never holds up the shell.
export default async function FocusFirstSlot() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, count } = await supabase
    .from("tasks")
    .select("title, deadline", { count: "exact" })
    .eq("user_id", user.id)
    .eq("is_restriction", true)
    .is("completed_at", null)
    .order("deadline", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(1);

  const first = data?.[0];
  if (!first) return null;
  return <FocusFirstChip focus={{ title: first.title, deadline: first.deadline, others: (count ?? 1) - 1 }} />;
}
