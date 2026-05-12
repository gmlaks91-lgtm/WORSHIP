"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/utils/supabase/server";
import type { SheetChords, SheetStructure } from "@/features/sheets/types";

const registerSheetSchema = z.object({
  songId: z.string().uuid(),
  imageUrls: z.array(z.string().url()).min(1, "악보 이미지를 1장 이상 업로드해 주세요."),
  memo: z.string().max(4000).optional(),
});

export type RegisterSheetResult = { ok: true } | { ok: false; message: string };

export async function registerSheet(
  raw: z.infer<typeof registerSheetSchema>,
): Promise<RegisterSheetResult> {
  const parsed = registerSheetSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(", ");
    return { ok: false, message: msg || "입력값을 확인하세요." };
  }

  const { songId, imageUrls } = parsed.data;
  const memo =
    parsed.data.memo === undefined
      ? null
      : parsed.data.memo.trim().length > 0
        ? parsed.data.memo.trim()
        : null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, message: "로그인이 필요합니다." };
    }

    const { data: song, error: songError } = await supabase
      .from("songs")
      .select("id")
      .eq("id", songId)
      .maybeSingle();

    if (songError || !song) {
      return { ok: false, message: "곡을 찾을 수 없습니다." };
    }

    const { error: insertError } = await supabase.from("sheets").insert({
      song_id: songId,
      image_urls: imageUrls,
      memo,
    });

    if (insertError) {
      return { ok: false, message: insertError.message };
    }

    revalidatePath("/");
    revalidatePath("/sheets");
    revalidatePath(`/sheets/${songId}`);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
    return { ok: false, message };
  }
}

// ============================================================================
// 악보 편집 기능
// ============================================================================

const updateSheetSchema = z.object({
  sheetId: z.string().uuid(),
  chords: z.record(z.any()).optional(),
  songStructure: z.record(z.any()).optional(),
  memo: z.string().max(4000).optional(),
  changeSummary: z.string().max(200).optional(),
});

export type UpdateSheetResult = { ok: true } | { ok: false; message: string };

export async function updateSheet(
  raw: z.infer<typeof updateSheetSchema>,
): Promise<UpdateSheetResult> {
  const parsed = updateSheetSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(", ");
    return { ok: false, message: msg || "입력값을 확인하세요." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, message: "로그인이 필요합니다." };
    }

    const { sheetId } = parsed.data;

    // 현재 악보 정보 조회
    const { data: currentSheet, error: fetchError } = await supabase
      .from("sheets")
      .select("*")
      .eq("id", sheetId)
      .maybeSingle();

    if (fetchError || !currentSheet) {
      return { ok: false, message: "악보를 찾을 수 없습니다." };
    }

    // 변경사항이 있는지 확인
    const hasChanges =
      parsed.data.chords !== undefined ||
      parsed.data.songStructure !== undefined ||
      parsed.data.memo !== undefined;

    if (!hasChanges) {
      return { ok: false, message: "변경된 내용이 없습니다." };
    }

    // 수정 이력 기록 (변경 전)
    const changeSummary = parsed.data.changeSummary || generateChangeSummary(parsed.data);

    const { error: revisionError } = await supabase.from("sheet_revisions").insert({
      sheet_id: sheetId,
      chords_before: currentSheet.chords,
      song_structure_before: currentSheet.song_structure,
      memo_before: currentSheet.memo,
      chords_after: parsed.data.chords || currentSheet.chords,
      song_structure_after: parsed.data.songStructure || currentSheet.song_structure,
      memo_after: parsed.data.memo !== undefined ? parsed.data.memo : currentSheet.memo,
      edited_by: user.id,
      change_summary: changeSummary,
    });

    if (revisionError) {
      return { ok: false, message: "수정 이력 기록에 실패했습니다: " + revisionError.message };
    }

    // 악보 업데이트
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.chords !== undefined) {
      updatePayload.chords = parsed.data.chords;
    }
    if (parsed.data.songStructure !== undefined) {
      updatePayload.song_structure = parsed.data.songStructure;
    }
    if (parsed.data.memo !== undefined) {
      updatePayload.memo = parsed.data.memo.trim().length > 0 ? parsed.data.memo.trim() : null;
    }

    const { error: updateError } = await supabase
      .from("sheets")
      .update(updatePayload)
      .eq("id", sheetId);

    if (updateError) {
      return { ok: false, message: updateError.message };
    }

    revalidatePath("/");
    revalidatePath("/sheets");
    revalidatePath(`/sheets/${currentSheet.song_id}`);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
    return { ok: false, message };
  }
}

function generateChangeSummary(data: z.infer<typeof updateSheetSchema>): string {
  const changes = [];
  if (data.chords !== undefined) changes.push("코드");
  if (data.songStructure !== undefined) changes.push("진행 순서");
  if (data.memo !== undefined) changes.push("메모");
  return changes.join(", ") + " 수정";
}
