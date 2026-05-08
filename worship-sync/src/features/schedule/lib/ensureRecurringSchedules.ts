import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type RecurringTemplate = {
  title: string;
  kind: "practice" | "worship";
  weekday: number;
  hour: number;
  minute: number;
};

const RECURRING_TEMPLATES: RecurringTemplate[] = [
  { title: "토요일 연습", kind: "practice", weekday: 6, hour: 15, minute: 30 },
  { title: "주일 예배", kind: "worship", weekday: 0, hour: 13, minute: 15 },
];

const UPCOMING_WEEKS = 8;

function makeWeeklyDate(base: Date, weekday: number, weekOffset: number, hour: number, minute: number) {
  const d = new Date(base);
  const delta = (weekday - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + delta + weekOffset * 7);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export async function ensureRecurringSchedules(supabase: SupabaseClient<Database>) {
  const now = new Date();
  const candidates = RECURRING_TEMPLATES.flatMap((template) =>
    Array.from({ length: UPCOMING_WEEKS }, (_, weekOffset) => {
      const startsAt = makeWeeklyDate(
        now,
        template.weekday,
        weekOffset,
        template.hour,
        template.minute,
      ).toISOString();

      return {
        title: template.title,
        kind: template.kind,
        starts_at: startsAt,
      };
    }),
  );

  const { data: excludedRows } = await supabase
    .from("recurring_schedule_exclusions")
    .select("title, kind, starts_at")
    .gte("starts_at", now.toISOString());

  const excluded = new Set(
    (excludedRows ?? []).map((row) => `${row.title}::${row.kind}::${new Date(row.starts_at).toISOString()}`),
  );
  const rows = candidates.filter(
    (row) => !excluded.has(`${row.title}::${row.kind}::${new Date(row.starts_at).toISOString()}`),
  );
  if (rows.length === 0) return;

  const { error } = await supabase
    .from("schedules")
    .upsert(rows, { onConflict: "title,kind,starts_at", ignoreDuplicates: true });

  if (error) {
    throw new Error(error.message);
  }
}
