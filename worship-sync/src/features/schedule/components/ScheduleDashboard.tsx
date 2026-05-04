"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Clock3, UserRound, X } from "lucide-react";

import { toggleAttendance, updateReason } from "@/features/schedule/actions";
import type { AttendanceRow, ProfileRow } from "@/features/schedule/queries/getScheduleData";
import type { AttendanceEventType, AttendanceStatus } from "@/types/database";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toastError, toastSuccess } from "@/lib/app-toast";
import { cn } from "@/lib/utils";

type ScheduleDashboardProps = {
  practiceDate: string;
  worshipDate: string;
  practiceLabel: string;
  worshipLabel: string;
  attendance: AttendanceRow[];
  profiles: ProfileRow[];
  currentUserId: string | null;
};

function initials(name: string) {
  const t = name.trim();
  if (!t) return "?";
  return t.slice(0, 2);
}

/** 서버 `myRow` 스냅샷이 바뀔 때만 remount 되어 로컬 상태를 안전하게 맞춤 (useEffect setState 린트 회피) */
function AttendanceMyStatus({
  myRow,
  eventDate,
  eventType,
}: {
  myRow: AttendanceRow | null;
  eventDate: string;
  eventType: AttendanceEventType;
}) {
  const [pending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState<AttendanceStatus | null>(myRow?.status ?? null);
  const [reasonDraft, setReasonDraft] = useState(myRow?.reason ?? "");

  const showReason = localStatus === "late" || localStatus === "absent";

  const onPickStatus = (status: AttendanceStatus) => {
    setLocalStatus(status);
    startTransition(async () => {
      const nextReason =
        status === "attending" ? null : reasonDraft.trim().length ? reasonDraft.trim() : null;
      const res = await toggleAttendance({
        eventDate,
        eventType,
        status,
        reason: nextReason,
      });
      if (!res.ok) {
        toastError(res.message);
        return;
      }
      toastSuccess();
    });
  };

  const onSaveReason = () => {
    if (!showReason) return;
    startTransition(async () => {
      const res = await updateReason({
        eventDate,
        eventType,
        reason: reasonDraft,
      });
      if (!res.ok) {
        toastError(res.message);
        return;
      }
      toastSuccess();
    });
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-3 sm:max-w-md">
        {(
          [
            { key: "attending" as const, icon: Check, label: "참석" },
            { key: "late" as const, icon: Clock3, label: "지각" },
            { key: "absent" as const, icon: X, label: "불참" },
          ] as const
        ).map(({ key, icon: Icon, label }) => {
          const active = localStatus === key;
          const palette =
            key === "attending"
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-900 shadow-sm dark:text-emerald-50"
              : key === "late"
                ? "border-amber-500/50 bg-amber-500/12 text-amber-950 shadow-sm dark:text-amber-50"
                : "border-red-500/45 bg-red-500/10 text-red-950 shadow-sm dark:text-red-50";
          return (
            <Button
              key={key}
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              className={cn(
                "h-auto flex-col gap-1.5 py-4 text-xs font-semibold transition-all duration-200 sm:py-3",
                active ? cn("ring-2 ring-ring/60", palette) : "text-muted-foreground",
              )}
              onClick={() => onPickStatus(key)}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Button>
          );
        })}
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          showReason ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/25 p-4 shadow-inner">
            <label
              className="text-xs font-medium text-muted-foreground"
              htmlFor={`reason-${eventType}`}
            >
              사유 {showReason ? "(지각·불참)" : ""}
            </label>
            <textarea
              id={`reason-${eventType}`}
              value={reasonDraft}
              onChange={(e) => setReasonDraft(e.target.value)}
              disabled={!showReason || pending}
              placeholder="예: 야근, 지역 출장, 가족 일정 등"
              className={cn(
                "min-h-[96px] w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none transition-[opacity,transform] duration-200",
                "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            />
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!showReason || pending}
                onClick={onSaveReason}
              >
                사유만 저장
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AttendanceEventCard({
  title,
  description,
  eventDate,
  eventType,
  attendance,
  profiles,
  currentUserId,
}: {
  title: string;
  description: string;
  eventDate: string;
  eventType: AttendanceEventType;
  attendance: AttendanceRow[];
  profiles: ProfileRow[];
  currentUserId: string | null;
}) {
  const rowsForEvent = useMemo(
    () =>
      attendance.filter((r) => r.event_date === eventDate && r.event_type === eventType),
    [attendance, eventDate, eventType],
  );

  const myRow = useMemo(
    () => rowsForEvent.find((r) => r.user_id === currentUserId) ?? null,
    [rowsForEvent, currentUserId],
  );

  const myStatusSyncKey = `${myRow?.id ?? "none"}:${myRow?.status ?? "x"}:${myRow?.reason ?? ""}`;

  const grouped = useMemo(() => {
    const byUser = new Map<string, AttendanceRow>();
    for (const r of rowsForEvent) byUser.set(r.user_id, r);

    const attending: ProfileRow[] = [];
    const late: ProfileRow[] = [];
    const absent: ProfileRow[] = [];
    const pendingList: ProfileRow[] = [];

    for (const p of profiles) {
      const row = byUser.get(p.id);
      if (!row) {
        pendingList.push(p);
        continue;
      }
      if (row.status === "attending") attending.push(p);
      else if (row.status === "late") late.push(p);
      else absent.push(p);
    }

    return { attending, late, absent, pending: pendingList };
  }, [profiles, rowsForEvent]);

  return (
    <Card className="border-border/70 shadow-sm ring-1 ring-border/35">
      <CardHeader className="gap-2 border-b border-border/50 pb-4 sm:pb-5">
        <CardTitle className="text-lg font-semibold tracking-tight">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-7 pt-5 sm:pt-6">
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <UserRound className="size-4 text-muted-foreground" aria-hidden />
            <h3 className="text-sm font-medium">내 상태</h3>
          </div>
          {!currentUserId ? (
            <p className="text-sm text-muted-foreground">로그인 후 상태를 선택할 수 있습니다.</p>
          ) : (
            <AttendanceMyStatus
              key={myStatusSyncKey}
              myRow={myRow}
              eventDate={eventDate}
              eventType={eventType}
            />
          )}
        </section>

        <section className="space-y-5">
          <h3 className="text-sm font-medium">팀 현황</h3>

          <OverviewCluster
            title="참석"
            tone="emerald"
            members={grouped.attending}
            rowsForEvent={rowsForEvent}
          />
          <OverviewCluster
            title="지각"
            tone="amber"
            members={grouped.late}
            rowsForEvent={rowsForEvent}
          />
          <OverviewCluster
            title="불참"
            tone="red"
            members={grouped.absent}
            rowsForEvent={rowsForEvent}
          />
          <OverviewCluster
            title="미응답"
            tone="muted"
            members={grouped.pending}
            rowsForEvent={rowsForEvent}
            hideReason
          />
        </section>
      </CardContent>
    </Card>
  );
}

function OverviewCluster({
  title,
  tone,
  members,
  rowsForEvent,
  hideReason,
}: {
  title: string;
  tone: "emerald" | "amber" | "red" | "muted";
  members: ProfileRow[];
  rowsForEvent: AttendanceRow[];
  hideReason?: boolean;
}) {
  const toneMap = {
    emerald: "border-emerald-500/25 bg-emerald-500/5",
    amber: "border-amber-500/25 bg-amber-500/5",
    red: "border-red-500/25 bg-red-500/5",
    muted: "border-border/70 bg-muted/30",
  } as const;

  const byUser = useMemo(() => {
    const m = new Map<string, AttendanceRow>();
    for (const r of rowsForEvent) m.set(r.user_id, r);
    return m;
  }, [rowsForEvent]);

  return (
    <div className={cn("rounded-2xl border border-border/60 p-4 shadow-sm", toneMap[tone])}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        <Badge variant="secondary" className="h-6 rounded-full px-2 text-[11px]">
          {members.length}명
        </Badge>
      </div>
      {members.length === 0 ? (
        <p className="text-xs text-muted-foreground">아직 없습니다.</p>
      ) : (
        <ul className="flex flex-wrap gap-3">
          {members.map((p) => {
            const row = byUser.get(p.id);
            const reason = row?.reason?.trim();
            const showTip =
              !hideReason && !!reason && (row?.status === "late" || row?.status === "absent");

            const face = (
              <div className="flex items-center gap-1.5">
                <Avatar className="size-8 border border-border/60 shadow-sm">
                  <AvatarFallback className="text-[10px] font-semibold">
                    {initials(p.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col text-left">
                  <span className="truncate text-xs font-medium leading-tight">{p.username}</span>
                  {showTip ? (
                    <span className="line-clamp-1 text-[10px] text-muted-foreground">{reason}</span>
                  ) : null}
                </div>
              </div>
            );

            if (showTip && reason) {
              return (
                <li key={p.id}>
                  <Tooltip>
                    <TooltipTrigger className="flex w-full max-w-[200px] items-center rounded-xl border border-transparent bg-transparent px-1.5 py-1 text-left outline-none transition-colors hover:bg-background/60 focus-visible:ring-2 focus-visible:ring-ring">
                      {face}
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                      <span className="font-medium">{p.username}</span>
                      <p className="mt-1 text-muted-foreground">{reason}</p>
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            }

            return (
              <li key={p.id} className="rounded-xl px-1.5 py-1">
                {face}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function ScheduleDashboard(props: ScheduleDashboardProps) {
  const {
    practiceDate,
    worshipDate,
    practiceLabel,
    worshipLabel,
    attendance,
    profiles,
    currentUserId,
  } = props;

  return (
    <div className="flex flex-col gap-7">
      <AttendanceEventCard
        title="토요일 연습"
        description={practiceLabel}
        eventDate={practiceDate}
        eventType="practice"
        attendance={attendance}
        profiles={profiles}
        currentUserId={currentUserId}
      />
      <AttendanceEventCard
        title="주일 예배"
        description={worshipLabel}
        eventDate={worshipDate}
        eventType="worship"
        attendance={attendance}
        profiles={profiles}
        currentUserId={currentUserId}
      />
    </div>
  );
}
