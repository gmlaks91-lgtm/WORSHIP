/**
 * Supabase `public` ??????? ??????? ???.
 * ????????? ?? `supabase gen types typescript`?? ??????? ???????? ???? ????????.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** DB ????? ? UI ???? ???? ???? */
export type ProfileRole = "leader" | "member";
export type TeamRoleCode = "L" | "M" | "S" | "D" | "A/G" | "B/G" | "E/G" | "V" | "STAFF";
export type SetlistStatus = "prep" | "confirmed";
export type AttendanceStatus = "attending" | "late" | "absent";
export type AttendanceEventType = "practice" | "worship";
export type ScheduleKind = "practice" | "worship" | "social";
export type ScheduleAttendanceStatus = "attending" | "absent" | "pending";
export type PostCategory = "prayer" | "feedback" | "general";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          role: ProfileRole;
          avatar_url: string | null;
          team_id: string | null;
          role_priority_1: TeamRoleCode | null;
          role_priority_2: TeamRoleCode | null;
          role_priority_3: TeamRoleCode | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          role?: ProfileRole;
          avatar_url?: string | null;
          team_id?: string | null;
          role_priority_1?: TeamRoleCode | null;
          role_priority_2?: TeamRoleCode | null;
          role_priority_3?: TeamRoleCode | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          role?: ProfileRole;
          avatar_url?: string | null;
          team_id?: string | null;
          role_priority_1?: TeamRoleCode | null;
          role_priority_2?: TeamRoleCode | null;
          role_priority_3?: TeamRoleCode | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      songs: {
        Row: {
          id: string;
          title: string;
          youtube_url: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          youtube_url?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          youtube_url?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      setlists: {
        Row: {
          id: string;
          event_date: string;
          title: string;
          status: SetlistStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_date: string;
          title: string;
          status?: SetlistStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_date?: string;
          title?: string;
          status?: SetlistStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      setlist_songs: {
        Row: {
          setlist_id: string;
          song_id: string;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          setlist_id: string;
          song_id: string;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          setlist_id?: string;
          song_id?: string;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      setlist_lineups: {
        Row: {
          id: string;
          setlist_id: string;
          role_code: TeamRoleCode;
          member_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          setlist_id: string;
          role_code: TeamRoleCode;
          member_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          setlist_id?: string;
          role_code?: TeamRoleCode;
          member_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sheets: {
        Row: {
          id: string;
          song_id: string;
          file_url: string;
          memo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          song_id: string;
          file_url: string;
          memo?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          song_id?: string;
          file_url?: string;
          memo?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      attendance: {
        Row: {
          id: string;
          user_id: string;
          event_date: string;
          event_type: AttendanceEventType;
          status: AttendanceStatus;
          reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_date: string;
          event_type: AttendanceEventType;
          status: AttendanceStatus;
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_date?: string;
          event_type?: AttendanceEventType;
          status?: AttendanceStatus;
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      schedules: {
        Row: {
          id: string;
          title: string;
          kind: ScheduleKind;
          starts_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          kind: ScheduleKind;
          starts_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          kind?: ScheduleKind;
          starts_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      attendances: {
        Row: {
          id: string;
          schedule_id: string;
          user_id: string;
          status: ScheduleAttendanceStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          schedule_id: string;
          user_id: string;
          status: ScheduleAttendanceStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          schedule_id?: string;
          user_id?: string;
          status?: ScheduleAttendanceStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      team_settings: {
        Row: {
          id: boolean;
          playlist_id: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          playlist_id?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: boolean;
          playlist_id?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          category: PostCategory;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: PostCategory;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: PostCategory;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
