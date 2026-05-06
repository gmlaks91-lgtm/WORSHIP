import "server-only";

import type { TeamRoleCode } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

export type SetlistSongRow = {
  id: string;
  title: string;
  youtube_url: string | null;
  description: string | null;
  order_index: number;
};

export type SetlistLineupRow = {
  role_code: TeamRoleCode;
  member_id: string;
  member_name: string;
};

export type PrepSetlistRow = {
  id: string;
  title: string;
  event_date: string;
  status: "prep" | "confirmed";
  songs: SetlistSongRow[];
  lineup: SetlistLineupRow[];
};

export type GetSetlistsResult = {
  setlists: PrepSetlistRow[];
  error: string | null;
};

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
  setlist_lineups:
    | {
        role_code: TeamRoleCode;
        member_id: string;
        profiles: { username: string } | null;
      }[]
    | null;
};

export async function getSetlists(options?: { limit?: number }): Promise<GetSetlistsResult> {
  const limit = options?.limit ?? 10;
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
        ),
        setlist_lineups (
          role_code,
          member_id,
          profiles ( username )
        )
      `,
      )
      .eq("status", "prep")
      .order("event_date", { ascending: false })
      .limit(limit);

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

      const lineup = (row.setlist_lineups ?? [])
        .map((line) => ({
          role_code: line.role_code,
          member_id: line.member_id,
          member_name: line.profiles?.username ?? "알 수 없음",
        }))
        .sort((a, b) => a.role_code.localeCompare(b.role_code));

      return {
        id: row.id,
        title: row.title,
        event_date: row.event_date,
        status: row.status as PrepSetlistRow["status"],
        songs,
        lineup,
      };
    });

    return { setlists, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류";
    return { setlists: [], error: message };
  }
}

