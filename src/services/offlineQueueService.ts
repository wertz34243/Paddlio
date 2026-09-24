import { getSupabaseClient } from "../lib/supabase";
import { sanitizeCloudPayload } from "./cloudIds";
import { getSyncEntityConfig, toSoftDeletePayload, type SyncPriority } from "./syncEntityConfig";
import { normalizeTrainingPlanQueuePayload } from "../domain/trainingPlanStatus";
import { classifySyncWriteError } from "./syncErrorPolicy";

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
  lastErrorCode?: string;
  errorKind?: "retryable" | "non-retryable";
  repairVersion?: number;
  userId: string;
};

export type OfflineQueueStats = { pending: number; failed: number; total: number };
export type OfflineQueueDiagnostic = {
  table: string;
  operation: OfflineQueueOperation;
  entityId: string;
  errorCode: string;
  errorKind: "retryable" | "non-retryable" | "unknown";
  retryCount: number;
  userScope: string;
  createdAt: string;
};

const SYNC_QUEUE_KEY = "paddlio_sync_queue";
const QUARANTINE_QUEUE_KEY = `${SYNC_QUEUE_KEY}:unscoped`;
const MAX_RETRY_COUNT = 5;
const QUEUE_REPAIR_VERSION = 2;
let activeQueueUserId = "";

const queueKey = (userId: string): string => `${SYNC_QUEUE_KEY}:${userId}`;

const inferQueueOwner = (item: any): string => {
  const payload = item?.payload ?? {};
  const candidates = [item?.userId, payload.user_id, payload.owner_id, payload.athlete_id, payload.created_by_user_id]
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  return candidates.length > 0 && candidates.every((value) => value === candidates[0]) ? candidates[0] : "";
};

const inferStoredErrorCode = (item: any): string | undefined => {
  if (item.lastErrorCode) return String(item.lastErrorCode);
  const match = String(item.lastError ?? "").match(/\b(?:PGRST\d{3}|\d{5}|4\d{2}|5\d{2})\b/i);
  return match?.[0];
};

const isOnline = (): boolean => typeof navigator === "undefined" || navigator.onLine;

const normalizeQueueItem = (item: any, scopedUserId = ""): OfflineQueueItem => {
  const table = item.table ?? item.tableName;
  const rawPayload = sanitizeCloudPayload(item.payload ?? {});
  const isTrainingPlan = table === "training_plan_items";
  const payload = isTrainingPlan ? normalizeTrainingPlanQueuePayload(rawPayload) : rawPayload;
  const storedErrorKind = item.errorKind ?? (item.lastError ? classifySyncWriteError(item.lastError) : undefined);
  const needsPlanRepair = isTrainingPlan && item.repairVersion !== QUEUE_REPAIR_VERSION;
  const needsTransientRepair = item.status === "failed" && item.repairVersion !== QUEUE_REPAIR_VERSION && storedErrorKind !== "non-retryable";
  const needsRepair = needsPlanRepair || needsTransientRepair;
  return {
  id: item.id ?? `sync-${crypto.randomUUID()}`,
  table,
  operation: item.operation ?? (item.action === "delete" ? "delete" : "upsert"),
  payload,
  createdAt: item.createdAt ?? new Date().toISOString(),
  retryCount: needsRepair ? 0 : item.retryCount ?? item.attempts ?? 0,
  status: needsRepair ? "pending" : item.status === "failed" ? "failed" : "pending",
  lastError: needsRepair ? undefined : item.lastError,
  lastErrorCode: needsRepair ? undefined : inferStoredErrorCode(item),
  errorKind: needsRepair ? undefined : storedErrorKind,
  repairVersion: QUEUE_REPAIR_VERSION,
  userId: item.userId || scopedUserId || inferQueueOwner(item),
  };
};

const parseQueue = (raw: string | null, scopedUserId = ""): OfflineQueueItem[] => {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map((item) => normalizeQueueItem(item, scopedUserId)).filter((item) => item.table) : [];
  } catch {
    return [];
  }
};

