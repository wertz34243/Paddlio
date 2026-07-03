import { enqueueOfflineChange, flushOfflineQueue, getOfflineQueueCount } from "./offlineQueueService";
import { subscribeToGeneralCloudChanges } from "./realtimeService";

export type SyncQueueItem = {
  id: string;
  tableName: string;
  action: "upsert" | "delete";
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
};

export const getPendingSyncCount = (): number => getOfflineQueueCount();

export const enqueueSyncChange = (item: Omit<SyncQueueItem, "id" | "createdAt" | "attempts">): void => {
  enqueueOfflineChange({
    table: item.tableName,
    operation: item.action === "delete" ? "delete" : item.payload.id ? "update" : "insert",
    payload: item.payload,
  });
};

export const flushSyncQueue = async (): Promise<number> => flushOfflineQueue();

export const subscribeToCloudChanges = (onChange: () => void): (() => void) =>
  subscribeToGeneralCloudChanges(onChange);
