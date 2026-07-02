import { getSupabaseClient } from "../lib/supabase";
import { enqueueSyncChange } from "./syncService";

export const createCloudNotification = async (input: { userId: string; title: string; body?: string; type?: string }): Promise<void> => {
  const payload = {
    user_id: input.userId,
    title: input.title,
    body: input.body ?? null,
    type: input.type ?? null,
  };
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) {
    enqueueSyncChange({ tableName: "notifications", action: "upsert", payload });
    return;
  }
  const { error } = await (client.from("notifications") as any).insert(payload);
  if (error) throw error;
};
