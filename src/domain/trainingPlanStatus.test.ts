import { describe, expect, it } from "vitest";
import { normalizePlanStatus, normalizeTrainingPlanQueuePayload, toCompatibleCloudPlanStatus } from "./trainingPlanStatus";

describe("training plan status compatibility", () => {
  it.each([
    ["completed", "done"],
    ["partially_completed", "done"],
    ["in_progress", "planned"],
    ["planned", "planned"],
    ["skipped", "skipped"],
    ["cancelled", "cancelled"],
  ])("maps %s to legacy-safe cloud status %s", (input, expected) => {
    expect(toCompatibleCloudPlanStatus(input)).toBe(expected);
  });

  it("normalizes stale localized and unknown cache values", () => {
    expect(normalizePlanStatus("erledigt")).toBe("completed");
    expect(normalizePlanStatus("ausgelassen")).toBe("skipped");
    expect(normalizePlanStatus("draft")).toBe("planned");
    expect(normalizeTrainingPlanQueuePayload({ id: "one", status: "active" })).toEqual({ id: "one", status: "planned" });
    expect(normalizeTrainingPlanQueuePayload({ id: "one", deleted_at: "2026-09-24T10:00:00Z" })).toEqual({ id: "one", deleted_at: "2026-09-24T10:00:00Z" });
  });
});
