import type { PlanStatus } from "./types";

export const normalizePlanStatus = (value: unknown): PlanStatus => {
  switch (String(value ?? "").toLowerCase()) {
    case "in_progress": return "in_progress";
    case "completed":
    case "done":
    case "erledigt": return "completed";
    case "partially_completed": return "partially_completed";
    case "skipped":
    case "ausgelassen": return "skipped";
    case "cancelled": return "cancelled";
    case "planned":
    case "geplant":
    default: return "planned";
  }
};

// This is the intersection of the original and current database constraints.
// The richer app status is retained in the existing training metadata.
export const toCompatibleCloudPlanStatus = (value: unknown): "planned" | "done" | "skipped" | "cancelled" => {
  const status = normalizePlanStatus(value);
  if (status === "completed" || status === "partially_completed") return "done";
  if (status === "skipped") return "skipped";
  if (status === "cancelled") return "cancelled";
  return "planned";
};

export const normalizeTrainingPlanQueuePayload = (payload: Record<string, unknown>): Record<string, unknown> =>
  Object.prototype.hasOwnProperty.call(payload, "status")
    ? { ...payload, status: toCompatibleCloudPlanStatus(payload.status) }
    : payload;
