"use client";

import { registerSheet } from "@/features/sheets/actions/sheetActions";
import { extensionFromFile } from "@/features/sheets/lib/file-kind";
import { createClient } from "@/utils/supabase/client";

/** Storage `sheets` 버킷 업로드 후 `sheets` 테이블에 메타 등록 */
export async function uploadSheetFromClient(
  songId: string,
  files: File[],
  memo?: string | null,
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  if (files.length === 0) {
    throw new Error("업로드할 이미지 파일을 선택해 주세요.");
  }

  const publicUrls: string[] = [];
  for (const file of files) {
    const ext = extensionFromFile(file);
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("sheets").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
    if (uploadError) {
      throw new Error(uploadError.message);
    }
    const { data: pub } = supabase.storage.from("sheets").getPublicUrl(path);
    publicUrls.push(pub.publicUrl);
  }

  const result = await registerSheet({
    songId,
    imageUrls: publicUrls,
    memo: memo && memo.trim().length > 0 ? memo.trim() : undefined,
  });

  if (!result.ok) {
    throw new Error(result.message);
  }
}
