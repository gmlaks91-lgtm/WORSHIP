import { PersonalDashboard } from "@/features/dashboard/components/PersonalDashboard";
import { getPersonalDashboardData } from "@/features/dashboard/queries/getPersonalDashboardData";
import { PrepSetlistSection } from "@/features/setlist/components/PrepSetlistSection";
import { getSetlists } from "@/features/setlist/queries/getSetlists";
import type { PrepSetlistWithSheets } from "@/features/setlist/types";
import { getLatestSheetsBySongIds } from "@/features/sheets/queries/getSheets";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function SmartSetlistDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let canManageSetlists = false;
  if (user) {
    const { data: row } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    canManageSetlists = row?.role === "leader";
  }

  const [dashboardData, { setlists, error }] = await Promise.all([
    getPersonalDashboardData(),
    getSetlists(),
  ]);
  const songIds = [...new Set(setlists.flatMap((l) => l.songs.map((s) => s.id)))];
  const sheetMap = await getLatestSheetsBySongIds(songIds);

  const setlistsWithSheets: PrepSetlistWithSheets[] = setlists.map((list) => ({
    ...list,
    songs: list.songs.map((s) => ({
      ...s,
      sheet: sheetMap[s.id] ?? null,
    })),
  }));

  return (
    <div className="flex flex-1 flex-col gap-8">
      <section className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          이번 주 콘티
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          스마트 송리스트
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          예습(prep) 콘티와 수록곡을 불러옵니다. 콘티 추가·편집은 리더만 할 수 있습니다.
        </p>
      </section>

      <PersonalDashboard data={dashboardData} />

      <PrepSetlistSection
        setlists={setlistsWithSheets}
        error={error}
        canManageSetlists={canManageSetlists}
      />
    </div>
  );
}
