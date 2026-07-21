import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabase";

type RealtimeHandler = (payload?: unknown) => void;
type RealtimeTable = {
  table: string;
  filter?: string;
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
};

const channels = new Map<string, RealtimeChannel>();
const recentEvents = new Map<string, number>();
const EVENT_DEDUPE_WINDOW_MS = 700;

const eventKey = (scopeKey: string, payload: unknown): string => {
  if (!payload || typeof payload !== "object") return `${scopeKey}:unknown`;
  const eventPayload = payload as {
    schema?: string;
    table?: string;
    eventType?: string;
    commit_timestamp?: string;
    new?: { id?: string; updated_at?: string };
    old?: { id?: string; updated_at?: string };
  };
  const rowId = eventPayload.new?.id ?? eventPayload.old?.id ?? "row";
  const rowVersion = eventPayload.new?.updated_at ?? eventPayload.old?.updated_at ?? eventPayload.commit_timestamp ?? "version";
  return [
    scopeKey,
    eventPayload.schema ?? "public",
    eventPayload.table ?? "table",
    eventPayload.eventType ?? "event",
    rowId,
    rowVersion,
  ].join(":");
};

const createDedupedHandler = (scopeKey: string, onChange: RealtimeHandler): RealtimeHandler => (payload) => {
  const key = eventKey(scopeKey, payload);
  const now = Date.now();
  const lastSeen = recentEvents.get(key) ?? 0;
  if (now - lastSeen < EVENT_DEDUPE_WINDOW_MS) return;

  recentEvents.set(key, now);
  if (recentEvents.size > 500) {
    const expiry = now - EVENT_DEDUPE_WINDOW_MS * 4;
    for (const [knownKey, timestamp] of recentEvents.entries()) {
      if (timestamp < expiry) recentEvents.delete(knownKey);
    }
  }

  onChange(payload);
};

const subscribeToTables = (scopeKey: string, tables: RealtimeTable[], onChange: RealtimeHandler): (() => void) => {
  const client = getSupabaseClient();
  if (!client || tables.length === 0) return () => undefined;

  const existing = channels.get(scopeKey);
  if (existing) {
    channels.delete(scopeKey);
    void client.removeChannel(existing);
  }

  const handler = createDedupedHandler(scopeKey, onChange);
  let channel = client.channel(`paddlio-${scopeKey}`);
  for (const table of tables) {
    channel = channel.on(
      "postgres_changes",
      {
        event: table.event ?? "*",
        schema: "public",
        table: table.table,
        ...(table.filter ? { filter: table.filter } : {}),
      },
      handler,
    );
  }
  channel.subscribe();
  channels.set(scopeKey, channel);

  return () => {
    const current = channels.get(scopeKey);
    if (current === channel) channels.delete(scopeKey);
    void client.removeChannel(channel);
  };
};

export const unsubscribeAll = (): void => {
  const client = getSupabaseClient();
  if (!client) {
    channels.clear();
    recentEvents.clear();
    return;
  }

  channels.forEach((channel) => void client.removeChannel(channel));
  channels.clear();
  recentEvents.clear();
};

export const subscribeToUserTrainings = (userId: string, onChange: RealtimeHandler): (() => void) => {
  if (!userId) return () => undefined;

  return subscribeToTables(
    `user-core-${userId}`,
    [
      { table: "profiles", filter: `id=eq.${userId}` },
      { table: "training_plan_items", filter: `owner_id=eq.${userId}` },
      { table: "training_plan_items", filter: `assigned_athlete_id=eq.${userId}` },
      { table: "training_feedback", filter: `athlete_id=eq.${userId}` },
      { table: "training_journal_entries", filter: `athlete_id=eq.${userId}` },
      { table: "training_attendance", filter: `athlete_id=eq.${userId}` },
      { table: "group_members", filter: `athlete_id=eq.${userId}` },
      { table: "group_memberships", filter: `user_id=eq.${userId}` },
      { table: "direct_messages", filter: `sender_id=eq.${userId}` },
      { table: "direct_messages", filter: `receiver_id=eq.${userId}` },
      { table: "task_assignments", filter: `assigned_to=eq.${userId}` },
    ],
    onChange,
  );
};

export const subscribeToCoachClub = (clubId: string, onChange: RealtimeHandler): (() => void) => {
  if (!clubId) return () => undefined;

  return subscribeToTables(
    `coach-club-${clubId}`,
    [
      { table: "training_plan_items", filter: `club_id=eq.${clubId}` },
      { table: "training_feedback", filter: `club_id=eq.${clubId}` },
      { table: "training_groups", filter: `club_id=eq.${clubId}` },
      { table: "club_messages", filter: `club_id=eq.${clubId}` },
      { table: "group_messages", filter: `club_id=eq.${clubId}` },
      { table: "tasks", filter: `club_id=eq.${clubId}` },
      { table: "training_attendance", filter: `club_id=eq.${clubId}` },
      { table: "profiles", filter: `club_id=eq.${clubId}` },
      { table: "trainer_requests", filter: `club_id=eq.${clubId}` },
    ],
    onChange,
  );
};

export const subscribeToAcademyUser = (userId: string, onChange: RealtimeHandler): (() => void) => {
  if (!userId) return () => undefined;

  return subscribeToTables(
    `academy-user-${userId}`,
    [
      { table: "academy_progress", filter: `user_id=eq.${userId}` },
      { table: "academy_favorites", filter: `user_id=eq.${userId}` },
      { table: "academy_assignments", filter: `assigned_to=eq.${userId}` },
    ],
    onChange,
  );
};

export const subscribeToPolarUser = (userId: string, onChange: RealtimeHandler): (() => void) => {
  if (!userId) return () => undefined;

  return subscribeToTables(
    `polar-user-${userId}`,
    [
      { table: "external_connections", filter: `user_id=eq.${userId}` },
      { table: "external_training_sessions", filter: `user_id=eq.${userId}` },
    ],
    onChange,
  );
};

export const subscribeToAnalysisUser = (userId: string, onChange: RealtimeHandler): (() => void) => {
  if (!userId) return () => undefined;

  return subscribeToTables(
    `analysis-user-${userId}`,
    [
      { table: "competition_results", filter: `athlete_id=eq.${userId}` },
      { table: "personal_bests", filter: `athlete_id=eq.${userId}` },
      { table: "season_goals", filter: `athlete_id=eq.${userId}` },
      { table: "smart_coach_recommendations", filter: `created_for_user_id=eq.${userId}` },
    ],
    onChange,
  );
};

export const subscribeToTrainingFeedback = (scope: { userId?: string; clubId?: string }, onChange: RealtimeHandler): (() => void) => {
  if (scope.userId) {
    return subscribeToTables(
      `training-feedback-user-${scope.userId}`,
      [{ table: "training_feedback", filter: `athlete_id=eq.${scope.userId}` }],
      onChange,
    );
  }

  if (scope.clubId) {
    return subscribeToTables(
      `training-feedback-club-${scope.clubId}`,
      [{ table: "training_feedback", filter: `club_id=eq.${scope.clubId}` }],
      onChange,
    );
  }

  return () => undefined;
};

export const subscribeToNotifications = (userId: string, onChange: RealtimeHandler): (() => void) => {
  if (!userId) return () => undefined;

  return subscribeToTables(
    `notifications-${userId}`,
    [{ table: "notifications", filter: `user_id=eq.${userId}` }],
    onChange,
  );
};
