import Link from "next/link";

import { ProfileSettings } from "@/features/profile/components/ProfileSettings";
import { getMyProfile } from "@/features/profile/queries/getMyProfile";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MorePage() {
  const { profile, error } = await getMyProfile();

  return (
    <div className="flex flex-col gap-10">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Ahaba</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">My page</h1>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">Manage your profile and jump to team lineup page.</p>
      </header>

      {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5 text-sm text-destructive">Failed to load profile: {error}</div> : null}

      {!profile && !error ? (
        <div className="rounded-lg border border-border/60 bg-muted/25 px-6 py-10 text-center text-sm text-muted-foreground">
          Login required.
          <div className="mt-4">
            <Link href="/login" className={cn(buttonVariants({ size: "sm" }))}>Go to login</Link>
          </div>
        </div>
      ) : null}

      {profile ? <ProfileSettings key={profile.updated_at} profile={profile} /> : null}

      <footer className="flex flex-wrap items-center gap-3 border-t border-border/50 pt-6">
        <Link href="/team" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>Team lineup</Link>
        <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Home</Link>
      </footer>
    </div>
  );
}
