import { AddSetlistTriggerButton } from "@/features/setlist/components/AddSetlistDialog";
import { SongListCard } from "@/features/setlist/components/SongListCard";
import { YouTubePlayer } from "@/features/setlist/components/YouTubePlayer";
import type { PrepSetlistWithSheets } from "@/features/setlist/types";

type PrepSetlistSectionProps = {
  setlists: PrepSetlistWithSheets[];
  error: string | null;
  canManageSetlists: boolean;
};

export function PrepSetlistSection({ setlists, error, canManageSetlists }: PrepSetlistSectionProps) {
  const hasLists = setlists.length > 0;

  return (
    <>
      <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-medium text-foreground">예습 모드</h2>
            <p className="text-xs text-muted-foreground">
              상태가 <span className="font-medium text-foreground">prep</span>인 콘티와 수록곡입니다.
            </p>
          </div>
          {canManageSetlists ? (
            <AddSetlistTriggerButton
              variant="secondary"
              size="sm"
              className="mt-3 w-full shadow-sm sm:mt-0 sm:w-auto"
            />
          ) : null}
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            데이터를 불러오지 못했습니다: {error}
          </div>
        ) : null}

        {!hasLists && !error ? (
          <div className="mt-6 flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-border/90 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            예습(prep) 콘티가 없거나 수록곡이 비어 있습니다. Supabase에 데이터를 추가해 보세요.
          </div>
        ) : null}

        {hasLists ? (
          <div className="mt-6 space-y-8">
            {setlists.map((list) => (
              <div key={list.id} className="space-y-3">
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                  <h3 className="text-base font-semibold tracking-tight">{list.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {list.event_date} · 예습
                  </p>
                </div>
                <ul className="flex flex-col gap-3">
                  {list.songs.map((song) => (
                    <li key={song.id}>
                      <SongListCard song={song} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <YouTubePlayer />
    </>
  );
}
