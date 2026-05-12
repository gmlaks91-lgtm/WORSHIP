import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import type { Database } from "@/types/database";
import { fetchWithTimeout } from "@/utils/supabase/fetch-with-timeout";

export type SessionUpdateResult = {
  response: NextResponse;
  user: User | null;
  authConfigured: boolean;
};

/**
 * 요청 쿠키에 Supabase 세션을 동기화해 클라이언트·서버 간 인증 상태를 맞춥니다.
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function updateSession(request: NextRequest): Promise<SessionUpdateResult> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { response: supabaseResponse, user: null, authConfigured: false };
  }

  const supabase = createServerClient<Database>(url, key, {
    global: {
      fetch: fetchWithTimeout,
    },
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: false,
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  try {
    const userRes = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Supabase auth timeout")), 4000),
      ),
    ]);

    return { response: supabaseResponse, user: userRes.data.user, authConfigured: true };
  } catch {
    // 인증 서버가 느리거나 접근 불가할 때 미들웨어가 전체 렌더를 멈추지 않도록 안전하게 통과
    return { response: supabaseResponse, user: null, authConfigured: false };
  }
}
