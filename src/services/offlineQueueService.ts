import { getSupabaseClient } from "../lib/supabase";
import { sanitizeCloudPayload } from "./cloudIds";
import { getSyncEntityConfig, toSoftDeletePayload, type SyncPriority } from "./syncEntityConfig";

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
  lastError?: string;
};

const SYNC_QUEUE_KEY = "paddlio_sync_queue";
const MAX_RETRY_COUNT = 5;

const isOnline = (): boolean => typeof navigator === "undefined" || navigator.onLine;

const normalizeQueueItem = (item: any): OfflineQueueItem => ({
  id: item.id ?? `sync-${crypto.randomUUID()}`,
  table: item.table ?? item.tableName,
  operation: item.operation ?? (item.action === "delete" ? "delete" : "upsert"),
  payload: sanitizeCloudPayload(item.payload ?? {}),
  createdAt: item.createdAt ?? new Date().toISOString(),
  retryCount: item.retryCount ?? item.attempts ?? 0,
  status: item.status === "failed" ? "failed" : "pending",
  lastError: item.lastError,
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
  const config = getSyncEntityConfig(item.table);
  const payload = item.operation === "delete" ? toSoftDeletePayload(item.table, item.payload) : item.payload;
  const operation = item.operation === "delete" && config.supportsSoftDelete ? "update" : item.operation;
  const entityId = payload[config.primaryKey] ?? payload.id;
  const nextItem: OfflineQueueItem = {
    ...item,
    operation,
    payload,
    id: `sync-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    status: "pending",
  };

  const queue = readOfflineQueue();
  if (!entityId) {
    writeOfflineQueue([...queue, nextItem]);
    return;
  }

  const nextQueue = queue.filter((queued) => {
    const queuedConfig = getSyncEntityConfig(queued.table);
    const queuedId = queued.payload[queuedConfig.primaryKey] ?? queued.payload.id;
    return !(queued.table === item.table && queuedId === entityId);
  });

  writeOfflineQueue([...nextQueue, nextItem]);
};

const flushQueueItem = async (item: OfflineQueueItem): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) return;

  const config = getSyncEntityConfig(item.table);
  const table = client.from(item.table) as any;

  if (item.operation === "delete") {
    const { error } = await table.delete().eq(config.primaryKey, item.payload[config.primaryKey]);
    if (error) throw error;
    return;
  }

  if (item.operation === "upsert") {
    const { error } = await table.upsert(item.payload, { onConflict: config.conflictKey });
    if (error) throw error;
    return;
  }

  if (item.operation === "update") {
    const payload = config.supportsSoftDelete ? toSoftDeletePayload(item.table, item.payload) : item.payload;
    const primaryValue = payload[config.primaryKey] ?? payload.id;
    const query = table.update(payload);
    const { error } = primaryValue
      ? await query.eq(config.primaryKey, primaryValue)
      : config.ownerField && payload[config.ownerField]
        ? await query.eq(config.ownerField, payload[config.ownerField])
        : await query.eq("user_id", payload.user_id);
    if (error) throw error;
    return;
  }

  const { error } = await table.insert(item.payload);
  if (error) throw error;
};

export const flushOfflineQueue = async (priority?: SyncPriority): Promise<number> => {
  const client = getSupabaseClient();
  if (!client || !isOnline()) return 0;

  const queue = readOfflineQueue();
  const selected = priority ? queue.filter((item) => getSyncEntityConfig(item.table).priority === priority) : queue;
  const untouched = priority ? queue.filter((item) => getSyncEntityConfig(item.table).priority !== priority) : [];
  const failed: OfflineQueueItem[] = [];
  let synced = 0;

  for (const item of selected) {
    if (item.retryCount >= MAX_RETRY_COUNT) {
      failed.push({ ...item, status: "failed", lastError: item.lastError ?? "Maximale Anzahl an Sync-Versuchen erreicht." });
      continue;
    }

    try {
      await flushQueueItem(item);
      synced += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unbekannter Sync-Fehler.";
      console.error(`[Paddlio Sync] Offline-Queue für ${item.table} konnte nicht synchronisiert werden.`, error);
      failed.push({ ...item, retryCount: item.retryCount + 1, status: "failed", lastError: message });
    }
  }

  writeOfflineQueue([...untouched, ...failed]);
  return synced;
};
