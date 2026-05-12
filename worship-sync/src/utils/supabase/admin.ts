import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { fetchWithTimeout } from "@/utils/supabase/fetch-with-timeout";

function readAdminEnv() {
  // Local/Server 환경마다 변수명을 다르게 둘 수 있어 둘 다 허용
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

  return { url, serviceRoleKey };
}

export function createAdminClient() {
  const { url, serviceRoleKey } = readAdminEnv();

  if (!url && !serviceRoleKey) {
    throw new Error(
      "Supabase Admin Client 환경변수가 없습니다. SUPABASE_URL(또는 NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY를 확인해 주세요.",
    );
  }
  if (!url) {
    throw new Error(
      "Supabase URL이 없습니다. SUPABASE_URL(또는 NEXT_PUBLIC_SUPABASE_URL)을 설정해 주세요.",
    );
  }
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 설정이 필요합니다.");
  }

  return createClient<Database>(url, serviceRoleKey, {
    global: {
      fetch: fetchWithTimeout,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
