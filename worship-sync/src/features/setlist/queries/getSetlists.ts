import "server-only";

import { createClient } from "@/utils/supabase/server";

export type SetlistSongRow = {
  id: string;
  title: string;
  youtube_url: string | null;
  description: string | null;
  order_index: number;
};

export type PrepSetlistRow = {
  id: string;
  title: string;
  event_date: string;
  status: "prep" | "confirmed";
  songs: SetlistSongRow[];
};

export type GetSetlistsResult = {
  setlists: PrepSetlistRow[];
  error: string | null;
};

/** Supabase 중첩 select — 제네릭에 관계가 없어 수동으로 형태를 고정합니다. */
type SetlistQueryRow = {
  id: string;
  title: string;
  event_date: string;
  status: string;
  setlist_songs:
    | {
        order_index: number;
        songs: {
          id: string;
          title: string;
          youtube_url: string | null;
          description: string | null;
        } | null;
      }[]
    | null;
};

/**
 * 최근 `prep` 상태 콘티와 곡(setlist_songs → songs)을 조인해 반환합니다.
 */
export async function getSetlists(): Promise<GetSetlistsResult> {
  try {
    const supabase = await createClient();

    const { data: setlistsRaw, error: setlistError } = await supabase
      .from("setlists")
      .select(
        `
        id,
        title,
        event_date,
        status,
        setlist_songs (
          order_index,
          songs (
            id,
            title,
            youtube_url,
            description
          )
        )
      `,
      )
      .eq("status", "prep")
      .order("event_date", { ascending: false })
      .limit(10);

    if (setlistError) {
      return { setlists: [], error: setlistError.message };
    }

    const rows = (setlistsRaw ?? []) as SetlistQueryRow[];

    const setlists: PrepSetlistRow[] = rows.map((row) => {
      const links = row.setlist_songs ?? [];
      const songs: SetlistSongRow[] = links
        .filter((l) => l.songs)
        .map((l) => ({
          id: l.songs!.id,
          title: l.songs!.title,
          youtube_url: l.songs!.youtube_url,
          description: l.songs!.description,
          order_index: l.order_index,
        }))
        .sort((a, b) => a.order_index - b.order_index);

      return {
        id: row.id,
        title: row.title,
        event_date: row.event_date,
        status: row.status as PrepSetlistRow["status"],
        songs,
      };
    });

    return { setlists, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류";
    return { setlists: [], error: message };
  }
}
