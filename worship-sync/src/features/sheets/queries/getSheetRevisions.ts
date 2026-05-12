import "server-only";

import { createClient } from "@/utils/supabase/server";
import type { SheetRevision } from "@/features/sheets/types";

export async function getSheetRevisions(sheetId: string): Promise<SheetRevision[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sheet_revisions")
    .select(
      `
        id,
        sheet_id,
        chords_before,
        song_structure_before,
        memo_before,
        chords_after,
        song_structure_after,
        memo_after,
        edited_by,
        edited_at,
        change_summary,
        created_at
      `
    )
    .eq("sheet_id", sheetId)
    .order("edited_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch sheet revisions:", error);
    return [];
  }

  return data || [];
}

export async function getSheetWithRevisions(sheetId: string) {
  const supabase = await createClient();

  const { data: sheet, error: sheetError } = await supabase
    .from("sheets")
    .select("*")
    .eq("id", sheetId)
    .maybeSingle();

  if (sheetError || !sheet) {
    return { sheet: null, revisions: [] };
  }

  const revisions = await getSheetRevisions(sheetId);

  // 수정자 이름 조회
  if (revisions.length > 0) {
    const editorIds = [...new Set(revisions.map((r) => r.edited_by))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", editorIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p.username]) || []);

    // 수정자 이름을 revisions에 추가
    revisions.forEach((revision) => {
      (revision as any).editor_name = profileMap.get(revision.edited_by) || "Unknown";
    });
  }

  return { sheet, revisions };
}
