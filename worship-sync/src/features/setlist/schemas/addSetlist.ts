import { z } from "zod";

import { TEAM_ROLE_OPTIONS } from "@/lib/team-roles";
import { getYoutubeVideoId } from "@/features/setlist/utils/youtube";

const teamRoleCodeValues = TEAM_ROLE_OPTIONS.map((r) => r.code) as [
  "L",
  "M",
  "S",
  "D",
  "A/G",
  "B/G",
  "E/G",
  "V",
  "STAFF",
];

const roleCodeSchema = z.enum(teamRoleCodeValues);

export const addSetlistTrackSchema = z.object({
  youtubeUrl: z
    .string()
    .min(1, "YouTube URL is required")
    .refine((u) => !!getYoutubeVideoId(u), "Invalid YouTube URL"),
});

export const lineupAssignSchema = z.object({
  roleCode: roleCodeSchema,
  memberId: z.string().uuid().nullable(),
});

export const addSetlistFormSchema = z.object({
  title: z.string().min(1, "Setlist title is required"),
  eventDate: z.date(),
  tracks: z.array(addSetlistTrackSchema).min(1, "Add at least one song"),
  lineup: z.array(lineupAssignSchema),
});

export type AddSetlistFormValues = z.infer<typeof addSetlistFormSchema>;

export const createPrepSetlistPayloadSchema = z.object({
  title: z.string().min(1),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  tracks: z.array(addSetlistTrackSchema).min(1),
  lineup: z.array(lineupAssignSchema),
});

export type CreatePrepSetlistPayload = z.infer<typeof createPrepSetlistPayloadSchema>;
