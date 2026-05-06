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
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Team lineup</h1>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">Check all members and role priorities at a glance.</p>
      </header>

      {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5 text-sm text-destructive">Failed to load members: {error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <Card key={member.id} className="border-border/70">
            <CardHeader className="pb-3"><CardTitle className="text-base">{member.username}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Permission</span> ， {member.role === "leader" ? "Leader" : "Member"}</p>
              <p><span className="text-muted-foreground">Priority 1</span> ， {teamRoleLabel(member.role_priority_1)}</p>
              <p><span className="text-muted-foreground">Priority 2</span> ， {teamRoleLabel(member.role_priority_2)}</p>
              <p><span className="text-muted-foreground">Priority 3</span> ， {teamRoleLabel(member.role_priority_3)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
