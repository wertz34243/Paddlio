import type { NotificationItem } from "../domain/types";
import { getSupabaseClient } from "../lib/supabase";
import { enqueueOfflineChange } from "./offlineQueueService";

type NotificationInput = {
  userId: string;
  title: string;
  message?: string;
  body?: string;
  type?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
};

const fromCloudNotification = (row: any): NotificationItem => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  message: row.message ?? row.body ?? "",
  type: row.type ?? "info",
  read: Boolean(row.read ?? row.read_at),
  createdAt: row.created_at,
  relatedEntityType: row.related_entity_type ?? undefined,
  relatedEntityId: row.related_entity_id ?? undefined,
});

export const listCloudNotifications = async (userId: string): Promise<NotificationItem[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await (client.from("notifications") as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(fromCloudNotification);
};

export const createCloudNotification = async (input: NotificationInput): Promise<void> => {
  const payload = {
    user_id: input.userId,
    title: input.title,
    body: input.body ?? input.message ?? null,
    message: input.message ?? input.body ?? null,
    type: input.type ?? "info",
    read: false,
    related_entity_type: input.relatedEntityType ?? null,
    related_entity_id: input.relatedEntityId ?? null,
  };
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) {
    enqueueOfflineChange({ table: "notifications", operation: "insert", payload });
    return;
  }
  const { error } = await (client.from("notifications") as any).insert(payload);
  if (error) throw error;
};

export const markCloudNotificationRead = async (id: string): Promise<void> => {
  const payload = { id, read: true, read_at: new Date().toISOString() };
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) {
    enqueueOfflineChange({ table: "notifications", operation: "update", payload });
    return;
  }

  const { error } = await (client.from("notifications") as any).update(payload).eq("id", id);
  if (error) throw error;
};

export const markAllCloudNotificationsRead = async (userId: string): Promise<void> => {
  const payload = { read: true, read_at: new Date().toISOString() };
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) {
    enqueueOfflineChange({ table: "notifications", operation: "update", payload: { ...payload, user_id: userId } });
    return;
  }

  const { error } = await (client.from("notifications") as any).update(payload).eq("user_id", userId).is("read_at", null);
  if (error) throw error;
};
