import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { SheetMedia } from "@/features/sheets/components/SheetMedia";
import { getLatestSheetForSong } from "@/features/sheets/queries/getSheets";
import { getSongUsageStats } from "@/features/setlist/queries/getSongUsageStats";
import { createClient } from "@/utils/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SheetForSongPage({
  params,
}: {
  params: Promise<{ songId: string }>;
}) {
  const { songId } = await params;
  const supabase = await createClient();

  const [sheet, songRes] = await Promise.all([
    getLatestSheetForSong(songId),
    supabase.from("songs").select("title").eq("id", songId).maybeSingle(),
  ]);
  const usageMap = await getSongUsageStats([songId]);
  const usage = usageMap[songId];

  const song = songRes.data;

  if (!song || !sheet) {
    notFound();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 items-start gap-2 border-b border-border/70 bg-background/95 px-2 py-2.5 shadow-sm backdrop-blur-md sm:px-3">
        <Link
          href="/"
          aria-label="대시보드로"
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "shrink-0")}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0 flex-1 space-y-0.5">
          <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">{song.title}</h1>
          {sheet.memo ? (
            <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{sheet.memo}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground">리더 메모가 없습니다.</p>
          )}
          <p className="text-[11px] text-muted-foreground">
            올해 누적 {usage?.yearly_count ?? 0}회 찬양
            {usage?.last_played_at ? ` · 최근 찬양일: ${usage.last_played_at}` : ""}
          </p>
        </div>
      </header>

      <div className="flex min-h-[60vh] flex-1 flex-col overflow-hidden sm:min-h-[70vh]">
        <SheetMedia fileUrl={sheet.file_url} className="min-h-0 flex-1" />
      </div>
    </div>
  );
}
