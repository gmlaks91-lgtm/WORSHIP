"use client";

import type { FormEvent } from "react";
import { useMemo, useState, useTransition } from "react";
import { CalendarPlus, Check, CircleDot, Trash2, X } from "lucide-react";

import {
  createSchedule,
  deleteSchedule,
  setScheduleAttendance,
} from "@/features/schedule/actions";
import type {
  ProfileRow,
  ScheduleAttendanceRow,
  ScheduleListRow,
} from "@/features/schedule/queries/getSchedulesPageData";
import type { ScheduleAttendanceStatus, ScheduleKind } from "@/types/database";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toastError, toastSuccess } from "@/lib/app-toast";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<ScheduleKind, string> = {
  practice: "연습",
  worship: "예배",
  social: "회식·모임",
};

const KIND_BADGE_CLASS: Record<ScheduleKind, string> = {
  practice: "border-sky-500/35 bg-sky-500/10 text-sky-950 dark:text-sky-50",
  worship: "border-violet-500/35 bg-violet-500/10 text-violet-950 dark:text-violet-50",
  social: "border-orange-500/35 bg-orange-500/10 text-orange-950 dark:text-orange-50",
};

function initials(name: string) {
  const t = name.trim();
  if (!t) return "?";
  return t.slice(0, 2);
}

function formatScheduleWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      weekday: "short",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function dayKey(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

type SchedulesSectionProps = {
  schedules: ScheduleListRow[];
  attendances: ScheduleAttendanceRow[];
  profiles: ProfileRow[];
  currentUserId: string | null;
  isLeader: boolean;
};

function MyResponsePicker({
  scheduleId,
  myRow,
}: {
  scheduleId: string;
  myRow: ScheduleAttendanceRow | null;
}) {
  const [pending, startTransition] = useTransition();
  const [local, setLocal] = useState<ScheduleAttendanceStatus | null>(myRow?.status ?? null);

  const onPick = (status: ScheduleAttendanceStatus) => {
    setLocal(status);
    startTransition(async () => {
      const res = await setScheduleAttendance({ scheduleId, status });
      if (!res.ok) {
        toastError(res.message);
        return;
      }
      toastSuccess();
    });
  };

  return (
    <div className="grid grid-cols-3 gap-3 sm:max-w-md">
      {(
        [
          { key: "attending" as const, icon: Check, label: "참석" },
          { key: "absent" as const, icon: X, label: "불참" },
          { key: "pending" as const, icon: CircleDot, label: "미정" },
        ] as const
      ).map(({ key, icon: Icon, label }) => {
        const active = local === key;
        const palette =
          key === "attending"
            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-900 dark:text-emerald-50"
            : key === "absent"
              ? "border-red-500/45 bg-red-500/10 text-red-950 dark:text-red-50"
              : "border-amber-500/45 bg-amber-500/10 text-amber-950 dark:text-amber-50";
        return (
          <Button
            key={key}
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            className={cn(
              "h-auto flex-col gap-1 py-3 text-xs font-semibold",
              active ? cn("ring-2 ring-ring/60", palette) : "text-muted-foreground",
            )}
            onClick={() => onPick(key)}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Button>
        );
      })}
    </div>
  );
}

function TeamStrip({
  title,
  tone,
  members,
}: {
  title: string;
  tone: "emerald" | "red" | "amber" | "muted";
  members: ProfileRow[];
}) {
  const toneMap = {
    emerald: "border-emerald-500/25 bg-emerald-500/5",
    red: "border-red-500/25 bg-red-500/5",
    amber: "border-amber-500/25 bg-amber-500/5",
    muted: "border-border/70 bg-muted/30",
  } as const;

  return (
    <div className={cn("rounded-lg border border-border/60 p-4 shadow-sm", toneMap[tone])}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        <Badge variant="secondary" className="h-5 rounded-full px-1.5 text-[10px]">
          {members.length}
        </Badge>
      </div>
      {members.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">없음</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {members.map((p) => (
            <li key={p.id} className="flex items-center gap-1">
              <Avatar className="size-7 border border-border/60">
                <AvatarFallback className="text-[9px] font-semibold">
                  {initials(p.username)}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[100px] truncate text-[11px] font-medium">{p.username}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ScheduleEventCard({
  schedule,
  rowsForSchedule,
  profiles,
  currentUserId,
  isLeader,
}: {
  schedule: ScheduleListRow;
  rowsForSchedule: ScheduleAttendanceRow[];
  profiles: ProfileRow[];
  currentUserId: string | null;
  isLeader: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const grouped = useMemo(() => {
    const byUser = new Map<string, ScheduleAttendanceRow>();
    for (const r of rowsForSchedule) byUser.set(r.user_id, r);

    const attending: ProfileRow[] = [];
    const absent: ProfileRow[] = [];
    const pendingList: ProfileRow[] = [];
    const unanswered: ProfileRow[] = [];

    for (const p of profiles) {
      const row = byUser.get(p.id);
      if (!row) {
        unanswered.push(p);
        continue;
      }
      if (row.status === "attending") attending.push(p);
      else if (row.status === "absent") absent.push(p);
      else pendingList.push(p);
    }

    return { attending, absent, pending: pendingList, unanswered };
  }, [profiles, rowsForSchedule]);

  const myRow = useMemo(
    () => rowsForSchedule.find((r) => r.user_id === currentUserId) ?? null,
    [rowsForSchedule, currentUserId],
  );

  const onDelete = () => {
    if (
      !confirm("이 일정을 삭제할까요? 팀원 참석 기록도 함께 삭제됩니다.")
    ) {
      return;
    }
    startTransition(async () => {
      const res = await deleteSchedule({ scheduleId: schedule.id });
      if (!res.ok) {
        toastError(res.message);
        return;
      }
      toastSuccess();
    });
  };

  return (
    <Card className="border-border/70 shadow-sm ring-1 ring-border/35">
      <CardHeader className="gap-2 border-b border-border/50 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn("text-[11px] font-semibold", KIND_BADGE_CLASS[schedule.kind])}
              >
                {KIND_LABEL[schedule.kind]}
              </Badge>
              <CardTitle className="text-lg font-semibold tracking-tight">{schedule.title}</CardTitle>
            </div>
            <CardDescription className="text-sm text-muted-foreground">
              {formatScheduleWhen(schedule.starts_at)}
            </CardDescription>
          </div>
          {isLeader ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={pending}
              onClick={onDelete}
              aria-label="일정 삭제"
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-8 pt-6">
        <section className="space-y-3">
          <h3 className="text-sm font-medium">내 응답</h3>
          {!currentUserId ? (
            <p className="text-sm text-muted-foreground">로그인 후 선택할 수 있습니다.</p>
          ) : (
            <MyResponsePicker
              key={`${myRow?.id ?? "new"}:${myRow?.status ?? "x"}`}
              scheduleId={schedule.id}
              myRow={myRow}
            />
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-medium">팀 현황</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <TeamStrip title="참석" tone="emerald" members={grouped.attending} />
            <TeamStrip title="불참" tone="red" members={grouped.absent} />
            <TeamStrip title="미정" tone="amber" members={grouped.pending} />
            <TeamStrip title="미응답" tone="muted" members={grouped.unanswered} />
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function AddScheduleDialog({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ScheduleKind>("practice");
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState("19:00");
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setTitle("");
    setKind("practice");
    const d = new Date();
    setDate(d.toISOString().slice(0, 10));
    setTime("19:00");
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      toastError("일정 이름을 입력하세요.");
      return;
    }
    const local = new Date(`${date}T${time}:00`);
    if (Number.isNaN(local.getTime())) {
      toastError("날짜·시간을 확인하세요.");
      return;
    }

    startTransition(async () => {
      const res = await createSchedule({
        title: trimmed,
        kind,
        startsAt: local.toISOString(),
      });
      if (!res.ok) {
        toastError(res.message);
        return;
      }
      toastSuccess();
      setOpen(false);
      reset();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button type="button" className="gap-2 shadow-sm" disabled={disabled} />
        }
      >
        <CalendarPlus className="size-4" aria-hidden />
        일정 추가
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>새 일정</DialogTitle>
            <DialogDescription>
              연습·예배·모임 일정을 추가합니다. 팀원은 각 카드에서 참석 여부를 선택할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-5">
            <div className="grid gap-2">
              <Label htmlFor="sch-title">이름</Label>
              <Input
                id="sch-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 5월 둘째 주 연습"
                maxLength={200}
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sch-kind">종류</Label>
              <select
                id="sch-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value as ScheduleKind)}
                className={cn(
                  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm",
                  "outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
                )}
              >
                <option value="practice">{KIND_LABEL.practice}</option>
                <option value="worship">{KIND_LABEL.worship}</option>
                <option value="social">{KIND_LABEL.social}</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="sch-date">날짜</Label>
                <Input
                  id="sch-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sch-time">시간</Label>
                <Input
                  id="sch-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="submit" disabled={pending}>
              추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SchedulesSection({
  schedules,
  attendances,
  profiles,
  currentUserId,
  isLeader,
}: SchedulesSectionProps) {
  const sortedSchedules = useMemo(
    () => [...schedules].sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    [schedules],
  );

  const groupedByDay = useMemo(() => {
    const map = new Map<string, ScheduleListRow[]>();
    for (const s of sortedSchedules) {
      const k = dayKey(s.starts_at);
      const list = map.get(k) ?? [];
      list.push(s);
      map.set(k, list);
    }
    return map;
  }, [sortedSchedules]);

  const dayOrder = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    for (const s of sortedSchedules) {
      const k = dayKey(s.starts_at);
      if (!seen.has(k)) {
        seen.add(k);
        order.push(k);
      }
    }
    return order;
  }, [sortedSchedules]);

  return (
    <div className="flex flex-col gap-8">
      {isLeader ? (
        <div className="flex flex-wrap items-center justify-end gap-4">
          <AddScheduleDialog />
        </div>
      ) : null}

      {schedules.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-border/90 bg-muted/25 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">예정된 일정이 없습니다</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            리더가 일정을 추가하면 여기에 표시됩니다. 지금은 다가오는 일정이 없거나 이미 지난 일정만 있을 수
            있습니다.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {dayOrder.map((day) => (
            <div key={day} className="space-y-5">
              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {day}
                </p>
                <div className="h-px flex-1 bg-border/70" />
              </div>
              <div className="flex flex-col gap-8">
                {(groupedByDay.get(day) ?? []).map((schedule) => {
                  const rowsForSchedule = attendances.filter((a) => a.schedule_id === schedule.id);
                  return (
                    <ScheduleEventCard
                      key={schedule.id}
                      schedule={schedule}
                      rowsForSchedule={rowsForSchedule}
                      profiles={profiles}
                      currentUserId={currentUserId}
                      isLeader={isLeader}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
