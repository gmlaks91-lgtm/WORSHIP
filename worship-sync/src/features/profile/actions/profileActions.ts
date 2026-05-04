"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/utils/supabase/server";

export type ProfileActionResult = { ok: true } | { ok: false; message: string };

const usernameSchema = z
  .string()
  .trim()
  .min(1, "이름을 입력하세요.")
  .max(80, "이름은 80자 이내로 해 주세요.");

const ALLOWED_AVATAR = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "bin";
}

export async function updateProfile(username: string): Promise<ProfileActionResult> {
  const parsed = usernameSchema.safeParse(username);
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

    const { error } = await supabase
      .from("profiles")
      .update({ username: parsed.data })
      .eq("id", user.id);

    if (error) {
      return { ok: false, message: error.message };
    }

    revalidatePath("/more");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류입니다.";
    return { ok: false, message };
  }
}

export async function updateAvatar(formData: FormData): Promise<ProfileActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, message: "로그인이 필요합니다." };
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, message: "이미지 파일을 선택해 주세요." };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { ok: false, message: "파일 크기는 5MB 이하여야 합니다." };
    }

    const mime = file.type || "application/octet-stream";
    if (!ALLOWED_AVATAR.has(mime)) {
      return { ok: false, message: "PNG, JPG, WebP, GIF만 업로드할 수 있습니다." };
    }

    const objectPath = `${user.id}/avatar.${extFromMime(mime)}`;

    const buf = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await supabase.storage.from("avatars").upload(objectPath, buf, {
      upsert: true,
      contentType: mime,
      cacheControl: "3600",
    });

    if (upErr) {
      return { ok: false, message: upErr.message };
    }

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(objectPath);
    const cleanUrl = pub.publicUrl;

    const { error: updErr } = await supabase
      .from("profiles")
      .update({ avatar_url: cleanUrl })
      .eq("id", user.id);

    if (updErr) {
      await supabase.storage.from("avatars").remove([objectPath]);
      return { ok: false, message: updErr.message };
    }

    const { data: siblings } = await supabase.storage.from("avatars").list(user.id);
    const toRemove =
      siblings?.map((o) => `${user.id}/${o.name}`).filter((p) => p !== objectPath) ?? [];
    if (toRemove.length) {
      await supabase.storage.from("avatars").remove(toRemove);
    }

    revalidatePath("/more");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류입니다.";
    return { ok: false, message };
  }
}
