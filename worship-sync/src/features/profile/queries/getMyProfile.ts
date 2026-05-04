import "server-only";

import type { ProfileRole } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

export type MyProfileRow = {
  id: string;
  username: string;
  role: ProfileRole;
  avatar_url: string | null;
  updated_at: string;
};

export async function getMyProfile(): Promise<{
  profile: MyProfileRow | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { profile: null, error: null };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, role, avatar_url, updated_at")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      return { profile: null, error: error.message };
    }
    if (!data) {
      return { profile: null, error: "프로필을 찾을 수 없습니다." };
    }

    return {
      profile: {
        id: data.id,
        username: data.username,
        role: data.role as ProfileRole,
        avatar_url: data.avatar_url ?? null,
        updated_at: data.updated_at,
      },
      error: null,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류";
    return { profile: null, error: message };
  }
}
