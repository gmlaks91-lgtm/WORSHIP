import Link from "next/link";

import { getTeamMembers } from "@/features/team/queries/getTeamMembers";
import { teamRoleLabel } from "@/lib/team-roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const { members, error } = await getTeamMembers();

  return (
    <div className="flex flex-1 flex-col gap-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Ahaba</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">팀 라인업</h1>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          전체 팀원의 포지션을 한눈에 확인하세요.
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5 text-sm text-destructive">
          팀원 정보를 불러오지 못했습니다: {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <Card key={member.id} className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{member.username}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(() => {
                const roleText = [
                  member.role_priority_1 ? teamRoleLabel(member.role_priority_1) : null,
                  member.role_priority_2 ? teamRoleLabel(member.role_priority_2) : null,
                  member.role_priority_3 ? teamRoleLabel(member.role_priority_3) : null,
                ]
                  .filter(Boolean)
                  .join(" / ");

                return (
                  <>
              <p>
                <span className="text-muted-foreground">권한</span> · {member.role === "leader" ? "리더" : "팀원"}
              </p>
              <p><span className="text-muted-foreground">포지션</span> · {roleText || "미정"}</p>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        ))}
      </div>

      <footer>
        <Link href="/" className="text-xs text-muted-foreground underline underline-offset-4">
          홈으로 돌아가기
        </Link>
      </footer>
    </div>
  );
}
