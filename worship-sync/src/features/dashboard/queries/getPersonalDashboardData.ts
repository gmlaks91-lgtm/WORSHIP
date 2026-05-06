import "server-only";

import { ensureRecurringSchedules } from "@/features/schedule/lib/ensureRecurringSchedules";
import { getSetlists, type PrepSetlistRow } from "@/features/setlist/queries/getSetlists";
import { getRecentSheetsForDashboard } from "@/features/sheets/queries/getSheets";
import type { ScheduleAttendanceStatus, ScheduleKind } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

export type DashboardScheduleRow = {
  id: string;
  title: string;
  kind: ScheduleKind;
  starts_at: string;
};

export type PersonalDashboardData = {
  upcomingWithMine: Array<{
    schedule: DashboardScheduleRow;
    myStatus: ScheduleAttendanceStatus | null;
  }>;
  recentSetlists: PrepSetlistRow[];
  recentSheets: Awaited<ReturnType<typeof getRecentSheetsForDashboard>>;
  errors: string[];
};

export async function getPersonalDashboardData(): Promise<PersonalDashboardData> {
  const errors: string[] = [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nowIso = new Date().toISOString();

  try {
    await ensureRecurringSchedules(supabase);
  } catch {
    errors.push("반복 일정 자동 생성 중 문제가 발생했습니다.");
  }

  const [{ setlists, error: setlistErr }, sheets] = await Promise.all([
    getSetlists({ limit: 3 }),
    getRecentSheetsForDashboard(5),
  ]);

  if (setlistErr) errors.push(setlistErr);

  let upcomingWithMine: PersonalDashboardData["upcomingWithMine"] = [];

  if (user) {
    const { data: schedRaw, error: sErr } = await supabase
      .from("schedules")
      .select("id, title, kind, starts_at")
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(8);

    if (sErr) {
      errors.push(sErr.message);
    } else {
      const schedules = (schedRaw ?? []) as DashboardScheduleRow[];
      const ids = schedules.map((s) => s.id);

      let mineMap = new Map<string, ScheduleAttendanceStatus>();
      if (ids.length > 0) {
        const { data: mineRaw, error: mErr } = await supabase
          .from("attendances")
          .select("schedule_id, status")
          .eq("user_id", user.id)
          .in("schedule_id", ids);

        if (mErr) {
          errors.push(mErr.message);
        } else {
          mineMap = new Map(
            (mineRaw ?? []).map((r) => [r.schedule_id, r.status as ScheduleAttendanceStatus]),
          );
        }
      }

      upcomingWithMine = schedules.map((schedule) => ({
        schedule,
        myStatus: mineMap.get(schedule.id) ?? null,
      }));
    }
  }

  return {
    upcomingWithMine,
    recentSetlists: setlists,
    recentSheets: sheets,
    errors,
  };
}
