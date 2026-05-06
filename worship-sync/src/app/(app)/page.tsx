import { PersonalDashboard } from "@/features/dashboard/components/PersonalDashboard";
import { getPersonalDashboardData } from "@/features/dashboard/queries/getPersonalDashboardData";
import { PrepSetlistSection } from "@/features/setlist/components/PrepSetlistSection";
import { getSetlists } from "@/features/setlist/queries/getSetlists";
import type { PrepSetlistWithSheets } from "@/features/setlist/types";
import type { TeamMemberRow } from "@/features/team/queries/getTeamMembers";
import { getLatestSheetsBySongIds } from "@/features/sheets/queries/getSheets";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function SmartSetlistDashboardPage() {
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
      <section className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Ahaba</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Smart Setlist</h1>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          Prep setlists, lineup assignments, and sheets in one place.
        </p>
      </section>

      <PersonalDashboard data={dashboardData} />

      <PrepSetlistSection
        setlists={setlistsWithSheets}
        error={error}
        canManageSetlists={canManageSetlists}
        teamMembers={teamMembers}
      />
    </div>
  );
}
