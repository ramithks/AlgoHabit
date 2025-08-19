// Minimal Supabase Database types for client-only usage (normalized schema)
// Keep this file independent of app modules to avoid circular deps.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; // uuid
          email: string | null;
          username: string | null;
          full_name: string | null;
          is_public: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          username?: string | null;
          full_name?: string | null;
          is_public?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          username?: string | null;
          full_name?: string | null;
          is_public?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      user_metrics: {
        Row: {
          user_id: string;
          xp: number;
          streak: number;
          last_active: string | null; // date
          updated_at: string;
        };
        Insert: {
          user_id: string;
          xp?: number;
          streak?: number;
          last_active?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          xp?: number;
          streak?: number;
          last_active?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_metrics_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      topics_progress: {
        Row: {
          user_id: string;
          topic_id: string;
          week: number;
          status: "pending" | "in-progress" | "complete" | "skipped";
          last_touched: string | null; // date
          xp_in_progress: boolean;
          xp_complete: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          topic_id: string;
          week: number;
          status?: "pending" | "in-progress" | "complete" | "skipped";
          last_touched?: string | null;
          xp_in_progress?: boolean;
          xp_complete?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          topic_id?: string;
          week?: number;
          status?: "pending" | "in-progress" | "complete" | "skipped";
          last_touched?: string | null;
          xp_in_progress?: boolean;
          xp_complete?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "topics_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      topic_daily_notes: {
        Row: {
          user_id: string;
          topic_id: string;
          day: string; // date
          note: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          topic_id: string;
          day: string;
          note: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          topic_id?: string;
          day?: string;
          note?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "topic_daily_notes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      // tasks removed
      activity_log: {
        Row: {
          user_id: string;
          day: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          day: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          day?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      username_aliases: {
        Row: {
          user_id: string;
          username: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          username: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          username?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "username_aliases_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
