import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSupabaseClient } from "../lib/supabase";
import { buildNextDeltaCursor, isAfterDeltaCursor } from "./deltaSyncService";
import { enqueueOfflineChange, flushOfflineQueue, getOfflineQueueDiagnostics, getOfflineQueueStats, readOfflineQueue, setOfflineQueueUser, writeOfflineQueue } from "./offlineQueueService";
import { getSyncEntityConfig, toSoftDeletePayload } from "./syncEntityConfig";
import { cloudValueOrCached, markCloudReadFailed } from "./cloudReadState";
import { classifySyncWriteError } from "./syncErrorPolicy";
import { runCloudWrite } from "./cloudWriteService";

vi.mock("../lib/supabase", () => ({ getSupabaseClient: vi.fn() }));

const PLAN_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ATHLETE_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

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
  vi.stubGlobal("navigator", { onLine: true });
  vi.mocked(getSupabaseClient).mockReset();
  setOfflineQueueUser(USER_ID);
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

  it.each([
    ["planned", "planned"],
    ["done", "done"],
    ["completed", "done"],
    ["partially_completed", "done"],
    ["skipped", "skipped"],
    ["cancelled", "cancelled"],
    ["legacy_unknown", "planned"],
  ])("repairs queued status %s to %s", (input, expected) => {
    window.localStorage.setItem(`paddlio_sync_queue:${USER_ID}`, JSON.stringify([{
      id: "legacy-queue", table: "training_plan_items", operation: "upsert",
      payload: { id: PLAN_ID, status: input }, retryCount: 5, status: "failed", lastError: "23514",
    }]));

    expect(readOfflineQueue()[0]).toMatchObject({
      retryCount: 0,
      status: "pending",
      payload: { status: expected },
    });
  });

  it("retries a repaired failed plan item and sends only a compatible status", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(getSupabaseClient).mockReturnValue({ from: vi.fn(() => ({ upsert })) } as never);
    window.localStorage.setItem(`paddlio_sync_queue:${USER_ID}`, JSON.stringify([{
      id: "legacy-failed", table: "training_plan_items", operation: "upsert",
      payload: { id: PLAN_ID, status: "partially_completed", title: "Altbestand" },
      retryCount: 5, status: "failed", lastError: "23514 status check",
    }]));

    await expect(flushOfflineQueue()).resolves.toBe(1);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ status: "done" }), { onConflict: "id" });
    expect(getOfflineQueueStats()).toEqual({ pending: 0, failed: 0, total: 0 });
  });

  it("retries a legacy transient failure exactly once after the queue upgrade", () => {
    window.localStorage.setItem(`paddlio_sync_queue:${USER_ID}`, JSON.stringify([{
      id: "legacy-network", table: "materials", operation: "upsert", payload: { id: PLAN_ID },
      retryCount: 5, status: "failed", lastError: "Failed to fetch", repairVersion: 1,
    }]));
    expect(readOfflineQueue()[0]).toMatchObject({ status: "pending", retryCount: 0, repairVersion: 3 });
  });

  it("does not reactivate a legacy non-retryable constraint failure", () => {
    window.localStorage.setItem(`paddlio_sync_queue:${USER_ID}`, JSON.stringify([{
      id: "legacy-constraint", table: "materials", operation: "upsert", payload: { id: PLAN_ID },
      retryCount: 5, status: "failed", lastError: "23514 check constraint", repairVersion: 1,
    }]));
    expect(readOfflineQueue()[0]).toMatchObject({ status: "failed", retryCount: 5, repairVersion: 3, errorKind: "non-retryable" });
    expect(getOfflineQueueDiagnostics()[0]).toMatchObject({
      table: "materials",
      operation: "upsert",
      errorCode: "23514",
      errorKind: "non-retryable",
      userScope: "aaaaaaaa...",
    });
    expect(getOfflineQueueDiagnostics()[0].createdAt).toBeTruthy();
  });

  it("repairs legacy athlete feedback identity and retries one old RLS failure", () => {
    window.localStorage.setItem(`paddlio_sync_queue:${USER_ID}`, JSON.stringify([{
      id: "legacy-athlete-feedback", table: "training_feedback", operation: "upsert",
      payload: { id: PLAN_ID, training_plan_item_id: PLAN_ID, athlete_id: USER_ID },
      retryCount: 5, status: "failed", lastError: "42501 RLS", repairVersion: 2,
    }]));

    expect(readOfflineQueue()[0]).toMatchObject({
      status: "pending",
      retryCount: 0,
      repairVersion: 3,
      payload: { feedback_type: "athlete", athlete_id: USER_ID, author_id: USER_ID },
    });
  });

  it("repairs legacy trainer feedback only when the current author is unambiguous", () => {
    window.localStorage.setItem(`paddlio_sync_queue:${USER_ID}`, JSON.stringify([{
      id: "legacy-trainer-feedback", table: "training_feedback", operation: "upsert",
      payload: { id: PLAN_ID, training_plan_item_id: PLAN_ID, athlete_id: ATHLETE_ID, coach_id: USER_ID },
      retryCount: 5, status: "failed", lastError: "42501 RLS", repairVersion: 2,
    }]));

    expect(readOfflineQueue()[0].payload).toMatchObject({
      feedback_type: "trainer",
      athlete_id: ATHLETE_ID,
      coach_id: USER_ID,
      author_id: USER_ID,
    });
  });

  it("does not invent feedback identity for an unrelated legacy payload", () => {
    window.localStorage.setItem(`paddlio_sync_queue:${USER_ID}`, JSON.stringify([{
      id: "ambiguous-feedback", table: "training_feedback", operation: "upsert",
      payload: { id: PLAN_ID, training_plan_item_id: PLAN_ID, athlete_id: ATHLETE_ID },
      retryCount: 5, status: "failed", lastError: "23514 invalid feedback", repairVersion: 2,
    }]));

    expect(readOfflineQueue()[0]).toMatchObject({ status: "failed", retryCount: 5, repairVersion: 3 });
    expect(readOfflineQueue()[0].payload).not.toHaveProperty("author_id");
    expect(readOfflineQueue()[0].payload).not.toHaveProperty("feedback_type");
  });

  it("isolates queue entries by account and restores them after switching back", () => {
    enqueueOfflineChange({ table: "training_plan_items", operation: "upsert", payload: { id: PLAN_ID }, userId: USER_ID });
    setOfflineQueueUser("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    expect(readOfflineQueue()).toEqual([]);
    setOfflineQueueUser(USER_ID);
    expect(readOfflineQueue()).toHaveLength(1);
  });

  it("quarantines legacy entries that cannot be assigned safely", () => {
    setOfflineQueueUser(null);
    window.localStorage.setItem("paddlio_sync_queue", JSON.stringify([{
      id: "legacy-unknown", table: "materials", operation: "upsert", payload: { id: PLAN_ID },
    }]));
    setOfflineQueueUser(USER_ID);
    expect(readOfflineQueue()).toEqual([]);
    expect(window.localStorage.getItem("paddlio_sync_queue:unscoped")).toContain("legacy-unknown");
  });
});

