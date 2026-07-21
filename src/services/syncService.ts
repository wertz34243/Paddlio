import { enqueueOfflineChange, flushOfflineQueue, getOfflineQueueCount } from "./offlineQueueService";
import type { SyncPriority } from "./syncEntityConfig";

export type SyncQueueItem = {
  id: string;
  tableName: string;
  action: "insert" | "update" | "upsert" | "delete";
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
};

export const getPendingSyncCount = (): number => getOfflineQueueCount();

export const enqueueSyncChange = (item: Omit<SyncQueueItem, "id" | "createdAt" | "attempts">): void => {
  enqueueOfflineChange({
    table: item.tableName,
    operation: item.action,
    payload: item.payload,
  });
};

export const flushSyncQueue = async (priority?: SyncPriority): Promise<number> => flushOfflineQueue(priority);
