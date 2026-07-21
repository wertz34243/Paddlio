import { getSyncEntityConfig } from "./syncEntityConfig";

export type DeltaSyncCursor = {
  table: string;
  lastSyncAt: string;
  lastCursorId: string;
  lastSuccessfulSync: string;
};

const CURSOR_KEY = "paddlio_delta_sync_cursors";

const getStorage = (): Storage | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const emptyDeltaCursor = (table: string): DeltaSyncCursor => ({
  table,
  lastSyncAt: "",
  lastCursorId: "",
  lastSuccessfulSync: "",
});

const readCursorMap = (): Record<string, DeltaSyncCursor> => {
  const storage = getStorage();
  if (!storage) return {};

  try {
    const raw = storage.getItem(CURSOR_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeCursorMap = (map: Record<string, DeltaSyncCursor>): void => {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(CURSOR_KEY, JSON.stringify(map));
  } catch {
    // Cursor cache is best-effort. A failed write falls back to full sync later.
  }
};

export const readDeltaCursor = (table: string): DeltaSyncCursor => readCursorMap()[table] ?? emptyDeltaCursor(table);

export const writeDeltaCursor = (cursor: DeltaSyncCursor): void => {
  writeCursorMap({ ...readCursorMap(), [cursor.table]: cursor });
};

export const isAfterDeltaCursor = (
  row: Record<string, unknown>,
  cursor: DeltaSyncCursor,
  updatedAtField = getSyncEntityConfig(cursor.table).updatedAtField,
  primaryKey = getSyncEntityConfig(cursor.table).primaryKey,
): boolean => {
  const updatedAt = typeof row[updatedAtField] === "string" ? row[updatedAtField] : "";
  const id = typeof row[primaryKey] === "string" ? row[primaryKey] : "";

  if (!cursor.lastSyncAt) return true;
  if (updatedAt > cursor.lastSyncAt) return true;
  if (updatedAt === cursor.lastSyncAt && id > cursor.lastCursorId) return true;
  return false;
};

export const buildNextDeltaCursor = (
  table: string,
  rows: Array<Record<string, unknown>>,
  syncedAt = new Date().toISOString(),
): DeltaSyncCursor => {
  const config = getSyncEntityConfig(table);
  const sorted = [...rows].sort((a, b) => {
    const leftTime = String(a[config.updatedAtField] ?? "");
    const rightTime = String(b[config.updatedAtField] ?? "");
    if (leftTime !== rightTime) return leftTime.localeCompare(rightTime);
    return String(a[config.primaryKey] ?? "").localeCompare(String(b[config.primaryKey] ?? ""));
  });
  const last = sorted[sorted.length - 1];

  return {
    table,
    lastSyncAt: last ? String(last[config.updatedAtField] ?? "") : syncedAt,
    lastCursorId: last ? String(last[config.primaryKey] ?? "") : "",
    lastSuccessfulSync: syncedAt,
  };
};

export const markDeltaSyncSuccessful = (
  table: string,
  rows: Array<Record<string, unknown>>,
  syncedAt = new Date().toISOString(),
): DeltaSyncCursor => {
  const cursor = buildNextDeltaCursor(table, rows, syncedAt);
  writeDeltaCursor(cursor);
  return cursor;
};
