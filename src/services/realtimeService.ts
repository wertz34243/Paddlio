import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabase";

type RealtimeHandler = (payload?: unknown) => void;

const channels = new Set<RealtimeChannel>();

const registerChannel = (channel: RealtimeChannel): (() => void) => {
  const client = getSupabaseClient();
  channels.add(channel);
  return () => {
    channels.delete(channel);
    if (client) void client.removeChannel(channel);
  };
};

export const unsubscribeAll = (): void => {
  const client = getSupabaseClient();
  if (!client) {
    channels.clear();
    return;
  }

  channels.forEach((channel) => void client.removeChannel(channel));
  channels.clear();
};

export const subscribeToUserTrainings = (userId: string, onChange: RealtimeHandler): (() => void) => {
  const client = getSupabaseClient();
  if (!client || !userId) return () => undefined;

  const channel = client
    .channel(`paddlio-user-trainings-${userId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `id=eq.${userId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "training_plan_items", filter: `owner_id=eq.${userId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "training_plan_items", filter: `assigned_athlete_id=eq.${userId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "training_templates", filter: `owner_id=eq.${userId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "training_feedback", filter: `athlete_id=eq.${userId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "competition_results", filter: `athlete_id=eq.${userId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "personal_bests", filter: `athlete_id=eq.${userId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "materials", filter: `athlete_id=eq.${userId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "external_connections", filter: `user_id=eq.${userId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "external_training_sessions", filter: `user_id=eq.${userId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "season_goals", filter: `athlete_id=eq.${userId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "smart_coach_recommendations", filter: `created_for_user_id=eq.${userId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "group_members", filter: `athlete_id=eq.${userId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "group_memberships", filter: `user_id=eq.${userId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages", filter: `sender_id=eq.${userId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages", filter: `receiver_id=eq.${userId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "task_assignments", filter: `assigned_to=eq.${userId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "training_attendance", filter: `athlete_id=eq.${userId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "beta_feedback", filter: `user_id=eq.${userId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "beta_testers", filter: `user_id=eq.${userId}` }, onChange)
    .subscribe();

  return registerChannel(channel);
};

export const subscribeToCoachClub = (clubId: string, onChange: RealtimeHandler): (() => void) => {
  const client = getSupabaseClient();
  if (!client || !clubId) return () => undefined;

  const channel = client
    .channel(`paddlio-coach-club-${clubId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "training_plan_items", filter: `club_id=eq.${clubId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "competitions", filter: `club_id=eq.${clubId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "competition_results", filter: `club_id=eq.${clubId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "personal_bests", filter: `club_id=eq.${clubId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "result_imports", filter: `club_id=eq.${clubId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "external_training_sessions", filter: `club_id=eq.${clubId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "training_groups", filter: `club_id=eq.${clubId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "smart_coach_recommendations", filter: `club_id=eq.${clubId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "club_material", filter: `club_id=eq.${clubId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "boats", filter: `club_id=eq.${clubId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "club_events", filter: `club_id=eq.${clubId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "club_documents", filter: `club_id=eq.${clubId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "club_messages", filter: `club_id=eq.${clubId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "club_settings", filter: `club_id=eq.${clubId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "group_messages", filter: `club_id=eq.${clubId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "club_posts", filter: `club_id=eq.${clubId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `club_id=eq.${clubId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "training_attendance", filter: `club_id=eq.${clubId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "beta_feedback", filter: `club_id=eq.${clubId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "beta_testers", filter: `club_id=eq.${clubId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `club_id=eq.${clubId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "trainer_requests", filter: `club_id=eq.${clubId}` }, onChange)
    .subscribe();

  return registerChannel(channel);
};

export const subscribeToTrainingFeedback = (scope: { userId?: string; clubId?: string }, onChange: RealtimeHandler): (() => void) => {
  const client = getSupabaseClient();
  if (!client) return () => undefined;

  const channel = client.channel(`paddlio-training-feedback-${scope.userId ?? scope.clubId ?? "all"}`);
  if (scope.userId) {
    channel.on("postgres_changes", { event: "*", schema: "public", table: "training_feedback", filter: `athlete_id=eq.${scope.userId}` }, onChange);
  } else if (scope.clubId) {
    channel.on("postgres_changes", { event: "*", schema: "public", table: "training_feedback" }, onChange);
  }
  channel.subscribe();

  return registerChannel(channel);
};

export const subscribeToNotifications = (userId: string, onChange: RealtimeHandler): (() => void) => {
  const client = getSupabaseClient();
  if (!client || !userId) return () => undefined;

  const channel = client
    .channel(`paddlio-notifications-${userId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, onChange)
    .subscribe();

  return registerChannel(channel);
};

export const subscribeToGeneralCloudChanges = (onChange: RealtimeHandler): (() => void) => {
  const client = getSupabaseClient();
  if (!client) return () => undefined;

  const channel = client
    .channel("paddlio-cloud-sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "training_plan_items" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "training_feedback" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "competitions" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "competition_results" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "personal_bests" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "result_imports" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "external_connections" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "external_training_sessions" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "beta_readiness_checks" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "beta_feedback" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "beta_testers" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "season_goals" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "smart_coach_recommendations" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "training_groups" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "group_members" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "club_material" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "boats" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "club_events" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "club_documents" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "club_messages" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "club_settings" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "group_messages" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "club_posts" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "task_assignments" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "training_attendance" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "file_attachments" }, onChange)
    .subscribe();

  return registerChannel(channel);
};
