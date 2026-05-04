"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/utils/supabase/server";

const eventTypeSchema = z.enum(["practice", "worship"]);
const statusSchema = z.enum(["attending", "late", "absent"]);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const toggleSchema = z.object({
  eventDate: dateSchema,
  eventType: eventTypeSchema,
  status: statusSchema,
  reason: z.string().max(2000).optional().nullable(),
});

const reasonSchema = z.object({
  eventDate: dateSchema,
  eventType: eventTypeSchema,
  reason: z.string().max(2000),
});

export type ActionResult = { ok: true } | { ok: false; message: string };

export async function toggleAttendance(
  raw: z.infer<typeof toggleSchema>,
): Promise<ActionResult> {
  const parsed = toggleSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "입력값을 확인하세요." };
  }

  const { eventDate, eventType, status } = parsed.data;
  const reason =
    status === "attending"
      ? null
      : parsed.data.reason?.trim()
        ? parsed.data.reason.trim()
        : null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, message: "로그인이 필요합니다." };
    }

    const { error } = await supabase.from("attendance").upsert(
      {
        user_id: user.id,
        event_date: eventDate,
        event_type: eventType,
        status,
        reason,
      },
      { onConflict: "user_id,event_date,event_type" },
    );

    if (error) {
      return { ok: false, message: error.message };
    }

    revalidatePath("/schedule");
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류입니다.";
    return { ok: false, message };
  }
}

export async function updateReason(raw: z.infer<typeof reasonSchema>): Promise<ActionResult> {
  const parsed = reasonSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "사유를 확인하세요." };
  }

  const { eventDate, eventType, reason } = parsed.data;
  const trimmed = reason.trim();

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, message: "로그인이 필요합니다." };
    }

    const { error } = await supabase
      .from("attendance")
      .update({ reason: trimmed.length ? trimmed : null })
      .eq("user_id", user.id)
      .eq("event_date", eventDate)
      .eq("event_type", eventType);

    if (error) {
      return { ok: false, message: error.message };
    }

    revalidatePath("/schedule");
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류입니다.";
    return { ok: false, message };
  }
}
