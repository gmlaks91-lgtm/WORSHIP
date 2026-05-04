import Link from "next/link";

import { ProfileSettings } from "@/features/profile/components/ProfileSettings";
import { getMyProfile } from "@/features/profile/queries/getMyProfile";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MorePage() {
  const { profile, error } = await getMyProfile();

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">계정</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">마이페이지</h1>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          표시 이름과 프로필 사진을 관리합니다. 역할(리더/팀원)은 관리자에게 문의하세요.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          프로필을 불러오지 못했습니다: {error}
        </div>
      ) : null}

      {!profile && !error ? (
        <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          로그인이 필요합니다.
          <div className="mt-4">
            <Link href="/login" className={cn(buttonVariants({ size: "sm" }))}>
              로그인하기
            </Link>
          </div>
        </div>
      ) : null}

      {profile ? <ProfileSettings key={profile.updated_at} profile={profile} /> : null}

      <footer className="border-t border-border/50 pt-6">
        <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          홈으로
        </Link>
      </footer>
    </div>
  );
}
