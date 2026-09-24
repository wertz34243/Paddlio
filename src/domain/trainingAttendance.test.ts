import { describe, expect, it } from "vitest";
import type { PlanEntry, TrainingAttendance } from "./types";
import { canDeleteTrainingAttendance, getAttendanceTrainings, hasTrainingEnded } from "./trainingAttendance";

const training = (patch: Partial<PlanEntry> = {}): PlanEntry => ({
  id: "training-1", ownerUserId: "user-1", athleteId: "athlete-1", clubId: "club-1",
  assignedType: "self", assignedAthleteIds: [], assignedGroupIds: [], title: "Technik",
  date: "2026-09-24", weekday: "Donnerstag", time: "10:00", startTime: "10:00", endTime: "11:00",
  durationMinutes: 60, area: "Wassertraining", trainingType: "K1 Technik", boatClass: "K1",
  goal: "", focus: "", description: "", intensity: "mittel", note: "", notes: "", status: "planned",
  repeat: "none", repeatUntil: "", createdByUserId: "user-1", assignedAthleteId: "", assignedGroupId: "",
  feedbackNote: "", createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z", ...patch,
});

const answer: TrainingAttendance = {
  id: "attendance-1", trainingId: "training-1", athleteId: "athlete-1", clubId: "club-1", groupId: "",
  status: "attending", reason: "", note: "", respondedAt: "2026-09-24T09:00:00Z",
  createdAt: "2026-09-24T09:00:00Z", updatedAt: "2026-09-24T09:00:00Z",
};

describe("training attendance lifecycle", () => {
  const afterTraining = new Date("2026-09-24T12:00:00");

  it("allows only trainer roles to delete attendance after training end", () => {
    expect(hasTrainingEnded(training(), afterTraining)).toBe(true);
    expect(canDeleteTrainingAttendance("coach", training(), afterTraining)).toBe(true);
    expect(canDeleteTrainingAttendance("teamAdmin", training(), afterTraining)).toBe(true);
    expect(canDeleteTrainingAttendance("clubAdmin", training(), afterTraining)).toBe(true);
    expect(canDeleteTrainingAttendance("admin", training(), afterTraining)).toBe(true);
    expect(canDeleteTrainingAttendance("athlete", training(), afterTraining)).toBe(false);
  });

  it("keeps ended attendance only while answers exist", () => {
    expect(getAttendanceTrainings([training()], [answer], afterTraining)).toHaveLength(1);
    expect(getAttendanceTrainings([training()], [], afterTraining)).toHaveLength(0);
  });

  it("keeps current and future training visible without answers", () => {
    expect(getAttendanceTrainings([training()], [], new Date("2026-09-24T10:30:00"))).toHaveLength(1);
  });
});
