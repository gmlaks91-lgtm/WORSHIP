import { notFound } from "next/navigation";

import { StaffNotesEditor } from "@/features/setlist/components/StaffNotesEditor";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function SetlistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("setlists")
    .select(
      `
      id,title,event_date,staff_notes,
      setlist_songs(order_index,songs(id,title,youtube_url)),
      setlist_lineups(role_code,profiles(username))
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{data.title}</h1>
        <p className="text-sm text-muted-foreground">{data.event_date}</p>
      </header>

      <section className="space-y-2 rounded-lg border border-border/60 bg-card/60 p-4">
        <h2 className="text-sm font-semibold">수록곡</h2>
        <ul className="space-y-1 text-sm">
          {(data.setlist_songs ?? [])
            .sort((a, b) => a.order_index - b.order_index)
            .map((row) => (
              <li key={`${data.id}-${row.order_index}`}>{row.songs?.title ?? "알 수 없음"}</li>
            ))}
        </ul>
      </section>

      <section className="space-y-2 rounded-lg border border-border/60 bg-card/60 p-4">
        <h2 className="text-sm font-semibold">라인업</h2>
        <ul className="space-y-1 text-sm">
          {(data.setlist_lineups ?? []).map((row, idx) => (
            <li key={`${data.id}-${row.role_code}-${idx}`}>
              {row.role_code} · {row.profiles?.username ?? "미배정"}
            </li>
          ))}
        </ul>
      </section>

      <StaffNotesEditor setlistId={data.id} initialValue={data.staff_notes} />
    </div>
  );
}
