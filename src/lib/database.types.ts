export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "Athlete" | "Coach" | "TeamAdmin" | "ClubAdmin" | "Admin";
export type UserStatus = "active" | "disabled";
export type ClubStatus = "active" | "inactive";
export type ReviewStatus = "open" | "approved" | "rejected";
export type PlanStatus = "planned" | "in_progress" | "completed" | "partially_completed" | "done" | "skipped" | "cancelled";
export type GoalStatus = "active" | "paused" | "achieved" | "archived";
export type GoalType = "time" | "count" | "percent" | "text";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          display_name: string | null;
          club_id: string | null;
          roles: UserRole[];
          status: UserStatus;
          avatar_url: string | null;
          age_category: string | null;
          boat_classes: string[];
          paddle_side: string | null;
          profile_data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["profiles"]["Row"], "id" | "created_at" | "updated_at">> & {
          id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      clubs: {
        Row: {
          id: string;
          name: string;
          short_name: string | null;
          city: string | null;
          contact_name: string | null;
          contact_email: string | null;
          website: string | null;
          logo_url: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          status: ClubStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["clubs"]["Row"], "id" | "created_at" | "updated_at">> & { name: string };
        Update: Partial<Database["public"]["Tables"]["clubs"]["Row"]>;
      };
      club_requests: {
        Row: {
          id: string;
          requested_by: string | null;
          name: string;
          short_name: string | null;
          city: string | null;
          message: string | null;
          status: ReviewStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["club_requests"]["Row"], "id" | "created_at">> & { name: string };
        Update: Partial<Database["public"]["Tables"]["club_requests"]["Row"]>;
      };
      trainer_requests: {
        Row: {
          id: string;
          user_id: string | null;
          club_id: string | null;
          club_name: string | null;
          message: string | null;
          has_license: boolean;
          license_number: string | null;
          qualification: string | null;
          phone: string | null;
          status: ReviewStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["trainer_requests"]["Row"], "id" | "created_at">>;
        Update: Partial<Database["public"]["Tables"]["trainer_requests"]["Row"]>;
      };
      training_groups: {
        Row: {
          id: string;
          club_id: string;
          coach_id: string | null;
          name: string;
          description: string | null;
          age_category: string | null;
          boat_classes: string[];
          training_focus: string | null;
          color: string | null;
          status: ClubStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["training_groups"]["Row"], "id" | "created_at" | "updated_at">> & {
          club_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["training_groups"]["Row"]>;
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          athlete_id: string;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["group_members"]["Row"], "id" | "created_at">> & {
          group_id: string;
          athlete_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["group_members"]["Row"]>;
      };
      season_goals: {
        Row: {
          id: string;
          athlete_id: string;
          assigned_by: string | null;
          title: string;
          description: string | null;
          goal_type: GoalType;
          target_value: number | null;
          current_value: number | null;
          unit: string | null;
          status: GoalStatus;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["season_goals"]["Row"], "id" | "created_at" | "updated_at">> & {
          athlete_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["season_goals"]["Row"]>;
      };
      training_plan_items: {
        Row: {
          id: string;
          owner_id: string;
          club_id: string | null;
          coach_id: string | null;
          assigned_athlete_id: string | null;
          assigned_group_id: string | null;
          title: string;
          date: string;
          start_time: string | null;
          end_time: string | null;
          duration_minutes: number;
          area: string | null;
          training_type: string | null;
          boat_class: string | null;
          goal: string | null;
          intensity: string | null;
          status: PlanStatus;
          repeat_rule: string | null;
          repeat_series_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["training_plan_items"]["Row"], "id" | "created_at" | "updated_at">> & {
          owner_id: string;
          title: string;
          date: string;
        };
        Update: Partial<Database["public"]["Tables"]["training_plan_items"]["Row"]>;
      };
      training_feedback: {
        Row: {
          id: string;
          training_plan_item_id: string;
          athlete_id: string;
          coach_id: string | null;
          status: "done" | "skipped";
          feeling: number | null;
          difficulty: number | null;
          fatigue: number | null;
          motivation: number | null;
          sleep: number | null;
          reason: string | null;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["training_feedback"]["Row"], "id" | "created_at" | "updated_at">> & {
          training_plan_item_id: string;
          athlete_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["training_feedback"]["Row"]>;
      };
      competitions: {
        Row: {
          id: string;
          club_id: string | null;
          name: string;
          location: string | null;
          organizer: string | null;
          course: string | null;
          start_date: string;
          end_date: string | null;
          level: string | null;
          source: string | null;
          external_id: string | null;
          source_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["competitions"]["Row"], "id" | "created_at" | "updated_at">> & {
          name: string;
          start_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["competitions"]["Row"]>;
      };
      competition_results: {
        Row: {
          id: string;
          competition_id: string;
          athlete_id: string;
          boat_class: string;
          run1_time_seconds: number | null;
          run1_penalty_seconds: number | null;
          run2_time_seconds: number | null;
          run2_penalty_seconds: number | null;
          best_total_seconds: number | null;
          rank: number | null;
          starter_field: number | null;
          gap_to_winner_seconds: number | null;
          feeling: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["competition_results"]["Row"], "id" | "created_at" | "updated_at">> & {
          competition_id: string;
          athlete_id: string;
          boat_class: string;
        };
        Update: Partial<Database["public"]["Tables"]["competition_results"]["Row"]>;
      };
      materials: {
        Row: {
          id: string;
          athlete_id: string;
          category: string;
          name: string;
          status: string;
          weight_kg: number | null;
          length_cm: number | null;
          rating: number | null;
          image_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["materials"]["Row"], "id" | "created_at" | "updated_at">> & {
          athlete_id: string;
          category: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["materials"]["Row"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string | null;
          message: string | null;
          type: string | null;
          read: boolean | null;
          read_at: string | null;
          related_entity_type: string | null;
          related_entity_id: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at">> & {
          user_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
      };
      smart_coach_recommendations: {
        Row: {
          id: string;
          owner_user_id: string;
          created_for_user_id: string;
          created_by_system: boolean;
          club_id: string | null;
          category: string;
          priority: "low" | "medium" | "high";
          title: string;
          message: string | null;
          reason: string | null;
          suggested_action: string | null;
          status: "open" | "done" | "dismissed";
          related_entity_type: string | null;
          related_entity_id: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["smart_coach_recommendations"]["Row"], "id" | "created_at" | "updated_at">> & {
          id: string;
          owner_user_id: string;
          created_for_user_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["smart_coach_recommendations"]["Row"]>;
      };
      club_material: {
        Row: {
          id: string;
          club_id: string;
          inventory_number: string | null;
          category: string;
          name: string;
          condition: string | null;
          owner_user_id: string | null;
          owner_name: string | null;
          photo_url: string | null;
          last_inspection_date: string | null;
          remark: string | null;
          status: ClubStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["club_material"]["Row"], "id" | "created_at" | "updated_at">> & { id: string; club_id: string; category: string; name: string };
        Update: Partial<Database["public"]["Tables"]["club_material"]["Row"]>;
      };
      boats: {
        Row: {
          id: string;
          club_id: string;
          manufacturer: string | null;
          model: string | null;
          boat_class: string;
          length_cm: number | null;
          weight_kg: number | null;
          build_year: number | null;
          owner_user_id: string | null;
          owner_name: string | null;
          is_club_boat: boolean;
          linked_athlete_ids: string[];
          status: ClubStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["boats"]["Row"], "id" | "created_at" | "updated_at">> & { id: string; club_id: string; boat_class: string };
        Update: Partial<Database["public"]["Tables"]["boats"]["Row"]>;
      };
      club_events: {
        Row: {
          id: string;
          club_id: string;
          title: string;
          date: string;
          time: string | null;
          category: string;
          group_id: string | null;
          trainer_user_id: string | null;
          athlete_user_id: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["club_events"]["Row"], "id" | "created_at" | "updated_at">> & { id: string; club_id: string; title: string; date: string };
        Update: Partial<Database["public"]["Tables"]["club_events"]["Row"]>;
      };
      club_documents: {
        Row: {
          id: string;
          club_id: string;
          folder: string;
          title: string;
          file_name: string | null;
          file_url: string | null;
          mime_type: string | null;
          visible_for_roles: string[];
          uploaded_by_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["club_documents"]["Row"], "id" | "created_at" | "updated_at">> & { id: string; club_id: string; folder: string; title: string };
        Update: Partial<Database["public"]["Tables"]["club_documents"]["Row"]>;
      };
      club_messages: {
        Row: {
          id: string;
          club_id: string;
          sender_user_id: string;
          audience: string;
          group_id: string | null;
          recipient_user_id: string | null;
          title: string;
          body: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["club_messages"]["Row"], "id" | "created_at" | "updated_at">> & { id: string; club_id: string; sender_user_id: string; title: string };
        Update: Partial<Database["public"]["Tables"]["club_messages"]["Row"]>;
      };
      club_settings: {
        Row: {
          club_id: string;
          logo_url: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          address: string | null;
          homepage: string | null;
          contact_name: string | null;
          contact_email: string | null;
          club_number: string | null;
          imprint: string | null;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["club_settings"]["Row"], "updated_at">> & { club_id: string };
        Update: Partial<Database["public"]["Tables"]["club_settings"]["Row"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          table_name: string | null;
          record_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["audit_logs"]["Row"], "id" | "created_at">> & { action: string };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]>;
      };
    };
  };
};
