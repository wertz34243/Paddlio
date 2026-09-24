import { describe, expect, it } from "vitest";
import { classifySyncError, getSyncErrorMessage } from "./syncStatus";

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
