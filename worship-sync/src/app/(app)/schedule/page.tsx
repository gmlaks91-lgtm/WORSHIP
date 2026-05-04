import { ScheduleDashboard } from "@/features/schedule/components/ScheduleDashboard";
import { getUpcomingWeekendPair } from "@/features/schedule/lib/weekend";
import { getScheduleData } from "@/features/schedule/queries/getScheduleData";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const { practiceDate, worshipDate, practiceLabel, worshipLabel } = getUpcomingWeekendPair();
  const { attendance, profiles, currentUserId, error } = await getScheduleData(
    practiceDate,
    worshipDate,
  );

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          이번 주말
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          일정 · 출석
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          연습(토)과 예배(일)에 대한 참석 여부를 팀과 공유하세요. 지각·불참 시 사유를 남기면
          리더가 한눈에 파악할 수 있습니다.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          데이터를 불러오지 못했습니다: {error}
        </div>
      ) : null}

      <ScheduleDashboard
        practiceDate={practiceDate}
        worshipDate={worshipDate}
        practiceLabel={`${practiceLabel} · 연습`}
        worshipLabel={`${worshipLabel} · 예배`}
        attendance={attendance}
        profiles={profiles}
        currentUserId={currentUserId}
      />
    </div>
  );
}
