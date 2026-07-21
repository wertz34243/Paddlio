import type { PaddleMotionData } from "../domain/types";

export type LocalFirstCacheMetadata = {
  userId: string;
  cacheKey: string;
  cachedAt: string;
  version: number;
};

const DB_NAME = "paddlio-local-first";
const DB_VERSION = 1;
const STORE_NAME = "cache";
const CACHE_VERSION = 1;

const hasIndexedDb = (): boolean => typeof indexedDB !== "undefined";

const openLocalFirstDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (!hasIndexedDb()) {
      reject(new Error("IndexedDB ist nicht verfügbar."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "cacheKey" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB konnte nicht geöffnet werden."));
  });

const transact = async <T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await openLocalFirstDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = action(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB-Operation fehlgeschlagen."));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("IndexedDB-Transaktion fehlgeschlagen."));
    };
  });
};

export const localFirstCacheKey = (userId: string, scope = "app-data"): string => `${userId}:${scope}`;

export const writeLocalFirstCache = async (
  userId: string,
  data: PaddleMotionData,
  scope = "app-data",
): Promise<LocalFirstCacheMetadata> => {
  const metadata: LocalFirstCacheMetadata = {
    userId,
    cacheKey: localFirstCacheKey(userId, scope),
    cachedAt: new Date().toISOString(),
    version: CACHE_VERSION,
  };

  await transact("readwrite", (store) => store.put({ ...metadata, data }));
  return metadata;
};

export const readLocalFirstCache = async <T = PaddleMotionData>(userId: string, scope = "app-data"): Promise<T | null> => {
  const record = await transact<any | undefined>("readonly", (store) => store.get(localFirstCacheKey(userId, scope)));
  return record?.data ?? null;
};

export const readLocalFirstCacheMetadata = async (userId: string, scope = "app-data"): Promise<LocalFirstCacheMetadata | null> => {
  const record = await transact<any | undefined>("readonly", (store) => store.get(localFirstCacheKey(userId, scope)));
  if (!record) return null;

  return {
    userId: record.userId,
    cacheKey: record.cacheKey,
    cachedAt: record.cachedAt,
    version: record.version,
  };
};
