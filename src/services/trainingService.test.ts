import { describe, expect, it } from "vitest";
import { fromCloudFeedback, toCloudFeedback } from "./trainingService";

describe("training feedback cloud mapping", () => {
  it("reads canonical and legacy feedback training ids", () => {
    expect(
      fromCloudFeedback({
        id: "feedback-1",
        training_plan_item_id: "training-canonical",
        athlete_id: "athlete-canonical",
        status: "done",
        updated_at: "2026-07-14T10:00:00.000Z",
      }),
    ).toMatchObject({
      trainingId: "training-canonical",
      athleteUserId: "athlete-canonical",
    });

    expect(
      fromCloudFeedback({
        id: "feedback-2",
        training_id: "training-legacy",
        athlete_user_id: "athlete-legacy",
        status: "done",
        updated_at: "2026-07-14T10:00:00.000Z",
      }),
    ).toMatchObject({
      trainingId: "training-legacy",
      athleteUserId: "athlete-legacy",
    });
  });

  it("writes canonical feedback columns for Supabase RLS", () => {
    const payload = toCloudFeedback({
      id: "5b8bd93a-14c3-44f2-95d4-bbd955370cde",
      trainingId: "3fa81f64-5717-4562-b3fc-2c963f66afa6",
      athleteUserId: "f2d0a338-0ed3-4ab6-93b8-3da2f710a991",
      coachUserId: "c4137bc4-bc05-4206-9cf5-95cf2221c01c",
      status: "done",
      feeling: 8,
      difficulty: 5,
      fatigue: 4,
      motivation: 9,
      completedAt: "2026-07-14T10:00:00.000Z",
    });

    expect(payload).toMatchObject({
      training_plan_item_id: "3fa81f64-5717-4562-b3fc-2c963f66afa6",
      athlete_id: "f2d0a338-0ed3-4ab6-93b8-3da2f710a991",
      coach_id: "c4137bc4-bc05-4206-9cf5-95cf2221c01c",
    });
    expect(payload).not.toHaveProperty("training_id");
    expect(payload).not.toHaveProperty("athlete_user_id");
  });
});
