import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import CategoriesEditor, { type CategoryUsage, type EditableCategory } from "@/components/settings/CategoriesEditor";
import FocusGoalSelect from "@/components/motivation/FocusGoalSelect";
import DeleteAccount from "@/components/settings/DeleteAccount";
import TimeZoneSetting from "@/components/settings/TimeZoneSetting";
import { createClient } from "@/lib/supabase/server";
import { sanitizeFocusGoal } from "@/lib/rings";

export const metadata: Metadata = { title: "Settings — FindYourself" };
export const dynamic = "force-dynamic";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="rounded-2xl bg-bg-elevated border border-[var(--border)] shadow-card p-5 md:p-6">
      <h2 id={`${id}-h`} className="font-display text-xl mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings");

  const [{ data: profile }, { data: cats }, { data: usageRows }] = await Promise.all([
    supabase.from("profiles").select("timezone, timezone_manual, daily_focus_goal_minutes").eq("id", user.id).maybeSingle(),
    supabase.from("categories").select("id, name, color").eq("user_id", user.id).order("sort_order").returns<EditableCategory[]>(),
    supabase.rpc("category_usage"),
  ]);

  const usage: CategoryUsage = {};
  for (const r of (usageRows ?? []) as { category_id: string; blocks: number | string; tasks: number | string }[]) {
    usage[r.category_id] = { blocks: Number(r.blocks), tasks: Number(r.tasks) };
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-10 font-ui">
      <header>
        <h1 className="font-display text-3xl">Settings</h1>
        <p className="text-ink-secondary text-[15px] mt-1">Your account, your day and your categories.</p>
      </header>

      <Section id="account" title="Account">
        <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-[15px]">
          <dt className="text-ink-muted">Email</dt>
          <dd className="text-ink-primary break-all" data-account-email>
            {user.email}
          </dd>
        </dl>
      </Section>

      <Section id="timezone" title="Time zone">
        <p className="mb-3 text-[14px] text-ink-secondary" data-account-timezone>
          A day starts and ends in this zone: the timetable, the clock, your streak and your week all follow it.
        </p>
        <TimeZoneSetting savedZone={profile?.timezone ?? "UTC"} manual={profile?.timezone_manual === true} />
      </Section>

      <Section id="focus" title="Focus">
        <FocusGoalSelect goalMinutes={sanitizeFocusGoal(profile?.daily_focus_goal_minutes)} />
        <p className="mt-2 text-[13px] text-ink-secondary">The focus ring on the timetable measures today against this.</p>
      </Section>

      <Section id="categories" title="Categories">
        <p className="mb-3 text-[14px] text-ink-secondary">
          Colour your blocks and tasks. Rename them, change their colour, put them in the order you like, or delete the
          ones you do not use.
        </p>
        <CategoriesEditor categories={cats ?? []} usage={usage} />
      </Section>

      <Section id="delete" title="Delete account">
        <p className="mb-3 text-[14px] text-ink-secondary">
          Remove your account and everything in it. There is no way to get it back.
        </p>
        <DeleteAccount />
      </Section>

      <p className="text-[13px] text-ink-muted">
        <Link href="/privacy" className="underline underline-offset-4 hover:no-underline">
          Privacy, in plain words
        </Link>
      </p>
    </div>
  );
}
