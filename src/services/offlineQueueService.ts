import { getSupabaseClient } from "../lib/supabase";
import { sanitizeCloudPayload } from "./cloudIds";
import { getSyncEntityConfig, toSoftDeletePayload, type SyncPriority } from "./syncEntityConfig";
import { normalizeTrainingPlanQueuePayload } from "../domain/trainingPlanStatus";

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
  repairVersion?: number;
};

export type OfflineQueueStats = { pending: number; failed: number; total: number };

const SYNC_QUEUE_KEY = "paddlio_sync_queue";
const MAX_RETRY_COUNT = 5;
const TRAINING_PLAN_REPAIR_VERSION = 1;

const isOnline = (): boolean => typeof navigator === "undefined" || navigator.onLine;

const normalizeQueueItem = (item: any): OfflineQueueItem => {
  const table = item.table ?? item.tableName;
  const rawPayload = sanitizeCloudPayload(item.payload ?? {});
  const isTrainingPlan = table === "training_plan_items";
  const payload = isTrainingPlan ? normalizeTrainingPlanQueuePayload(rawPayload) : rawPayload;
  const needsPlanRepair = isTrainingPlan && item.repairVersion !== TRAINING_PLAN_REPAIR_VERSION;
  return {
  id: item.id ?? `sync-${crypto.randomUUID()}`,
  table,
  operation: item.operation ?? (item.action === "delete" ? "delete" : "upsert"),
  payload,
  createdAt: item.createdAt ?? new Date().toISOString(),
  retryCount: needsPlanRepair ? 0 : item.retryCount ?? item.attempts ?? 0,
  status: needsPlanRepair ? "pending" : item.status === "failed" ? "failed" : "pending",
  lastError: needsPlanRepair ? undefined : item.lastError,
  repairVersion: isTrainingPlan ? TRAINING_PLAN_REPAIR_VERSION : item.repairVersion,
  };
};

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

export const getOfflineQueueStats = (): OfflineQueueStats => {
  const queue = readOfflineQueue();
  const failed = queue.filter((item) => item.status === "failed").length;
  return { pending: queue.length - failed, failed, total: queue.length };
};

export const enqueueOfflineChange = (item: Omit<OfflineQueueItem, "id" | "createdAt" | "retryCount" | "status">): void => {
  const config = getSyncEntityConfig(item.table);
  const rawPayload = item.operation === "delete" ? toSoftDeletePayload(item.table, item.payload) : item.payload;
  const payload = item.table === "training_plan_items" ? normalizeTrainingPlanQueuePayload(rawPayload) : rawPayload;
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
    repairVersion: item.table === "training_plan_items" ? TRAINING_PLAN_REPAIR_VERSION : undefined,
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
  const payload = item.table === "training_plan_items" ? normalizeTrainingPlanQueuePayload(item.payload) : item.payload;
  const table = client.from(item.table) as any;

  if (item.table === "training_plan_items" && import.meta.env.DEV) {
    console.debug("[Paddlio Sync] training_plan_items write", {
      id: payload.id,
      appStatus: item.payload.status,
      cloudStatus: payload.status,
      path: `offline-queue:${item.operation}`,
    });
  }

  if (item.operation === "delete") {
    const { error } = await table.delete().eq(config.primaryKey, payload[config.primaryKey]);
    if (error) throw error;
    return;
  }

  if (item.operation === "upsert") {
    const { error } = await table.upsert(payload, { onConflict: config.conflictKey });
    if (error) throw error;
    return;
  }

  if (item.operation === "update") {
    const updatePayload = config.supportsSoftDelete ? toSoftDeletePayload(item.table, payload) : payload;
    const primaryValue = updatePayload[config.primaryKey] ?? updatePayload.id;
    const query = table.update(updatePayload);
    const { error } = primaryValue
      ? await query.eq(config.primaryKey, primaryValue)
      : config.ownerField && updatePayload[config.ownerField]
        ? await query.eq(config.ownerField, updatePayload[config.ownerField])
        : await query.eq("user_id", updatePayload.user_id);
    if (error) throw error;
    return;
  }

  const { error } = await table.insert(payload);
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
