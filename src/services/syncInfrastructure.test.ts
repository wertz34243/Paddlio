import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildNextDeltaCursor, isAfterDeltaCursor } from "./deltaSyncService";
import { enqueueOfflineChange, readOfflineQueue, writeOfflineQueue } from "./offlineQueueService";
import { getSyncEntityConfig, toSoftDeletePayload } from "./syncEntityConfig";

const PLAN_ID = "11111111-1111-4111-8111-111111111111";

const localStorageMock = () => {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => store.set(key, value)),
    removeItem: vi.fn((key: string) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
  };
};

beforeEach(() => {
  const storage = localStorageMock();
  vi.stubGlobal("window", {
    localStorage: storage,
    dispatchEvent: vi.fn(),
  });
  vi.stubGlobal("CustomEvent", class {
    type: string;
    detail: unknown;

    constructor(type: string, init?: { detail?: unknown }) {
      this.type = type;
      this.detail = init?.detail;
    }
  });
  writeOfflineQueue([]);
});

describe("sync entity config", () => {
  it("defines stable table-specific rules for critical training sync", () => {
    expect(getSyncEntityConfig("training_plan_items")).toMatchObject({
      conflictKey: "id",
      supportsSoftDelete: true,
      deletedAtField: "deleted_at",
      mergeStrategy: "fieldMerge",
      priority: "A",
    });

    expect(getSyncEntityConfig("external_training_sessions")).toMatchObject({
      conflictKey: "provider,provider_activity_id",
      mergeStrategy: "manual",
      priority: "B",
    });
  });

  it("turns supported deletes into tombstone payloads", () => {
    expect(toSoftDeletePayload("training_plan_items", { id: PLAN_ID }, "2026-07-21T10:00:00.000Z")).toMatchObject({
      id: PLAN_ID,
      deleted_at: "2026-07-21T10:00:00.000Z",
      updated_at: "2026-07-21T10:00:00.000Z",
    });
  });
});

describe("delta sync cursor", () => {
  it("keeps rows with the same timestamp ordered by id", () => {
    const cursor = {
      table: "training_plan_items",
      lastSyncAt: "2026-07-21T10:00:00.000Z",
      lastCursorId: "b",
      lastSuccessfulSync: "2026-07-21T10:00:01.000Z",
    };

    expect(isAfterDeltaCursor({ id: "a", updated_at: "2026-07-21T10:00:00.000Z" }, cursor)).toBe(false);
    expect(isAfterDeltaCursor({ id: "c", updated_at: "2026-07-21T10:00:00.000Z" }, cursor)).toBe(true);
    expect(isAfterDeltaCursor({ id: "a", updated_at: "2026-07-21T10:00:01.000Z" }, cursor)).toBe(true);
  });

  it("builds the next cursor from the newest timestamp and id", () => {
    expect(
      buildNextDeltaCursor("training_plan_items", [
        { id: "b", updated_at: "2026-07-21T10:00:00.000Z" },
        { id: "a", updated_at: "2026-07-21T10:00:01.000Z" },
      ], "2026-07-21T10:00:02.000Z"),
    ).toMatchObject({
      table: "training_plan_items",
      lastSyncAt: "2026-07-21T10:00:01.000Z",
      lastCursorId: "a",
      lastSuccessfulSync: "2026-07-21T10:00:02.000Z",
    });
  });
});

describe("offline queue", () => {
  it("coalesces multiple updates for the same entity", () => {
    enqueueOfflineChange({ table: "training_plan_items", operation: "upsert", payload: { id: PLAN_ID, title: "Alt" } });
    enqueueOfflineChange({ table: "training_plan_items", operation: "upsert", payload: { id: PLAN_ID, title: "Neu" } });

    expect(readOfflineQueue()).toHaveLength(1);
    expect(readOfflineQueue()[0].payload).toMatchObject({ id: PLAN_ID, title: "Neu" });
  });

  it("queues training deletes as soft-delete updates", () => {
    enqueueOfflineChange({ table: "training_plan_items", operation: "delete", payload: { id: PLAN_ID } });

    expect(readOfflineQueue()[0]).toMatchObject({
      table: "training_plan_items",
      operation: "update",
      payload: {
        id: PLAN_ID,
      },
    });
    expect(readOfflineQueue()[0].payload.deleted_at).toBeTruthy();
  });
});
