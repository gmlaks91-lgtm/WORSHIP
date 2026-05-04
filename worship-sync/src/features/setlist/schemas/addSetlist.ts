import { z } from "zod";

import { getYoutubeVideoId } from "@/features/setlist/utils/youtube";

export const addSetlistTrackSchema = z.object({
  youtubeUrl: z
    .string()
    .min(1, "YouTube URL을 입력하세요")
    .refine((u) => !!getYoutubeVideoId(u), "유효한 YouTube URL이 아닙니다"),
});

export const addSetlistFormSchema = z.object({
  title: z.string().min(1, "콘티 제목을 입력하세요"),
  eventDate: z.date(),
  tracks: z.array(addSetlistTrackSchema).min(1, "최소 한 곡 이상 추가하세요"),
});

export type AddSetlistFormValues = z.infer<typeof addSetlistFormSchema>;

export const createPrepSetlistPayloadSchema = z.object({
  title: z.string().min(1),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않습니다"),
  tracks: z.array(addSetlistTrackSchema).min(1),
});

export type CreatePrepSetlistPayload = z.infer<typeof createPrepSetlistPayloadSchema>;
