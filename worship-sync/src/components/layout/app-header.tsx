import Link from "next/link";

import { AppHeaderActions } from "@/components/layout/app-header-actions";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

type AppHeaderProps = {
  className?: string;
};

export async function AppHeader({ className }: AppHeaderProps) {
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

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md",
        "shadow-[0_1px_0_0_rgba(0,0,0,0.03)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)]",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="group flex flex-col gap-0.5 transition-opacity hover:opacity-90"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Worship
          </span>
          <span className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
            WorshipSync
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground lg:inline">
            스마트 송리스트
          </span>
          <AppHeaderActions canManageSetlists={canManageSetlists} />
        </div>
      </div>
    </header>
  );
}