describe("cloud read semantics", () => {
  it("accepts a successful empty cloud collection as the source of truth", () => {
    expect(cloudValueOrCached([], [{ id: "cached" }])).toEqual([]);
  });

  it("uses cached data only when the cloud read failed", () => {
    expect(cloudValueOrCached(markCloudReadFailed([]), [{ id: "cached" }])).toEqual([{ id: "cached" }]);
  });
});

describe("sync write error policy", () => {
  it("retries network and server failures", () => {
    expect(classifySyncWriteError(new Error("Failed to fetch"))).toBe("retryable");
    expect(classifySyncWriteError({ status: 503, message: "Service unavailable" })).toBe("retryable");
  });

  it("does not retry authorization or invalid-data failures", () => {
    expect(classifySyncWriteError({ code: "42501", message: "RLS violation" })).toBe("non-retryable");
    expect(classifySyncWriteError({ code: "23514", message: "check constraint" })).toBe("non-retryable");
  });

  it("queues a transient online write failure for the active account", async () => {
    vi.mocked(getSupabaseClient).mockReturnValue({ from: vi.fn() } as never);
    await runCloudWrite("materials", "upsert", { id: PLAN_ID }, async () => ({ error: new Error("Failed to fetch") }));
    expect(readOfflineQueue()).toEqual([
      expect.objectContaining({ table: "materials", userId: USER_ID, status: "pending" }),
    ]);
  });

  it("surfaces a non-retryable write without poisoning the retry queue", async () => {
    vi.mocked(getSupabaseClient).mockReturnValue({ from: vi.fn() } as never);
    await expect(runCloudWrite("materials", "upsert", { id: PLAN_ID }, async () => ({
      error: { code: "42501", message: "permission denied" },
    }))).rejects.toMatchObject({ code: "42501" });
    expect(readOfflineQueue()).toEqual([]);
  });
});
