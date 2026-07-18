import { describe, expect, it } from "vitest";
import type { ExternalTrainingSession, PlanEntry } from "../../domain/types";
import {
  buildTrainingSessionFromPolar,
  dateKeyFromPolarTimestamp,
  mergeExternalSessionsByProviderActivity,
  mergeTrainingSessionsById,
  suggestPolarTrainingMatches,
} from "./polarTrainingSync";

const polarSession = (overrides: Partial<ExternalTrainingSession> = {}): ExternalTrainingSession => ({
  id: "polar-row-1",
  userId: "athlete-1",
  athleteId: "athlete-1",
  clubId: "club-1",
  provider: "polar",
  providerActivityId: "activity-1",
  title: "GA1 Wasser",
  sportType: "paddling",
  startedAt: "2026-07-14T16:00:00+02:00",
  durationSeconds: 3600,
  distanceMeters: 8000,
  avgHeartRate: 142,
  maxHeartRate: 171,
  calories: 420,
  trainingLoad: 34,
  recoveryStatus: "balanced",
  rawData: {},
  linkedTrainingId: "",
  createdAt: "2026-07-14T17:10:00Z",
  updatedAt: "2026-07-14T17:10:00Z",
  ...overrides,
});

const planEntry = (overrides: Partial<PlanEntry> = {}): PlanEntry => ({
  id: "plan-1",
  ownerUserId: "coach-1",
  athleteId: "athlete-1",
  clubId: "club-1",
  assignedType: "athlete",
  assignedAthleteIds: ["athlete-1"],
  assignedGroupIds: [],
  title: "GA1 Grundlagen",
  date: "2026-07-14",
  weekday: "Dienstag",
  time: "16:00",
  startTime: "16:00",
  endTime: "17:00",
  durationMinutes: 60,
  area: "Wassertraining",
  trainingType: "GA1",
  boatClass: "K1",
  goal: "Grundlage",
  focus: "GA1",
  description: "",
  intensity: "locker",
  note: "",
  notes: "",
  status: "planned",
  repeat: "none",
  repeatUntil: "",
  createdByUserId: "coach-1",
  assignedAthleteId: "athlete-1",
  assignedGroupId: "",
  feedbackNote: "",
  createdAt: "2026-07-14T10:00:00Z",
  updatedAt: "2026-07-14T10:00:00Z",
  ...overrides,
});

describe("polar training sync helpers", () => {
  it("keeps Polar timestamp on the local calendar day", () => {
    expect(dateKeyFromPolarTimestamp("2026-07-14T00:30:00+02:00")).toBe("2026-07-14");
  });

  it("builds a stable journal entry without UTC date slicing", () => {
    expect(buildTrainingSessionFromPolar(polarSession(), "athlete-1")).toMatchObject({
      id: "training-polar-row-1",
      athleteId: "athlete-1",
      date: "2026-07-14",
      type: "Ausdauer",
      durationMinutes: 60,
    });
  });

  it("updates existing external sessions by provider activity instead of duplicating them", () => {
    const merged = mergeExternalSessionsByProviderActivity(
      [polarSession({ title: "Alt" })],
      [polarSession({ id: "polar-row-2", title: "Neu" })],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ id: "polar-row-2", title: "Neu", providerActivityId: "activity-1" });
  });

  it("updates existing generated journal sessions by id", () => {
    const current = [buildTrainingSessionFromPolar(polarSession({ title: "Alt" }), "athlete-1")];
    const incoming = [buildTrainingSessionFromPolar(polarSession({ title: "Neu", durationSeconds: 4200 }), "athlete-1")];
    const merged = mergeTrainingSessionsById(current, incoming);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ durationMinutes: 70, focus: "Polar Neu" });
  });

  it("suggests matching planned training without auto-linking", () => {
    const matches = suggestPolarTrainingMatches(polarSession(), [
      planEntry(),
      planEntry({ id: "wrong-day", date: "2026-07-15" }),
      planEntry({ id: "wrong-athlete", athleteId: "athlete-2", assignedAthleteIds: ["athlete-2"] }),
    ]);
    expect(matches).toHaveLength(1);
    expect(matches[0].planEntry.id).toBe("plan-1");
    expect(matches[0].score).toBeGreaterThanOrEqual(80);
  });
});
