"use server";

import { revalidatePath } from "next/cache";

import { fetchYoutubeOEmbedTitle } from "@/features/setlist/utils/youtube-meta";
import {
  createPrepSetlistPayloadSchema,
  type CreatePrepSetlistPayload,
} from "@/features/setlist/schemas/addSetlist";
import { getYoutubeVideoId, toYoutubeWatchUrl } from "@/features/setlist/utils/youtube";
import { requireLeader } from "@/lib/require-leader";
import type { TeamRoleCode } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

export type CreatePrepSetlistResult = { ok: true } | { ok: false; message: string };

export async function createPrepSetlist(raw: CreatePrepSetlistPayload): Promise<CreatePrepSetlistResult> {
  const parsed = createPrepSetlistPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(", ");
    return { ok: false, message: msg || "입력값을 확인해 주세요." };
  }

  const { title, eventDate, tracks, lineup } = parsed.data;

  try {
    const supabase = await createClient();
    const leader = await requireLeader(supabase);
    if (!leader.ok) return { ok: false, message: leader.message };

    const { data: setlist, error: setlistError } = await supabase
      .from("setlists")
      .insert({ title, event_date: eventDate, status: "prep" })
      .select("id")
      .single();

    if (setlistError || !setlist) {
      return { ok: false, message: setlistError?.message ?? "콘티를 생성하지 못했습니다." };
    }

    const setlistId = setlist.id;

    const { data: existingSongs, error: songsReadError } = await supabase
      .from("songs")
      .select("id, youtube_url");
    if (songsReadError) {
      await supabase.from("setlists").delete().eq("id", setlistId);
      return { ok: false, message: songsReadError.message };
    }

    const byVideoId = new Map<string, string>();
    for (const row of existingSongs ?? []) {
      const vid = getYoutubeVideoId(row.youtube_url);
      if (vid) byVideoId.set(vid, row.id);
    }

    const songIdsOrdered: string[] = [];
    for (const track of tracks) {
      const videoId = getYoutubeVideoId(track.youtubeUrl);
      if (!videoId) {
        await supabase.from("setlists").delete().eq("id", setlistId);
        return { ok: false, message: "유효하지 않은 YouTube URL이 포함되어 있습니다." };
      }

      let songId = byVideoId.get(videoId);
      if (!songId) {
        const canonical = toYoutubeWatchUrl(videoId);
        const oembedTitle = await fetchYoutubeOEmbedTitle(canonical);
        const songTitle = oembedTitle ?? `YouTube - ${videoId}`;

        const { data: inserted, error: insertSongError } = await supabase
          .from("songs")
          .insert({ title: songTitle, youtube_url: canonical, description: null })
          .select("id")
          .single();

        if (insertSongError || !inserted) {
          await supabase.from("setlists").delete().eq("id", setlistId);
          return { ok: false, message: insertSongError?.message ?? "곡을 생성하지 못했습니다." };
        }

        songId = inserted.id;
        byVideoId.set(videoId, songId);
      }

      songIdsOrdered.push(songId);
    }

    const songRows = songIdsOrdered.map((songId, index) => ({
      setlist_id: setlistId,
      song_id: songId,
      order_index: index,
    }));
    const { error: junctionError } = await supabase.from("setlist_songs").insert(songRows);
    if (junctionError) {
      await supabase.from("setlists").delete().eq("id", setlistId);
      return { ok: false, message: junctionError.message };
    }

    const lineupRows = lineup
      .filter((item) => item.memberId)
      .map((item) => ({
        setlist_id: setlistId,
        role_code: item.roleCode as TeamRoleCode,
        member_id: item.memberId!,
      }));

    if (lineupRows.length > 0) {
      const { error: lineupErr } = await supabase.from("setlist_lineups").insert(lineupRows);
      if (lineupErr) {
        await supabase.from("setlists").delete().eq("id", setlistId);
        return { ok: false, message: lineupErr.message };
      }
    }

    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
    return { ok: false, message };
  }
}

export async function upsertSetlistLineup(raw: {
  setlistId: string;
  lineup: Array<{ roleCode: TeamRoleCode; memberId: string | null }>;
}): Promise<CreatePrepSetlistResult> {
  try {
    const supabase = await createClient();
    const leader = await requireLeader(supabase);
    if (!leader.ok) return { ok: false, message: leader.message };

    const { error: delErr } = await supabase
      .from("setlist_lineups")
      .delete()
      .eq("setlist_id", raw.setlistId);
    if (delErr) return { ok: false, message: delErr.message };

    const rows = raw.lineup
      .filter((l) => l.memberId)
      .map((l) => ({ setlist_id: raw.setlistId, role_code: l.roleCode, member_id: l.memberId! }));

    if (rows.length > 0) {
      const { error: insErr } = await supabase.from("setlist_lineups").insert(rows);
      if (insErr) return { ok: false, message: insErr.message };
    }

    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
    return { ok: false, message };
  }
}
