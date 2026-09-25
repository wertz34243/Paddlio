import { describe, expect, it } from "vitest";
import { classifySyncError, getFailedSyncMessage, getSyncErrorMessage, resolveCloudConnectionState } from "./syncStatus";

describe("sync status classification", () => {
  it("classifies planning constraint errors without exposing SQL", () => {
    const error = { code: "23514", message: "new row violates training_plan_items_status_check" };
    const category = classifySyncError("Planungsdaten speichern", error);
    const message = getSyncErrorMessage([category]);

    expect(category).toBe("planning_sync_error");
    expect(message).toContain("Planungsdaten");
    expect(message).not.toContain("23514");
    expect(message).not.toContain("constraint");
  });

  it("treats profile failures as their own core category", () => {
    expect(classifySyncError("Profil synchronisieren")).toBe("profile_sync_error");
  });
});

describe("failed queue messages", () => {
  it("names the affected areas instead of blaming the profile", () => {
    expect(getFailedSyncMessage(["materials", "training_templates"], 2)).toBe(
      "2 Datensätze konnten noch nicht synchronisiert werden. Betroffen: Material, Vorlagen.",
    );
  });
});

describe("cloud connection state", () => {
  it("returns to connected after a successful retry cleared every current error", () => {
    expect(resolveCloudConnectionState({
      online: true,
      profileReady: true,
      pending: 0,
      failed: 0,
      readErrors: 0,
    })).toBe("connected");
  });

  it("keeps supplemental read failures separate from profile availability", () => {
    expect(resolveCloudConnectionState({
      online: true,
      profileReady: true,
      pending: 0,
      failed: 0,
      readErrors: 1,
    })).toBe("limited");
  });
});
