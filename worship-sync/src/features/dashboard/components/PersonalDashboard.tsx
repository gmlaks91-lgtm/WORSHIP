import Link from "next/link";
import { ArrowRight, CalendarRange, ListMusic, Music2 } from "lucide-react";

import type { PersonalDashboardData } from "@/features/dashboard/queries/getPersonalDashboardData";
import type { ScheduleAttendanceStatus, ScheduleKind } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatShortWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function myStatusLabel(status: ScheduleAttendanceStatus | null) {
  if (status === "attending") return { text: "참석", className: "border-emerald-500/40 bg-emerald-500/10" };
  if (status === "absent") return { text: "불참", className: "border-red-500/40 bg-red-500/10" };
  if (status === "pending") return { text: "미정", className: "border-amber-500/40 bg-amber-500/10" };
  return { text: "응답 전", className: "border-border/80 bg-muted/40" };
}

export function PersonalDashboard({ data }: { data: PersonalDashboardData }) {
  const errLine = data.errors.length ? data.errors.join(" · ") : null;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            내 요약
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">오늘의 팀 한눈에</h2>
          <p className="text-xs text-muted-foreground">
            다가오는 일정 응답과 최근 콘티·악보를 모았습니다.
          </p>
        </div>
        <Link
          href="/schedule"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "mt-2 inline-flex w-full gap-1 shadow-sm sm:mt-0 sm:w-auto",
          )}
        >
          일정 전체
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      {errLine ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5 text-xs text-destructive">
          일부 정보를 불러오지 못했습니다: {errLine}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/70 shadow-sm ring-1 ring-border/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CalendarRange className="size-4 text-muted-foreground" aria-hidden />
              <CardTitle className="text-base font-semibold">다가오는 일정 · 내 응답</CardTitle>
            </div>
            <CardDescription>참석·불참·미정을 빠르게 확인하세요.</CardDescription>
          </CardHeader>
            <CardContent className="space-y-4">
            {data.upcomingWithMine.length === 0 ? (
              <p className="text-sm text-muted-foreground">예정된 일정이 없습니다.</p>
            ) : (
              <ul className="space-y-2.5">
                {data.upcomingWithMine.map(({ schedule, myStatus }) => {
                  const badge = myStatusLabel(myStatus);
                  return (
                    <li key={schedule.id}>
                      <Link
                        href="/schedule"
                        className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/15 px-4 py-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-semibold",
                                KIND_BADGE_CLASS[schedule.kind],
                              )}
                            >
                              {KIND_LABEL[schedule.kind]}
                            </Badge>
                            <span className="truncate text-sm font-medium">{schedule.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{formatWhen(schedule.starts_at)}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 self-start sm:self-center",
                            badge.className,
                          )}
                        >
                          {badge.text}
                        </Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="border-border/70 shadow-sm ring-1 ring-border/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ListMusic className="size-4 text-muted-foreground" aria-hidden />
                <CardTitle className="text-base font-semibold">최근 예습 콘티</CardTitle>
              </div>
              <CardDescription>prep 상태 콘티가 최신 순으로 표시됩니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.recentSetlists.length === 0 ? (
                <p className="text-sm text-muted-foreground">표시할 콘티가 없습니다.</p>
              ) : (
                <ul className="space-y-3">
                  {data.recentSetlists.map((list) => (
                    <li key={list.id}>
                      <Link
                        href="/#prep-setlists"
                        className="block rounded-lg border border-border/60 bg-muted/15 px-4 py-3 transition-colors hover:bg-muted/30"
                      >
                        <p className="truncate text-sm font-medium">{list.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {list.event_date} · 곡 {list.songs.length}곡
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/#prep-setlists"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "w-full text-muted-foreground",
                )}
              >
                아래 콘티 섹션으로 이동
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm ring-1 ring-border/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Music2 className="size-4 text-muted-foreground" aria-hidden />
                <CardTitle className="text-base font-semibold">방금 올라온 악보</CardTitle>
              </div>
              <CardDescription>최근 업로드된 파일입니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentSheets.length === 0 ? (
                <p className="text-sm text-muted-foreground">최근 악보가 없습니다.</p>
              ) : (
                <ul className="space-y-3">
                  {data.recentSheets.map((row) => (
                    <li key={row.id}>
                      <Link
                        href={`/sheets/${row.song_id}`}
                        className="block rounded-lg border border-border/60 bg-muted/15 px-4 py-3 transition-colors hover:bg-muted/30"
                      >
                        <p className="truncate text-sm font-medium">{row.song_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatShortWhen(row.created_at)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/sheets"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "w-full text-muted-foreground",
                )}
              >
                악보 라이브러리
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
