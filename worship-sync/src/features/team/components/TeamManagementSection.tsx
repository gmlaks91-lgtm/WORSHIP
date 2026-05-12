"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { hardDeleteMember, updateMemberRoles } from "@/features/team/actions/teamManagementActions";
import type { TeamManagementMember } from "@/features/team/queries/getTeamManagementData";
import { TEAM_ROLE_OPTIONS, teamRoleLabel } from "@/lib/team-roles";
import { toastError, toastPromise } from "@/lib/app-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type TeamManagementSectionProps = {
  members: TeamManagementMember[];
  isLeader: boolean;
  currentUserId: string | null;
};

type DraftRoles = {
  rolePriority1: string;
  rolePriority2: string;
  rolePriority3: string;
};

function formatDate(value: string | null) {
  if (!value) return "정보 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "정보 없음";
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function signupStatus(member: TeamManagementMember) {
  if (!member.hasProfile) return "프로필 미생성";
  if (!member.email_confirmed_at) return "가입 대기";
  return "가입 완료";
}

export function TeamManagementSection({ members, isLeader, currentUserId }: TeamManagementSectionProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<Record<string, DraftRoles>>(() => {
    const next: Record<string, DraftRoles> = {};
    for (const member of members) {
      next[member.id] = {
        rolePriority1: member.role_priority_1 ?? "",
        rolePriority2: member.role_priority_2 ?? "",
        rolePriority3: member.role_priority_3 ?? "",
      };
    }
    return next;
  });

  const counts = useMemo(() => {
    const joined = members.filter((m) => m.email_confirmed_at).length;
    const waiting = members.filter((m) => !m.email_confirmed_at).length;
    return { total: members.length, joined, waiting };
  }, [members]);

  const onRoleChange = (memberId: string, key: keyof DraftRoles, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [memberId]: {
        rolePriority1: prev[memberId]?.rolePriority1 ?? "",
        rolePriority2: prev[memberId]?.rolePriority2 ?? "",
        rolePriority3: prev[memberId]?.rolePriority3 ?? "",
        [key]: value,
      },
    }));
  };

  const onSaveRoles = (member: TeamManagementMember) => {
    const draft = drafts[member.id];
    if (!draft) return;
    startTransition(async () => {
      try {
        await toastPromise(
          updateMemberRoles({
            targetUserId: member.id,
            rolePriority1: draft.rolePriority1 || null,
            rolePriority2: draft.rolePriority2 || null,
            rolePriority3: draft.rolePriority3 || null,
          }).then((res) => {
            if (!res.ok) throw new Error(res.message);
          }),
          "포지션을 저장하는 중입니다...",
        ).unwrap();
        router.refresh();
      } catch {
        // handled by toastPromise
      }
    });
  };

  const onDeleteMember = (member: TeamManagementMember) => {
    if (!isLeader) return;
    if (member.id === currentUserId) {
      toastError("본인 계정은 강제 퇴장할 수 없습니다.");
      return;
    }
    if (!window.confirm(`${member.username} 멤버를 영구 삭제할까요? auth 계정도 함께 삭제됩니다.`)) {
      return;
    }
    setDeleteTargetId(member.id);
    startTransition(async () => {
      try {
        await toastPromise(
          hardDeleteMember({ targetUserId: member.id }).then((res) => {
            if (!res.ok) throw new Error(res.message);
          }),
          "멤버 계정을 영구 삭제하는 중입니다...",
        ).unwrap();
        router.refresh();
      } catch {
        // handled by toastPromise
      } finally {
        setDeleteTargetId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {isLeader ? (
        <Card className="border-neutral-200/60 bg-white/50 shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-neutral-900">리더 관리 요약</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm sm:grid-cols-3">
            <div className="rounded-lg bg-neutral-50 px-3 py-2.5">
              <p className="text-xs font-medium text-neutral-500 mb-1">전체 멤버</p>
              <p className="text-lg font-semibold text-neutral-900">{counts.total}명</p>
            </div>
            <div className="rounded-lg bg-green-50 px-3 py-2.5">
              <p className="text-xs font-medium text-green-600 mb-1">가입 완료</p>
              <p className="text-lg font-semibold text-green-900">{counts.joined}명</p>
            </div>
            <div className="rounded-lg bg-amber-50 px-3 py-2.5">
              <p className="text-xs font-medium text-amber-600 mb-1">가입 대기</p>
              <p className="text-lg font-semibold text-amber-900">{counts.waiting}명</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {members.map((member) => {
          const roleText = [
            member.role_priority_1 ? teamRoleLabel(member.role_priority_1) : null,
            member.role_priority_2 ? teamRoleLabel(member.role_priority_2) : null,
            member.role_priority_3 ? teamRoleLabel(member.role_priority_3) : null,
          ]
            .filter(Boolean)
            .join(" / ");

          const draft = drafts[member.id] ?? { rolePriority1: "", rolePriority2: "", rolePriority3: "" };
          const isWaiting = !member.email_confirmed_at;
          const isActive = member.email_confirmed_at && member.hasProfile;

          return (
            <Card
              key={member.id}
              className="group relative border-neutral-100 bg-white/70 shadow-sm transition-all hover:shadow-md hover:border-neutral-200 backdrop-blur-sm overflow-hidden"
            >
              {/* Status indicator */}
              <div className="absolute top-0 right-0 w-2 h-2">
                {isActive && (
                  <div className="w-full h-full bg-green-400 rounded-bl-lg"></div>
                )}
                {isWaiting && (
                  <div className="w-full h-full bg-amber-300 rounded-bl-lg"></div>
                )}
              </div>

              {/* Avatar and basic info */}
              <CardHeader className="pb-3 flex flex-col items-center text-center">
                <Avatar size="lg" className="mb-3 shadow-sm">
                  <AvatarImage src={member.avatar_url ?? ""} alt={member.username} />
                  <AvatarFallback className="bg-neutral-100 text-neutral-600 font-semibold">
                    {member.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-base text-neutral-900">{member.username}</CardTitle>
                <p className="text-xs text-neutral-500 mt-1">
                  {member.role === "leader" ? "리더" : "팀원"}
                </p>
              </CardHeader>

              <CardContent className="space-y-3 text-sm">
                {/* Roles */}
                {roleText && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-neutral-600">포지션</p>
                    <div className="flex flex-wrap gap-1.5">
                      {member.role_priority_1 && (
                        <Badge
                          variant="secondary"
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-0"
                        >
                          {teamRoleLabel(member.role_priority_1)}
                        </Badge>
                      )}
                      {member.role_priority_2 && (
                        <Badge
                          variant="secondary"
                          className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-0"
                        >
                          {teamRoleLabel(member.role_priority_2)}
                        </Badge>
                      )}
                      {member.role_priority_3 && (
                        <Badge
                          variant="secondary"
                          className="bg-pink-50 text-pink-700 hover:bg-pink-100 border-0"
                        >
                          {teamRoleLabel(member.role_priority_3)}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="space-y-1">
                  <p className="text-xs text-neutral-500">
                    {isActive && <span className="text-green-600 font-medium">✓ 가입 완료</span>}
                    {isWaiting && <span className="text-amber-600 font-medium">⧖ 가입 대기</span>}
                  </p>
                </div>

                {/* Leader controls */}
                {isLeader ? (
                  <div className="space-y-2 rounded-lg border border-neutral-150 bg-neutral-50/60 p-3 mt-3">
                    <p className="text-xs font-medium text-neutral-600">포지션 수정</p>
                    <div className="space-y-2">
                      <select
                        className="h-8 w-full rounded-md border border-neutral-200 bg-white px-2 text-xs outline-none transition-colors focus-visible:border-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-200/50 disabled:opacity-50"
                        value={draft.rolePriority1}
                        onChange={(e) => onRoleChange(member.id, "rolePriority1", e.target.value)}
                        disabled={pending}
                      >
                        <option value="">1순위 선택</option>
                        {TEAM_ROLE_OPTIONS.map((role) => (
                          <option key={`p1-${role.code}`} value={role.code}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                      <select
                        className="h-8 w-full rounded-md border border-neutral-200 bg-white px-2 text-xs outline-none transition-colors focus-visible:border-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-200/50 disabled:opacity-50"
                        value={draft.rolePriority2}
                        onChange={(e) => onRoleChange(member.id, "rolePriority2", e.target.value)}
                        disabled={pending}
                      >
                        <option value="">2순위 선택</option>
                        {TEAM_ROLE_OPTIONS.map((role) => (
                          <option key={`p2-${role.code}`} value={role.code}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                      <select
                        className="h-8 w-full rounded-md border border-neutral-200 bg-white px-2 text-xs outline-none transition-colors focus-visible:border-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-200/50 disabled:opacity-50"
                        value={draft.rolePriority3}
                        onChange={(e) => onRoleChange(member.id, "rolePriority3", e.target.value)}
                        disabled={pending}
                      >
                        <option value="">3순위 선택</option>
                        {TEAM_ROLE_OPTIONS.map((role) => (
                          <option key={`p3-${role.code}`} value={role.code}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-1.5 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onSaveRoles(member)}
                        disabled={pending}
                        className="flex-1 h-8 text-xs bg-neutral-900 hover:bg-neutral-800 text-white"
                      >
                        저장
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteMember(member)}
                        disabled={pending || deleteTargetId === member.id || member.id === currentUserId}
                        className="flex-1 h-8 text-xs"
                      >
                        {deleteTargetId === member.id ? "삭제 중..." : "삭제"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
