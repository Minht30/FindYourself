import { shiftISODate } from "@/lib/dates";

// Buckets are derived, never stored (see migration 20260929233739 and
// DECISIONS, Session 17): a task carries a calendar date, and "today" is the
// user's day from the fy-tz cookie.
export const BUCKETS = ["today", "tomorrow", "backlog"] as const;
export type Bucket = (typeof BUCKETS)[number];

export const BUCKET_LABELS: Record<Bucket, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  backlog: "Backlog",
};

export type TaskPriority = "low" | "med" | "high";

export type TaskDTO = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  category_id: string | null;
  scheduled_for: string | null; // YYYY-MM-DD, null = Backlog
  deadline: string | null;
  is_restriction: boolean;
  completed_at: string | null;
  sort_order: number;
};

export const TASK_COLUMNS =
  "id, title, description, priority, category_id, scheduled_for, deadline, is_restriction, completed_at, sort_order";

// Where an open task shows up on the board.
// - Overdue (dated before today) stays visible under Today, flagged, until
//   the end-of-day roll (a later Phase 4 box) lets the user re-home it.
// - Anything dated after tomorrow is grouped under Tomorrow with its date;
//   the UI only schedules for today / tomorrow, so this is an edge case.
export function bucketOf(scheduledFor: string | null, today: string): Bucket {
  if (scheduledFor === null) return "backlog";
  if (scheduledFor <= today) return "today";
  return "tomorrow";
}

export function isOverdue(task: Pick<TaskDTO, "scheduled_for" | "completed_at">, today: string): boolean {
  return task.completed_at === null && task.scheduled_for !== null && task.scheduled_for < today;
}

// Inverse of bucketOf, for writes.
export function scheduledForBucket(bucket: Bucket, today: string): string | null {
  if (bucket === "today") return today;
  if (bucket === "tomorrow") return shiftISODate(today, 1);
  return null;
}

export function isBucket(value: unknown): value is Bucket {
  return typeof value === "string" && (BUCKETS as readonly string[]).includes(value);
}