const migrateLegacyQueue = (userId: string): void => {
  const raw = window.localStorage.getItem(SYNC_QUEUE_KEY);
  if (!raw) return;
  const legacy = parseQueue(raw);
  const canAssign = legacy.length > 0 && legacy.every((item) => item.userId === userId);
  if (canAssign) {
    const existing = parseQueue(window.localStorage.getItem(queueKey(userId)), userId);
    window.localStorage.setItem(queueKey(userId), JSON.stringify([...existing, ...legacy.map((item) => ({ ...item, userId }))]));
  } else {
    window.localStorage.setItem(QUARANTINE_QUEUE_KEY, raw);
  }
  window.localStorage.removeItem(SYNC_QUEUE_KEY);
};

export const setOfflineQueueUser = (userId: string | null): void => {
  activeQueueUserId = userId ?? "";
  if (activeQueueUserId) migrateLegacyQueue(activeQueueUserId);
  window.dispatchEvent(new CustomEvent("paddlio-sync-queue-changed", { detail: { userId: activeQueueUserId } }));
};

export const getOfflineQueueUser = (): string => activeQueueUserId;

export const readOfflineQueue = (): OfflineQueueItem[] => {
  if (!activeQueueUserId) return [];
  return parseQueue(window.localStorage.getItem(queueKey(activeQueueUserId)), activeQueueUserId)
    .filter((item) => item.userId === activeQueueUserId);
};

export const writeOfflineQueue = (items: OfflineQueueItem[]): void => {
  if (!activeQueueUserId) return;
  try {
    const ownItems = items.filter((item) => item.userId === activeQueueUserId);
    window.localStorage.setItem(queueKey(activeQueueUserId), JSON.stringify(ownItems));
    window.dispatchEvent(new CustomEvent("paddlio-sync-queue-changed", { detail: { count: ownItems.length, userId: activeQueueUserId } }));
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

const getErrorCode = (error: unknown): string => {
  if (!error || typeof error !== "object" || !("code" in error || "status" in error)) return "";
  const value = error as { code?: string | number; status?: number };
  return String(value.code ?? value.status ?? "");
};

export const getOfflineQueueDiagnostics = (): OfflineQueueDiagnostic[] =>
  readOfflineQueue()
    .filter((item) => item.status === "failed")
    .map((item) => {
      const config = getSyncEntityConfig(item.table);
      const rawId = String(item.payload[config.primaryKey] ?? item.payload.id ?? "unbekannt");
      return {
        table: item.table,
        operation: item.operation,
        entityId: rawId === "unbekannt" ? rawId : `${rawId.slice(0, 8)}...`,
        errorCode: item.lastErrorCode ?? "unbekannt",
        errorKind: item.errorKind ?? (item.lastError ? classifySyncWriteError(item.lastError) : "unknown"),
        retryCount: item.retryCount,
        userScope: item.userId ? `${item.userId.slice(0, 8)}...` : "unscoped",
        createdAt: item.createdAt,
      };
    });

export const enqueueOfflineChange = (
  item: Omit<OfflineQueueItem, "id" | "createdAt" | "retryCount" | "status" | "userId"> & { userId?: string },
): void => {
  const itemUserId = item.userId || activeQueueUserId;
  if (!activeQueueUserId || itemUserId !== activeQueueUserId) {
    console.error("[Paddlio Sync] Änderung ohne passenden Account-Kontext wurde nicht in eine fremde Queue geschrieben.");
    return;
  }
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
    userId: itemUserId,
    repairVersion: QUEUE_REPAIR_VERSION,
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
      const record = error && typeof error === "object" ? error as { message?: string; details?: string } : null;
      const message = error instanceof Error ? error.message : record?.message ?? record?.details ?? "Unbekannter Sync-Fehler.";
      console.error(`[Paddlio Sync] Offline-Queue für ${item.table} konnte nicht synchronisiert werden.`, error);
      const retryable = classifySyncWriteError(error) === "retryable";
      failed.push({
        ...item,
        retryCount: retryable ? item.retryCount + 1 : MAX_RETRY_COUNT,
        status: "failed",
        lastError: message,
        lastErrorCode: getErrorCode(error),
        errorKind: retryable ? "retryable" : "non-retryable",
      });
    }
  }

  writeOfflineQueue([...untouched, ...failed]);
  return synced;
};
