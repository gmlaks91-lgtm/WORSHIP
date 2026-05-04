import "server-only";

import type { AttendanceEventType, AttendanceStatus } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

export type ProfileRow = {
  id: string;
  username: string;
  role: string;
};

export type AttendanceRow = {
  id: string;
  user_id: string;
  event_date: string;
  event_type: AttendanceEventType;
  status: AttendanceStatus;
  reason: string | null;
};

export async function getScheduleData(practiceDate: string, worshipDate: string) {
  const supabase = await createClient();

  const dates = Array.from(new Set([practiceDate, worshipDate]));

  const [{ data: attendanceRaw, error: attErr }, { data: profilesRaw, error: profErr }, userRes] =
    await Promise.all([
      supabase
        .from("attendance")
        .select("id, user_id, event_date, event_type, status, reason")
        .in("event_date", dates),
      supabase.from("profiles").select("id, username, role"),
      supabase.auth.getUser(),
    ]);

  if (attErr) {
    return {
      attendance: [] as AttendanceRow[],
      profiles: [] as ProfileRow[],
      currentUserId: userRes.data.user?.id ?? null,
      error: attErr.message,
    };
  }

  if (profErr) {
    return {
      attendance: (attendanceRaw ?? []) as AttendanceRow[],
      profiles: [] as ProfileRow[],
      currentUserId: userRes.data.user?.id ?? null,
      error: profErr.message,
    };
  }

  const attendance = (attendanceRaw ?? []).filter((row) => {
    if (row.event_type === "practice" && row.event_date === practiceDate) return true;
    if (row.event_type === "worship" && row.event_date === worshipDate) return true;
    return false;
  }) as AttendanceRow[];

  return {
    attendance,
    profiles: (profilesRaw ?? []) as ProfileRow[],
    currentUserId: userRes.data.user?.id ?? null,
    error: null as string | null,
  };
}
