import { getSupabaseClient } from "../lib/supabase";

export type SyncQueueItem = {
  id: string;
  tableName: string;
  action: "upsert" | "delete";
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
};

const SYNC_QUEUE_KEY = "paddlio_sync_queue";

const readQueue = (): SyncQueueItem[] => {
  try {
    const raw = window.localStorage.getItem(SYNC_QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeQueue = (items: SyncQueueItem[]): void => {
  try {
    window.localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(items));
  } catch {
    // Offline queue stays best-effort when browser storage is unavailable.
  }
};

export const getPendingSyncCount = (): number => readQueue().length;

export const enqueueSyncChange = (item: Omit<SyncQueueItem, "id" | "createdAt" | "attempts">): void => {
  writeQueue([
    ...readQueue(),
    {
      ...item,
      id: `sync-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      attempts: 0,
    },
  ]);
};

export const flushSyncQueue = async (): Promise<number> => {
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) return 0;
  const queue = readQueue();
  const failed: SyncQueueItem[] = [];
  let synced = 0;

  for (const item of queue) {
    try {
      if (item.action === "delete") {
        const { error } = await (client.from(item.tableName) as any).delete().eq("id", item.payload.id);
        if (error) throw error;
      } else {
        const { error } = await (client.from(item.tableName) as any).upsert(item.payload, { onConflict: "id" });
        if (error) throw error;
      }
      synced += 1;
    } catch {
      failed.push({ ...item, attempts: item.attempts + 1 });
    }
  }

  writeQueue(failed);
  return synced;
};

export const subscribeToCloudChanges = (onChange: () => void): (() => void) => {
  const client = getSupabaseClient();
  if (!client) return () => undefined;

  const channel = client
    .channel("paddlio-cloud-sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "training_plan_items" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "training_feedback" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "season_goals" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "trainer_requests" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, onChange)
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
};
