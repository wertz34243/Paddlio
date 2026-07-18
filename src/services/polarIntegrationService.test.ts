import { describe, expect, it } from "vitest";
import { mapPolarImportToExternalSession, type PolarImportRow } from "./polarIntegrationService";

describe("polar import mapping", () => {
  it("maps Polar imports into Paddlio external sessions without inventing ownership", () => {
    const row: PolarImportRow = {
      id: "polar-row-1",
      provider_activity_id: "activity-1",
      title: "GA1 Wasser",
      sport_type: "paddling",
      started_at: "2026-07-14T16:00:00Z",
      duration_seconds: 3600,
      distance_meters: 8000,
      avg_heart_rate: 142,
      max_heart_rate: 171,
      calories: 420,
      training_load: 34,
      recovery_status: "balanced",
      raw_data: { source: "polar" },
      linked_training_id: "training-1",
      updated_at: "2026-07-14T17:10:00Z",
    };

    expect(mapPolarImportToExternalSession(row)).toMatchObject({
      id: "polar-row-1",
      provider: "polar",
      providerActivityId: "activity-1",
      title: "GA1 Wasser",
      sportType: "paddling",
      durationSeconds: 3600,
      distanceMeters: 8000,
      avgHeartRate: 142,
      maxHeartRate: 171,
      linkedTrainingId: "training-1",
      userId: "",
      athleteId: "",
      clubId: "",
    });
  });
});
