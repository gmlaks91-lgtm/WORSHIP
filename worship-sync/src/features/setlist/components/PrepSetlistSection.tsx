"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useMemo, useState, useTransition } from "react";

import { upsertSetlistLineup } from "@/features/setlist/actions/setlistActions";
import { AddSetlistTriggerButton } from "@/features/setlist/components/AddSetlistDialog";
import { SongListCard } from "@/features/setlist/components/SongListCard";
import { YouTubePlayer } from "@/features/setlist/components/YouTubePlayer";
import type { PrepSetlistWithSheets } from "@/features/setlist/types";
import type { TeamMemberRow } from "@/features/team/queries/getTeamMembers";
import { isMultiMemberRole, TEAM_ROLE_OPTIONS, teamRoleLabel } from "@/lib/team-roles";
import { toastPromise } from "@/lib/app-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type PrepSetlistSectionProps = {
  setlists: PrepSetlistWithSheets[];
  error: string | null;
  canManageSetlists: boolean;
  teamMembers: TeamMemberRow[];
};

type LineupEditorProps = {
  setlistId: string;
  current: Array<{ role_code: string; member_id: string }>;
  members: TeamMemberRow[];
};

function groupLineupItems(items: Array<{ role_code: string; member_name: string }>) {
  const map = new Map<string, string[]>();
  for (const item of items) {
    const existing = map.get(item.role_code) ?? [];
    existing.push(item.member_name);
    map.set(item.role_code, existing);
  }
  return TEAM_ROLE_OPTIONS.map((role) => ({ roleCode: role.code, memberNames: map.get(role.code) ?? [] }));
}

function LineupEditorDialog({ setlistId, current, members }: LineupEditorProps) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const initial = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const item of current) {
      const existing = map.get(item.role_code) ?? [];
      existing.push(item.member_id);
      map.set(item.role_code, existing);
    }

    return TEAM_ROLE_OPTIONS.map((r) => ({
      roleCode: r.code,
      memberIds: (map.get(r.code) ?? []).slice(),
    }));
  }, [current]);

  const [draft, setDraft] = useState(initial);

  const onSave = () => {
    start(async () => {
      try {
        await toastPromise(
          upsertSetlistLineup({
            setlistId,
            lineup: draft.map((d) => ({ roleCode: d.roleCode, memberIds: d.memberIds })),
          }).then((res) => {
            if (!res.ok) throw new Error(res.message);
          }),
          "라인업을 저장하는 중입니다...",
        ).unwrap();
        setOpen(false);
      } catch {
        /* handled */
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(initial);
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>라인업 수정</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>라인업 배정</DialogTitle>
          <DialogDescription>V(보컬), STAFF(스텝)는 여러 명 선택이 가능합니다.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {draft.map((item, index) => (
            <div key={item.roleCode} className="rounded-lg border border-border/60 bg-card/50 p-3">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">{teamRoleLabel(item.roleCode)}</p>
              {isMultiMemberRole(item.roleCode) ? (
                <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-input bg-background p-2">
                  {members.map((m) => {
                    const checked = item.memberIds.includes(m.id);
                    return (
                      <label key={m.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = [...draft];
                            const existing = next[index].memberIds;
                            next[index] = {
                              ...next[index],
                              memberIds: e.target.checked
                                ? [...existing, m.id]
                                : existing.filter((id) => id !== m.id),
                            };
                            setDraft(next);
                          }}
                        />
                        <span className="text-sm">{m.username}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <select
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                  value={item.memberIds[0] ?? ""}
                  onChange={(e) => {
                    const next = [...draft];
                    next[index] = { ...next[index], memberIds: e.target.value ? [e.target.value] : [] };
                    setDraft(next);
                  }}
                >
                  <option value="">미배정</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.username}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            취소
          </Button>
          <Button onClick={onSave} disabled={pending}>
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PrepSetlistSection({
  setlists,
  error,
  canManageSetlists,
  teamMembers,
}: PrepSetlistSectionProps) {
  const hasLists = setlists.length > 0;

  return (
    <>
      <section id="prep-setlists" className="scroll-mt-8 rounded-lg border border-border/80 bg-card p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-medium text-foreground">예습 콘티</h2>
            <p className="text-xs text-muted-foreground">prep 상태 콘티와 수록곡을 확인하세요.</p>
          </div>
          {canManageSetlists ? (
            <AddSetlistTriggerButton
              variant="secondary"
              size="sm"
              className="mt-3 w-full shadow-sm sm:mt-0 sm:w-auto"
              teamMembers={teamMembers.map((m) => ({ id: m.id, username: m.username }))}
            />
          ) : null}
        </div>

        {error ? (
          <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5 text-sm text-destructive">
            데이터를 불러오지 못했습니다: {error}
          </div>
        ) : null}

        {!hasLists && !error ? (
          <div className="mt-6 flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-border/90 bg-muted/30 px-5 py-10 text-center text-sm text-muted-foreground">
            아직 예습 콘티가 없습니다.
          </div>
        ) : null}

        {hasLists ? (
          <div className="mt-8 space-y-10">
            {setlists.map((list) => {
              const groupedLineup = groupLineupItems(list.lineup);
              return (
                <div key={list.id} className="space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold tracking-tight">{list.title}</h3>
                      <p className="text-xs text-muted-foreground">{format(new Date(list.event_date), "PPP", { locale: ko })}</p>
                    </div>
                    {canManageSetlists ? (
                      <LineupEditorDialog setlistId={list.id} current={list.lineup} members={teamMembers} />
                    ) : null}
                  </div>

                  <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">라인업</p>
                    {list.lineup.length === 0 ? (
                      <p className="text-sm text-muted-foreground">아직 라인업이 배정되지 않았습니다.</p>
                    ) : (
                      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {groupedLineup
                          .filter((item) => item.memberNames.length > 0)
                          .map((item) => (
                            <li key={`${list.id}-${item.roleCode}`} className="rounded-lg border border-border/60 bg-card px-3 py-2 text-sm">
                              <span className="text-muted-foreground">{teamRoleLabel(item.roleCode)}</span>
                              <span className="mx-1">·</span>
                              <span className="font-medium">{item.memberNames.join(", ")}</span>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>

                  <ul className="flex flex-col gap-4">
                    {list.songs.map((song) => (
                      <li key={song.id}>
                        <SongListCard song={song} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : null}
      </section>

      <YouTubePlayer />
    </>
  );
}
