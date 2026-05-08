import { PersonalDashboard } from "@/features/dashboard/components/PersonalDashboard";
import { getPersonalDashboardData } from "@/features/dashboard/queries/getPersonalDashboardData";
import { PrepSetlistSection } from "@/features/setlist/components/PrepSetlistSection";
import { getRecentSongWarningByVideoId } from "@/features/setlist/queries/getSongUsageStats";
import { LastWorshipVideoSection } from "@/features/team-settings/components/LastWorshipVideoSection";
import { getSetlists } from "@/features/setlist/queries/getSetlists";
import type { PrepSetlistWithSheets } from "@/features/setlist/types";
import type { TeamMemberRow } from "@/features/team/queries/getTeamMembers";
import { getLatestSheetsBySongIds } from "@/features/sheets/queries/getSheets";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function AhabaDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let canManageSetlists = false;
  let teamMembers: TeamMemberRow[] = [];

  if (user) {
    const [{ data: row }, { data: members }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      supabase
        .from("profiles")
        .select("id, username, avatar_url, role, role_priority_1, role_priority_2, role_priority_3")
        .order("username", { ascending: true }),
    ]);
    canManageSetlists = row?.role === "leader";
    teamMembers = (members ?? []) as TeamMemberRow[];
  }

  const [dashboardData, { setlists, error }] = await Promise.all([
    getPersonalDashboardData(),
    getSetlists(),
  ]);
  const recentSongWarningByVideoId = canManageSetlists ? await getRecentSongWarningByVideoId() : {};
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
    <div className="flex flex-1 flex-col gap-10">
      <LastWorshipVideoSection
        videoUrl={dashboardData.lastWorshipVideoUrl}
        embedUrl={dashboardData.lastWorshipVideoEmbedUrl}
        canEdit={dashboardData.canManageTeamPlaylist}
      />

      <section className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Ahaba</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">이 주의 콘티</h1>
      </section>

      <PersonalDashboard data={dashboardData} />

      <PrepSetlistSection
        setlists={setlistsWithSheets}
        error={error}
        canManageSetlists={canManageSetlists}
        teamMembers={teamMembers}
        recentSongWarningByVideoId={recentSongWarningByVideoId}
      />
    </div>
  );
}
