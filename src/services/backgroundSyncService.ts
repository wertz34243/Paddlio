import { flushOfflineQueue, getOfflineQueueCount } from "./offlineQueueService";
import type { SyncPriority } from "./syncEntityConfig";

export type NetworkSyncState = "online" | "offline" | "syncing" | "pending" | "error";

export type BackgroundSyncStatus = {
  state: NetworkSyncState;
  pendingChanges: number;
  lastSuccessfulSync: string;
  lastError: string;
  activePriority?: SyncPriority;
};

type BackgroundSyncReason = "app-start" | "login" | "foreground" | "online" | "pull-to-refresh" | "local-change" | "manual";
type BackgroundSyncListener = (status: BackgroundSyncStatus) => void;

const INITIAL_STATUS: BackgroundSyncStatus = {
  state: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "online",
  pendingChanges: 0,
  lastSuccessfulSync: "",
  lastError: "",
};

class BackgroundSyncEngine {
  private status: BackgroundSyncStatus = INITIAL_STATUS;
  private listeners = new Set<BackgroundSyncListener>();
  private running = false;

  getStatus(): BackgroundSyncStatus {
    return { ...this.status, pendingChanges: getOfflineQueueCount() };
  }

  subscribe(listener: BackgroundSyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  private emit(next: Partial<BackgroundSyncStatus>): void {
    this.status = { ...this.status, ...next, pendingChanges: getOfflineQueueCount() };
    this.listeners.forEach((listener) => listener(this.getStatus()));
  }

  async run(reason: BackgroundSyncReason = "manual", priorities: SyncPriority[] = ["A", "B"]): Promise<number> {
    if (this.running) return 0;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.emit({ state: "offline", pendingChanges: getOfflineQueueCount() });
      return 0;
    }

    this.running = true;
    this.emit({ state: "syncing", lastError: "" });

    try {
      let synced = 0;
      for (const priority of priorities) {
        this.emit({ activePriority: priority });
        synced += await flushOfflineQueue(priority);
      }

      const pending = getOfflineQueueCount();
      this.emit({
        state: pending > 0 ? "pending" : "online",
        pendingChanges: pending,
        lastSuccessfulSync: new Date().toISOString(),
        activePriority: undefined,
      });
      window.dispatchEvent(new CustomEvent("paddlio-background-sync-completed", { detail: { reason, synced, pending } }));
      return synced;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Synchronisierung fehlgeschlagen.";
      this.emit({ state: "error", lastError: message, activePriority: undefined });
      return 0;
    } finally {
      this.running = false;
    }
  }

  markLocalChange(): void {
    this.emit({ state: typeof navigator !== "undefined" && navigator.onLine ? "pending" : "offline" });
  }
}

export const backgroundSyncEngine = new BackgroundSyncEngine();
