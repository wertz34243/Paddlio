import { getSupabaseClient } from "../lib/supabase";
import { sanitizeCloudPayload } from "./cloudIds";

export type OfflineQueueOperation = "insert" | "update" | "upsert" | "delete";
export type OfflineQueueStatus = "pending" | "failed";

export type OfflineQueueItem = {
  id: string;
  table: string;
  operation: OfflineQueueOperation;
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
  status: OfflineQueueStatus;
};

const SYNC_QUEUE_KEY = "paddlio_sync_queue";

const normalizeQueueItem = (item: any): OfflineQueueItem => ({
  id: item.id ?? `sync-${crypto.randomUUID()}`,
  table: item.table ?? item.tableName,
  operation: item.operation ?? (item.action === "delete" ? "delete" : "upsert"),
  payload: sanitizeCloudPayload(item.payload ?? {}),
  createdAt: item.createdAt ?? new Date().toISOString(),
  retryCount: item.retryCount ?? item.attempts ?? 0,
  status: item.status === "failed" ? "failed" : "pending",
});

export const readOfflineQueue = (): OfflineQueueItem[] => {
  try {
    const raw = window.localStorage.getItem(SYNC_QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeQueueItem).filter((item) => item.table) : [];
  } catch {
    return [];
  }
};

export const writeOfflineQueue = (items: OfflineQueueItem[]): void => {
  try {
    window.localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("paddlio-sync-queue-changed", { detail: { count: items.length } }));
  } catch {
    // Local queue stays best-effort if browser storage is unavailable.
  }
};

export const getOfflineQueueCount = (): number => readOfflineQueue().length;

export const enqueueOfflineChange = (item: Omit<OfflineQueueItem, "id" | "createdAt" | "retryCount" | "status">): void => {
  writeOfflineQueue([
    ...readOfflineQueue(),
    {
      ...item,
      id: `sync-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: "pending",
    },
  ]);
};

export const flushOfflineQueue = async (): Promise<number> => {
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) return 0;

  const queue = readOfflineQueue();
  const failed: OfflineQueueItem[] = [];
  let synced = 0;

  for (const item of queue) {
    try {
      if (item.operation === "delete") {
        const { error } = await (client.from(item.table) as any).delete().eq("id", item.payload.id);
        if (error) throw error;
      } else if (item.operation === "upsert") {
        const { error } = await (client.from(item.table) as any).upsert(item.payload, { onConflict: item.table === "club_settings" ? "club_id" : "id" });
        if (error) throw error;
      } else if (item.operation === "update") {
        const { id, ...payload } = item.payload;
        const query = (client.from(item.table) as any).update(payload);
        const { error } = id ? await query.eq("id", id) : await query.eq("user_id", item.payload.user_id);
        if (error) throw error;
      } else {
        const { error } = await (client.from(item.table) as any).insert(item.payload);
        if (error) throw error;
      }
      synced += 1;
    } catch (error) {
      console.error(`[Paddlio Sync] Offline-Queue für ${item.table} konnte nicht synchronisiert werden.`, error);
      failed.push({ ...item, retryCount: item.retryCount + 1, status: "failed" });
    }
  }

  writeOfflineQueue(failed);
  return synced;
};
